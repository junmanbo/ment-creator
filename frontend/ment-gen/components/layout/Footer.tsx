"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  HelpCircle,
  Activity,
  Clock,
  Users,
  Database,
  Wifi,
  WifiOff
} from "lucide-react"

interface SystemStatus {
  overall: "healthy" | "warning" | "error"
  database: "connected" | "disconnected" | "slow"
  tts_service: "available" | "unavailable" | "degraded"
  user_count: number
  last_updated: string
}

interface FooterProps {
  className?: string
}

export default function Footer({ className }: FooterProps) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    overall: "healthy",
    database: "connected",
    tts_service: "available",
    user_count: 12,
    last_updated: "" // 초기값을 빈 문자열로 설정
  })
  
  const [isOnline, setIsOnline] = useState<boolean | null>(null) // 초기값을 null로 설정
  const [currentTime, setCurrentTime] = useState<string>("") // 현재 시간 상태
  const [isMounted, setIsMounted] = useState(false) // 마운트 상태 추적

  // 컴포넌트 마운트 후에만 시간 및 온라인 상태 설정
  useEffect(() => {
    setIsMounted(true)
    const updateTime = () => {
      const now = new Date().toLocaleTimeString('ko-KR', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      setCurrentTime(now)
      setSystemStatus(prev => ({
        ...prev,
        last_updated: now
      }))
    }
    
    // 초기 시간 설정
    updateTime()
    setIsOnline(navigator?.onLine ?? true)
    
    // 30초마다 시간 업데이트
    const interval = setInterval(updateTime, 30000)
    
    // 온라인/오프라인 이벤트 리스너
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "available":
        return "bg-green-500"
      case "warning":
      case "slow":
      case "degraded":
        return "bg-yellow-500"
      case "error":
      case "disconnected":
      case "unavailable":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (type: string, status: string) => {
    const statusMap: Record<string, Record<string, string>> = {
      overall: {
        healthy: "정상",
        warning: "주의",
        error: "오류"
      },
      database: {
        connected: "연결됨",
        disconnected: "연결 끊김",
        slow: "느림"
      },
      tts_service: {
        available: "사용 가능",
        unavailable: "사용 불가",
        degraded: "성능 저하"
      }
    }
    
    return statusMap[type]?.[status] || status
  }

  return (
    <footer className={`bg-white border-t border-gray-200 ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 text-sm">
        {/* 왼쪽: 버전 정보 및 링크 */}
        <div className="flex items-center space-x-6">
          <div className="text-gray-600">
            <span className="font-medium">ARS 관리 시스템</span>
            <span className="ml-2 text-gray-400">v2.1.0</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/help"
              className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              <span>지원 센터</span>
            </Link>
            
            <Link
              href="/docs"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              문서
            </Link>
            
            <Link
              href="/feedback"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              피드백
            </Link>
          </div>
        </div>

        {/* 오른쪽: 시스템 상태 */}
        <div className="flex items-center space-x-4">
          {/* 활성 사용자 수 */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="text-sm">{systemStatus.user_count}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>현재 접속 중인 사용자</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* 시스템 상태 */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="outline"
                    className={`border-0 text-white ${getStatusColor(systemStatus.overall)}`}
                  >
                    <Activity className="h-3 w-3 mr-1" />
                    {getStatusText("overall", systemStatus.overall)}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">시스템 상태</p>
                  <div className="flex items-center justify-between space-x-4">
                    <span>데이터베이스:</span>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(systemStatus.database)}`} />
                      {getStatusText("database", systemStatus.database)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between space-x-4">
                    <span>TTS 서비스:</span>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(systemStatus.tts_service)}`} />
                      {getStatusText("tts_service", systemStatus.tts_service)}
                    </div>
                  </div>
                  {isMounted && systemStatus.last_updated && (
                    <div className="flex items-center justify-between space-x-4">
                      <span>마지막 업데이트:</span>
                      <span className="text-gray-400">{systemStatus.last_updated}</span>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* 네트워크 상태 - 클라이언트에서만 렌더링 */}
          {isMounted && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-gray-600">
                    {isOnline ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isOnline ? "온라인" : "오프라인"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* 마지막 업데이트 시간 - 클라이언트에서만 렌더링 */}
          {isMounted && currentTime && (
            <div className="hidden lg:flex items-center text-gray-500 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              <span>{currentTime}</span>
            </div>
          )}
        </div>
      </div>

      {/* 모바일용 추가 정보 */}
      <div className="md:hidden px-4 py-2 border-t border-gray-100 bg-gray-50">
        <div className="flex justify-center space-x-4 text-xs text-gray-500">
          <Link href="/help" className="hover:text-gray-700">
            지원 센터
          </Link>
          <Link href="/docs" className="hover:text-gray-700">
            문서
          </Link>
          <Link href="/feedback" className="hover:text-gray-700">
            피드백
          </Link>
        </div>
      </div>
    </footer>
  )
}
