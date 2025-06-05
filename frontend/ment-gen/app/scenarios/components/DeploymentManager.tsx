"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Rocket,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  RotateCcw,
  Pause,
  Play,
  RefreshCw,
  Loader2,
  Server,
  Eye,
  History,
  Shield
} from "lucide-react"

interface Deployment {
  id: string
  scenario_id: string
  environment: "development" | "staging" | "production"
  version: string
  status: "pending" | "deploying" | "deployed" | "failed" | "rolled_back"
  deployed_by: string
  started_at?: string
  completed_at?: string
  error_message?: string
  created_at: string
}

interface DeploymentHistory {
  id: string
  action: string
  status: string
  message: string
  metadata?: any
  created_at: string
}

interface LatestDeployments {
  development?: Deployment | null
  staging?: Deployment | null
  production?: Deployment | null
}

interface DeploymentManagerProps {
  scenarioId: string
  currentVersion: string
  onDeploymentUpdate?: (deployments: LatestDeployments) => void
}

export default function DeploymentManager({ 
  scenarioId, 
  currentVersion,
  onDeploymentUpdate 
}: DeploymentManagerProps) {
  const [latestDeployments, setLatestDeployments] = useState<LatestDeployments>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isDeploying, setIsDeploying] = useState(false)
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null)
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentHistory[]>([])
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    if (scenarioId) {
      loadLatestDeployments()
      
      // 30초마다 상태 갱신
      const interval = setInterval(loadLatestDeployments, 30000)
      return () => clearInterval(interval)
    }
  }, [scenarioId])

  const loadLatestDeployments = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/deployments/scenario/${scenarioId}/latest`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setLatestDeployments(data)
        onDeploymentUpdate?.(data)
      }
    } catch (error) {
      console.error("Load deployments error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const deployToEnvironment = async (environment: string) => {
    setIsDeploying(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/deployments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            scenario_id: scenarioId,
            environment,
            version: currentVersion,
            config: {
              auto_rollback: true,
              health_check_timeout: environment === "production" ? 120 : 60
            }
          }),
        }
      )

      if (response.ok) {
        const deployment = await response.json()
        
        toast({
          title: "배포 시작",
          description: `${environment} 환경으로 배포가 시작되었습니다.`,
        })
        
        // 상태 새로고침
        setTimeout(() => {
          loadLatestDeployments()
        }, 2000)
      } else {
        const errorData = await response.json()
        toast({
          title: "배포 실패",
          description: errorData.detail || "배포 요청에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Deploy error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDeploying(false)
    }
  }

  const rollbackDeployment = async (deploymentId: string) => {
    if (!confirm("정말로 이전 버전으로 롤백하시겠습니까?")) {
      return
    }

    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/deployments/${deploymentId}/rollback`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "롤백 시작",
          description: `${result.rollback_version} 버전으로 롤백이 시작되었습니다.`,
        })
        
        setTimeout(() => {
          loadLatestDeployments()
        }, 2000)
      } else {
        toast({
          title: "롤백 실패",
          description: "롤백 요청에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Rollback error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    }
  }

  const loadDeploymentHistory = async (deploymentId: string) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/deployments/${deploymentId}/history`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setDeploymentHistory(data)
      }
    } catch (error) {
      console.error("Load deployment history error:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed": return "bg-green-100 text-green-800 border-green-200"
      case "deploying": return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "failed": return "bg-red-100 text-red-800 border-red-200"
      case "rolled_back": return "bg-purple-100 text-purple-800 border-purple-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "deployed": return <CheckCircle className="h-4 w-4" />
      case "deploying": return <Loader2 className="h-4 w-4 animate-spin" />
      case "pending": return <Clock className="h-4 w-4" />
      case "failed": return <AlertTriangle className="h-4 w-4" />
      case "rolled_back": return <RotateCcw className="h-4 w-4" />
      default: return <Server className="h-4 w-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "deployed": return "배포됨"
      case "deploying": return "배포 중"
      case "pending": return "대기 중"
      case "failed": return "실패"
      case "rolled_back": return "롤백됨"
      default: return status
    }
  }

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case "production": return "bg-red-50 border-red-200"
      case "staging": return "bg-yellow-50 border-yellow-200"
      case "development": return "bg-blue-50 border-blue-200"
      default: return "bg-gray-50 border-gray-200"
    }
  }

  const getEnvironmentLabel = (env: string) => {
    switch (env) {
      case "production": return "프로덕션"
      case "staging": return "스테이징"
      case "development": return "개발"
      default: return env
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Rocket className="h-5 w-5" />
            <span>배포 관리</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">배포 현황 로딩 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Rocket className="h-5 w-5" />
            <span>배포 관리</span>
          </CardTitle>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadLatestDeployments}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 현재 버전 정보 */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">현재 버전: {currentVersion}</p>
              <p className="text-sm text-blue-700">편집 중인 버전</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">CURRENT</Badge>
          </div>
        </div>

        {/* 환경별 배포 현황 */}
        <div className="space-y-3">
          {["production", "staging", "development"].map((env) => {
            const deployment = latestDeployments[env as keyof LatestDeployments]
            
            return (
              <div key={env} className={`p-4 rounded-lg border ${getEnvironmentColor(env)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Server className="h-5 w-5" />
                    <span className="font-medium">{getEnvironmentLabel(env)}</span>
                    {env === "production" && <Shield className="h-4 w-4 text-red-600" />}
                  </div>
                  
                  {deployment && (
                    <Badge className={getStatusColor(deployment.status)}>
                      {getStatusIcon(deployment.status)}
                      <span className="ml-1">{getStatusLabel(deployment.status)}</span>
                    </Badge>
                  )}
                </div>
                
                {deployment ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">배포된 버전:</span>
                      <span className="font-mono">{deployment.version}</span>
                    </div>
                    
                    {deployment.completed_at && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">배포 시간:</span>
                        <span>{new Date(deployment.completed_at).toLocaleString()}</span>
                      </div>
                    )}
                    
                    {deployment.error_message && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        오류: {deployment.error_message}
                      </div>
                    )}
                    
                    <div className="flex space-x-2 pt-2">
                      {deployment.status === "deployed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rollbackDeployment(deployment.id)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          롤백
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDeployment(deployment)
                          loadDeploymentHistory(deployment.id)
                          setIsHistoryDialogOpen(true)
                        }}
                      >
                        <History className="h-4 w-4 mr-1" />
                        히스토리
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-3">배포된 버전이 없습니다</p>
                    <Button
                      size="sm"
                      onClick={() => deployToEnvironment(env)}
                      disabled={isDeploying}
                      variant={env === "production" ? "default" : "outline"}
                    >
                      {isDeploying ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Rocket className="h-4 w-4 mr-1" />
                      )}
                      배포하기
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 배포 버튼들 */}
        <Separator />
        
        <div className="space-y-2">
          <h4 className="font-medium">새 배포</h4>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              onClick={() => deployToEnvironment("development")}
              disabled={isDeploying}
              className="justify-start"
            >
              <Server className="h-4 w-4 mr-2 text-blue-600" />
              개발 환경 배포
            </Button>
            
            <Button
              variant="outline"
              onClick={() => deployToEnvironment("staging")}
              disabled={isDeploying}
              className="justify-start"
            >
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
              스테이징 배포 (테스트)
            </Button>
            
            <Button
              onClick={() => deployToEnvironment("production")}
              disabled={isDeploying}
              className="justify-start bg-red-600 hover:bg-red-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              프로덕션 배포 (운영)
            </Button>
          </div>
        </div>
      </CardContent>

      {/* 배포 히스토리 다이얼로그 */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              배포 히스토리 - {selectedDeployment?.environment} v{selectedDeployment?.version}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {deploymentHistory.length > 0 ? (
              deploymentHistory.map((history) => (
                <div key={history.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {history.action === "deploy" && <Rocket className="h-4 w-4 text-blue-600" />}
                    {history.action === "rollback" && <RotateCcw className="h-4 w-4 text-orange-600" />}
                    {history.action === "validation" && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {history.action === "healthcheck" && <Activity className="h-4 w-4 text-purple-600" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium capitalize">{history.action}</span>
                      <Badge variant="outline" className="text-xs">
                        {history.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{history.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(history.created_at).toLocaleString()}
                    </p>
                    
                    {history.metadata && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">상세 정보</summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(history.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <History className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">배포 히스토리가 없습니다.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
