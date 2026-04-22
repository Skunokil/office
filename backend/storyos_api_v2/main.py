import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import check_db_connection, engine
from .routes import router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await check_db_connection()
        logger.info("storyos-v2: database connection OK")
    except Exception as exc:
        logger.warning("storyos-v2: database not reachable at startup: %s", exc)
    yield
    await engine.dispose()


app = FastAPI(
    title="Story OS API v2",
    version="0.1.0",
    description=(
        "Story OS v2 — аналитическая и авторская система для работы с художественным текстом. "
        "Backend: PostgreSQL (storyos_v2) via SQLAlchemy 2 async + asyncpg."
    ),
    openapi_tags=[
        {"name": "health", "description": "Проверка доступности сервиса"},
        {"name": "canonical", "description": "Canonical layer: Work, Chapter, Episode, Event"},
        {"name": "text", "description": "Text layer: Manuscript, TextBlock"},
        {"name": "epistemic", "description": "Epistemic layer: EpistemicTrack, EpistemicStep, EvidenceRole"},
        {"name": "diagnostic", "description": "Diagnostic layer: Issue"},
    ],
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://office.transformatornaya.ru",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)

app.include_router(router)
