"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react"
import { useAppSelector, useAppDispatch } from "../../app/store/hooks"
import { logout } from "../../app/store/authSlice"

interface HeaderProps {
  onMenuToggle?: () => void
  isSidebarOpen?: boolean
}

export default function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  
  // Redux store에서 사용자 정보 가져오기
  const { user, isLoggedIn } = useAppSelector((state) => state.auth)
  
  const [notifications] = useState([
    { id: 1, message: "TTS 생성이 완료되었습니다.", time: "5분 전" },
    { id: 2, message: "새 시나리오가 배포되었습니다.", time: "10분 전" },
    { id: 3, message: "시스템 점검이 예정되어 있습니다.", time: "1시간 전" },
  ])

  const handleLogout = () => {
    // Redux store에서 로그아웃 처리
    dispatch(logout())
    
    // 로컬 스토리지에서 토큰 제거
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    
    // 로그인 페이지로 이동
    router.push("/login")
  }

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "manager":
        return "bg-blue-100 text-blue-800"
      case "operator":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case "admin":
        return "관리자"
      case "manager":
        return "매니저"
      case "operator":
        return "운영자"
      case "viewer":
        return "뷰어"
      default:
        return "사용자"
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* 왼쪽: 로고 및 메뉴 토글 */}
        <div className="flex items-center space-x-4">
          {/* 모바일 메뉴 토글 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="lg:hidden"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10">
              <Image 
                src="/hanwha-logo.png" 
                alt="한화손해보험 로고" 
                width={40} 
                height={40}
                className="w-10 h-10"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900">
                한화손해보험 ARS 관리
              </h1>
              <p className="text-xs text-gray-500">콜센터 시나리오 관리 시스템</p>
            </div>
          </Link>
        </div>

        {/* 오른쪽: 알림, 사용자 정보, 로그아웃 */}
        <div className="flex items-center space-x-4">
          {/* 로그인된 사용자만 알림 표시 */}
          {isLoggedIn && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>알림</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                  </DropdownMenuItem>
                ))}
                {notifications.length === 0 && (
                  <DropdownMenuItem disabled>
                    새로운 알림이 없습니다.
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 사용자 정보 드롭다운 또는 로그인/회원가입 버튼 */}
          {isLoggedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-auto px-2">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user.username || 'User'} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">{user?.full_name || user?.username || 'User'}</p>
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className={getRoleBadgeColor(user?.role)}>
                          {getRoleDisplayName(user?.role)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.full_name || user.username || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || ''}
                    </p>
                    {user.department && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.department}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/mypage" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>내 정보</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>설정</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">로그인</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">회원가입</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
