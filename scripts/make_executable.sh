#!/bin/bash

# 🔧 전체 스크립트 실행 권한 설정

echo "🔧 ARS 시스템 스크립트 실행 권한 설정"
echo "====================================="

# 모든 실행 가능한 스크립트에 권한 부여
chmod +x setup_system.sh
chmod +x run_system.sh  
chmod +x debug_system.sh
chmod +x fix_frontend_error.sh
chmod +x commit_scenario_integration.sh
chmod +x commit_fix.sh
chmod +x git_status.sh
chmod +x run_fix.sh

echo "✅ 실행 권한 설정 완료!"
echo ""
echo "📋 사용 가능한 스크립트:"
echo "  ./setup_system.sh           - 전체 시스템 설정"
echo "  ./run_system.sh             - 시스템 실행"
echo "  ./debug_system.sh           - 문제 해결"
echo "  ./fix_frontend_error.sh     - 프론트엔드 에러 수정"
echo "  ./commit_fix.sh             - 수정사항 Git 커밋"
echo ""
echo "🚀 빠른 시작 가이드:"
echo "  1. ./setup_system.sh        # 최초 설정 (한 번만 실행)"
echo "  2. ./run_system.sh          # 시스템 실행"
echo ""
echo "🔧 에러 발생 시:"
echo "  ./fix_frontend_error.sh     # 프론트엔드 에러 수정"
echo "  ./debug_system.sh           # 종합 문제 해결"
