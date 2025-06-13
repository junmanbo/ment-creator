# 🔧 Fish Speech Docker 문제 해결 가이드

## 🚨 주요 문제 및 해결 방법

### 1. pyaudio 설치 실패 (`portaudio.h: No such file or directory`)

**원인**: pyaudio 컴파일에 필요한 시스템 라이브러리 부족

**해결책**:
1. **개선된 Dockerfile 사용** (이미 적용됨):
   ```bash
   # 최신 버전 사용
   ./fish-speech-docker.sh build
   ```

2. **수동 빌드 시도**:
   ```bash
   # GPU 버전
   docker build -f Dockerfile.fishspeech.v2 -t fish-speech-gpu .
   
   # CPU 버전  
   docker build -f Dockerfile.fishspeech-cpu.v2 -t fish-speech-cpu .
   ```

### 2. Docker 빌드 시간이 너무 오래 걸림

**정상 현상**: 최초 빌드 시 10-20분 소요
- Fish Speech 소스 다운로드
- S1 모델 다운로드 (약 2GB)
- 의존성 패키지 설치

**진행 상황 확인**:
```bash
# 빌드 로그 실시간 확인
./fish-speech-docker.sh logs

# 또는 Docker 빌드 진행 상황
docker-compose build --progress=plain fish-speech-cpu
```

### 3. 메모리 부족으로 빌드 실패

**GPU 메모리 부족**:
```bash
# CPU 버전 사용
./fish-speech-docker.sh start-cpu
```

**시스템 메모리 부족**:
```bash
# Docker 메모리 제한 증가 (8GB 이상 권장)
# Docker Desktop > Settings > Resources > Memory
```

### 4. 모델 다운로드 실패

**인터넷 연결 문제**:
```bash
# 수동 모델 다운로드
wget -O fish-speech-1.4-s1.pth \
  https://huggingface.co/fishaudio/fish-speech-1.4/resolve/main/fish-speech-1.4-s1.pth

# 컨테이너에 복사
docker cp fish-speech-1.4-s1.pth fish-speech-api-cpu:/app/fish-speech/checkpoints/
```

### 5. API 서버 시작 실패

**포트 충돌**:
```bash
# 8765 포트 사용 확인
lsof -i :8765

# 다른 포트 사용 (docker-compose.yml 수정)
ports:
  - "8766:8765"  # 8766 포트로 변경
```

**컨테이너 상태 확인**:
```bash
# 컨테이너 상태
docker ps -a | grep fish-speech

# 상세 로그
./fish-speech-docker.sh logs
```

### 6. CUDA 관련 오류 (GPU 버전)

**CUDA 버전 불일치**:
```bash
# 현재 CUDA 버전 확인
nvidia-smi

# CPU 버전 사용
./fish-speech-docker.sh stop
./fish-speech-docker.sh start-cpu
```

**NVIDIA Container Runtime 미설치**:
```bash
# Ubuntu에서 nvidia-container-runtime 설치
sudo apt update
sudo apt install -y nvidia-container-runtime
sudo systemctl restart docker
```

## 🛠️ 고급 문제 해결

### 완전 초기화 및 재시작

```bash
# 1. 모든 컨테이너 및 이미지 제거
./fish-speech-docker.sh stop
docker-compose down --volumes --remove-orphans
docker system prune -f

# 2. Fish Speech 이미지 제거
docker rmi $(docker images | grep fish-speech | awk '{print $3}')

# 3. 볼륨 제거
docker volume rm ment-creator_fish-speech-models ment-creator_fish-speech-cache

# 4. 재빌드 및 재시작
./fish-speech-docker.sh build
./fish-speech-docker.sh start-cpu  # 또는 start-gpu
```

### 로그 수집 및 디버깅

```bash
# 전체 시스템 로그
./fish-speech-docker.sh logs > fish-speech-debug.log 2>&1

# Docker 시스템 정보
docker system df
docker system info

# 컨테이너 리소스 사용량
docker stats fish-speech-api-cpu
```

### 최소 동작 확인

**간단한 TTS 테스트**:
```bash
# Fish Speech API 접근 테스트
curl http://localhost:8765/health

# 기본 TTS 생성 테스트  
curl -X POST http://localhost:8765/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"안녕하세요", "language":"ko"}' \
  --output test.wav
```

## 📞 지원 요청 시 포함할 정보

```bash
# 시스템 정보 수집 스크립트
echo "=== 시스템 정보 ===" > debug_info.txt
uname -a >> debug_info.txt
docker --version >> debug_info.txt
docker-compose --version >> debug_info.txt

echo -e "\n=== NVIDIA GPU 정보 ===" >> debug_info.txt
nvidia-smi >> debug_info.txt 2>&1 || echo "NVIDIA GPU 없음" >> debug_info.txt

echo -e "\n=== Docker 컨테이너 상태 ===" >> debug_info.txt
docker ps -a >> debug_info.txt

echo -e "\n=== Fish Speech 로그 ===" >> debug_info.txt
./fish-speech-docker.sh logs >> debug_info.txt 2>&1

echo "debug_info.txt 파일 생성 완료"
```

## 🎯 권장 대안

**경량화 버전**: pyaudio 없이 핵심 기능만 사용
```dockerfile
# 최소 설치 버전
RUN pip install torch torchaudio transformers fastapi uvicorn
RUN pip install fish-speech --no-deps
```

**로컬 설치**: Docker 대신 직접 설치
```bash
# Fish Speech 직접 설치 (Ubuntu)
git clone https://github.com/fishaudio/fish-speech.git
cd fish-speech
pip install -e .
```

이 가이드로 대부분의 Fish Speech Docker 관련 문제를 해결할 수 있습니다! 🐟
