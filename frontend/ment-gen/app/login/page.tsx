"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { login, fetchUserProfile } from "../store/authSlice"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  
  // Redux store에서 로그인 상태 확인
  const { isLoggedIn, loading } = useAppSelector((state) => state.auth)
  
  // 이미 로그인된 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    if (!loading && isLoggedIn) {
      router.push("/")
    }
  }, [isLoggedIn, loading, router])

  // 로딩 중이거나 이미 로그인된 사용자는 로딩 화면 표시
  if (loading || isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "입력 오류",
        description: "사용자 ID와 비밀번호를 모두 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
      console.log('API URL:', apiUrl) // 디버깅용
      const response = await fetch(`${apiUrl}/login/access-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      })

      if (response.ok) {
        const data = await response.json()
        
        // Redux store에 로그인 상태 저장
        dispatch(login({ token: data.access_token }))
        localStorage.setItem("access_token", data.access_token)
        
        // 사용자 정보 로드
        dispatch(fetchUserProfile())
        
        toast({
          title: "로그인 성공",
          description: "시스템에 로그인되었습니다.",
        })
        router.push("/")
      } else {
        if (response.status === 400) {
          toast({
            title: "로그인 실패",
            description: "사용자 ID 또는 비밀번호가 올바르지 않습니다.",
            variant: "destructive",
          })
        } else if (response.status === 500) {
          toast({
            title: "시스템 오류",
            description: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "접속 오류",
            description: "로그인 중 오류가 발생했습니다. 다시 시도해주세요.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다. 네트워크 연결을 확인해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    toast({
      title: "비밀번호 찾기",
      description: "관리자에게 문의하여 비밀번호를 재설정해주세요.",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* 로고 및 타이틀 섹션 */}
          <div className="text-center space-y-6">
            {/* 로고 */}
            <div className="flex justify-center">
              <div className="w-24 h-24 flex items-center justify-center">
                <Image 
                  src="/hanwha-logo.png" 
                  alt="한화손해보험 로고" 
                  width={96} 
                  height={96}
                  className="w-24 h-24 drop-shadow-lg"
                />
              </div>
            </div>
            
            {/* 시스템 제목 */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                한화손해보험
              </h1>
              <h2 className="text-lg font-semibold text-gray-600">
                ARS 시나리오 관리 시스템
              </h2>
              <p className="text-sm text-gray-500">
                음성 인공지능 기반 멘트 생성 및 관리 플랫폼
              </p>
            </div>
          </div>

          {/* 로그인 폼 */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <h3 className="text-xl font-semibold text-center text-gray-800">
                시스템 접속
              </h3>
              <p className="text-sm text-gray-500 text-center">
                콜센터 운영 담당자 로그인
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    사용자 ID
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="사용자 ID를 입력하세요"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                    autoComplete="username"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    비밀번호
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div className="pt-2 space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        로그인 중...
                      </>
                    ) : (
                      "로그인"
                    )}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="ghost" 
                    className="w-full h-11 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                  >
                    비밀번호 찾기
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 추가 정보 */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>접속 문의: IT지원팀 (내선 1234)</p>
            <p>운영시간: 평일 09:00 ~ 18:00</p>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2025 한화손해보험. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ARS 시나리오 관리 시스템 v2.1.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
