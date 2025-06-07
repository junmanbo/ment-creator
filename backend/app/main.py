import sentry_sdk
from fastapi import FastAPI, APIRouter, Depends
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List

from app.api.main import api_router
from app.core.config import settings
from app.api.deps import CurrentUser, SessionDep
from app.models.voice_actor import VoiceModel
from sqlmodel import select

# Import all models to ensure proper SQLModel relationship initialization
import app.models  # noqa: F401


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure all models are properly configured
    from sqlmodel import SQLModel
    from sqlalchemy.orm import configure_mappers
    
    # This ensures all relationships are properly configured
    configure_mappers()
    
    yield
    # Shutdown: cleanup if needed

if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan,
)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add OpenAI-compatible /v1/models endpoint
@app.get("/v1/models")
async def list_models(
    current_user: CurrentUser = Depends(),
    session: SessionDep = Depends()
):
    """OpenAI-compatible models endpoint for TTS libraries"""
    try:
        # Get all available voice models
        statement = select(VoiceModel)
        voice_models = session.exec(statement).all()
        
        # Format as OpenAI-compatible response
        models_data = []
        for model in voice_models:
            models_data.append({
                "id": f"voice-model-{model.id}",
                "object": "model",
                "created": int(model.created_at.timestamp()),
                "owned_by": "ars-system",
                "permission": [],
                "root": f"voice-model-{model.id}",
                "parent": None
            })
        
        return {
            "object": "list",
            "data": models_data
        }
        
    except Exception as e:
        # Return empty list if there's an error
        return {
            "object": "list",
            "data": []
        }

app.include_router(api_router, prefix=settings.API_V1_STR)
