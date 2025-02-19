"use client"

import type React from "react"

import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { Provider } from "react-redux"
import { store } from "./store/store"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Provider store={store}>
          {children}
          <Toaster />
        </Provider>
      </body>
    </html>
  )
}

