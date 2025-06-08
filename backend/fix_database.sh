#!/bin/bash
# 데이터베이스 설정 도우미 스크립트

echo "🔧 ARS Ment Creator - 데이터베이스 설정 도우미"
echo ""
echo "현재 데이터베이스 연결 오류가 발생했습니다."
echo "다음 중 하나를 선택하세요:"
echo ""
echo "1) SQLite로 빠른 전환 (개발용 - 권장)"
echo "2) PostgreSQL Docker 실행"
echo "3) 종료"
echo ""

read -p "선택하세요 (1-3): " choice

case $choice in
    1)
        echo "=== SQLite로 전환합니다 ==="
        chmod +x switch_to_sqlite.sh
        ./switch_to_sqlite.sh
        ;;
    2)
        echo "=== PostgreSQL Docker를 실행합니다 ==="
        chmod +x setup_postgresql.sh
        ./setup_postgresql.sh
        ;;
    3)
        echo "설정을 종료합니다."
        exit 0
        ;;
    *)
        echo "잘못된 선택입니다."
        exit 1
        ;;
esac

echo ""
echo "✅ 데이터베이스 설정이 완료되었습니다!"
echo "이제 백엔드 서버를 실행하세요:"
echo ""
echo "cd /home/jun/projects/ment-creator/backend"
echo "source .venv/bin/activate"
echo "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
