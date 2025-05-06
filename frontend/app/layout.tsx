import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "./components/providers"
import { Navbar } from "./components/navbar"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "AI 멘트 생성기",
  description: "AI를 이용한 맞춤형 음성 멘트 생성 서비스",
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
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <footer className="border-t py-4">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                © 2023 AI 멘트 생성기. All rights reserved.
              </div>
            </footer>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

