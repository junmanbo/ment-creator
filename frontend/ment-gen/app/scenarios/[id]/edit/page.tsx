"use client"

import React, { useState, useEffect, useCallback } from "react"
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
  NodeTypes,
  MarkerType,
  Panel,
  MiniMap,
  ConnectionMode,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import NodeEditor from "../../components/NodeEditor"
import VersionManager from "../../components/VersionManager"
import ScenarioStatusManager from "../../components/ScenarioStatusManager"
import ScenarioTTSStatus from "../../components/ScenarioTTSStatus"
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
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Eye,
  Clock,
  TrendingUp
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

// 노드 컴포넌트들 (Handle 추가)
const StartNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-green-100 border-2 ${selected ? 'border-green-500' : 'border-green-300'}`}>
    <div className="flex items-center space-x-2">
      <Phone className="h-4 w-4 text-green-600" />
      <span className="text-sm font-medium">{data.label || "시작"}</span>
    </div>
    {/* 출력 핸들만 있음 */}
    <Handle
      type="source"
      position={Position.Bottom}
      style={{
        background: '#22c55e',
        width: 8,
        height: 8,
        bottom: -4,
      }}
    />
  </div>
)

const MessageNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 ${selected ? 'border-blue-500' : 'border-blue-300'} min-w-[150px]`}>
    {/* 입력 핸들 */}
    <Handle
      type="target"
      position={Position.Top}
      style={{
        background: '#3b82f6',
        width: 8,
        height: 8,
        top: -4,
      }}
    />
    
    <div className="flex items-center space-x-2">
      <MessageSquare className="h-4 w-4 text-blue-600" />
      <span className="text-sm font-medium">{data.label || "메시지"}</span>
    </div>
    {data.config?.text && (
      <p className="text-xs text-gray-600 mt-1 truncate">{data.config.text.substring(0, 30)}...</p>
    )}
    
    {/* 출력 핸들 */}
    <Handle
      type="source"
      position={Position.Bottom}
      style={{
        background: '#3b82f6',
        width: 8,
        height: 8,
        bottom: -4,
      }}
    />
  </div>
)

const BranchNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-yellow-100 border-2 ${selected ? 'border-yellow-500' : 'border-yellow-300'}`}>
    {/* 입력 핸들 */}
    <Handle
      type="target"
      position={Position.Top}
      style={{
        background: '#eab308',
        width: 8,
        height: 8,
        top: -4,
      }}
    />
    
    <div className="flex items-center space-x-2">
      <GitBranch className="h-4 w-4 text-yellow-600" />
      <span className="text-sm font-medium">{data.label || "분기"}</span>
    </div>
    
    {/* 여러 출력 핸들 (분기용) */}
    <Handle
      type="source"
      position={Position.Bottom}
      id="option-1"
      style={{
        background: '#eab308',
        width: 8,
        height: 8,
        bottom: -4,
        left: '25%',
      }}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="option-2"
      style={{
        background: '#eab308',
        width: 8,
        height: 8,
        bottom: -4,
        left: '50%',
      }}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="option-3"
      style={{
        background: '#eab308',
        width: 8,
        height: 8,
        bottom: -4,
        left: '75%',
      }}
    />
  </div>
)

const TransferNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-purple-100 border-2 ${selected ? 'border-purple-500' : 'border-purple-300'}`}>
    {/* 입력 핸들 */}
    <Handle
      type="target"
      position={Position.Top}
      style={{
        background: '#a855f7',
        width: 8,
        height: 8,
        top: -4,
      }}
    />
    
    <div className="flex items-center space-x-2">
      <PhoneCall className="h-4 w-4 text-purple-600" />
      <span className="text-sm font-medium">{data.label || "상담원"}</span>
    </div>
    
    {/* 출력 핸들 (상담원 연결 후 다른 플로우로 갈 수 있음) */}
    <Handle
      type="source"
      position={Position.Bottom}
      style={{
        background: '#a855f7',
        width: 8,
        height: 8,
        bottom: -4,
      }}
    />
  </div>
)

const EndNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-red-100 border-2 ${selected ? 'border-red-500' : 'border-red-300'}`}>
    {/* 입력 핸들만 있음 */}
    <Handle
      type="target"
      position={Position.Top}
      style={{
        background: '#ef4444',
        width: 8,
        height: 8,
        top: -4,
      }}
    />
    
    <div className="flex items-center space-x-2">
      <Square className="h-4 w-4 text-red-600" />
      <span className="text-sm font-medium">{data.label || "종료"}</span>
    </div>
  </div>
)

const InputNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-gray-100 border-2 ${selected ? 'border-gray-500' : 'border-gray-300'}`}>
    {/* 입력 핸들 */}
    <Handle
      type="target"
      position={Position.Top}
      style={{
        background: '#6b7280',
        width: 8,
        height: 8,
        top: -4,
      }}
    />
    
    <div className="flex items-center space-x-2">
      <Mic className="h-4 w-4 text-gray-600" />
      <span className="text-sm font-medium">{data.label || "입력"}</span>
    </div>
    
    {/* 출력 핸들 */}
    <Handle
      type="source"
      position={Position.Bottom}
      style={{
        background: '#6b7280',
        width: 8,
        height: 8,
        bottom: -4,
      }}
    />
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

interface Scenario {
  id: string
  name: string
  description?: string
  category?: string
  version: string
  status: string
  nodes: any[]
  connections: any[]
  created_by: string
  updated_by?: string
  created_at: string
  updated_at: string
}

function ScenarioEditPageContent() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { fitView, getNodes, getEdges } = useReactFlow()
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [selectedNode, setSelectedNode] = useState<ScenarioNode | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [nodeCounter, setNodeCounter] = useState(1)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoVersionEnabled, setAutoVersionEnabled] = useState(true)
  const [lastVersionSnapshot, setLastVersionSnapshot] = useState<any>(null)
  const [changeTracker, setChangeTracker] = useState<{
    nodes_added: string[]
    nodes_modified: string[]
    nodes_deleted: string[]
    connections_added: string[]
    connections_modified: string[]
    connections_deleted: string[]
  }>({
    nodes_added: [],
    nodes_modified: [],
    nodes_deleted: [],
    connections_added: [],
    connections_modified: [],
    connections_deleted: []
  })

  // 변경사항 추적 및 자동 버전 생성
  useEffect(() => {
    if (lastVersionSnapshot && (nodes.length > 0 || edges.length > 0)) {
      trackChanges()
    }
    setHasUnsavedChanges(true)
  }, [nodes, edges])

  // 변경사항 분석 함수
  const trackChanges = () => {
    if (!lastVersionSnapshot) return

    const currentSnapshot = {
      nodes: nodes.map(n => ({ id: n.id, ...n.data, position: n.position })),
      connections: edges.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.label }))
    }

    const prevNodes = new Map(lastVersionSnapshot.nodes?.map((n: any) => [n.id, n]) || [])
    const prevConnections = new Map(lastVersionSnapshot.connections?.map((c: any) => [c.id, c]) || [])
    const currentNodes = new Map(currentSnapshot.nodes.map(n => [n.id, n]))
    const currentConnections = new Map(currentSnapshot.connections.map(c => [c.id, c]))

    const tracker = {
      nodes_added: [],
      nodes_modified: [],
      nodes_deleted: [],
      connections_added: [],
      connections_modified: [],
      connections_deleted: []
    } as any

    // 노드 변경 추적
    for (const [nodeId, node] of currentNodes) {
      if (!prevNodes.has(nodeId)) {
        tracker.nodes_added.push(nodeId)
      } else if (JSON.stringify(prevNodes.get(nodeId)) !== JSON.stringify(node)) {
        tracker.nodes_modified.push(nodeId)
      }
    }

    for (const [nodeId] of prevNodes) {
      if (!currentNodes.has(nodeId)) {
        tracker.nodes_deleted.push(nodeId)
      }
    }

    // 연결 변경 추적
    for (const [connId, conn] of currentConnections) {
      if (!prevConnections.has(connId)) {
        tracker.connections_added.push(connId)
      } else if (JSON.stringify(prevConnections.get(connId)) !== JSON.stringify(conn)) {
        tracker.connections_modified.push(connId)
      }
    }

    for (const [connId] of prevConnections) {
      if (!currentConnections.has(connId)) {
        tracker.connections_deleted.push(connId)
      }
    }

    setChangeTracker(tracker)
  }

  // 자동 버전 생성 (개선된 에러 처리)
  const createAutoVersion = async (changeDescription?: string) => {
    if (!scenario || !autoVersionEnabled) return null

    try {
      const accessToken = localStorage.getItem("access_token")
      if (!accessToken) {
        console.warn("No access token available for auto version creation")
        return null
      }

      const changes = getChangeDescription()
      const description = changeDescription || changes || "자동 생성된 버전"

      // 네트워크 요청 timeout 설정
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10초 timeout

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenario.id}/versions/auto?change_description=${encodeURIComponent(description)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      if (response.ok) {
        const newVersion = await response.json()
        
        // 현재 상태를 새로운 기준점으로 설정
        setLastVersionSnapshot({
          nodes: nodes.map(n => ({ id: n.id, ...n.data, position: n.position })),
          connections: edges.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.label }))
        })
        
        // 변경 추적 초기화
        setChangeTracker({
          nodes_added: [],
          nodes_modified: [],
          nodes_deleted: [],
          connections_added: [],
          connections_modified: [],
          connections_deleted: []
        })

        toast({
          title: "자동 버전 생성",
          description: `버전 ${newVersion.version}이 생성되었습니다.`,
          duration: 3000,
        })

        return newVersion
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))
        console.warn(`Auto version creation failed: ${response.status} - ${errorData.detail}`)
        
        // 401 오류인 경우에만 토스트 표시
        if (response.status === 401) {
          toast({
            title: "인증 만료",
            description: "자동 버전 생성을 위해 다시 로그인해주세요.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.warn("Auto version creation error:", error)
      
      // 네트워크 에러인 경우 사용자에게 알림 (선택적)
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn("Auto version creation timed out")
        } else if (error.message.includes('fetch')) {
          console.warn("Network error during auto version creation - backend server may be down")
          // 네트워크 에러는 조용히 처리 (사용자에게 알리지 않음)
        }
      }
    }
    return null
  }

  // 변경 사항 설명 생성
  const getChangeDescription = () => {
    const changes = []
    
    if (changeTracker.nodes_added.length > 0) {
      changes.push(`노드 ${changeTracker.nodes_added.length}개 추가`)
    }
    if (changeTracker.nodes_modified.length > 0) {
      changes.push(`노드 ${changeTracker.nodes_modified.length}개 수정`)
    }
    if (changeTracker.nodes_deleted.length > 0) {
      changes.push(`노드 ${changeTracker.nodes_deleted.length}개 삭제`)
    }
    if (changeTracker.connections_added.length > 0) {
      changes.push(`연결 ${changeTracker.connections_added.length}개 추가`)
    }
    if (changeTracker.connections_modified.length > 0) {
      changes.push(`연결 ${changeTracker.connections_modified.length}개 수정`)
    }
    if (changeTracker.connections_deleted.length > 0) {
      changes.push(`연결 ${changeTracker.connections_deleted.length}개 삭제`)
    }

    return changes.join(", ")
  }

  // 중요한 변경사항 감지 (자동 버전 생성 트리거)
  const hasSignificantChanges = () => {
    const totalChanges = Object.values(changeTracker).reduce((sum, arr) => sum + arr.length, 0)
    return totalChanges >= 3 // 3개 이상 변경 시 중요한 변경으로 간주
  }

  // 시나리오 로드
  useEffect(() => {
    if (params.id) {
      loadScenario(params.id as string)
    }
  }, [params.id])

  const loadScenario = async (scenarioId: string) => {
    setIsLoading(true)
    setError(null)
    
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
        },
      })

      if (response.ok) {
        const data = await response.json()
        setScenario(data)
        
        // 노드들을 React Flow 형식으로 변환
        const flowNodes: ScenarioNode[] = (data.nodes || []).map((node: any) => ({
          id: node.node_id,
          type: node.node_type,
          position: { x: node.position_x || 0, y: node.position_y || 0 },
          data: {
            label: node.name,
            nodeType: node.node_type,
            config: node.config || {}
          }
        }))
        
        // 연결들을 React Flow 형식으로 변환
        const flowEdges: ScenarioEdge[] = (data.connections || []).map((conn: any, index: number) => ({
          id: conn.id || `edge-${index}`,
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
        
        // 초기 스냅샷 설정 (버전 추적을 위한 기준점)
        setLastVersionSnapshot({
          nodes: flowNodes.map(n => ({ id: n.id, ...n.data, position: n.position })),
          connections: flowEdges.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.label }))
        })
        
        // 노드 카운터 업데이트
        const maxNodeNum = Math.max(...flowNodes.map(n => {
          const match = n.id.match(/\\d+$/)
          return match ? parseInt(match[0]) : 0
        }), 0)
        setNodeCounter(maxNodeNum + 1)
        
        setHasUnsavedChanges(false)
      } else if (response.status === 401) {
        toast({
          title: "인증 만료",
          description: "다시 로그인해주세요.",
          variant: "destructive",
        })
        localStorage.removeItem("access_token")
        router.push("/login")
      } else if (response.status === 404) {
        setError("시나리오를 찾을 수 없습니다.")
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("Load scenario error:", error)
      const errorMessage = error instanceof Error ? error.message : "시나리오를 불러오는데 실패했습니다."
      setError(errorMessage)
      toast({
        title: "로드 실패",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 엣지 연결 처리 (개선된 스타일)
  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#555',
        },
        style: {
          strokeWidth: 2,
          stroke: '#555',
        },
        type: 'smoothstep', // 부드러운 연결선
      }
      setEdges((eds) => addEdge(edge, eds))
      setHasUnsavedChanges(true)
    },
    [setEdges]
  )

  // 노드 선택 처리
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as ScenarioNode)
  }, [])

  // 캔버스 클릭 (노드 선택 해제)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // 자동 레이아웃 함수들
  const autoLayoutVertical = () => {
    const currentNodes = getNodes()
    const currentEdges = getEdges()
    
    if (currentNodes.length === 0) return
    
    // 시작 노드 찾기
    const startNode = currentNodes.find(node => node.data.nodeType === 'start')
    if (!startNode) {
      // 시작 노드가 없으면 첫 번째 노드를 시작점으로 사용
      const firstNode = currentNodes[0]
      if (firstNode) {
        layoutFromNode(firstNode, currentNodes, currentEdges)
      }
      return
    }
    
    layoutFromNode(startNode, currentNodes, currentEdges)
  }
  
  const layoutFromNode = (startNode: Node, currentNodes: Node[], currentEdges: Edge[]) => {
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
    
    setHasUnsavedChanges(true)
    
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
    
    setHasUnsavedChanges(true)
    setTimeout(() => fitView(), 100)
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
    setHasUnsavedChanges(true)
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
      setHasUnsavedChanges(true)
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
    setHasUnsavedChanges(true)
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
    setHasUnsavedChanges(true)
  }

  // 시나리오 저장 (개선된 자동 버전 생성 포함)
  const saveScenario = async (createVersion: boolean = false) => {
    if (!scenario) return
    
    setIsSaving(true)
    let saveSuccessful = false
    let newVersion = null
    
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
      
      const currentNodes = getNodes()
      const currentEdges = getEdges()
      
      // 자동 버전 생성 시도 (실패해도 저장은 계속 진행)
      if ((createVersion || (autoVersionEnabled && hasSignificantChanges())) && hasUnsavedChanges) {
        const changeDesc = getChangeDescription()
        if (changeDesc) {
          try {
            newVersion = await createAutoVersion(changeDesc)
            if (newVersion) {
              console.log(`Auto version created: ${newVersion.version}`)
            }
          } catch (versionError) {
            console.warn("Auto version creation failed, continuing with save:", versionError)
            // 버전 생성 실패해도 저장은 계속 진행
          }
        }
      }
      
      // 1. 기존 노드 및 연결 삭제
      if (scenario.nodes && scenario.nodes.length > 0) {
        for (const node of scenario.nodes) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenario.id}/nodes/${node.node_id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${accessToken}` },
            })
          } catch (error) {
            console.warn(`Failed to delete node ${node.node_id}:`, error)
          }
        }
      }
      
      // 2. 새 노드들 생성
      const nodePromises = currentNodes.map(async (node) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenario.id}/nodes`, {
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
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`Node creation failed: ${errorData.detail || response.statusText}`)
        }
        
        return response.json()
      })
      
      await Promise.all(nodePromises)
      
      // 3. 연결들 생성
      const connectionPromises = currentEdges.map(async (edge) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenario.id}/connections`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            scenario_id: scenario.id,
            source_node_id: edge.source,
            target_node_id: edge.target,
            condition: edge.data?.condition || null,
            label: edge.data?.label || edge.label || null
          }),
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`Connection creation failed: ${errorData.detail || response.statusText}`)
        }
        
        return response.json()
      })
      
      await Promise.all(connectionPromises)
      
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      
      // 새로운 스냅샷 설정
      setLastVersionSnapshot({
        nodes: currentNodes.map(n => ({ id: n.id, ...n.data, position: n.position })),
        connections: currentEdges.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.label }))
      })
      
      // 변경 추적 초기화
      setChangeTracker({
        nodes_added: [],
        nodes_modified: [],
        nodes_deleted: [],
        connections_added: [],
        connections_modified: [],
        connections_deleted: []
      })
      
      saveSuccessful = true
      
      toast({
        title: "저장 완료",
        description: newVersion 
          ? `시나리오가 저장되고 버전 ${newVersion.version}이 생성되었습니다.`
          : "시나리오가 저장되었습니다.",
        duration: newVersion ? 5000 : 3000
      })
      
      // 저장 성공 시에만 시나리오 데이터 다시 로드
      if (saveSuccessful) {
        try {
          await loadScenario(scenario.id)
        } catch (reloadError) {
          console.warn("Failed to reload scenario after save:", reloadError)
          // 리로드 실패는 사용자에게 알리지 않음 (저장은 성공했으므로)
        }
      }
      
    } catch (error) {
      console.error("Save scenario error:", error)
      
      let errorMessage = "시나리오 저장 중 오류가 발생했습니다."
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = "백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요."
        } else if (error.name === 'AbortError') {
          errorMessage = "요청 시간이 초과되었습니다. 다시 시도해주세요."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "저장 실패",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 브라우저 닫기 시 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">시나리오를 불러오는 중...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push("/scenarios")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로 돌아가기
          </Button>
        </div>
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
          <Button 
            variant="ghost" 
            onClick={() => {
              if (hasUnsavedChanges) {
                const confirmed = confirm("저장하지 않은 변경사항이 있습니다. 정말로 나가시겠습니까?")
                if (!confirmed) return
              }
              router.push("/scenarios")
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold">{scenario.name}</h1>
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  변경됨
                </Badge>
              )}
              {lastSaved && !hasUnsavedChanges && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  저장됨
                </Badge>
              )}
              {hasSignificantChanges() && autoVersionEnabled && (
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  자동 버전 대상
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>버전 {scenario.version}</span>
              {lastSaved && (
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>마지막 저장: {lastSaved.toLocaleTimeString('ko-KR')}</span>
                </span>
              )}
              {getChangeDescription() && (
                <span className="flex items-center space-x-1 text-blue-600">
                  <Eye className="h-3 w-3" />
                  <span>{getChangeDescription()}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 자동 버전 토글 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoVersionEnabled(!autoVersionEnabled)}
            className={`${autoVersionEnabled ? 'bg-blue-50 border-blue-300' : ''}`}
            title={`자동 버전 생성 ${autoVersionEnabled ? '비활성화' : '활성화'}`}
          >
            {autoVersionEnabled ? (
              <>
                <ToggleRight className="h-4 w-4 mr-2 text-blue-600" />
                자동 버전
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4 mr-2 text-gray-400" />
                자동 버전
              </>
            )}
          </Button>
          
          {/* 수동 버전 생성 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => createAutoVersion("수동 버전 생성")}
            disabled={!hasUnsavedChanges}
            title="현재 상태로 수동 버전 생성"
          >
            <GitBranch className="h-4 w-4 mr-2" />
            버전 생성
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => loadScenario(scenario.id)}
            disabled={isLoading}
            title="새로고침"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
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
          <Button variant="outline" onClick={() => router.push(`/scenarios/${scenario.id}/simulate`)}>
            <Play className="h-4 w-4 mr-2" />
            시뮬레이션
          </Button>
          
          {/* 저장 옵션 */}
          <div className="flex space-x-1">
            <Button 
              onClick={() => saveScenario(false)} 
              disabled={isSaving || !hasUnsavedChanges}
              variant={hasUnsavedChanges ? "default" : "outline"}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? "저장 중..." : "저장"}
            </Button>
            
            {hasUnsavedChanges && (
              <Button 
                onClick={() => saveScenario(true)} 
                disabled={isSaving}
                variant="secondary"
                size="sm"
                title="저장과 동시에 버전 생성"
              >
                + 버전
              </Button>
            )}
          </div>
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
                selectedNode={selectedNode ? {
                  ...selectedNode,
                  data: {
                    ...selectedNode.data,
                    scenarioId: scenario.id
                  }
                } : null}
                onUpdateNode={updateNodeData}
                onUpdateConfig={updateNodeConfig}
                onDeleteNode={deleteSelectedNode}
              />
            </div>
            
            {/* TTS 현황 */}
            <div className="p-4 border-t">
              <ScenarioTTSStatus
                scenarioId={scenario.id}
                onStatusUpdate={(status) => {
                  // TTS 상태 업데이트 시 필요한 처리
                }}
              />
            </div>
            
            
            {/* 버전 관리 */}
            <div className="p-4 border-t">
              <VersionManager
                scenarioId={scenario.id}
                currentVersion={scenario.version}
                onVersionChange={(newVersion) => {
                  // 버전 변경 시 시나리오 데이터 업데이트
                  if (scenario) {
                    setScenario({ ...scenario, version: newVersion })
                  }
                  // 새로운 스냅샷 설정
                  setLastVersionSnapshot({
                    nodes: nodes.map(n => ({ id: n.id, ...n.data, position: n.position })),
                    connections: edges.map(e => ({ id: e.id, source: e.source, target: e.target, label: e.label }))
                  })
                  // 변경 추적 초기화
                  setChangeTracker({
                    nodes_added: [],
                    nodes_modified: [],
                    nodes_deleted: [],
                    connections_added: [],
                    connections_modified: [],
                    connections_deleted: []
                  })
                  setHasUnsavedChanges(false)
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
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            attributionPosition="top-right"
            connectionLineStyle={{ strokeWidth: 2, stroke: '#555' }}
            defaultEdgeOptions={{
              style: { strokeWidth: 2, stroke: '#555' },
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#555' },
            }}
          >
            <Background color="#f0f0f0" gap={20} />
            <Controls />
            <MiniMap 
              nodeStrokeColor="#555"
              nodeColor="#f0f0f0"
              pannable
              zoomable
            />
            <Panel position="top-right">
              <div className="bg-white p-3 rounded-lg shadow-lg border space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">시나리오 정보</p>
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
                  {hasUnsavedChanges && (
                    <div className="text-xs text-orange-600 mt-1">
                      변경사항이 있습니다
                    </div>
                  )}
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
