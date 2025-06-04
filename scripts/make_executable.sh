#!/bin/bash

# 🔧 실행 권한 설정 스크립트

echo "🔧 ARS 시스템 스크립트 실행 권한 설정"
echo "====================================="

# 실행 권한 부여
chmod +x setup_system.sh
chmod +x run_system.sh  
chmod +x debug_system.sh
chmod +x commit_scenario_integration.sh
chmod +x git_status.sh

echo "✅ 실행 권한 설정 완료!"
echo ""
echo "📋 사용 가능한 스크립트:"
echo "  ./setup_system.sh     - 전체 시스템 설정"
echo "  ./run_system.sh       - 시스템 실행"
echo "  ./debug_system.sh     - 문제 해결"
echo ""
echo "🚀 시작하려면 다음 명령어를 실행하세요:"
echo "  ./setup_system.sh"
