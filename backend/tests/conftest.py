import asyncio
from collections.abc import AsyncGenerator

import pytest
from app.db.session import get_db
from app.main import app
from app.models.base import Base
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
async_session_factory = async_sessionmaker(bind=engine, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop() -> AsyncGenerator[asyncio.AbstractEventLoop, None]:
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def init_db() -> AsyncGenerator[None, None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    from app.core.jwt import create_access_token
    from app.core.password import hash_password
    from app.db.models.user import User

    user = User(
        email="test@company.com",
        name="Test User",
        hashed_password=hash_password("password"),
    )
    db_session.add(user)
    await db_session.flush()

    token = create_access_token(email=user.email)

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        client.headers["Authorization"] = f"Bearer {token}"
        yield client

    app.dependency_overrides.clear()
