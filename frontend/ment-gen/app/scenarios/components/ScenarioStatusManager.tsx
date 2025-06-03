"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { 
  Settings,
  Rocket,
  Pause,
  Play,
  Square,
  AlertTriangle,
  CheckCircle,
  Clock,
  Archive,
  Loader2
} from "lucide-react"

interface ScenarioStatusManagerProps {
  scenario: any
  onStatusChange: (newStatus: string) => void
}

export default function ScenarioStatusManager({ scenario, onStatusChange }: ScenarioStatusManagerProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const [isStatusChanging, setIsStatusChanging] = useState(false)
  const [deployDialogOpen, setDeployDialogOpen] = useState(false)
  
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

  const deployScenario = async (environment: string) => {
    setIsDeploying(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenario.id}/deploy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            environment,
            version: scenario.version,
            config: {
              auto_rollback: true,
              health_check_timeout: 60
            }
          }),
        }
      )

      if (response.ok) {
        setDeployDialogOpen(false)
        
        // 배포 성공 시 상태를 active로 변경
        if (environment === "production") {
          onStatusChange("active")
        } else if (environment === "staging") {
          onStatusChange("testing")
        }
        
        toast({
          title: "배포 완료",
          description: `${environment} 환경으로 배포가 완료되었습니다.`,
        })
      } else {
        toast({
          title: "배포 실패",
          description: "배포 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Deploy scenario error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDeploying(false)
    }
  }

  const getAvailableActions = () => {
    const actions = []
    
    switch (scenario.status) {
      case "draft":
        actions.push(
          { key: "test", label: "테스트 환경 배포", variant: "outline" as const },
          { key: "deploy", label: "운영 환경 배포", variant: "default" as const }
        )
        break
      case "testing":
        actions.push(
          { key: "deploy", label: "운영 환경 배포", variant: "default" as const },
          { key: "inactive", label: "비활성화", variant: "outline" as const }
        )
        break
      case "active":
        actions.push(
          { key: "inactive", label: "비활성화", variant: "outline" as const },
          { key: "archive", label: "보관", variant: "outline" as const }
        )
        break
      case "inactive":
        actions.push(
          { key: "active", label: "활성화", variant: "default" as const },
          { key: "archive", label: "보관", variant: "outline" as const }
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

        <Separator />

        {/* 배포 관리 */}
        <div>
          <h4 className="font-medium mb-3">배포 관리</h4>
          
          <div className="space-y-2">
            {scenario.deployed_at && (
              <div className="text-sm text-gray-600 mb-3">
                <Clock className="h-4 w-4 inline mr-1" />
                마지막 배포: {new Date(scenario.deployed_at).toLocaleString()}
              </div>
            )}

            <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" disabled={scenario.status === "archived"}>
                  <Rocket className="h-4 w-4 mr-2" />
                  배포하기
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>시나리오 배포</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      배포할 환경을 선택하세요. 프로덕션 배포 시 현재 활성화된 시나리오가 교체됩니다.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      onClick={() => deployScenario("staging")}
                      disabled={isDeploying}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      {isDeploying ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                      )}
                      스테이징 환경 (테스트용)
                    </Button>
                    
                    <Button
                      onClick={() => deployScenario("production")}
                      disabled={isDeploying}
                      className="w-full justify-start"
                    >
                      {isDeploying ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      프로덕션 환경 (운영용)
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-4">
                    <p>• 스테이징: 내부 테스트용 환경</p>
                    <p>• 프로덕션: 실제 고객이 사용하는 운영 환경</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                    onClick={() => {
                      if (action.key === "test") {
                        deployScenario("staging")
                      } else if (action.key === "deploy") {
                        setDeployDialogOpen(true)
                      } else {
                        changeStatus(action.key)
                      }
                    }}
                    disabled={isStatusChanging || isDeploying}
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