import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "./components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ARS 시나리오 관리 시스템",
  description: "손해보험 콜센터 ARS 시나리오 및 TTS 멘트 관리 시스템",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen">
            <main className="w-full h-full">{children}</main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

