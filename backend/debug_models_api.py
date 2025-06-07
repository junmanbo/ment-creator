#!/usr/bin/env python3
"""
음성 모델 API 테스트 스크립트
422 오류 원인 파악을 위한 디버깅 도구
"""

import requests
import json
from typing import Optional

API_BASE = "http://localhost:8000/api/v1"

def test_login() -> Optional[str]:
    """로그인하여 액세스 토큰을 받아옵니다."""
    print("🔐 로그인 테스트...")
    
    # 기본 superuser 계정으로 로그인 시도
    login_data = {
        "username": "chchdelm3@icloud.com",  # FIRST_SUPERUSER from .env
        "password": "XSkpS63oZ86W"           # FIRST_SUPERUSER_PASSWORD from .env
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/login/access-token",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"로그인 응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print("✅ 로그인 성공")
            return token
        else:
            print(f"❌ 로그인 실패: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ 로그인 오류: {e}")
        return None

def test_voice_actors_endpoint(token: str):
    """성우 목록 API 테스트"""
    print("\n🎭 성우 목록 API 테스트...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{API_BASE}/voice-actors", headers=headers)
        print(f"성우 목록 응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 성우 {len(data)}명 조회 성공")
            for actor in data[:3]:  # 처음 3명만 표시
                print(f"  - {actor['name']} ({actor['id']})")
        else:
            print(f"❌ 성우 목록 조회 실패: {response.text}")
            
    except Exception as e:
        print(f"❌ 성우 목록 API 오류: {e}")

def test_voice_models_endpoint(token: str):
    """음성 모델 목록 API 테스트 (422 오류 원인 파악)"""
    print("\n🤖 음성 모델 목록 API 테스트...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 쿼리 파라미터 없이 테스트
    try:
        print("1. 기본 요청 테스트...")
        response = requests.get(f"{API_BASE}/voice-actors/models", headers=headers)
        print(f"응답 상태: {response.status_code}")
        print(f"응답 헤더: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 음성 모델 {len(data)}개 조회 성공")
            for model in data[:3]:  # 처음 3개만 표시
                print(f"  - {model['model_name']} (상태: {model['status']})")
        else:
            print(f"❌ 응답 내용:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2, ensure_ascii=False))
            except:
                print(response.text)
                
    except Exception as e:
        print(f"❌ 음성 모델 API 오류: {e}")
    
    # 쿼리 파라미터와 함께 테스트
    try:
        print("\n2. 쿼리 파라미터 포함 테스트...")
        params = {
            "skip": 0,
            "limit": 20,
            "status": "ready"
        }
        response = requests.get(f"{API_BASE}/voice-actors/models", headers=headers, params=params)
        print(f"응답 상태: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ 쿼리 파라미터 포함 요청 실패:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2, ensure_ascii=False))
            except:
                print(response.text)
                
    except Exception as e:
        print(f"❌ 쿼리 파라미터 테스트 오류: {e}")

def test_voice_models_test_endpoint(token: str):
    """음성 모델 테스트 엔드포인트 확인"""
    print("\n🧪 음성 모델 테스트 엔드포인트...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{API_BASE}/voice-actors/models/test", headers=headers)
        print(f"테스트 엔드포인트 응답 상태: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 테스트 엔드포인트 성공")
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(f"❌ 테스트 엔드포인트 실패: {response.text}")
            
    except Exception as e:
        print(f"❌ 테스트 엔드포인트 오류: {e}")

def main():
    print("🔍 음성 모델 API 422 오류 진단 도구")
    print("=" * 50)
    
    # 1. 로그인
    token = test_login()
    if not token:
        print("로그인이 필요합니다. 프로그램을 종료합니다.")
        return
    
    # 2. 성우 목록 테스트 (정상 동작 확인)
    test_voice_actors_endpoint(token)
    
    # 3. 음성 모델 테스트 엔드포인트 확인
    test_voice_models_test_endpoint(token)
    
    # 4. 음성 모델 목록 API 테스트 (422 오류 재현)
    test_voice_models_endpoint(token)
    
    print("\n" + "=" * 50)
    print("테스트 완료")

if __name__ == "__main__":
    main()
