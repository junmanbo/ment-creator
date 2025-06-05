"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // 즉시 성우 관리 페이지로 리다이렉트
    router.replace('/voice-actors')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-lg">TTS 관리 시스템으로 이동 중...</span>
      </div>
    </div>
  )
}
