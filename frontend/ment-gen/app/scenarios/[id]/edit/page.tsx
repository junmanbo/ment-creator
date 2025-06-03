  // 시나리오 상태 변경 핸들러
  const handleStatusChange = (newStatus: string) => {
    if (scenario) {
      setScenario({
        ...scenario,
        status: newStatus
      })
    }
  }"use client"

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
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import NodeEditor from "../components/NodeEditor"
import VersionManager from "../components/VersionManager"
import ScenarioStatusManager from "../components/ScenarioStatusManager"
import ImportExportManager from "../../../components/ImportExportManager"
import CollaborationManager from "../../../components/CollaborationManager"
import { 
  Save, 
  Play, 
  ArrowLeft, 
  Plus,
  Phone,
  MessageSquare,
  GitBranch,
  PhoneCall,
  Square,
  Mic,
  Loader2,
  LayoutGrid,
  Workflow,
  Maximize,
  RotateCcw,
  Download,
  Upload
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

function ScenarioEditPageContent() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { fitView, getNodes, getEdges } = useReactFlow()
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [selectedNode, setSelectedNode] = useState<ScenarioNode | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [nodeCounter, setNodeCounter] = useState(1)

  // 시나리오 상태 변경 핸들러
  const handleStatusChange = (newStatus: string) => {
    if (scenario) {
      setScenario({
        ...scenario,
        status: newStatus
      })
    }
  }

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

  // 자동 레이아웃 함수들
  const autoLayoutVertical = () => {
    const currentNodes = getNodes()
    const currentEdges = getEdges()
    
    if (currentNodes.length === 0) return
    
    // 시작 노드 찾기
    const startNode = currentNodes.find(node => node.data.nodeType === 'start')
    if (!startNode) return
    
    const visited = new Set<string>()
    const positioned = new Map<string, { x: number; y: number }>()
    const VERTICAL_SPACING = 150
    const HORIZONTAL_SPACING = 200
    
    function positionNodesRecursively(nodeId: string, x: number, y: number, level: number) {
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      
      positioned.set(nodeId, { x, y })
      
      // 연결된 다음 노드들 찾기
      const connectedEdges = currentEdges.filter(edge => edge.source === nodeId)
      const childNodes = connectedEdges.map(edge => edge.target)
      
      childNodes.forEach((childId, index) => {
        const childX = x + (index - (childNodes.length - 1) / 2) * HORIZONTAL_SPACING
        const childY = y + VERTICAL_SPACING
        positionNodesRecursively(childId, childX, childY, level + 1)
      })
    }
    
    // 시작 노드부터 재귀적으로 배치
    positionNodesRecursively(startNode.id, 400, 50, 0)
    
    // 위치가 설정되지 않은 노드들 처리
    currentNodes.forEach((node, index) => {
      if (!positioned.has(node.id)) {
        positioned.set(node.id, { 
          x: 100 + (index % 5) * HORIZONTAL_SPACING, 
          y: 300 + Math.floor(index / 5) * VERTICAL_SPACING 
        })
      }
    })
    
    // 노드 위치 업데이트
    setNodes(nds => nds.map(node => {
      const newPosition = positioned.get(node.id)
      return newPosition ? { ...node, position: newPosition } : node
    }))
    
    // 화면에 맞춤
    setTimeout(() => fitView(), 100)
  }
  
  const autoLayoutGrid = () => {
    const currentNodes = getNodes()
    const GRID_SIZE = 250
    const COLS = Math.ceil(Math.sqrt(currentNodes.length))
    
    setNodes(nds => nds.map((node, index) => ({
      ...node,
      position: {
        x: (index % COLS) * GRID_SIZE + 100,
        y: Math.floor(index / COLS) * GRID_SIZE + 100
      }
    })))
    
    setTimeout(() => fitView(), 100)
  }
  
  const exportScenario = () => {
    if (!scenario) return
    
    return {
      scenario: {
        name: scenario.name,
        description: scenario.description,
        category: scenario.category,
        version: scenario.version
      },
      nodes: getNodes().map(node => ({
        id: node.id,
        type: node.data.nodeType,
        name: node.data.label,
        position: node.position,
        config: node.data.config
      })),
      edges: getEdges().map(edge => ({
        source: edge.source,
        target: edge.target,
        label: edge.label,
        condition: edge.data?.condition
      }))
    }
  }
  
  const importScenario = async (importData: any) => {
    try {
      // 기존 노드와 연결 초기화
      setNodes([])
      setEdges([])
      
      // 새 데이터로 설정
      const importedNodes: ScenarioNode[] = importData.nodes.map((node: any) => ({
        id: node.id,
        type: node.type,
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.name,
          nodeType: node.type,
          config: node.config || {}
        }
      }))
      
      const importedEdges: ScenarioEdge[] = importData.edges.map((edge: any, index: number) => ({
        id: `imported-edge-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        data: {
          condition: edge.condition,
          label: edge.label
        }
      }))
      
      setNodes(importedNodes)
      setEdges(importedEdges)
      
      // 시나리오 기본 정보 업데이트
      if (scenario && importData.scenario) {
        setScenario({
          ...scenario,
          name: importData.scenario.name || scenario.name,
          description: importData.scenario.description || scenario.description,
          category: importData.scenario.category || scenario.category
        })
      }
      
      // 노드 카운터 업데이트
      const maxNodeNum = Math.max(...importedNodes.map(n => {
        const match = n.id.match(/\d+$/)
        return match ? parseInt(match[0]) : 0
      }), 0)
      setNodeCounter(maxNodeNum + 1)
      
      // 화면에 맞춤
      setTimeout(() => fitView(), 500)
      
    } catch (error) {
      console.error('Import scenario error:', error)
      throw error
    }
  }
  
  // 새 노드 추가
  const addNode = (nodeType: string) => {
    const nodeId = `${nodeType}_${nodeCounter}`
    
    // 기존 노드들의 위치를 고려하여 새 위치 계산
    const currentNodes = getNodes()
    let newX = 100
    let newY = 100
    
    if (currentNodes.length > 0) {
      // 가장 오른쪽, 아래쪽 노드 위치 찾기
      const maxX = Math.max(...currentNodes.map(n => n.position.x))
      const maxY = Math.max(...currentNodes.map(n => n.position.y))
      newX = maxX + 200
      newY = maxY
      
      // 화면을 벗어나면 다음 줄로
      if (newX > 800) {
        newX = 100
        newY = maxY + 150
      }
    }
    
    const newNode: ScenarioNode = {
      id: nodeId,
      type: nodeType,
      position: { x: newX, y: newY },
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
          <Button 
            variant="outline" 
            onClick={autoLayoutVertical}
            title="수직 자동 레이아웃"
          >
            <Workflow className="h-4 w-4 mr-2" />
            자동 배치
          </Button>
          <Button 
            variant="outline" 
            onClick={autoLayoutGrid}
            title="그리드 레이아웃"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            그리드
          </Button>
          <ImportExportManager
            onImport={importScenario}
            onExport={exportScenario}
            scenarioName={scenario.name}
          />
          <Button variant="outline" onClick={() => router.push(`/scenarios/${scenario.id}/simulate`)}>
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
        {/* 좌측 노드 팔레트 및 편집기 */}
        <div className="w-80 bg-gray-50 border-r flex flex-col">
          {/* 노드 팔레트 */}
          <div className="p-4 border-b">
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
          </div>

          {/* 노드 편집기 */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <NodeEditor
                selectedNode={selectedNode}
                onUpdateNode={updateNodeData}
                onUpdateConfig={updateNodeConfig}
                onDeleteNode={deleteSelectedNode}
              />
            </div>
            
            {/* 상태 관리 */}
            <div className="p-4 border-t">
              <ScenarioStatusManager
                scenario={scenario}
                onStatusChange={handleStatusChange}
              />
            </div>
            
            {/* 버전 관리 */}
            <div className="p-4 border-t">
              <VersionManager
                scenarioId={scenario.id}
                currentVersion={scenario.version}
              />
            </div>
            
            {/* 협업 관리 */}
            <div className="p-4 border-t">
              <CollaborationManager
                scenarioId={scenario.id}
                currentUser={{
                  id: "current_user", // 실제로는 인증된 사용자 정보
                  name: "김개발",
                  email: "kim@example.com"
                }}
                onUserAction={(action, nodeId) => {
                  // 사용자 액션 처리
                  console.log('User action:', action, nodeId)
                }}
              />
            </div>
          </div>
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
              <div className="bg-white p-3 rounded-lg shadow-lg border space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">시나리오 상태</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">노드:</span>
                      <span className="font-medium ml-1">{nodes.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">연결:</span>
                      <span className="font-medium ml-1">{edges.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fitView()}
                    className="w-full text-xs h-8"
                  >
                    <Maximize className="h-3 w-3 mr-1" />
                    전체 보기
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={autoLayoutVertical}
                    className="w-full text-xs h-8"
                  >
                    <Workflow className="h-3 w-3 mr-1" />
                    자동 배치
                  </Button>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

// ReactFlowProvider로 감싸는 wrapper 컴포넌트
export default function ScenarioEditPage() {
  return (
    <ReactFlowProvider>
      <ScenarioEditPageContent />
    </ReactFlowProvider>
  )
}
