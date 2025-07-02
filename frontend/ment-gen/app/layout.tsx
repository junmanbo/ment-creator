import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "./components/providers"
import { MainLayout } from "@/components/layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "한화시스템 ARS 관리 시스템",
  description: "한화시스템 콜센터 ARS 시나리오 및 TTS 멘트 관리 시스템",
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
          <MainLayout>
            {children}
          </MainLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

