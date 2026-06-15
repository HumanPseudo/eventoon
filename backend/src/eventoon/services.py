from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from eventoon.database import async_session
from eventoon.repositories import EventRepository, RegistrationRepository
from eventoon.schemas import EventCreate, EventStats, RegistrationCreate


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

    async def create(self, data: EventCreate) -> dict:
        event = await self.event_repo.create(
            name=data.name,
            description=data.description,
            date=data.date,
            max_capacity=data.max_capacity,
        )
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
        event = await self.event_repo.get_by_id_for_update(event_id)
        if not event:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Event not found")

        count = await self.registration_repo.count_by_event(event_id)
        if count >= event.max_capacity:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Maximum capacity reached")

        try:
            registration = await self.registration_repo.create(
                event_id=event_id,
                user_name=data.user_name,
                email=data.email,
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
