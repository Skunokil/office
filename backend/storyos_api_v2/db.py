import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost/storyos_v2",
)

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def check_db_connection() -> None:
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))


async def get_db():
    async with SessionLocal() as session:
        yield session
