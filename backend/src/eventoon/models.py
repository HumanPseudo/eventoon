from datetime import date, datetime

from sqlalchemy import Date, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (UniqueConstraint("name", name="uq_event_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(1000))
    date: Mapped[date] = mapped_column(Date)
    max_capacity: Mapped[int] = mapped_column()

    registrations: Mapped[list["Registration"]] = relationship(back_populates="event")


class EventAIInsight(Base):
    __tablename__ = "event_ai_insights"

    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), primary_key=True)
    event_name: Mapped[str] = mapped_column(String(255))
    registration_count: Mapped[int] = mapped_column()
    max_capacity: Mapped[int] = mapped_column()
    summary: Mapped[str] = mapped_column(String(2000))
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    event: Mapped["Event"] = relationship()


class Registration(Base):
    __tablename__ = "registrations"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"))
    user_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    registration_date: Mapped[datetime] = mapped_column(default=datetime.now)

    event: Mapped["Event"] = relationship(back_populates="registrations")

    __table_args__ = (
        UniqueConstraint("event_id", "email", name="uq_event_email"),
        Index("ix_registration_event_id", "event_id"),
        Index("ix_registration_registration_date", "registration_date"),
    )
