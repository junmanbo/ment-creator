"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ARSMentManagementPage() {
  const router = useRouter()

  useEffect(() => {
    // ARS 멘트 관리 메인 페이지에 접근하면 멘트 목록으로 리다이렉트
    router.replace("/ars-ment-management/list")
  }, [router])

  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-2">페이지를 로드하는 중...</span>
    </div>
  )
}
