"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppSelector, useAppDispatch } from "../store/hooks"
import { logout } from "../store/authSlice"
import { useToast } from "@/components/ui/use-toast"

export default function MyPage() {
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

  const handleLogout = () => {
    // Redux store에서 로그인 상태 삭제
    dispatch(logout())

    // 로컬 스토리지에서 access_token 삭제
    localStorage.removeItem("access_token")

    // 로그아웃 성공 메시지 표시
    toast({
      title: "로그아웃 성공",
      description: "성공적으로 로그아웃되었습니다.",
    })

    // 홈 페이지로 리다이렉트
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
          <p className="mb-6">여기에 사용자 정보를 표시할 수 있습니다.</p>
          <Button onClick={handleLogout} variant="destructive">
            로그아웃
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
