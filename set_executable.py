import os
import stat

# 실행 권한을 설정할 파일들
script_paths = [
    "/home/jun/projects/ment-creator/fish-speech-docker.sh",
    "/home/jun/projects/ment-creator/diagnose-fish-speech.sh",
    "/home/jun/projects/ment-creator/fix-fish-speech.sh",
    "/home/jun/projects/ment-creator/quick-fix-fish-speech.sh",
    "/home/jun/projects/ment-creator/rebuild-fish-speech.sh"
]

for script_path in script_paths:
    if os.path.exists(script_path):
        current_permissions = os.stat(script_path).st_mode
        os.chmod(script_path, current_permissions | stat.S_IEXEC)
        print(f"✅ {os.path.basename(script_path)} 실행 권한이 추가되었습니다.")
    else:
        print(f"❌ {script_path} 파일을 찾을 수 없습니다.")
