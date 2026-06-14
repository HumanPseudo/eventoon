from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from eventoon.models import Event, Registration, EventAIInsight


class EventRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, name: str, description: str, date: date, max_capacity: int) -> Event:
        event = Event(name=name, description=description, date=date, max_capacity=max_capacity)
        self.session.add(event)
        await self.session.flush()
        return event

    async def list_all(self) -> list[Event]:
        result = await self.session.execute(select(Event).order_by(Event.date.desc()))
        return list(result.scalars().all())

    async def get_by_id(self, event_id: int) -> Event | None:
        result = await self.session.execute(select(Event).where(Event.id == event_id))
        return result.scalar_one_or_none()

    async def get_top5(self) -> list[tuple[int, str, int]]:
        stmt = (
            select(Event.id, Event.name, func.count(Registration.id).label("total"))
            .outerjoin(Registration, Registration.event_id == Event.id)
            .group_by(Event.id, Event.name)
            .order_by(func.count(Registration.id).desc())
            .limit(5)
        )
        result = await self.session.execute(stmt)
        return list(result.all())

    async def get_monthly_stats(self) -> list[tuple[datetime, int]]:
        stmt = (
            select(
                func.date_trunc("month", Registration.registration_date).label("month"),
                func.count(Registration.id).label("total"),
            )
            .group_by("month")
            .order_by(func.date_trunc("month", Registration.registration_date).desc())
        )
        result = await self.session.execute(stmt)
        return list(result.all())


class EventAIInsightRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_cached_insight(self, event_id: int, reg_count: int) -> str | None:
        stmt = select(EventAIInsight.summary).where(
            EventAIInsight.event_id == event_id,
            EventAIInsight.registration_count == reg_count
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def save_insight(self, event_id: int, reg_count: int, summary: str):
        insight = EventAIInsight(
            event_id=event_id,
            registration_count=reg_count,
            summary=summary,
        )
        await self.session.merge(insight)
        await self.session.flush()


class RegistrationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, event_id: int, user_name: str, email: str) -> Registration:
        registration = Registration(
            event_id=event_id,
            user_name=user_name,
            email=email,
        )
        self.session.add(registration)
        try:
            await self.session.flush()
        except IntegrityError as e:
            raise ValueError("Email already registered for this event") from e
        return registration

    async def exists_by_email(self, event_id: int, email: str) -> bool:
        result = await self.session.execute(
            select(Registration.id).where(
                Registration.event_id == event_id,
                Registration.email == email,
            )
        )
        return result.first() is not None

    async def count_by_event(self, event_id: int) -> int:
        result = await self.session.execute(
            select(func.count(Registration.id)).where(Registration.event_id == event_id)
        )
        return result.scalar_one()
