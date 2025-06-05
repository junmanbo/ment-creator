"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { 
  Volume2, 
  Play, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Zap
} from "lucide-react"

interface ScenarioTTSStatusProps {
  scenarioId: string
  onStatusUpdate?: (status: any) => void
}

interface TTSStatus {
  scenario_id: string
  total_nodes: number
  tts_ready_nodes: number
  tts_pending_nodes: number
  completion_percentage: number
  last_updated: string
}

export default function ScenarioTTSStatus({ scenarioId, onStatusUpdate }: ScenarioTTSStatusProps) {
  const [ttsStatus, setTtsStatus] = useState<TTSStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBatchGenerating, setIsBatchGenerating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (scenarioId) {
      loadTTSStatus()
      
      // 30초마다 상태 갱신
      const interval = setInterval(loadTTSStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [scenarioId])

  const loadTTSStatus = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenario-tts/scenario/${scenarioId}/status`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setTtsStatus(data)
        onStatusUpdate?.(data)
      }
    } catch (error) {
      console.error("Load TTS status error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const batchGenerateTTS = async (forceRegenerate = false) => {
    setIsBatchGenerating(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenario-tts/scenario/${scenarioId}/batch-generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            force_regenerate: forceRegenerate
          }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "일괄 TTS 생성 시작",
          description: `${result.total_nodes}개 노드 중 ${result.generated}개 TTS 생성을 시작했습니다.`,
        })
        
        // 상태 새로고침
        setTimeout(() => {
          loadTTSStatus()
        }, 2000)
      } else {
        toast({
          title: "일괄 생성 실패",
          description: "TTS 일괄 생성 요청에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Batch generate TTS error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    } finally {
      setIsBatchGenerating(false)
    }
  }

  const getStatusColor = (percentage: number) => {
    if (percentage === 100) return "text-green-600"
    if (percentage >= 50) return "text-yellow-600" 
    return "text-red-600"
  }

  const getStatusIcon = (percentage: number) => {
    if (percentage === 100) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (percentage >= 50) return <AlertCircle className="h-5 w-5 text-yellow-600" />
    return <AlertCircle className="h-5 w-5 text-red-600" />
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5" />
            <span>TTS 현황</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">TTS 현황 로딩 중...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!ttsStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5" />
            <span>TTS 현황</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-500">TTS 현황을 불러올 수 없습니다.</p>
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
            <Volume2 className="h-5 w-5" />
            <span>TTS 현황</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadTTSStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            
            <Button
              size="sm"
              onClick={() => batchGenerateTTS(false)}
              disabled={isBatchGenerating}
            >
              {isBatchGenerating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-1" />
              )}
              일괄 생성
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 전체 진행률 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getStatusIcon(ttsStatus.completion_percentage)}
              <span className="font-medium">전체 완성률</span>
            </div>
            <Badge variant="outline" className={getStatusColor(ttsStatus.completion_percentage)}>
              {ttsStatus.completion_percentage.toFixed(1)}%
            </Badge>
          </div>
          
          <Progress 
            value={ttsStatus.completion_percentage} 
            className="h-2"
          />
          
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>완료: {ttsStatus.tts_ready_nodes}개</span>
            <span>전체: {ttsStatus.total_nodes}개</span>
          </div>
        </div>

        {/* 상세 현황 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-700">
              {ttsStatus.tts_ready_nodes}
            </div>
            <div className="text-sm text-green-600">완료</div>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-semibold text-yellow-700">
              {ttsStatus.tts_pending_nodes}
            </div>
            <div className="text-sm text-yellow-600">대기중</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-700">
              {ttsStatus.total_nodes - ttsStatus.tts_ready_nodes - ttsStatus.tts_pending_nodes}
            </div>
            <div className="text-sm text-gray-600">미생성</div>
          </div>
        </div>

        {/* 마지막 업데이트 시간 */}
        <div className="text-xs text-gray-500 text-center">
          마지막 업데이트: {new Date(ttsStatus.last_updated).toLocaleString()}
        </div>

        {/* 일괄 작업 버튼들 */}
        {ttsStatus.completion_percentage < 100 && (
          <div className="space-y-2 pt-2 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => batchGenerateTTS(false)}
              disabled={isBatchGenerating}
            >
              {isBatchGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  누락된 TTS 생성
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => batchGenerateTTS(true)}
              disabled={isBatchGenerating}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              전체 TTS 재생성
            </Button>
          </div>
        )}
        
        {ttsStatus.completion_percentage === 100 && (
          <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-700 font-medium">모든 TTS가 완성되었습니다!</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
