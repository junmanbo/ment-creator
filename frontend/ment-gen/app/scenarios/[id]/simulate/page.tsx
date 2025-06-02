"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Play, 
  Square, 
  RotateCcw,
  Phone,
  MessageSquare,
  GitBranch,
  PhoneCall,
  Mic,
  Loader2
} from "lucide-react"

interface Scenario {
  id: string
  name: string
  description?: string
  nodes: any[]
  connections: any[]
}

interface Simulation {
  id: string
  scenario_id: string
  current_node_id?: string
  session_data?: any
  status: string
  started_at: string
}

interface SimulationStep {
  nodeId: string
  nodeName: string
  nodeType: string
  content?: string
  options?: string[]
  timestamp: string
}

export default function ScenarioSimulatePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [simulation, setSimulation] = useState<Simulation | null>(null)
  const [currentNode, setCurrentNode] = useState<any>(null)
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSimulating, setIsSimulating] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadScenario(params.id as string)
    }
  }, [params.id])

  const loadScenario = async (scenarioId: string) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setScenario(data)
      }
    } catch (error) {
      console.error("Load scenario error:", error)
      toast({
        title: "로드 실패",
        description: "시나리오를 불러오는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startSimulation = async () => {
    if (!scenario) return

    // 시작 노드 찾기
    const startNode = scenario.nodes.find(node => node.node_type === "start")
    if (!startNode) {
      toast({
        title: "시뮬레이션 오류",
        description: "시작 노드가 없습니다.",
        variant: "destructive",
      })
      return
    }

    setIsSimulating(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenario.id}/simulate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            scenario_id: scenario.id,
            start_node_id: startNode.node_id,
            simulation_config: {}
          }),
        }
      )

      if (response.ok) {
        const simulationData = await response.json()
        setSimulation(simulationData)
        setCurrentNode(startNode)
        
        // 첫 번째 단계 추가
        addSimulationStep(startNode)
        
        toast({
          title: "시뮬레이션 시작",
          description: "ARS 시나리오 시뮬레이션이 시작되었습니다.",
        })
      }
    } catch (error) {
      console.error("Start simulation error:", error)
      toast({
        title: "시뮬레이션 시작 실패",
        description: "시뮬레이션을 시작하는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSimulating(false)
    }
  }

  const addSimulationStep = (node: any, userInput?: string) => {
    const step: SimulationStep = {
      nodeId: node.node_id,
      nodeName: node.name,
      nodeType: node.node_type,
      content: node.config?.text || "",
      timestamp: new Date().toISOString()
    }

    // 분기 노드의 경우 옵션 추가
    if (node.node_type === "branch" && node.config?.branches) {
      step.options = node.config.branches.map((branch: any) => `${branch.key}. ${branch.label}`)
    }

    setSimulationSteps(prev => [...prev, step])
  }

  const selectOption = (optionKey: string) => {
    if (!currentNode || !scenario) return

    // 현재 노드에서 선택된 옵션에 따른 다음 노드 찾기
    const connection = scenario.connections.find(conn => 
      conn.source_node_id === currentNode.node_id &&
      conn.condition?.input === optionKey
    )

    if (connection) {
      const nextNode = scenario.nodes.find(node => node.node_id === connection.target_node_id)
      if (nextNode) {
        setCurrentNode(nextNode)
        addSimulationStep(nextNode)
      }
    }
  }

  const stopSimulation = async () => {
    if (!simulation) return

    try {
      const accessToken = localStorage.getItem("access_token")
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/simulations/${simulation.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      setSimulation(null)
      setCurrentNode(null)
      setSimulationSteps([])
      
      toast({
        title: "시뮬레이션 종료",
        description: "시뮬레이션이 종료되었습니다.",
      })
    } catch (error) {
      console.error("Stop simulation error:", error)
    }
  }

  const resetSimulation = () => {
    if (simulation) {
      stopSimulation()
    }
    setSimulationSteps([])
    setCurrentNode(null)
  }

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case "start": return <Phone className="h-4 w-4 text-green-600" />
      case "message": return <MessageSquare className="h-4 w-4 text-blue-600" />
      case "branch": return <GitBranch className="h-4 w-4 text-yellow-600" />
      case "transfer": return <PhoneCall className="h-4 w-4 text-purple-600" />
      case "input": return <Mic className="h-4 w-4 text-gray-600" />
      default: return <Square className="h-4 w-4 text-red-600" />
    }
  }

  const getNodeTypeLabel = (nodeType: string) => {
    switch (nodeType) {
      case "start": return "시작"
      case "message": return "메시지"
      case "branch": return "분기"
      case "transfer": return "상담원 연결"
      case "input": return "입력"
      case "end": return "종료"
      default: return nodeType
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">시나리오를 불러오는 중...</span>
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>시나리오를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push("/scenarios")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{scenario.name} - 시뮬레이션</h1>
            <p className="text-gray-600">ARS 시나리오 흐름을 미리 체험해보세요</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!simulation ? (
            <Button onClick={startSimulation} disabled={isSimulating}>
              {isSimulating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              시뮬레이션 시작
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={resetSimulation}>
                <RotateCcw className="h-4 w-4 mr-2" />
                다시 시작
              </Button>
              <Button variant="destructive" onClick={stopSimulation}>
                <Square className="h-4 w-4 mr-2" />
                시뮬레이션 종료
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 현재 단계 */}
        <Card>
          <CardHeader>
            <CardTitle>현재 단계</CardTitle>
          </CardHeader>
          <CardContent>
            {currentNode ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {getNodeIcon(currentNode.node_type)}
                  <Badge variant="outline">{getNodeTypeLabel(currentNode.node_type)}</Badge>
                  <span className="font-medium">{currentNode.name}</span>
                </div>
                
                {currentNode.config?.text && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">음성 멘트:</p>
                    <p className="text-blue-800">{currentNode.config.text}</p>
                  </div>
                )}
                
                {currentNode.node_type === "branch" && currentNode.config?.branches && (
                  <div>
                    <p className="text-sm font-medium mb-2">고객 선택 옵션:</p>
                    <div className="space-y-2">
                      {currentNode.config.branches.map((branch: any, index: number) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => selectOption(branch.key)}
                        >
                          {branch.key}. {branch.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {currentNode.node_type === "transfer" && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-purple-900">상담원에게 연결됩니다.</p>
                  </div>
                )}
                
                {currentNode.node_type === "end" && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-red-900">통화가 종료됩니다.</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                시뮬레이션을 시작하세요
              </p>
            )}
          </CardContent>
        </Card>

        {/* 시뮬레이션 로그 */}
        <Card>
          <CardHeader>
            <CardTitle>시뮬레이션 로그</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {simulationSteps.map((step, index) => (
                <div key={index} className="border-l-2 border-gray-200 pl-4 pb-3">
                  <div className="flex items-center space-x-2 mb-1">
                    {getNodeIcon(step.nodeType)}
                    <span className="text-sm font-medium">{step.nodeName}</span>
                    <Badge variant="outline" className="text-xs">
                      {getNodeTypeLabel(step.nodeType)}
                    </Badge>
                  </div>
                  
                  {step.content && (
                    <p className="text-sm text-gray-600 mb-1">{step.content}</p>
                  )}
                  
                  {step.options && (
                    <div className="text-xs text-gray-500">
                      <p>선택 옵션:</p>
                      <ul className="list-disc list-inside ml-2">
                        {step.options.map((option, optionIndex) => (
                          <li key={optionIndex}>{option}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-400">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
              
              {simulationSteps.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  시뮬레이션 로그가 여기에 표시됩니다
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 시나리오 정보 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>시나리오 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">총 노드 수</p>
              <p className="text-lg font-semibold">{scenario.nodes.length}개</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">연결 수</p>
              <p className="text-lg font-semibold">{scenario.connections.length}개</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">시뮬레이션 상태</p>
              <Badge variant={simulation ? "default" : "secondary"}>
                {simulation ? "진행 중" : "대기"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
