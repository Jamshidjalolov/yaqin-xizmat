from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./yaqin_xizmat.db")

# postgresql:// -> postgresql+asyncpg://
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

# asyncpg does not support sslmode= or channel_binding= in URL params — remove them
import re
DATABASE_URL = re.sub(r'[?&]sslmode=[^&]*', '', DATABASE_URL)
DATABASE_URL = re.sub(r'[?&]channel_binding=[^&]*', '', DATABASE_URL)
DATABASE_URL = re.sub(r'\?&', '?', DATABASE_URL)
DATABASE_URL = DATABASE_URL.rstrip('?').rstrip('&')

# SSL connect arg for Neon / remote PostgreSQL
connect_args = {}
if "postgresql+asyncpg" in DATABASE_URL:
    connect_args = {"ssl": True}

engine = create_async_engine(
    DATABASE_URL,
    future=True,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_timeout=15,
)

async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with async_session() as session:
        yield session
