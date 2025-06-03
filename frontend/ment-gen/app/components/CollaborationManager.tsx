"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Users, 
  Eye, 
  Edit3, 
  Clock, 
  Wifi, 
  WifiOff,
  Circle
} from "lucide-react"

interface CollaborationUser {
  id: string
  name: string
  email: string
  avatar?: string
  status: "active" | "idle" | "offline"
  lastSeen: Date
  currentAction?: "editing" | "viewing" | "idle"
  currentNode?: string
}

interface CollaborationManagerProps {
  scenarioId: string
  currentUser: {
    id: string
    name: string
    email: string
  }
  onUserAction?: (action: string, nodeId?: string) => void
}

export default function CollaborationManager({ 
  scenarioId, 
  currentUser,
  onUserAction 
}: CollaborationManagerProps) {
  const [collaborators, setCollaborators] = useState<CollaborationUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const { toast } = useToast()

  // 실제 구현에서는 WebSocket 또는 Server-Sent Events 사용
  useEffect(() => {
    // Mock 데이터로 시작 (실제로는 WebSocket 연결)
    const mockCollaborators: CollaborationUser[] = [
      {
        id: "user1",
        name: "김운영",
        email: "kim@example.com",
        status: "active",
        lastSeen: new Date(),
        currentAction: "editing",
        currentNode: "start_001"
      },
      {
        id: "user2", 
        name: "이기획",
        email: "lee@example.com",
        status: "idle",
        lastSeen: new Date(Date.now() - 300000), // 5분 전
        currentAction: "viewing"
      }
    ]

    // 현재 사용자 제외
    const filteredCollaborators = mockCollaborators.filter(user => user.id !== currentUser.id)
    setCollaborators(filteredCollaborators)
    setIsConnected(true)

    // Mock 연결 시뮬레이션
    const connectionSimulation = setInterval(() => {
      // 랜덤하게 연결 상태 변경 (실제로는 WebSocket 상태)
      if (Math.random() < 0.05) { // 5% 확률로 연결 상태 변경
        setIsConnected(prev => !prev)
      }
      
      // 사용자 상태 업데이트
      setCollaborators(prev => prev.map(user => ({
        ...user,
        status: Math.random() < 0.1 ? "idle" : user.status,
        lastSeen: Math.random() < 0.2 ? new Date() : user.lastSeen
      })))
    }, 5000)

    return () => clearInterval(connectionSimulation)
  }, [currentUser.id, scenarioId])

  const handleReconnect = () => {
    setReconnectAttempts(prev => prev + 1)
    
    // Mock 재연결 (실제로는 WebSocket 재연결)
    setTimeout(() => {
      setIsConnected(true)
      setReconnectAttempts(0)
      toast({
        title: "연결 복원",
        description: "실시간 협업 기능이 복원되었습니다.",
      })
    }, 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-500"
      case "idle": return "text-yellow-500"
      case "offline": return "text-gray-400"
      default: return "text-gray-400"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "활성"
      case "idle": return "대기"
      case "offline": return "오프라인"
      default: return "알 수 없음"
    }
  }

  const getActionIcon = (action?: string) => {
    switch (action) {
      case "editing": return <Edit3 className="h-3 w-3" />
      case "viewing": return <Eye className="h-3 w-3" />
      default: return <Circle className="h-3 w-3" />
    }
  }

  const getActionLabel = (action?: string) => {
    switch (action) {
      case "editing": return "편집 중"
      case "viewing": return "보는 중"
      default: return "대기 중"
    }
  }

  const formatLastSeen = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return "방금 전"
    if (minutes < 60) return `${minutes}분 전`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}시간 전`
    const days = Math.floor(hours / 24)
    return `${days}일 전`
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>협업자</span>
            <Badge variant="outline" className="text-xs">
              {collaborators.length}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Wifi className="h-3 w-3" />
                <span className="text-xs">연결됨</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <WifiOff className="h-3 w-3 text-red-500" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReconnect}
                  className="h-6 px-2 text-xs"
                  disabled={reconnectAttempts > 0}
                >
                  {reconnectAttempts > 0 ? "재연결 중..." : "재연결"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {collaborators.length > 0 ? (
          collaborators.map((user) => (
            <TooltipProvider key={user.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)} bg-current`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        {user.currentAction && (
                          <div className="flex items-center space-x-1 text-gray-500">
                            {getActionIcon(user.currentAction)}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {formatLastSeen(user.lastSeen)}
                      </p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <div className="text-xs space-y-1">
                    <p className="font-medium">{user.name}</p>
                    <p>상태: {getStatusLabel(user.status)}</p>
                    {user.currentAction && (
                      <p>활동: {getActionLabel(user.currentAction)}</p>
                    )}
                    {user.currentNode && (
                      <p>위치: {user.currentNode}</p>
                    )}
                    <p>마지막 활동: {formatLastSeen(user.lastSeen)}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))
        ) : (
          <div className="text-center py-4">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">현재 혼자 작업 중입니다</p>
            <p className="text-xs text-gray-400 mt-1">
              다른 팀원이 참여하면 여기에 표시됩니다
            </p>
          </div>
        )}
        
        {/* 현재 사용자 정보 */}
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-blue-500 text-white">
                  {currentUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-blue-900">
                  {currentUser.name} (나)
                </p>
                <Edit3 className="h-3 w-3 text-blue-600" />
              </div>
              <p className="text-xs text-blue-700">{currentUser.email}</p>
            </div>
            
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
              편집자
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
