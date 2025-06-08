#!/usr/bin/env python3
"""
음성 모델 API 422 오류 수정 테스트
"""

import requests
import json
from typing import Optional

API_BASE = "http://localhost:8000/api/v1"

def test_voice_models_api():
    """음성 모델 API 테스트"""
    print("🔍 음성 모델 API 테스트...")
    
    # 인증 없이 기본 테스트 (401 에러가 예상되지만 422 에러가 아니어야 함)
    print("\n1. 인증 없이 기본 요청 테스트...")
    try:
        response = requests.get(f"{API_BASE}/voice-actors/models")
        print(f"응답 상태: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ 예상된 401 Unauthorized (인증 필요)")
        elif response.status_code == 422:
            print("❌ 여전히 422 Unprocessable Entity 발생")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2, ensure_ascii=False))
            except:
                print(response.text)
        else:
            print(f"예상치 못한 응답 코드: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 테스트 중 오류: {e}")
    
    # 잘못된 파라미터와 함께 테스트
    print("\n2. 잘못된 파라미터 테스트...")
    try:
        params = {
            "voice_actor_id": "invalid-uuid",
            "status": "invalid-status"
        }
        response = requests.get(f"{API_BASE}/voice-actors/models", params=params)
        print(f"응답 상태: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ 401 Unauthorized (인증이 먼저 필요)")
        elif response.status_code == 422:
            print("⚠️ 422 응답 - 파라미터 검증 오류:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2, ensure_ascii=False))
            except:
                print(response.text)
        else:
            print(f"응답 코드: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 테스트 중 오류: {e}")
    
    # 빈 파라미터와 함께 테스트
    print("\n3. 빈 파라미터 테스트...")
    try:
        params = {
            "voice_actor_id": "",
            "status": ""
        }
        response = requests.get(f"{API_BASE}/voice-actors/models", params=params)
        print(f"응답 상태: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ 401 Unauthorized (정상적인 인증 에러)")
        elif response.status_code == 422:
            print("❌ 422 응답 발생:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2, ensure_ascii=False))
            except:
                print(response.text)
        else:
            print(f"응답 코드: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 테스트 중 오류: {e}")

def main():
    print("🔧 음성 모델 API 422 오류 수정 테스트")
    print("=" * 50)
    
    test_voice_models_api()
    
    print("\n" + "=" * 50)
    print("테스트 완료")
    print("\n💡 결과 해석:")
    print("- 401 Unauthorized: 정상 (인증이 필요한 API)")
    print("- 422 Unprocessable Entity: 문제 (파라미터 검증 오류)")
    print("- 다른 상태 코드: 예상치 못한 응답")

if __name__ == "__main__":
    main()
