"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { 
  ArrowLeft,
  Play,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Loader2,
  Phone,
  MessageSquare,
  Mic,
  Diamond,
  CheckCircle,
  AlertCircle,
  Clock,
  User
} from "lucide-react"

interface SimulationState {
  simulation_id: string
  current_node_id: string | null
  node_data: {
    node_id: string
    node_type: string
    name: string
    config: any
  } | null
  available_actions: string[]
  status: string
  session_data: Record<string, any>
  is_completed: boolean
  message?: string
}

interface ScenarioInfo {
  id: string
  name: string
  description?: string
  category?: string
  version: string
  status: string
}

export default function SimulatePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const scenarioId = params.id as string
  
  const [scenario, setScenario] = useState<ScenarioInfo | null>(null)
  const [simulation, setSimulation] = useState<SimulationState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [sessionHistory, setSessionHistory] = useState<Array<{
    node_id: string
    node_type: string
    name: string
    timestamp: Date
    action?: string
    input?: string
  }>>([])

  useEffect(() => {
    fetchScenarioInfo()
  }, [scenarioId])

  const fetchScenarioInfo = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      if (!accessToken) {
        toast({
          title: "인증 필요",
          description: "로그인이 필요합니다.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setScenario(data)
      } else if (response.status === 404) {
        toast({
          title: "시나리오를 찾을 수 없음",
          description: "해당 시나리오가 존재하지 않습니다.",
          variant: "destructive",
        })
        router.push("/scenarios")
      } else {
        throw new Error("Failed to fetch scenario")
      }
    } catch (error) {
      console.error("Fetch scenario error:", error)
      toast({
        title: "오류 발생",
        description: "시나리오 정보를 불러오는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startSimulation = async () => {
    setIsStarting(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}/simulation/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSimulation(data)
        setSessionHistory([])
        
        if (data.node_data) {
          addToHistory(data.node_data, "시뮬레이션 시작")
        }
        
        toast({
          title: "시뮬레이션 시작",
          description: "시나리오 시뮬레이션이 시작되었습니다.",
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "시뮬레이션 시작 실패")
      }
    } catch (error) {
      console.error("Start simulation error:", error)
      toast({
        title: "시뮬레이션 시작 실패",
        description: error instanceof Error ? error.message : "시뮬레이션을 시작할 수 없습니다.",
        variant: "destructive",
      })
    } finally {
      setIsStarting(false)
    }
  }

  const executeAction = async (actionType: string, data?: any) => {
    if (!simulation) return

    setIsExecuting(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/simulation/${simulation.simulation_id}/action`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action_type: actionType,
          ...data
        }),
      })

      if (response.ok) {
        const newState = await response.json()
        setSimulation(newState)
        
        if (newState.node_data) {
          addToHistory(newState.node_data, actionType, data?.input_value || data?.condition_choice)
        }
        
        // 입력 필드 초기화
        setInputValue("")
        
        if (newState.is_completed) {
          toast({
            title: "시뮬레이션 완료",
            description: "시나리오가 완료되었습니다.",
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "액션 실행 실패")
      }
    } catch (error) {
      console.error("Execute action error:", error)
      toast({
        title: "액션 실행 실패",
        description: error instanceof Error ? error.message : "액션을 실행할 수 없습니다.",
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  const addToHistory = (nodeData: any, action: string, input?: string) => {
    setSessionHistory(prev => [...prev, {
      node_id: nodeData.node_id,
      node_type: nodeData.node_type,
      name: nodeData.name,
      timestamp: new Date(),
      action,
      input
    }])
  }

  const playAudio = async () => {
    if (!simulation?.node_data || simulation.node_data.node_type !== "message") {
      toast({
        title: "오디오 없음",
        description: "이 노드에는 오디오 파일이 없습니다.",
        variant: "destructive",
      })
      return
    }

    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}/simulation/audio/${simulation.node_data.node_id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        // 인증이 필요한 오디오 스트림을 위해 fetch로 오디오 데이터 가져오기
        const audioUrl = data.audio_url.startsWith('http') 
          ? data.audio_url 
          : `${process.env.NEXT_PUBLIC_API_BASE_URL}${data.audio_url}`
          
        console.log("Fetching audio from URL:", audioUrl)
        const audioResponse = await fetch(audioUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        
        console.log("Audio response status:", audioResponse.status)
        
        if (audioResponse.ok) {
          const audioBlob = await audioResponse.blob()
          const audioBlobUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioBlobUrl)
          setAudioRef(audio)
          setIsPlaying(true)
          
          audio.onended = () => {
            setIsPlaying(false)
            URL.revokeObjectURL(audioBlobUrl) // 메모리 정리
          }
          
          audio.onerror = () => {
            setIsPlaying(false)
            URL.revokeObjectURL(audioBlobUrl) // 메모리 정리
            toast({
              title: "오디오 재생 실패",
              description: "오디오 파일을 재생할 수 없습니다.",
              variant: "destructive",
            })
          }
          
          await audio.play()
        } else {
          const errorText = await audioResponse.text()
          console.error("Audio fetch error:", audioResponse.status, errorText)
          throw new Error(`오디오 데이터 가져오기 실패: ${audioResponse.status} ${errorText}`)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || "오디오 URL을 가져올 수 없습니다"
        
        if (errorMessage.includes("TTS가 생성되지 않았습니다")) {
          toast({
            title: "TTS 필요",
            description: "이 노드의 TTS를 먼저 생성해주세요.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "오디오 재생 실패",
            description: errorMessage,
            variant: "destructive",
          })
        }
        return
      }
    } catch (error) {
      console.error("Play audio error:", error)
      toast({
        title: "오디오 재생 실패",
        description: error instanceof Error ? error.message : "오디오를 재생할 수 없습니다.",
        variant: "destructive",
      })
    }
  }

  const stopAudio = () => {
    if (audioRef) {
      audioRef.pause()
      audioRef.currentTime = 0
      setIsPlaying(false)
    }
  }

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case "start": return <Phone className="h-4 w-4" />
      case "message": return <MessageSquare className="h-4 w-4" />
      case "input": return <Mic className="h-4 w-4" />
      case "condition": return <Diamond className="h-4 w-4" />
      case "end": return <CheckCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getNodeTypeName = (nodeType: string) => {
    switch (nodeType) {
      case "start": return "시작"
      case "message": return "메시지"
      case "input": return "입력"
      case "condition": return "조건"
      case "branch": return "분기"
      case "transfer": return "전환"
      case "end": return "종료"
      default: return nodeType
    }
  }

  const renderNodeActions = () => {
    if (!simulation?.node_data || !simulation.available_actions.length) {
      return null
    }

    const nodeType = simulation.node_data.node_type
    const actions = simulation.available_actions

    return (
      <div className="space-y-4">
        {nodeType === "input" && actions.includes("input") && (
          <div className="space-y-2">
            <Label>입력 값</Label>
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="값을 입력하세요"
                onKeyPress={(e) => e.key === 'Enter' && inputValue.trim() && executeAction("input", { input_value: inputValue.trim() })}
                disabled={isExecuting}
              />
              <Button 
                onClick={() => executeAction("input", { input_value: inputValue.trim() })}
                disabled={!inputValue.trim() || isExecuting}
              >
                입력
              </Button>
            </div>
          </div>
        )}

        {nodeType === "condition" && actions.includes("condition_select") && (
          <div className="space-y-2">
            <Label>조건 선택</Label>
            <div className="flex space-x-2">
              <Button 
                onClick={() => executeAction("condition_select", { condition_choice: "yes" })}
                disabled={isExecuting}
                variant="outline"
                className="flex-1"
              >
                YES
              </Button>
              <Button 
                onClick={() => executeAction("condition_select", { condition_choice: "no" })}
                disabled={isExecuting}
                variant="outline"
                className="flex-1"
              >
                NO
              </Button>
            </div>
          </div>
        )}

        {actions.includes("next") && (
          <Button 
            onClick={() => executeAction("next")}
            disabled={isExecuting}
            className="w-full"
          >
            다음
          </Button>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">시나리오 정보를 불러오는 중...</span>
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            시나리오를 찾을 수 없습니다.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/scenarios")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            시나리오 목록
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{scenario.name} - 시뮬레이션</h1>
            <p className="text-muted-foreground">
              {scenario.description || "시나리오 시뮬레이션을 실행합니다"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{scenario.category}</Badge>
          <Badge variant="secondary">v{scenario.version}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 시뮬레이션 제어 */}
        <div className="lg:col-span-2 space-y-6">
          {!simulation ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>시뮬레이션 시작</span>
                </CardTitle>
                <CardDescription>
                  시나리오 시뮬레이션을 시작하여 플로우를 테스트해보세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={startSimulation} disabled={isStarting} size="lg" className="w-full">
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      시작 중...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      시뮬레이션 시작
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 현재 노드 상태 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {simulation.node_data && getNodeIcon(simulation.node_data.node_type)}
                      <span>현재 노드</span>
                    </div>
                    <Badge variant={simulation.is_completed ? "default" : "secondary"}>
                      {simulation.is_completed ? "완료" : simulation.status}
                    </Badge>
                  </CardTitle>
                  {simulation.node_data && (
                    <CardDescription>
                      {getNodeTypeName(simulation.node_data.node_type)} - {simulation.node_data.name}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {simulation.node_data && (
                    <div className="space-y-4">
                      {/* 노드 내용 */}
                      {simulation.node_data.config?.message && (
                        <div className="bg-muted p-4 rounded-lg">
                          <Label className="text-sm font-medium">메시지</Label>
                          <p className="mt-1">{simulation.node_data.config.message}</p>
                        </div>
                      )}
                      
                      {simulation.node_data.config?.prompt && (
                        <div className="bg-muted p-4 rounded-lg">
                          <Label className="text-sm font-medium">안내 메시지</Label>
                          <p className="mt-1">{simulation.node_data.config.prompt}</p>
                        </div>
                      )}

                      {/* 오디오 재생 */}
                      {simulation.node_data.node_type === "message" && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={isPlaying ? stopAudio : playAudio}
                            disabled={isExecuting}
                          >
                            {isPlaying ? (
                              <>
                                <VolumeX className="h-4 w-4 mr-2" />
                                정지
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-4 w-4 mr-2" />
                                재생
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* 노드별 액션 */}
                      {renderNodeActions()}
                    </div>
                  )}

                  {/* 전역 액션 */}
                  <div className="flex space-x-2 pt-4 border-t">
                    {simulation.available_actions.includes("restart") && (
                      <Button
                        variant="outline"
                        onClick={() => executeAction("restart")}
                        disabled={isExecuting}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        재시작
                      </Button>
                    )}
                    
                    {simulation.available_actions.includes("stop") && (
                      <Button
                        variant="outline"
                        onClick={() => executeAction("stop")}
                        disabled={isExecuting}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        중지
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 시뮬레이션 완료 */}
              {simulation.is_completed && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    시나리오 시뮬레이션이 완료되었습니다.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        {/* 세션 정보 및 히스토리 */}
        <div className="space-y-6">
          {/* 세션 데이터 */}
          {simulation?.session_data && Object.keys(simulation.session_data).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>세션 데이터</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(simulation.session_data).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{key}:</span>
                      <span className="text-sm font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 히스토리 */}
          {sessionHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>진행 히스토리</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessionHistory.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 text-sm">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNodeIcon(item.node_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-muted-foreground">{item.action}</div>
                        {item.input && (
                          <div className="text-xs bg-muted px-2 py-1 rounded mt-1">
                            입력: {item.input}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {item.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
