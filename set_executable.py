import os
import stat

# fish-speech-docker.sh 파일에 실행 권한 추가
script_path = "/home/jun/projects/ment-creator/fish-speech-docker.sh"
current_permissions = os.stat(script_path).st_mode
os.chmod(script_path, current_permissions | stat.S_IEXEC)

print("✅ fish-speech-docker.sh 실행 권한이 추가되었습니다.")
