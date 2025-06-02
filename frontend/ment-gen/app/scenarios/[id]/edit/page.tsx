"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  EdgeTypes,
  NodeTypes,
  MarkerType,
  Panel,
  MiniMap,
  ConnectionMode,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { 
  Save, 
  Play, 
  ArrowLeft, 
  Plus,
  Trash2,
  Settings,
  Phone,
  MessageSquare,
  GitBranch,
  PhoneCall,
  Square,
  Mic,
  Loader2
} from "lucide-react"

// 노드 타입 정의
interface ScenarioNode extends Node {
  data: {
    label: string
    nodeType: "start" | "message" | "branch" | "transfer" | "end" | "input"
    config: any
  }
}

interface ScenarioEdge extends Edge {
  data?: {
    condition?: any
    label?: string
  }
}

// 노드 컴포넌트들
const StartNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-green-100 border-2 ${selected ? 'border-green-500' : 'border-green-300'}`}>
    <div className="flex items-center space-x-2">
      <Phone className="h-4 w-4 text-green-600" />
      <span className="text-sm font-medium">{data.label || "시작"}</span>
    </div>
  </div>
)

const MessageNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 ${selected ? 'border-blue-500' : 'border-blue-300'} min-w-[150px]`}>
    <div className="flex items-center space-x-2">
      <MessageSquare className="h-4 w-4 text-blue-600" />
      <span className="text-sm font-medium">{data.label || "메시지"}</span>
    </div>
    {data.config?.text && (
      <p className="text-xs text-gray-600 mt-1 truncate">{data.config.text.substring(0, 30)}...</p>
    )}
  </div>
)

const BranchNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-yellow-100 border-2 ${selected ? 'border-yellow-500' : 'border-yellow-300'}`}>
    <div className="flex items-center space-x-2">
      <GitBranch className="h-4 w-4 text-yellow-600" />
      <span className="text-sm font-medium">{data.label || "분기"}</span>
    </div>
  </div>
)

const TransferNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-purple-100 border-2 ${selected ? 'border-purple-500' : 'border-purple-300'}`}>
    <div className="flex items-center space-x-2">
      <PhoneCall className="h-4 w-4 text-purple-600" />
      <span className="text-sm font-medium">{data.label || "상담원"}</span>
    </div>
  </div>
)

const EndNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-red-100 border-2 ${selected ? 'border-red-500' : 'border-red-300'}`}>
    <div className="flex items-center space-x-2">
      <Square className="h-4 w-4 text-red-600" />
      <span className="text-sm font-medium">{data.label || "종료"}</span>
    </div>
  </div>
)

const InputNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-gray-100 border-2 ${selected ? 'border-gray-500' : 'border-gray-300'}`}>
    <div className="flex items-center space-x-2">
      <Mic className="h-4 w-4 text-gray-600" />
      <span className="text-sm font-medium">{data.label || "입력"}</span>
    </div>
  </div>
)

// 커스텀 노드 타입 등록
const nodeTypes: NodeTypes = {
  start: StartNode,
  message: MessageNode,
  branch: BranchNode,
  transfer: TransferNode,
  end: EndNode,
  input: InputNode,
}

// 초기 노드 및 엣지
const initialNodes: ScenarioNode[] = []
const initialEdges: ScenarioEdge[] = []

interface Scenario {
  id: string
  name: string
  description?: string
  category?: string
  version: string
  status: string
  nodes: any[]
  connections: any[]
}

export default function ScenarioEditPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [selectedNode, setSelectedNode] = useState<ScenarioNode | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [nodeCounter, setNodeCounter] = useState(1)

  // 시나리오 로드
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
        
        // 노드들을 React Flow 형식으로 변환
        const flowNodes: ScenarioNode[] = data.nodes.map((node: any) => ({
          id: node.node_id,
          type: node.node_type,
          position: { x: node.position_x, y: node.position_y },
          data: {
            label: node.name,
            nodeType: node.node_type,
            config: node.config || {}
          }
        }))
        
        // 연결들을 React Flow 형식으로 변환
        const flowEdges: ScenarioEdge[] = data.connections.map((conn: any, index: number) => ({
          id: `edge-${index}`,
          source: conn.source_node_id,
          target: conn.target_node_id,
          label: conn.label,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          data: {
            condition: conn.condition,
            label: conn.label
          }
        }))
        
        setNodes(flowNodes)
        setEdges(flowEdges)
        
        // 노드 카운터 업데이트
        const maxNodeNum = Math.max(...flowNodes.map(n => {
          const match = n.id.match(/\d+$/)
          return match ? parseInt(match[0]) : 0
        }), 0)
        setNodeCounter(maxNodeNum + 1)
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

  // 엣지 연결 처리
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }, eds)),
    [setEdges]
  )

  // 노드 선택 처리
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as ScenarioNode)
  }, [])

  // 새 노드 추가
  const addNode = (nodeType: string) => {
    const nodeId = `${nodeType}_${nodeCounter}`
    const newNode: ScenarioNode = {
      id: nodeId,
      type: nodeType,
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      data: {
        label: getNodeLabel(nodeType),
        nodeType: nodeType as any,
        config: {}
      }
    }
    
    setNodes((nds) => [...nds, newNode])
    setNodeCounter(nodeCounter + 1)
  }

  const getNodeLabel = (nodeType: string) => {
    switch (nodeType) {
      case "start": return "시작"
      case "message": return "메시지"
      case "branch": return "분기"
      case "transfer": return "상담원"
      case "end": return "종료"
      case "input": return "입력"
      default: return "노드"
    }
  }

  // 선택된 노드 삭제
  const deleteSelectedNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id))
      setSelectedNode(null)
    }
  }

  // 노드 데이터 업데이트
  const updateNodeData = (field: string, value: any) => {
    if (!selectedNode) return
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              [field]: value
            }
          }
          setSelectedNode(updatedNode as ScenarioNode)
          return updatedNode
        }
        return node
      })
    )
  }

  // 노드 설정 업데이트
  const updateNodeConfig = (configField: string, value: any) => {
    if (!selectedNode) return
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              config: {
                ...node.data.config,
                [configField]: value
              }
            }
          }
          setSelectedNode(updatedNode as ScenarioNode)
          return updatedNode
        }
        return node
      })
    )
  }

  // 시나리오 저장
  const saveScenario = async () => {
    if (!scenario) return
    
    setIsSaving(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      
      // 기존 노드 및 연결 삭제 후 새로 생성하는 방식
      // 실제로는 더 효율적인 업데이트 로직이 필요할 수 있음
      
      // 모든 기존 노드 삭제
      for (const node of scenario.nodes) {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenario.id}/nodes/${node.node_id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      }
      
      // 새 노드들 생성
      for (const node of nodes) {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenario.id}/nodes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            scenario_id: scenario.id,
            node_id: node.id,
            node_type: node.data.nodeType,
            name: node.data.label,
            position_x: node.position.x,
            position_y: node.position.y,
            config: node.data.config || {}
          }),
        })
      }
      
      // 연결들 생성
      for (const edge of edges) {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenario.id}/connections`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            scenario_id: scenario.id,
            source_node_id: edge.source,
            target_node_id: edge.target,
            condition: edge.data?.condition,
            label: edge.data?.label || edge.label
          }),
        })
      }
      
      toast({
        title: "저장 완료",
        description: "시나리오가 저장되었습니다.",
      })
    } catch (error) {
      console.error("Save scenario error:", error)
      toast({
        title: "저장 실패",
        description: "시나리오 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
    <div className="h-screen flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push("/scenarios")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{scenario.name}</h1>
            <p className="text-sm text-gray-600">버전 {scenario.version}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => {}}>
            <Play className="h-4 w-4 mr-2" />
            시뮬레이션
          </Button>
          <Button onClick={saveScenario} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            저장
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* 좌측 노드 팔레트 */}
        <div className="w-64 bg-gray-50 border-r p-4">
          <h3 className="font-medium mb-4">노드 팔레트</h3>
          <div className="space-y-2">
            {[
              { type: "start", label: "시작", icon: Phone, color: "green" },
              { type: "message", label: "메시지", icon: MessageSquare, color: "blue" },
              { type: "branch", label: "분기", icon: GitBranch, color: "yellow" },
              { type: "transfer", label: "상담원", icon: PhoneCall, color: "purple" },
              { type: "input", label: "입력", icon: Mic, color: "gray" },
              { type: "end", label: "종료", icon: Square, color: "red" },
            ].map((nodeType) => (
              <Button
                key={nodeType.type}
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode(nodeType.type)}
              >
                <nodeType.icon className="h-4 w-4 mr-2" />
                {nodeType.label}
              </Button>
            ))}
          </div>

          {selectedNode && (
            <>
              <Separator className="my-4" />
              <h3 className="font-medium mb-4">노드 설정</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="node-name">노드 이름</Label>
                  <Input
                    id="node-name"
                    value={selectedNode.data.label}
                    onChange={(e) => updateNodeData("label", e.target.value)}
                  />
                </div>

                {selectedNode.data.nodeType === "message" && (
                  <div>
                    <Label htmlFor="message-text">메시지 내용</Label>
                    <Textarea
                      id="message-text"
                      value={selectedNode.data.config.text || ""}
                      onChange={(e) => updateNodeConfig("text", e.target.value)}
                      placeholder="고객에게 전달할 메시지를 입력하세요"
                      rows={3}
                    />
                  </div>
                )}

                {selectedNode.data.nodeType === "branch" && (
                  <div>
                    <Label>분기 옵션</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      고객의 선택에 따른 분기를 설정하세요
                    </p>
                    {/* 분기 옵션 설정 UI 추가 예정 */}
                  </div>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelectedNode}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  노드 삭제
                </Button>
              </div>
            </>
          )}
        </div>

        {/* 메인 플로우차트 영역 */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
            <Panel position="top-right">
              <div className="bg-white p-2 rounded shadow">
                <p className="text-xs text-gray-600">
                  노드: {nodes.length} / 연결: {edges.length}
                </p>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}
