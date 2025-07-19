from fastapi import APIRouter

from app.api.routes import login, users, ment, voice_actors, scenarios, scenario_tts, tts_engines, dashboard

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(ment.router)
api_router.include_router(voice_actors.router)
api_router.include_router(scenarios.router)
api_router.include_router(scenario_tts.router)
api_router.include_router(tts_engines.router)  # 🔄 TTS 엔진 관리 라우터 추가
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])  # 대시보드 라우터 추가
