#!/bin/bash
cd /home/jun/projects/ment-creator/backend

echo "=== Installing missing dependencies ==="
uv sync

echo ""
echo "=== Verifying installations ==="
uv run python -c "
import sys
try:
    import noisereduce
    print('✅ noisereduce installed')
except ImportError:
    print('❌ noisereduce NOT installed')
    
try:
    import pyloudnorm
    print('✅ pyloudnorm installed')
except ImportError:
    print('❌ pyloudnorm NOT installed')
    
try:
    import numpy
    print('✅ numpy installed')
except ImportError:
    print('❌ numpy NOT installed')
    
try:
    import scipy
    print('✅ scipy installed')
except ImportError:
    print('❌ scipy NOT installed')
    
try:
    import librosa
    print('✅ librosa installed')
except ImportError:
    print('❌ librosa NOT installed')
    
try:
    import soundfile
    print('✅ soundfile installed')
except ImportError:
    print('❌ soundfile NOT installed')
"

echo ""
echo "=== Testing AudioPreprocessor import ==="
uv run python -c "
try:
    from app.services.audio.audio_preprocessor import audio_preprocessor
    print('✅ AudioPreprocessor imported successfully')
except Exception as e:
    print(f'❌ Import failed: {e}')
"

echo ""
echo "=== Starting FastAPI server ==="
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
