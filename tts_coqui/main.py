import os
import torch
from torch.serialization import add_safe_globals
from TTS.tts.configs.xtts_config import XttsConfig, XttsAudioConfig
from TTS.config.shared_configs import BaseDatasetConfig
from TTS.tts.models.xtts import XttsArgs  # ✅ 이번에 추가된 클래스

# 안전하게 사용할 클래스 등록
add_safe_globals({
    XttsConfig,
    XttsAudioConfig,
    BaseDatasetConfig,
    XttsArgs
})

from TTS.api import TTS
import numpy as np
import torchaudio

# XTTS 모델 로드
tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2", progress_bar=True)
# tts = TTS(model_name="tts_models/multilingual/multi-dataset/bark", progress_bar=True)

# GPU 설정
tts.to("cuda" if torch.cuda.is_available() else "cpu")

# voice_samples 폴더에 있는 음성파일 리스트를 전부 가져와서 wav_files 리스트에 추가
# voice_samples_dir = "voice_samples"
voice_samples_dir = "bin_voice_samples"
# voice_samples_dir = "chungcheong_samples"
# voice_samples_dir = "gyeongsang_samples"

# 2번째 파일까지만 가져오기
wav_files = [
    os.path.join(voice_samples_dir, file)
    for file in os.listdir(voice_samples_dir)
    if file.endswith(".wav")
]

print("🎤 음성 샘플 목록:")
for i, wav_file in enumerate(wav_files, start=1):
    print(f"{i}: {wav_file}")

# 텍스트 -> 음성
tts.tts_to_file(
    text="안녕 난 코끼리야 너는 누구니 나는 오늘 아침부터 병준이랑 한 번 하고 머리하러 갔다왔어 기분이 째져",
    file_path="bin_voice_korean01.wav",
    language="ko",
    speaker_wav=wav_files,
    speed=1.0,
    temperature=0.7,
)


print("🎉 음성 생성 완료: cloned_voice_korean.wav")
