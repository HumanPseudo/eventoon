import html
import re
from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from eventoon.database import async_session
from eventoon.repositories import EventRepository, RegistrationRepository
from eventoon.schemas import EventCreate, EventStats, RegistrationCreate


def sanitize(text: str, max_length: int = 0) -> str:
    text = text.replace("\x00", "")
    stripped = re.sub(r"<[^>]*>", "", text)
    if stripped != text:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="HTML tags are not allowed",
        )
    text = html.escape(stripped, quote=True)
    text = text.strip()
    if max_length:
        text = text[:max_length]
    return text


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window = timedelta(seconds=window_seconds)
        self._buckets: dict[str, list[datetime]] = defaultdict(list)

    def check(self, key: str) -> None:
        now = datetime.now()
        self._buckets[key] = [t for t in self._buckets[key] if now - t < self.window]
        if len(self._buckets[key]) >= self.max_requests:
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Try again later.",
            )
        self._buckets[key].append(now)


register_limiter = RateLimiter(max_requests=10, window_seconds=60)


async def get_session():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


class EventService:
    def __init__(self, session: AsyncSession):
        self.event_repo = EventRepository(session)
        self.registration_repo = RegistrationRepository(session)

    async def cleanup_all(self):
        await self.registration_repo.delete_all()
        await self.event_repo.delete_all()

    async def create(self, data: EventCreate) -> dict:
        name = sanitize(data.name, 255)
        description = sanitize(data.description, 1000)
        if not name or not description:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Name and description cannot be empty after sanitization",
            )
        try:
            event = await self.event_repo.create(
                name=name,
                description=description,
                date=data.date,
                max_capacity=data.max_capacity,
            )
        except ValueError as e:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
        return {
            "id": event.id,
            "name": event.name,
            "description": event.description,
            "date": str(event.date),
            "max_capacity": event.max_capacity,
        }

    async def list_all(self) -> list[dict]:
        events_with_counts = await self.event_repo.list_all_with_counts()
        return [
            {
                "id": e.id,
                "name": e.name,
                "description": e.description,
                "date": str(e.date),
                "max_capacity": e.max_capacity,
                "attendee_count": count,
            }
            for e, count in events_with_counts
        ]

    async def get_by_id(self, event_id: int) -> dict:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Event not found")

        count = await self.registration_repo.count_by_event(event_id)

        return {
            "id": event.id,
            "name": event.name,
            "description": event.description,
            "date": str(event.date),
            "max_capacity": event.max_capacity,
            "attendee_count": count,
        }

    async def register(self, event_id: int, data: RegistrationCreate) -> dict:
        register_limiter.check(f"register:{event_id}:{data.email}")

        result = await self.event_repo.get_by_id_for_update_with_count(event_id)
        if not result:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Event not found")

        event, count = result
        if count >= event.max_capacity:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Maximum capacity reached")

        try:
            user_name = sanitize(data.user_name, 255)
            if not user_name:
                raise HTTPException(
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="User name cannot be empty after sanitization",
                )
            registration = await self.registration_repo.create(
                event_id=event_id,
                user_name=user_name,
                email=data.email.strip().replace("\n", "").replace("\r", ""),
            )
        except ValueError as e:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
        return {
            "id": registration.id,
            "event_id": registration.event_id,
            "user_name": registration.user_name,
            "email": registration.email,
            "registration_date": str(registration.registration_date),
        }

    async def stats(self, event_id: int) -> EventStats:
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Event not found")
        count = await self.registration_repo.count_by_event(event_id)
        return EventStats(
            id=event.id,
            name=event.name,
            total_registrations=count,
            max_capacity=event.max_capacity,
        )
