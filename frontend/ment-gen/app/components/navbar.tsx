"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { useAppSelector } from "../store/hooks"

export function Navbar() {
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn)

  return (
    <header className="border-b">
      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="font-bold text-lg">
              AI 멘트 생성기
            </Link>
            <div className="flex space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/scenarios">시나리오 관리</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/voice-actors">성우 관리</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/create">멘트 생성하기</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/list">멘트 목록</Link>
              </Button>
            </div>
          </div>
          {isLoggedIn ? (
            <Link href="/mypage" className="flex flex-col items-center">
              <User className="h-6 w-6" />
              <span className="text-sm">마이페이지</span>
            </Link>
          ) : (
            <Button asChild>
              <Link href="/login">로그인</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}

