"use client"

import React, { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Header from "./Header"
import Sidebar from "./Sidebar"
import Footer from "./Footer"
import { cn } from "@/lib/utils"
import { useAppSelector } from "../../app/store/hooks"

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

// 로그인이 필요하지 않은 페이지들
const publicPaths = ["/login", "/register", "/forgot-password"]

export default function MainLayout({ children, className }: MainLayoutProps) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
  // Redux store에서 사용자 정보 가져오기
  const { user, loading: isLoading } = useAppSelector((state) => state.auth)

  // 공개 페이지인지 확인
  const isPublicPage = publicPaths.includes(pathname)

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setIsSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // 사이드바 토글
  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // 모바일에서 사이드바 외부 클릭 시 닫기
  const handleOverlayClick = () => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }

  // 공개 페이지는 레이아웃 없이 렌더링
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header
        onMenuToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "relative transition-all duration-300 ease-in-out",
            // 데스크톱
            "hidden lg:block",
            isSidebarOpen ? "lg:w-64" : "lg:w-16",
            // 모바일
            isMobile && isSidebarOpen && "fixed inset-y-0 left-0 z-50 w-64 lg:relative"
          )}
        >
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={handleSidebarToggle}
            className="h-full"
          />
        </div>

        {/* 모바일 오버레이 */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={handleOverlayClick}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main
            className={cn(
              "flex-1 overflow-auto p-4 lg:p-6",
              className
            )}
          >
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  )
}
