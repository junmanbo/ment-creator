#!/bin/bash

# Git 상태 확인 및 커밋 스크립트

echo "=== Git 상태 확인 ==="
git status

echo -e "\n=== 변경사항 추가 ==="
git add .

echo -e "\n=== 커밋 실행 ==="
git commit -m "feat: 시나리오 관리 시스템 기반 구조 완성

- 시나리오 CRUD API 구현 완료
- 시나리오 노드 및 연결 관리 API
- React Flow 기반 플로우차트 에디터
- 시나리오 목록 및 편집 페이지
- 버전 관리 및 상태 관리 기능
- .gitignore 파일 개선 (TTS, AI 모델 파일 제외)"

echo -e "\n=== 커밋 완료 ==="
git log --oneline -3
