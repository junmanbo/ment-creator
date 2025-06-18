# 한국어 TTS 품질 개선 가이드

## 📌 개요
이 문서는 XTTS V2를 사용한 한국어 TTS 생성 시 음성 품질을 개선하기 위한 가이드입니다.

## 🎯 주요 문제점과 해결 방법

### 1. 톤과 억양 문제
한국어 TTS에서 자주 발생하는 문제:
- 기계적이고 부자연스러운 억양
- 문장 끝의 어색한 톤
- 반복적인 패턴

### 2. 최적화된 파라미터 설정

#### 기본 최적화 파라미터
```python
korean_optimized_params = {
    "temperature": 0.65,      # 자연스러움 (기본: 0.7)
    "top_k": 40,             # 일관성 (기본: 50)
    "top_p": 0.85,           # 다양성 (기본: 0.85)
    "repetition_penalty": 1.1,  # 반복 방지 (기본: 1.0)
    "do_sample": True,       # 샘플링 활성화
    "split_sentences": True  # 문장 분할
}
```

## 🎨 파라미터 상세 설명

### temperature (온도)
- **역할**: 음성의 다양성과 자연스러움 조절
- **범위**: 0.1 ~ 1.0
- **한국어 추천**: 0.6 ~ 0.75
- **효과**:
  - 낮을수록: 더 일관되고 안정적이지만 기계적
  - 높을수록: 더 자연스럽지만 불안정할 수 있음

### top_k (상위 K 샘플링)
- **역할**: 다음 토큰 선택 시 고려할 후보 수
- **범위**: 10 ~ 100
- **한국어 추천**: 30 ~ 50
- **효과**: 낮을수록 더 일관되고, 높을수록 더 다양함

### top_p (누적 확률 샘플링)
- **역할**: 누적 확률 임계값
- **범위**: 0.5 ~ 1.0
- **한국어 추천**: 0.8 ~ 0.9
- **효과**: 음성의 자연스러움과 일관성 균형

### repetition_penalty (반복 페널티)
- **역할**: 반복적인 패턴 방지
- **범위**: 1.0 ~ 1.5
- **한국어 추천**: 1.1 ~ 1.2
- **효과**: 높을수록 반복 억제, 너무 높으면 부자연스러움

## 🎤 참조 음성 최적화

### 고품질 참조 음성 준비
1. **음성 길이**: 10-20초가 적당
2. **녹음 품질**: 
   - 샘플레이트: 22050Hz 이상
   - 비트레이트: 16bit 이상
   - 노이즈 최소화
3. **음성 다양성**:
   - 다양한 톤과 감정 포함
   - 문장 시작, 중간, 끝 모두 포함
4. **한국어 특성**:
   - 자연스러운 한국어 억양
   - 명확한 발음

### 참조 음성 개수
```python
# 3-5개의 참조 음성 사용 권장
gpt_cond_latent, speaker_embedding = model.get_conditioning_latents(
    audio_path=[
        "ref_sample_1.wav",  # 친근한 톤
        "ref_sample_2.wav",  # 중립적 톤
        "ref_sample_3.wav",  # 밝은 톤
        "ref_sample_4.wav",  # 차분한 톤
        "ref_sample_5.wav"   # 강조 톤
    ]
)
```

## 📝 텍스트 전처리

### 1. 숫자 변환
```python
# 변환 전
text = "가격은 15,000원입니다."

# 변환 후
text = "가격은 만오천원입니다."
```

### 2. 영어 단어 처리
```python
# 변환 전
text = "AI 기술이 발전하고 있습니다."

# 변환 후
text = "에이아이 기술이 발전하고 있습니다."
```

### 3. 특수문자 처리
```python
# 변환 전
text = "문의사항은 support@example.com으로 보내주세요."

# 변환 후
text = "문의사항은 서포트 골뱅이 이그잼플 닷컴으로 보내주세요."
```

## 🚀 실제 적용 예시

### API 호출 시
```python
# TTS 생성 요청
response = requests.post(
    f"{API_BASE_URL}/voice-actors/tts-scripts/{script_id}/generate",
    json={
        "generation_params": {
            "temperature": 0.65,
            "top_k": 40,
            "top_p": 0.85,
            "repetition_penalty": 1.1,
            "do_sample": True
        }
    },
    headers={"Authorization": f"Bearer {token}"}
)
```

### 프론트엔드에서
```javascript
const generateTTS = async (scriptId, customParams = {}) => {
  // 한국어 최적화 기본 파라미터
  const koreanOptimizedParams = {
    temperature: 0.65,
    top_k: 40,
    top_p: 0.85,
    repetition_penalty: 1.1,
    do_sample: true
  };
  
  // 사용자 커스텀 파라미터와 병합
  const finalParams = { ...koreanOptimizedParams, ...customParams };
  
  const response = await fetch(
    `/api/v1/voice-actors/tts-scripts/${scriptId}/generate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        generation_params: finalParams
      })
    }
  );
  
  return response.json();
};
```

## 🔧 품질 개선 체크리스트

### ✅ 참조 음성
- [ ] 고품질 녹음 (노이즈 없음)
- [ ] 한국어 네이티브 스피커
- [ ] 10-20초 길이
- [ ] 다양한 톤 포함
- [ ] 3-5개 샘플 준비

### ✅ 텍스트 전처리
- [ ] 숫자를 한글로 변환
- [ ] 영어를 한글 발음으로 변환
- [ ] 특수문자 제거 또는 변환
- [ ] 문장 부호 정리

### ✅ 파라미터 설정
- [ ] temperature: 0.6-0.75
- [ ] top_k: 30-50
- [ ] top_p: 0.8-0.9
- [ ] repetition_penalty: 1.1-1.2
- [ ] split_sentences: True

### ✅ 생성 후 확인
- [ ] 자연스러운 억양
- [ ] 명확한 발음
- [ ] 일관된 톤
- [ ] 적절한 속도

## 📊 파라미터 조정 가이드

### 문제별 해결 방법

| 문제 | 해결 방법 |
|------|----------|
| 너무 기계적임 | temperature를 0.7-0.75로 높이기 |
| 불안정한 음성 | temperature를 0.5-0.6으로 낮추기 |
| 반복적인 패턴 | repetition_penalty를 1.2-1.3으로 높이기 |
| 부자연스러운 끝맺음 | top_p를 0.9-0.95로 높이기 |
| 일관성 부족 | top_k를 20-30으로 낮추기 |

## 🎯 사용 시나리오별 추천 설정

### 1. 공식적인 안내 (보험 ARS)
```python
params = {
    "temperature": 0.55,     # 안정적
    "top_k": 30,            # 일관성
    "top_p": 0.8,           # 예측 가능
    "repetition_penalty": 1.1
}
```

### 2. 친근한 안내 (고객 서비스)
```python
params = {
    "temperature": 0.7,      # 자연스러움
    "top_k": 45,            # 다양성
    "top_p": 0.9,           # 유연함
    "repetition_penalty": 1.15
}
```

### 3. 긴급 안내 (경고/알림)
```python
params = {
    "temperature": 0.5,      # 매우 안정적
    "top_k": 20,            # 높은 일관성
    "top_p": 0.75,          # 명확함
    "repetition_penalty": 1.0
}
```

## 💡 추가 팁

1. **A/B 테스트**: 동일한 텍스트로 여러 파라미터 조합을 테스트
2. **점진적 조정**: 한 번에 하나의 파라미터만 조정
3. **피드백 수집**: 실제 사용자의 피드백을 바탕으로 개선
4. **정기적 검토**: 모델 업데이트 시 파라미터 재조정 필요

## 🚨 주의사항

1. **과도한 조정 주의**: 극단적인 값은 오히려 품질 저하
2. **컨텍스트 고려**: 사용 목적에 따라 파라미터 조정
3. **성능 균형**: 품질과 생성 속도의 균형 고려
4. **일관성 유지**: 동일 프로젝트 내에서는 일관된 설정 사용

---

이 가이드는 지속적으로 업데이트되며, 새로운 최적화 방법이 발견되면 추가될 예정입니다.
