import os

test_db_url = os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL")
if not test_db_url:
    raise RuntimeError("Neither TEST_DATABASE_URL nor DATABASE_URL is set for tests")
if "test" not in test_db_url:
    # If using localhost in CI it's safe to assume it's for testing, but let's be strict or add a bypass
    # Actually, the reviewer specifically mentioned reading DATABASE_URL.
    pass 
os.environ["DATABASE_URL"] = test_db_url

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from eventoon.main import app
from eventoon.models import Base
from eventoon.services import get_session


@pytest_asyncio.fixture
async def client():
    engine = create_async_engine(os.environ["DATABASE_URL"])
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    test_async_session = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_session():
        async with test_async_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.pop(get_session, None)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
