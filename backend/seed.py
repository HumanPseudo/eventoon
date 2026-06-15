from datetime import date, datetime

from sqlalchemy import select

from eventoon.config import settings
from eventoon.database import engine, async_session
from eventoon.models import Base, Event, Registration

SAMPLE_EVENTS = [
    {
        "name": "Summer Music Festival",
        "description": "Three days of live music across 5 stages. Featuring international and local artists.",
        "date": date(2026, 7, 15),
        "max_capacity": 500,
    },
    {
        "name": "Tech Conference 2026",
        "description": "Annual technology conference with talks on AI, cloud, and cybersecurity.",
        "date": date(2026, 8, 20),
        "max_capacity": 300,
    },
    {
        "name": "Food & Wine Expo",
        "description": "Gourmet food tasting and wine pairing event with top chefs.",
        "date": date(2026, 9, 10),
        "max_capacity": 200,
    },
    {
        "name": "Yoga Retreat Weekend",
        "description": "Relaxing weekend of yoga, meditation, and wellness workshops.",
        "date": date(2026, 6, 25),
        "max_capacity": 50,
    },
    {
        "name": "Startup Pitch Night",
        "description": "Early-stage startups pitch to investors and compete for funding.",
        "date": date(2026, 10, 5),
        "max_capacity": 150,
    },
]

SAMPLE_REGISTRATIONS = {
    1: [
        ("Alice", "alice@example.com"),
        ("Bob", "bob@example.com"),
        ("Charlie", "charlie@example.com"),
    ],
    2: [
        ("Diana", "diana@example.com"),
        ("Eve", "eve@example.com"),
    ],
    3: [
        ("Frank", "frank@example.com"),
    ],
}


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        existing = await session.execute(select(Event.id).limit(1))
        if existing.first():
            print("Database already has events, skipping seed.")
            return

        for data in SAMPLE_EVENTS:
            event = Event(**data)
            session.add(event)
            await session.flush()

            registrations = SAMPLE_REGISTRATIONS.get(event.id, [])
            for name, email in registrations:
                session.add(
                    Registration(
                        event_id=event.id,
                        user_name=name,
                        email=email,
                        registration_date=datetime.now(tz=None),
                    )
                )

        await session.commit()

    print(f"Seeded {len(SAMPLE_EVENTS)} events with registrations.")


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed())
