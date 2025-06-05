"use client"

import React from "react"
import { Loader2, Shield } from "lucide-react"

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* 로고 */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>
        
        {/* 로딩 인디케이터 */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-700">
              시스템 로딩 중
            </h2>
            <p className="text-sm text-gray-500">
              ARS 시나리오 관리 시스템을 준비하고 있습니다...
            </p>
          </div>
        </div>
        
        {/* 진행률 바 (선택사항) */}
        <div className="w-64 mx-auto">
          <div className="bg-gray-200 rounded-full h-1.5">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1.5 rounded-full animate-pulse" style={{ width: "70%" }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
