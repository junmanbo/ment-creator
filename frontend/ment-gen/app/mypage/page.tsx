"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppSelector, useAppDispatch } from "../store/hooks"
import { logout } from "../store/authSlice"

export default function MyPage() {
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn)
  const router = useRouter()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

  const handleLogout = () => {
    dispatch(logout())
    localStorage.removeItem("access_token")
    router.push("/")
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>마이페이지</CardTitle>
        </CardHeader>
        <CardContent>
          <p>여기에 사용자 정보를 표시할 수 있습니다.</p>
          <div className="mt-4 space-y-2">
            <Button onClick={handleLogout}>로그아웃</Button>
            <Button variant="outline" asChild>
              <Link href="/">홈으로 돌아가기</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

