"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Home, 
  ArrowLeft, 
  FileQuestion, 
  Search,
  AlertTriangle
} from "lucide-react"

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          {/* 아이콘 */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <FileQuestion className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          {/* 제목 */}
          <div className="space-y-2">
            <CardTitle className="text-6xl font-bold text-gray-900">404</CardTitle>
            <h2 className="text-xl font-semibold text-gray-700">
              페이지를 찾을 수 없습니다
            </h2>
            <p className="text-sm text-gray-500">
              요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 추천 페이지 */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <Search className="h-4 w-4 mr-1" />
              다음 페이지를 확인해보세요
            </h3>
            <div className="space-y-1 text-sm">
              <Link href="/" className="block text-blue-600 hover:text-blue-800">
                • 대시보드
              </Link>
              <Link href="/scenarios" className="block text-blue-600 hover:text-blue-800">
                • 시나리오 관리
              </Link>
              <Link href="/voice-actors" className="block text-blue-600 hover:text-blue-800">
                • 성우 관리
              </Link>
              <Link href="/tts" className="block text-blue-600 hover:text-blue-800">
                • TTS 관리
              </Link>
            </div>
          </div>
          
          {/* 액션 버튼들 */}
          <div className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                홈으로 돌아가기
              </Link>
            </Button>
            
            <Button variant="outline" onClick={() => window.history.back()} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              이전 페이지로
            </Button>
          </div>
          
          {/* 도움말 */}
          <div className="pt-4 border-t">
            <div className="flex items-start space-x-2 text-left">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-500">
                <p className="font-medium">문제가 지속되면:</p>
                <p>• 브라우저 새로고침 시도</p>
                <p>• URL 주소 확인</p>
                <p>• IT 지원팀 문의 (내선 1234)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
