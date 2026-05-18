from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.agent import router as agent_router
from api.auth import router as auth_router
from config import get_settings
from core.database import close_database, init_database

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.db_auto_create:
        await init_database()
    yield
    if settings.db_auto_create:
        await close_database()


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(agent_router)


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
