import sentry_sdk
import logging
from fastapi import FastAPI, APIRouter, Depends, Request
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
from typing import List

from app.api.main import api_router
from app.core.config import settings
from app.api.deps import CurrentUser, SessionDep
from app.models.voice_actor import VoiceModel
from sqlmodel import select

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 요청 로깅
        logger.info(f"🔍 Request: {request.method} {request.url.path} | Query: {request.url.query}")
        
        # 404 에러가 예상되는 요청 특별 로깅
        if "/models" in request.url.path or "/v1/" in request.url.path:
            logger.warning(f"⚠️  Models 관련 요청 감지: {request.method} {request.url.path}")
            logger.warning(f"   전체 URL: {request.url}")
            logger.warning(f"   Headers: {dict(request.headers)}")
        
        response = await call_next(request)
        
        # 404 응답 로깅
        if response.status_code == 404:
            logger.error(f"❌ 404 Not Found: {request.method} {request.url.path}")
        
        return response

# Import all models to ensure proper SQLModel relationship initialization
import app.models  # noqa: F401


def custom_generate_unique_id(route: APIRoute) -> str:
    # Handle routes without tags gracefully
    tag = route.tags[0] if route.tags else "default"
    return f"{tag}-{route.name}"


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

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add OpenAI-compatible models endpoint (outside of /api/v1 for compatibility)
@app.get("/models", tags=["models"])
async def list_models(
    current_user: CurrentUser,
    session: SessionDep
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
