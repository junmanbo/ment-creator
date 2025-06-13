# Fish Speech pyrootutils 설치 문제 해결 가이드

## 문제 상황
Fish Speech API 서버 시작 시 `ModuleNotFoundError: No module named 'pyrootutils'` 오류 발생

## 해결 방법

### 1단계: Fish Speech 디렉토리로 이동
```bash
cd /home/jun/projects/ment-creator/backend/fish_speech/fish-speech
```

### 2단계: Fish Speech 가상환경 활성화
```bash
source .venv/bin/activate
```

### 3단계: pip 업그레이드
```bash
python -m pip install --upgrade pip
```

### 4단계: pyrootutils 설치
```bash
python -m pip install "pyrootutils>=1.0.4"
```

### 5단계: 설치 확인
```bash
python -c "import pyrootutils; print(f'pyrootutils 버전: {pyrootutils.__version__}')"
```

### 6단계: Fish Speech 의존성 재설치 (선택사항)
```bash
python -m pip install -e ".[stable]"
```

### 7단계: 전체 설치 확인
```bash
python -c "import fish_speech; print('Fish Speech 모듈 로드 성공')"
```

## 빠른 실행 명령어 (한 번에 모든 단계 실행)
```bash
cd /home/jun/projects/ment-creator/backend/fish_speech/fish-speech && \
source .venv/bin/activate && \
python -m pip install --upgrade pip && \
python -m pip install "pyrootutils>=1.0.4" && \
python -c "import pyrootutils; print(f'✅ pyrootutils 설치 완료: {pyrootutils.__version__}')" && \
echo "🎉 설치 완료! 이제 Fish Speech 서버를 다시 시작해보세요."
```

## 설치 완료 후 Fish Speech 서버 시작
```bash
cd /home/jun/projects/ment-creator/backend
python start_fish_speech_server.py start
```

## 추가 문제 해결

### PyTorch 재설치가 필요한 경우
```bash
# CUDA 버전
python -m pip install torch==2.4.1 torchvision==0.19.1 torchaudio==2.4.1 --index-url https://download.pytorch.org/whl/cu121

# 또는 CPU 버전
python -m pip install torch==2.4.1 torchvision==0.19.1 torchaudio==2.4.1
```

### 전체 Fish Speech 재설치가 필요한 경우
```bash
cd /home/jun/projects/ment-creator/backend/fish_speech/fish-speech
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install torch==2.4.1 torchvision==0.19.1 torchaudio==2.4.1
python -m pip install -e ".[stable]"
```

## 자동 설치 스크립트 실행 (Python)
준비된 스크립트를 사용하려면:
```bash
cd /home/jun/projects/ment-creator/backend
python install_pyrootutils_final.py
```
