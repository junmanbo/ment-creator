# backend/app/services/tts_service_debug.py
"""
TTS 서비스 디버깅 및 문제 해결용 유틸리티
"""

import os
import uuid
import asyncio
import logging
import traceback
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

from sqlmodel import Session
from app.core.db import engine
from app.models.voice_actor import VoiceActor, VoiceSample

logger = logging.getLogger(__name__)

class TTSServiceDebugger:
    """TTS 서비스 디버깅 및 문제 해결"""
    
    def __init__(self):
        self.debug_info = {}
        
    async def diagnose_tts_environment(self) -> Dict[str, Any]:
        """TTS 환경 전체 진단"""
        logger.info("Starting TTS environment diagnosis")
        
        diagnosis = {
            "timestamp": datetime.now().isoformat(),
            "environment": {},
            "dependencies": {},
            "directories": {},
            "voice_actors": {},
            "samples": {},
            "issues": [],
            "recommendations": []
        }
        
        # 1. 환경 정보 수집
        diagnosis["environment"] = await self._check_environment()
        
        # 2. 의존성 확인
        diagnosis["dependencies"] = await self._check_dependencies()
        
        # 3. 디렉토리 구조 확인
        diagnosis["directories"] = await self._check_directories()
        
        # 4. 데이터베이스 상태 확인
        diagnosis["voice_actors"] = await self._check_voice_actors()
        diagnosis["samples"] = await self._check_voice_samples()
        
        # 5. 문제점 분석
        diagnosis["issues"], diagnosis["recommendations"] = self._analyze_issues(diagnosis)
        
        return diagnosis
    
    async def _check_environment(self) -> Dict[str, Any]:
        """환경 정보 확인"""
        env_info = {
            "python_version": None,
            "working_directory": str(Path.cwd()),
            "user": os.getenv("USER", "unknown"),
            "gpu_available": False,
            "cuda_version": None
        }
        
        try:
            import sys
            env_info["python_version"] = sys.version
            
            # GPU 확인
            try:
                import torch
                env_info["gpu_available"] = torch.cuda.is_available()
                if torch.cuda.is_available():
                    env_info["cuda_version"] = torch.version.cuda
                    env_info["gpu_count"] = torch.cuda.device_count()
                    env_info["gpu_names"] = [
                        torch.cuda.get_device_name(i) 
                        for i in range(torch.cuda.device_count())
                    ]
            except ImportError:
                env_info["torch_error"] = "PyTorch not installed"
                
        except Exception as e:
            env_info["error"] = str(e)
            
        return env_info
    
    async def _check_dependencies(self) -> Dict[str, Any]:
        """의존성 라이브러리 확인"""
        deps = {
            "torch": {"installed": False, "version": None, "error": None},
            "torchaudio": {"installed": False, "version": None, "error": None},
            "TTS": {"installed": False, "version": None, "error": None},
            "librosa": {"installed": False, "version": None, "error": None},
            "soundfile": {"installed": False, "version": None, "error": None},
            "numpy": {"installed": False, "version": None, "error": None}
        }
        
        for lib_name in deps.keys():
            try:
                if lib_name == "torch":
                    import torch
                    deps[lib_name]["installed"] = True
                    deps[lib_name]["version"] = torch.__version__
                elif lib_name == "torchaudio":
                    import torchaudio
                    deps[lib_name]["installed"] = True
                    deps[lib_name]["version"] = torchaudio.__version__
                elif lib_name == "TTS":
                    import TTS
                    deps[lib_name]["installed"] = True
                    deps[lib_name]["version"] = getattr(TTS, "__version__", "unknown")
                elif lib_name == "librosa":
                    import librosa
                    deps[lib_name]["installed"] = True
                    deps[lib_name]["version"] = librosa.__version__
                elif lib_name == "soundfile":
                    import soundfile
                    deps[lib_name]["installed"] = True
                    deps[lib_name]["version"] = soundfile.__version__
                elif lib_name == "numpy":
                    import numpy
                    deps[lib_name]["installed"] = True
                    deps[lib_name]["version"] = numpy.__version__
                    
            except ImportError as e:
                deps[lib_name]["error"] = f"ImportError: {e}"
            except Exception as e:
                deps[lib_name]["error"] = f"Error: {e}"
                
        return deps
    
    async def _check_directories(self) -> Dict[str, Any]:
        """디렉토리 구조 확인"""
        directories = {
            "audio_files": {"exists": False, "writable": False, "count": 0},
            "voice_samples": {"exists": False, "writable": False, "count": 0}
        }
        
        for dir_name in directories.keys():
            dir_path = Path(dir_name)
            try:
                directories[dir_name]["exists"] = dir_path.exists()
                
                if dir_path.exists():
                    directories[dir_name]["writable"] = os.access(dir_path, os.W_OK)
                    directories[dir_name]["count"] = len(list(dir_path.iterdir()))
                    
                    # 하위 디렉토리 상세 정보
                    if dir_name == "voice_samples":
                        subdirs = [d for d in dir_path.iterdir() if d.is_dir()]
                        directories[dir_name]["subdirectories"] = []
                        for subdir in subdirs:
                            subdir_info = {
                                "name": subdir.name,
                                "files": len(list(subdir.iterdir())),
                                "size_bytes": sum(f.stat().st_size for f in subdir.rglob("*") if f.is_file())
                            }
                            directories[dir_name]["subdirectories"].append(subdir_info)
                
            except Exception as e:
                directories[dir_name]["error"] = str(e)
                
        return directories
    
    async def _check_voice_actors(self) -> Dict[str, Any]:
        """성우 데이터 상태 확인"""
        actors_info = {
            "total_count": 0,
            "active_count": 0,
            "by_gender": {},
            "by_age_range": {},
            "actors": []
        }
        
        try:
            with Session(engine) as session:
                from sqlmodel import select
                actors = session.exec(select(VoiceActor)).all()
                
                actors_info["total_count"] = len(actors)
                actors_info["active_count"] = len([a for a in actors if a.is_active])
                
                # 성별 집계
                gender_counts = {}
                age_counts = {}
                for actor in actors:
                    gender = actor.gender.value if hasattr(actor.gender, 'value') else str(actor.gender)
                    age_range = actor.age_range.value if hasattr(actor.age_range, 'value') else str(actor.age_range)
                    
                    gender_counts[gender] = gender_counts.get(gender, 0) + 1
                    age_counts[age_range] = age_counts.get(age_range, 0) + 1
                
                actors_info["by_gender"] = gender_counts
                actors_info["by_age_range"] = age_counts
                
                # 개별 성우 정보 (최대 10개)
                for actor in actors[:10]:
                    actor_info = {
                        "id": str(actor.id),
                        "name": actor.name,
                        "gender": actor.gender.value if hasattr(actor.gender, 'value') else str(actor.gender),
                        "age_range": actor.age_range.value if hasattr(actor.age_range, 'value') else str(actor.age_range),
                        "is_active": actor.is_active,
                        "created_at": actor.created_at.isoformat() if actor.created_at else None
                    }
                    actors_info["actors"].append(actor_info)
                    
        except Exception as e:
            actors_info["error"] = str(e)
            actors_info["traceback"] = traceback.format_exc()
            
        return actors_info
    
    async def _check_voice_samples(self) -> Dict[str, Any]:
        """음성 샘플 상태 확인"""
        samples_info = {
            "total_count": 0,
            "by_actor": {},
            "file_issues": []
        }
        
        try:
            with Session(engine) as session:
                from sqlmodel import select
                samples = session.exec(select(VoiceSample)).all()
                
                samples_info["total_count"] = len(samples)
                
                # 성우별 집계
                actor_counts = {}
                for sample in samples:
                    actor_id = str(sample.voice_actor_id)
                    actor_counts[actor_id] = actor_counts.get(actor_id, 0) + 1
                    
                    # 파일 존재 여부 확인
                    if sample.audio_file_path:
                        file_path = Path(sample.audio_file_path)
                        if not file_path.exists():
                            samples_info["file_issues"].append({
                                "sample_id": str(sample.id),
                                "voice_actor_id": actor_id,
                                "missing_file": sample.audio_file_path
                            })
                
                samples_info["by_actor"] = actor_counts
                
        except Exception as e:
            samples_info["error"] = str(e)
            
        return samples_info
    
    def _analyze_issues(self, diagnosis: Dict[str, Any]) -> tuple:
        """진단 결과를 바탕으로 문제점과 해결방안 분석"""
        issues = []
        recommendations = []
        
        # 의존성 문제 확인
        deps = diagnosis.get("dependencies", {})
        missing_deps = [name for name, info in deps.items() if not info.get("installed")]
        
        if missing_deps:
            issues.append(f"Missing dependencies: {', '.join(missing_deps)}")
            recommendations.append(f"Install missing dependencies: pip install {' '.join(missing_deps)}")
        
        # TTS 라이브러리 특별 확인
        if not deps.get("TTS", {}).get("installed"):
            issues.append("TTS library is not installed - this is critical for voice generation")
            recommendations.append("Install TTS library: pip install TTS or uv add TTS")
        
        # 디렉토리 문제 확인
        directories = diagnosis.get("directories", {})
        for dir_name, dir_info in directories.items():
            if not dir_info.get("exists"):
                issues.append(f"Directory {dir_name} does not exist")
                recommendations.append(f"Create directory: mkdir -p {dir_name}")
            elif not dir_info.get("writable"):
                issues.append(f"Directory {dir_name} is not writable")
                recommendations.append(f"Fix permissions: chmod 755 {dir_name}")
        
        # 성우 데이터 확인
        actors = diagnosis.get("voice_actors", {})
        if actors.get("total_count", 0) == 0:
            issues.append("No voice actors registered")
            recommendations.append("Register at least one voice actor to enable TTS generation")
        elif actors.get("active_count", 0) == 0:
            issues.append("No active voice actors available")
            recommendations.append("Activate at least one voice actor")
        
        # 음성 샘플 문제 확인
        samples = diagnosis.get("samples", {})
        missing_files = len(samples.get("file_issues", []))
        if missing_files > 0:
            issues.append(f"{missing_files} voice sample files are missing")
            recommendations.append("Re-upload missing voice sample files")
        
        if samples.get("total_count", 0) == 0:
            issues.append("No voice samples uploaded")
            recommendations.append("Upload voice samples for registered voice actors to enable TTS generation")
        
        # GPU 사용 권장사항
        env = diagnosis.get("environment", {})
        if not env.get("gpu_available"):
            recommendations.append("Consider using GPU for faster TTS generation (optional)")
        
        return issues, recommendations
    
    async def fix_common_issues(self) -> Dict[str, Any]:
        """일반적인 문제들 자동 수정"""
        results = {
            "fixed": [],
            "failed": [],
            "skipped": []
        }
        
        # 1. 디렉토리 생성
        directories = ["audio_files", "voice_samples"]
        for dir_name in directories:
            try:
                dir_path = Path(dir_name)
                if not dir_path.exists():
                    dir_path.mkdir(parents=True, exist_ok=True)
                    results["fixed"].append(f"Created directory: {dir_name}")
                else:
                    results["skipped"].append(f"Directory already exists: {dir_name}")
            except Exception as e:
                results["failed"].append(f"Failed to create {dir_name}: {e}")
        
        # 2. 비활성 성우들 활성화 (필요시)
        try:
            with Session(engine) as session:
                from sqlmodel import select
                
                # 활성 성우가 없으면 첫 번째 성우를 활성화
                active_actors = session.exec(
                    select(VoiceActor).where(VoiceActor.is_active == True)
                ).all()
                
                if not active_actors:
                    first_actor = session.exec(select(VoiceActor)).first()
                    if first_actor:
                        first_actor.is_active = True
                        session.add(first_actor)
                        session.commit()
                        results["fixed"].append(f"Activated voice actor: {first_actor.name}")
                    else:
                        results["skipped"].append("No voice actors found to activate")
                else:
                    results["skipped"].append(f"{len(active_actors)} voice actors already active")
                
        except Exception as e:
            results["failed"].append(f"Failed to check/activate voice actors: {e}")
        
        return results

# 디버거 인스턴스
tts_debugger = TTSServiceDebugger()
