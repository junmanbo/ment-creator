#!/bin/bash

# Fish Speech Docker 서비스 관리 스크립트

set -e

function show_help() {
    echo "Fish Speech Docker 서비스 관리 스크립트"
    echo ""
    echo "사용법:"
    echo "  $0 start-gpu    # GPU 버전 Fish Speech 서비스 시작"
    echo "  $0 start-cpu    # CPU 버전 Fish Speech 서비스 시작"
    echo "  $0 stop         # Fish Speech 서비스 중지"
    echo "  $0 status       # Fish Speech 서비스 상태 확인"
    echo "  $0 logs         # Fish Speech 로그 확인"
    echo "  $0 restart-gpu  # GPU 버전 재시작"
    echo "  $0 restart-cpu  # CPU 버전 재시작"
    echo "  $0 build        # Docker 이미지 재빌드"
    echo ""
    echo "예제:"
    echo "  $0 start-gpu    # NVIDIA GPU가 있는 환경에서 실행"
    echo "  $0 start-cpu    # GPU가 없는 환경에서 실행"
}

function check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker가 설치되지 않았습니다."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose가 설치되지 않았습니다."
        exit 1
    fi
    
    echo "✅ Docker 환경 확인 완료"
}

function start_gpu() {
    echo "🚀 Fish Speech GPU 버전 시작 중..."
    
    # GPU 확인
    if ! nvidia-smi &> /dev/null; then
        echo "⚠️  NVIDIA GPU를 찾을 수 없습니다. CPU 버전을 사용하세요."
        echo "   사용법: $0 start-cpu"
        exit 1
    fi
    
    echo "🔨 Docker 이미지 빌드 중... (최초 실행 시 시간이 오래 걸립니다)"
    docker-compose --profile gpu up -d fish-speech-gpu
    
    if [ $? -eq 0 ]; then
        echo "✅ Fish Speech GPU 버전이 시작되었습니다."
        echo "   API URL: http://localhost:8765"
        echo "   상태 확인: $0 status"
        echo "   로그 확인: $0 logs"
    else
        echo "❌ GPU 버전 시작 실패. CPU 버전을 시도해보세요:"
        echo "   $0 start-cpu"
    fi
}

function start_cpu() {
    echo "🚀 Fish Speech CPU 버전 시작 중..."
    echo "🔨 Docker 이미지 빌드 중... (최초 실행 시 시간이 오래 걸립니다)"
    docker-compose --profile cpu up -d fish-speech-cpu
    
    if [ $? -eq 0 ]; then
        echo "✅ Fish Speech CPU 버전이 시작되었습니다."
        echo "   API URL: http://localhost:8765"
        echo "   상태 확인: $0 status"
        echo "   로그 확인: $0 logs"
    else
        echo "❌ CPU 버전 시작 실패. 로그를 확인해보세요:"
        echo "   $0 logs"
    fi
}

function stop_service() {
    echo "🛑 Fish Speech 서비스 중지 중..."
    docker-compose --profile gpu down fish-speech-gpu 2>/dev/null || true
    docker-compose --profile cpu down fish-speech-cpu 2>/dev/null || true
    echo "✅ Fish Speech 서비스가 중지되었습니다."
}

function show_status() {
    echo "📊 Fish Speech 서비스 상태:"
    echo ""
    
    # 컨테이너 상태 확인
    if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q "fish-speech-api"; then
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "fish-speech-api"
        echo ""
        
        # API 상태 확인
        echo "🔍 API 서비스 상태 확인 중..."
        if curl -f http://localhost:8765/health &> /dev/null; then
            echo "✅ Fish Speech API 서비스가 정상 작동 중입니다."
        else
            echo "⚠️  Fish Speech API 서비스에 접근할 수 없습니다."
            echo "   잠시 후 다시 시도하거나 로그를 확인해보세요: $0 logs"
        fi
    else
        echo "❌ Fish Speech 서비스가 실행되지 않았습니다."
        echo "   서비스 시작: $0 start-gpu 또는 $0 start-cpu"
    fi
}

function show_logs() {
    echo "📄 Fish Speech 서비스 로그:"
    echo ""
    
    if docker ps --format "{{.Names}}" | grep -q "fish-speech-api-gpu"; then
        docker-compose logs --tail=50 -f fish-speech-gpu
    elif docker ps --format "{{.Names}}" | grep -q "fish-speech-api-cpu"; then
        docker-compose logs --tail=50 -f fish-speech-cpu
    else
        echo "❌ 실행 중인 Fish Speech 서비스가 없습니다."
    fi
}

function restart_gpu() {
    echo "🔄 Fish Speech GPU 버전 재시작 중..."
    stop_service
    sleep 2
    start_gpu
}

function restart_cpu() {
    echo "🔄 Fish Speech CPU 버전 재시작 중..."
    stop_service
    sleep 2
    start_cpu
}

function build_images() {
    echo "🔨 Fish Speech Docker 이미지 빌드 중..."
    echo "⚠️  처음 빌드 시 10-20분 정도 소요될 수 있습니다."
    
    # GPU 버전 빌드
    echo "🎯 GPU 버전 빌드 시작..."
    docker-compose build --no-cache fish-speech-gpu
    
    # CPU 버전 빌드
    echo "🎯 CPU 버전 빌드 시작..."
    docker-compose build --no-cache fish-speech-cpu
    
    echo "✅ Docker 이미지 빌드 완료"
    echo ""
    echo "🚀 이제 서비스를 시작할 수 있습니다:"
    echo "   GPU: $0 start-gpu"
    echo "   CPU: $0 start-cpu"
}

# 메인 실행 로직
case "${1:-}" in
    start-gpu)
        check_docker
        start_gpu
        ;;
    start-cpu)
        check_docker
        start_cpu
        ;;
    stop)
        check_docker
        stop_service
        ;;
    status)
        check_docker
        show_status
        ;;
    logs)
        check_docker
        show_logs
        ;;
    restart-gpu)
        check_docker
        restart_gpu
        ;;
    restart-cpu)
        check_docker
        restart_cpu
        ;;
    build)
        check_docker
        build_images
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ 잘못된 명령어입니다."
        echo ""
        show_help
        exit 1
        ;;
esac
