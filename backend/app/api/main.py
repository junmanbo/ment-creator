from fastapi import APIRouter

from app.api.routes import login, users, ment, voice_actors, scenarios, scenario_tts

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(ment.router)
api_router.include_router(voice_actors.router)
api_router.include_router(scenarios.router)
api_router.include_router(scenario_tts.router)
