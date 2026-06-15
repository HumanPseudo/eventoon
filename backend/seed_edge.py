"""Edge case & adversarial test data to stress-test the application.

Run:  docker compose exec backend uv run python /app/seed_edge.py
Copy: docker cp backend/seed_edge.py eventoon-backend-1:/app/

All data complies with API validation rules (ISO 27001).
SQL/XSS/Unicode strings are valid UTF-8 text stored safely via
parameterized queries; they do NOT execute.
"""

from datetime import date, datetime

from eventoon.database import async_session, engine
from eventoon.models import Base, Event, Registration

EDGE_EVENTS = [
    # --- SQL Injection attempts ---
    {
        "name": "Robert'); DROP TABLE events; --",
        "description": "SQL injection in name",
        "date": date(2026, 1, 1),
        "max_capacity": 10,
    },
    {
        "name": "SQL Injection Desc",
        "description": "'; DELETE FROM registrations WHERE '1'='1",
        "date": date(2026, 1, 1),
        "max_capacity": 10,
    },
    # --- XSS / HTML injection ---
    {
        "name": "<script>alert('XSS')</script>",
        "description": "<img src=x onerror=alert(1)>",
        "date": date(2026, 1, 1),
        "max_capacity": 10,
    },
    {
        "name": '<iframe src="javascript:alert(1)"></iframe>',
        "description": "Basic <b>HTML</b> <i>tags</i> allowed but scripts stripped",
        "date": date(2026, 1, 1),
        "max_capacity": 10,
    },
    # --- Unicode / special characters ---
    {
        "name": "🎉 Unicode Party ñoño \u202e (RTL override)",
        "description": "Zero-width space: \u200b \u200c \u200d. Zalgo text: ḫ̷̨̛̙̼̲͓̹̮̱̪̮̖̲̮̭̲̱̳̲̱̲̲̲̘̲̲̲̲̲̮̲̜̮̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲ę̷̛̮̙̼̲͓̹̮̱̪̮̖̲̮̭̲̱̳̲̱̲̲̲̘̲̲̲̲̲̮̲̜̮̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲l̷̨̛̮̙̼̲͓̹̮̱̪̮̖̲̮̭̲̱̳̲̱̲̲̲̘̲̲̲̲̲̮̲̜̮̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲l̷̨̛̮̙̼̲͓̹̮̱̪̮̖̲̮̭̲̱̳̲̱̲̲̲̘̲̲̲̲̲̮̲̜̮̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲̲",
        "date": date(2026, 1, 1),
        "max_capacity": 10,
    },
    {
        "name": "Japanese 日本語 Русский العربية",
        "description": "Mixed scripts: 你好, مرحبا, שלום, नमस्ते",
        "date": date(2026, 1, 1),
        "max_capacity": 10,
    },
    # --- Boundary capacity values ---
    {
        "name": "Capacity=1",
        "description": "Minimum capacity event",
        "date": date(2026, 1, 1),
        "max_capacity": 1,
    },
    {
        "name": "Capacity=999999",
        "description": "Very large capacity",
        "date": date(2026, 1, 1),
        "max_capacity": 999999,
    },
    # --- Date edge cases ---
    {
        "name": "Far Future Event",
        "description": "Event 100 years in the future",
        "date": date(2126, 1, 1),
        "max_capacity": 10,
    },
    {
        "name": "Past Event",
        "description": "Event in the past (should still work)",
        "date": date(2020, 1, 1),
        "max_capacity": 10,
    },
    {
        "name": "Leap Year Event",
        "description": "Feb 29 on a leap year",
        "date": date(2028, 2, 29),
        "max_capacity": 10,
    },
    # --- Very long strings (just under limit) ---
    {
        "name": "A" * 255,
        "description": "B" * 1000,
        "date": date(2026, 1, 1),
        "max_capacity": 10,
    },
    # --- Whitespace-only strings ---
    # REMOVED: stripped to empty by sanitize, fails API validation (422)
    # --- Newline injection ---
    # REMOVED: valid strings, not adversarial
    # --- JSON-like injection ---
    {
        "name": '{"key": "value"}',
        "description": '["array", "injection"]',
        "date": date(2026, 1, 1),
        "max_capacity": 10,
    },
    # --- Duplicate name/date ---
    # REMOVED: unique constraint on name prevents duplicates
]

EDGE_REGISTRATIONS = {
    # Valid event id will be filled at runtime
    # --- Email injection ---
    "email_injection": [
        ("SQL Injection", "'; DROP TABLE events; --@example.com"),
        ("Newline", "test@example.com\n\rSubject: spam"),
        ("XSS Email", "<script>alert(1)</script>@example.com"),
        ("Very long local", f"{'a' * 240}@example.com"),
        ("Plus addressing", "test+spam@example.com"),
        ("Unicode email", "üñîçødé@example.com"),
    ],
    # --- User name edge cases ---
    "name_edge_cases": [
        ("<script>alert('XSS')</script>", "xss@example.com"),
        ("Robert'); DROP TABLE registrations; --", "sqli@example.com"),
        ("A" * 255, "long-name@example.com"),
        ("🎉 Emoji 😊 Name", "emoji@example.com"),
        # REMOVED: empty "", whitespace "   ", and null-byte names fail API validation
    ],
}


async def seed_edge():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        created_ids = []

        for data in EDGE_EVENTS:
            event = Event(**data)
            session.add(event)
            await session.flush()
            created_ids.append(event.id)
            print(f"  Created event id={event.id}: {data['name'][:60]}")

        # Register edge-case attendees on the first few events
        base_id = created_ids[0] if created_ids else 1

        ok = 0
        fail = 0
        for user_name, email in EDGE_REGISTRATIONS["email_injection"]:
            try:
                async with session.begin_nested():
                    session.add(
                        Registration(
                            event_id=base_id,
                            user_name=user_name,
                            email=email,
                            registration_date=datetime.now(),
                        )
                    )
                ok += 1
            except Exception as e:
                print(f"  FAIL email {email!r}: {e}")
                fail += 1
        print(f"  Edge emails on event {base_id}: {ok} ok, {fail} failed")

        ok = 0
        fail = 0
        target = created_ids[1] if len(created_ids) > 1 else base_id
        for user_name, email in EDGE_REGISTRATIONS["name_edge_cases"]:
            try:
                async with session.begin_nested():
                    session.add(
                        Registration(
                            event_id=target,
                            user_name=user_name,
                            email=email,
                            registration_date=datetime.now(),
                        )
                    )
                ok += 1
            except Exception as e:
                print(f"  FAIL name {user_name!r} / {email!r}: {e}")
                fail += 1
        print(f"  Edge names on event {target}: {ok} ok, {fail} failed")

        # Fill the 1-capacity event to trigger overflow
        cap1_id = None
        for data in EDGE_EVENTS:
            if data["max_capacity"] == 1:
                cap1_id = created_ids[EDGE_EVENTS.index(data)]
                break
        if cap1_id:
            session.add(
                Registration(
                    event_id=cap1_id,
                    user_name="First and only",
                    email="only@example.com",
                    registration_date=datetime.now(),
                )
            )
            print(f"  Filled capacity-1 event {cap1_id} to max")

        await session.commit()

    print(f"\nSeeded {len(EDGE_EVENTS)} edge-case events.")


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed_edge())
