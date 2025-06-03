import type React from "react"
import "../globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "../components/providers"

export const metadata = {
  title: "로그인 - 손해보험 콜센터 ARS 시나리오 관리 시스템",
  description: "콜센터 운영 담당자 로그인 페이지",
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      {children}
      <Toaster />
    </Providers>
  )
}
