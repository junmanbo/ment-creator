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
from app.models.voice_actor import VoiceActor
from sqlmodel import select

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 요청 로깅
        logger.info(f"🔍 Request: {request.method} {request.url.path} | Query: {request.url.query}")
        
        # Filter OpenAI SDK automatic requests to reduce unnecessary logs
        if "/models" in request.url.path and "OpenAI" in request.headers.get("user-agent", ""):
            # Skip logging for OpenAI SDK automatic model list requests
            pass
        elif "/v1/" in request.url.path and request.url.path != "/api/v1":
            logger.info(f"🔍 External v1 request: {request.method} {request.url.path}")
        
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
    sentry_sdk.init(
        dsn=str(settings.SENTRY_DSN), 
        enable_tracing=True,
        # Disable OpenAI integration to prevent automatic /v1/models requests
        auto_enabling_integrations=False,
        default_integrations=False,
        integrations=[
            # Only enable essential integrations
            sentry_sdk.integrations.fastapi.FastApiIntegration(auto_enable=True),
            sentry_sdk.integrations.sqlalchemy.SqlalchemyIntegration(),
            sentry_sdk.integrations.logging.LoggingIntegration(),
        ]
    )

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

# Add OpenAI-compatible models endpoint (외부 라이브러리 호환성을 위해 유지)
@app.get("/models", tags=["models"])
async def list_models(
    current_user: CurrentUser,
    session: SessionDep
):
    """OpenAI-compatible models endpoint for TTS libraries"""
    try:
        # 활성 성우들을 모델로 반환 (VoiceModel 대신 VoiceActor 사용)
        statement = select(VoiceActor).where(VoiceActor.is_active == True)
        voice_actors = session.exec(statement).all()
        
        # Format as OpenAI-compatible response
        models_data = []
        for actor in voice_actors:
            models_data.append({
                "id": f"voice-actor-{actor.id}",
                "object": "model",
                "created": int(actor.created_at.timestamp()),
                "owned_by": "ars-system",
                "permission": [],
                "root": f"voice-actor-{actor.id}",
                "parent": None,
                "name": actor.name,
                "description": actor.description or f"{actor.name} 성우 음성"
            })
        
        return {
            "object": "list",
            "data": models_data
        }
        
    except Exception as e:
        logger.error(f"Error in /models endpoint: {e}")
        # Return empty list if there's an error
        return {
            "object": "list",
            "data": []
        }

# NOTE: /v1/models 디버깅 엔드포인트 제거됨
# OpenAI SDK의 자동 모델 목록 조회 요청을 차단하기 위해 404 응답 허용

app.include_router(api_router, prefix=settings.API_V1_STR)
