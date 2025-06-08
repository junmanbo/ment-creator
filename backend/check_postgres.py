#!/usr/bin/env python3
"""PostgreSQL 연결 상태 확인 스크립트"""

import subprocess
import sys
import psycopg
from pathlib import Path

def check_postgres_service():
    """PostgreSQL 서비스 상태 확인"""
    try:
        result = subprocess.run(['sudo', 'systemctl', 'status', 'postgresql'], 
                              capture_output=True, text=True, timeout=10)
        print("PostgreSQL 서비스 상태:")
        print(result.stdout)
        return result.returncode == 0
    except Exception as e:
        print(f"서비스 상태 확인 실패: {e}")
        return False

def check_postgres_process():
    """PostgreSQL 프로세스 확인"""
    try:
        result = subprocess.run(['pgrep', '-f', 'postgres'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("PostgreSQL 프로세스가 실행 중입니다.")
            print(f"PID: {result.stdout.strip()}")
            return True
        else:
            print("PostgreSQL 프로세스를 찾을 수 없습니다.")
            return False
    except Exception as e:
        print(f"프로세스 확인 실패: {e}")
        return False

def test_connection(user, password, database, host='localhost', port=5432):
    """데이터베이스 연결 테스트"""
    try:
        conn_string = f"postgresql://{user}:{password}@{host}:{port}/{database}"
        print(f"연결 테스트: {user}@{host}:{port}/{database}")
        
        conn = psycopg.connect(conn_string)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ 연결 성공: {version[0]}")
        conn.close()
        return True
    except Exception as e:
        print(f"❌ 연결 실패: {e}")
        return False

def main():
    print("=== PostgreSQL 상태 점검 ===\n")
    
    # 1. 서비스 상태 확인
    print("1. 서비스 상태 확인")
    check_postgres_service()
    print()
    
    # 2. 프로세스 확인
    print("2. 프로세스 확인")
    check_postgres_process()
    print()
    
    # 3. 연결 테스트
    print("3. 연결 테스트")
    
    # backend/.env 설정으로 테스트
    print("backend/.env 설정으로 테스트:")
    test_connection("postgres", "password", "ment_creator")
    print()
    
    # 루트 .env 설정으로 테스트
    print("루트 .env 설정으로 테스트:")
    test_connection("chchdelm3", "XSkpS63oZ86W", "app")
    print()
    
    # 기본 postgres 사용자로 테스트
    print("기본 postgres 사용자로 테스트:")
    test_connection("postgres", "", "postgres")  # 비밀번호 없이
    
if __name__ == "__main__":
    main()
