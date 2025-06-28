"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { 
  Settings,
  Pause,
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  Archive,
} from "lucide-react"

interface ScenarioStatusManagerProps {
  scenario: any
  onStatusChange: (newStatus: string) => void
}

export default function ScenarioStatusManager({ scenario, onStatusChange }: ScenarioStatusManagerProps) {
  const [isStatusChanging, setIsStatusChanging] = useState(false)
  
  const { toast } = useToast()

  const statusConfig = {
    draft: {
      label: "초안",
      color: "bg-gray-100 text-gray-800",
      icon: Square,
      description: "작업 중인 초안 상태"
    },
    testing: {
      label: "테스트",
      color: "bg-yellow-100 text-yellow-800",
      icon: AlertTriangle,
      description: "테스트 환경에서 검증 중"
    },
    active: {
      label: "활성",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle,
      description: "운영 환경에서 실행 중"
    },
    inactive: {
      label: "비활성",
      color: "bg-red-100 text-red-800",
      icon: Pause,
      description: "일시적으로 비활성화됨"
    },
    archived: {
      label: "보관됨",
      color: "bg-purple-100 text-purple-800",
      icon: Archive,
      description: "보관된 시나리오"
    }
  }

  const changeStatus = async (newStatus: string) => {
    if (newStatus === scenario.status) return

    setIsStatusChanging(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenario.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            status: newStatus
          }),
        }
      )

      if (response.ok) {
        onStatusChange(newStatus)
        toast({
          title: "상태 변경 완료",
          description: `시나리오 상태가 '${statusConfig[newStatus as keyof typeof statusConfig].label}'로 변경되었습니다.`,
        })
      } else {
        toast({
          title: "상태 변경 실패",
          description: "상태 변경 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Change status error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    } finally {
      setIsStatusChanging(false)
    }
  }


  const getAvailableActions = () => {
    const actions = []
    
    switch (scenario.status) {
      case "draft":
        actions.push(
          { key: "testing", label: "테스트", variant: "outline" as const },
          { key: "active", label: "활성화", variant: "default" as const }
        )
        break
      case "testing":
        actions.push(
          { key: "active", label: "활성화", variant: "default" as const },
          { key: "inactive", label: "비활성화", variant: "outline" as const }
        )
        break
      case "active":
        actions.push(
          { key: "inactive", label: "비활성화", variant: "outline" as const },
          { key: "archived", label: "보관", variant: "outline" as const }
        )
        break
      case "inactive":
        actions.push(
          { key: "active", label: "활성화", variant: "default" as const },
          { key: "archived", label: "보관", variant: "outline" as const }
        )
        break
    }
    
    return actions
  }

  const currentStatus = statusConfig[scenario.status as keyof typeof statusConfig]
  const StatusIcon = currentStatus.icon

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>상태 관리</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 현재 상태 */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <StatusIcon className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium">현재 상태</p>
              <p className="text-sm text-gray-600">{currentStatus.description}</p>
            </div>
          </div>
          <Badge className={currentStatus.color}>
            {currentStatus.label}
          </Badge>
        </div>

        {/* 상태 변경 */}
        <div>
          <label className="text-sm font-medium mb-2 block">상태 변경</label>
          <Select value={scenario.status} onValueChange={changeStatus} disabled={isStatusChanging}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center space-x-2">
                    <config.icon className="h-4 w-4" />
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        {/* 빠른 액션들 */}
        {getAvailableActions().length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">빠른 액션</h4>
              <div className="space-y-2">
                {getAvailableActions().map((action) => (
                  <Button
                    key={action.key}
                    variant={action.variant}
                    size="sm"
                    className="w-full"
                    onClick={() => changeStatus(action.key)}
                    disabled={isStatusChanging}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}