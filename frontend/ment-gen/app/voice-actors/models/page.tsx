"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function VoiceModelsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // 메인 성우 관리 페이지의 음성 모델 탭으로 리다이렉트
    router.replace("/voice-actors?tab=models")
  }, [router])

  return (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2">음성 모델 페이지로 이동 중...</span>
    </div>
  )
}
