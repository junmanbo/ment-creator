"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function MentListPage() {
  const router = useRouter()

  useEffect(() => {
    // 기존 멘트 목록 페이지에 접근하면 새로운 ARS 멘트 관리 페이지로 리다이렉트
    router.replace("/ars-ment-management/list")
  }, [router])

  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-2">새로운 페이지로 이동하는 중...</span>
    </div>
  )
}
