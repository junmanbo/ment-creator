"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 입력 검증
    if (!email.trim() || !password.trim() || !name.trim()) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      })
      return
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }
    
    if (password.length < 8) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호는 8자 이상이어야 합니다.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'
      const response = await fetch(`${apiUrl}/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, full_name: name }),
      })

      if (response.ok) {
        toast({
          title: "회원가입 성공",
          description: "로그인 페이지로 이동합니다.",
        })
        router.push("/login")
      } else {
        const errorData = await response.json()
        toast({
          title: "회원가입 실패",
          description: errorData.detail || "회원가입 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Register error:", error)
      toast({
        title: "회원가입 오류",
        description: "서버와의 통신 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
                  alt="한화시스템 로고" 
                  width={96} 
                  height={96}
                  className="w-24 h-24 drop-shadow-lg"
                />
              </div>
            </div>
            
            {/* 시스템 제목 */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                한화시스템
              </h1>
              <h2 className="text-lg font-semibold text-gray-600">
                ARS 시나리오 관리 시스템
              </h2>
              <p className="text-sm text-gray-500">
                신규 사용자 등록
              </p>
            </div>
          </div>

          {/* 회원가입 폼 */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <div className="mb-4">
                <Button variant="ghost" asChild className="px-0 h-auto text-gray-600 hover:text-gray-800">
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    로그인 페이지로 돌아가기
                  </Link>
                </Button>
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-800">
                회원가입
              </h3>
              <p className="text-sm text-gray-500 text-center">
                계정 정보를 입력하여 가입하세요
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    이메일
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    이름
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
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
                    placeholder="비밀번호를 입력하세요 (8자 이상)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    비밀번호 확인
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
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
                        가입 중...
                      </>
                    ) : (
                      "가입하기"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 추가 정보 */}
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>가입 문의: IT지원팀 (내선 1234)</p>
            <p>운영시간: 평일 09:00 ~ 18:00</p>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2025 한화시스템. All rights reserved.
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

