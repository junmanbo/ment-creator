"use client"

import React, { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Connection,
  ReactFlowProvider,
  Panel,
  MarkerType,
  NodeTypes,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { 
  Save, 
  Play, 
  ArrowLeft,
  Trash2,
  Phone,
  MessageSquare,
  GitBranch,
  UserX,
  Square,
  Mic,
  Loader2,
  Settings,
  Volume2,
  HelpCircle,
  Database,
  PhoneCall,
  Clock,
  Calendar,
  TrendingUp
} from "lucide-react"

// Handle 스타일 상수
const HANDLE_STYLE = {
  width: 12,
  height: 12,
  border: '2px solid',
}

const getHandleStyle = (color: string, position: 'top' | 'bottom') => ({
  ...HANDLE_STYLE,
  background: color,
  borderColor: color,
  [position]: -6,
})

// 새로운 ARS 노드 컴포넌트들
const StartNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-green-100 border-2 ${selected ? 'border-green-500' : 'border-green-300'}`}>
    <div className="flex items-center">
      <Phone className="h-4 w-4 mr-2 text-green-600" />
      <div className="text-green-800 font-medium">{data.label}</div>
    </div>
    <Handle
      type="source"
      position={Position.Bottom}
      style={getHandleStyle('#22c55e', 'bottom')}
    />
  </div>
)

const EndNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-red-100 border-2 ${selected ? 'border-red-500' : 'border-red-300'}`}>
    <Handle
      type="target"
      position={Position.Top}
      style={getHandleStyle('#ef4444', 'top')}
    />
    <div className="flex items-center">
      <Square className="h-4 w-4 mr-2 text-red-600" />
      <div className="text-red-800 font-medium">{data.label}</div>
    </div>
  </div>
)

const ConditionNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-orange-100 border-2 ${selected ? 'border-orange-500' : 'border-orange-300'}`}>
    <Handle
      type="target"
      position={Position.Top}
      style={getHandleStyle('#f97316', 'top')}
    />
    <div className="flex items-center">
      <Settings className="h-4 w-4 mr-2 text-orange-600" />
      <div className="text-orange-800 font-medium">{data.label}</div>
    </div>
    <div className="text-xs text-orange-600 mt-1">
      {data.config?.condition_type || '조건 타입'}
    </div>
    
    {/* 조건 분기용 다중 출력 핸들 */}
    <Handle
      type="source"
      position={Position.Bottom}
      id="true"
      style={{...getHandleStyle('#f97316', 'bottom'), left: '30%'}}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="false"
      style={{...getHandleStyle('#f97316', 'bottom'), left: '70%'}}
    />
  </div>
)

const VoiceMentNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-indigo-100 border-2 ${selected ? 'border-indigo-500' : 'border-indigo-300'}`}>
    <Handle
      type="target"
      position={Position.Top}
      style={getHandleStyle('#6366f1', 'top')}
    />
    <div className="flex items-center">
      <Volume2 className="h-4 w-4 mr-2 text-indigo-600" />
      <div className="text-indigo-800 font-medium">{data.label}</div>
    </div>
    {data.config?.text_content && (
      <div className="text-xs text-indigo-600 mt-1 max-w-48 truncate">
        {data.config.text_content}
      </div>
    )}
    <Handle
      type="source"
      position={Position.Bottom}
      style={getHandleStyle('#6366f1', 'bottom')}
    />
  </div>
)

const MenuSelectNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-emerald-100 border-2 ${selected ? 'border-emerald-500' : 'border-emerald-300'}`}>
    <Handle
      type="target"
      position={Position.Top}
      style={getHandleStyle('#10b981', 'top')}
    />
    <div className="flex items-center">
      <HelpCircle className="h-4 w-4 mr-2 text-emerald-600" />
      <div className="text-emerald-800 font-medium">{data.label}</div>
    </div>
    <div className="text-xs text-emerald-600 mt-1">
      메뉴 {data.config?.menu_items?.length || 0}개
    </div>
    
    {/* 메뉴 옵션별 다중 출력 핸들 */}
    {[1, 2, 3].map((num) => (
      <Handle
        key={num}
        type="source"
        position={Position.Bottom}
        id={`menu-${num}`}
        style={{...getHandleStyle('#10b981', 'bottom'), left: `${20 + num * 20}%`}}
      />
    ))}
  </div>
)

const InputCollectNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-teal-100 border-2 ${selected ? 'border-teal-500' : 'border-teal-300'}`}>
    <Handle
      type="target"
      position={Position.Top}
      style={getHandleStyle('#14b8a6', 'top')}
    />
    <div className="flex items-center">
      <Database className="h-4 w-4 mr-2 text-teal-600" />
      <div className="text-teal-800 font-medium">{data.label}</div>
    </div>
    <div className="text-xs text-teal-600 mt-1">
      {data.config?.input_type || '입력 타입'}
    </div>
    <Handle
      type="source"
      position={Position.Bottom}
      style={getHandleStyle('#14b8a6', 'bottom')}
    />
  </div>
)

const ExternalApiNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-cyan-100 border-2 ${selected ? 'border-cyan-500' : 'border-cyan-300'}`}>
    <Handle
      type="target"
      position={Position.Top}
      style={getHandleStyle('#06b6d4', 'top')}
    />
    <div className="flex items-center">
      <Database className="h-4 w-4 mr-2 text-cyan-600" />
      <div className="text-cyan-800 font-medium">{data.label}</div>
    </div>
    <div className="text-xs text-cyan-600 mt-1">
      {data.config?.endpoint_name || 'API 호출'}
    </div>
    
    {/* API 결과별 다중 출력 핸들 */}
    <Handle
      type="source"
      position={Position.Bottom}
      id="success"
      style={{...getHandleStyle('#06b6d4', 'bottom'), left: '30%'}}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="error"
      style={{...getHandleStyle('#06b6d4', 'bottom'), left: '70%'}}
    />
  </div>
)

const TransferNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-purple-100 border-2 ${selected ? 'border-purple-500' : 'border-purple-300'}`}>
    <Handle
      type="target"
      position={Position.Top}
      style={getHandleStyle('#a855f7', 'top')}
    />
    <div className="flex items-center">
      <PhoneCall className="h-4 w-4 mr-2 text-purple-600" />
      <div className="text-purple-800 font-medium">{data.label}</div>
    </div>
    <div className="text-xs text-purple-600 mt-1">
      {data.config?.transfer_type || '상담원 연결'}
    </div>
    <Handle
      type="source"
      position={Position.Bottom}
      style={getHandleStyle('#a855f7', 'bottom')}
    />
  </div>
)

// Legacy 노드들 (하위 호환성)
const MessageNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-blue-100 border-2 ${selected ? 'border-blue-500' : 'border-blue-300'}`}>
    <Handle
      type="target"
      position={Position.Top}
      style={getHandleStyle('#3b82f6', 'top')}
    />
    <div className="flex items-center">
      <MessageSquare className="h-4 w-4 mr-2 text-blue-600" />
      <div className="text-blue-800 font-medium">{data.label}</div>
    </div>
    {data.content && (
      <div className="text-xs text-blue-600 mt-1 max-w-48 truncate">
        {data.content}
      </div>
    )}
    <Handle
      type="source"
      position={Position.Bottom}
      style={getHandleStyle('#3b82f6', 'bottom')}
    />
  </div>
)

const BranchNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-yellow-100 border-2 ${selected ? 'border-yellow-500' : 'border-yellow-300'}`}>
    <Handle
      type="target"
      position={Position.Top}
      style={getHandleStyle('#eab308', 'top')}
    />
    <div className="flex items-center">
      <GitBranch className="h-4 w-4 mr-2 text-yellow-600" />
      <div className="text-yellow-800 font-medium">{data.label}</div>
    </div>
    
    {/* 여러 출력 핸들 (분기용) */}
    <Handle
      type="source"
      position={Position.Bottom}
      id="option-1"
      style={{...getHandleStyle('#eab308', 'bottom'), left: '25%'}}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="option-2"
      style={{...getHandleStyle('#eab308', 'bottom'), left: '50%'}}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="option-3"
      style={{...getHandleStyle('#eab308', 'bottom'), left: '75%'}}
    />
  </div>
)

const InputNode = ({ data, selected }: { data: any; selected: boolean }) => (
  <div className={`px-4 py-2 shadow-md rounded-md bg-gray-100 border-2 ${selected ? 'border-gray-500' : 'border-gray-300'}`}>
    <Handle
      type="target"
      position={Position.Top}
      style={getHandleStyle('#6b7280', 'top')}
    />
    <div className="flex items-center">
      <Mic className="h-4 w-4 mr-2 text-gray-600" />
      <div className="text-gray-800 font-medium">{data.label}</div>
    </div>
    <Handle
      type="source"
      position={Position.Bottom}
      style={getHandleStyle('#6b7280', 'bottom')}
    />
  </div>
)

const nodeTypes: NodeTypes = {
  // 기본 노드
  start: StartNode,
  end: EndNode,
  
  // 새로운 ARS 노드
  condition: ConditionNode,
  voice_ment: VoiceMentNode,
  menu_select: MenuSelectNode,
  input_collect: InputCollectNode,
  external_api: ExternalApiNode,
  transfer: TransferNode,
  
  // Legacy 노드 (하위 호환성)
  message: MessageNode,
  branch: BranchNode,
  input: InputNode,
}

// 노드 팔레트 아이템
const NodePaletteItem = ({ 
  type, 
  icon: Icon, 
  label, 
  color,
  onDragStart 
}: { 
  type: string
  icon: any
  label: string
  color: string
  onDragStart: (event: React.DragEvent, nodeType: string) => void
}) => (
  <div
    className={`flex items-center p-3 border-2 rounded-lg cursor-grab hover:shadow-md transition-shadow ${color}`}
    draggable
    onDragStart={(event) => onDragStart(event, type)}
  >
    <Icon className="h-5 w-5 mr-2" />
    <span className="font-medium">{label}</span>
  </div>
)

interface ScenarioFormData {
  name: string
  description: string
  category: string
  is_template: boolean
}

interface NodeData {
  id: string
  label: string
  content?: string
  nodeType: string
  config?: Record<string, any>
}

const initialNodes: Node[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 250, y: 25 },
    data: { label: '시작', nodeType: 'start' },
    deletable: false,
  },
]

const initialEdges: Edge[] = []

// 메인 플로우 컴포넌트 (ReactFlowProvider 내부)
function FlowEditor({
  nodes,
  edges,
  setNodes,
  setEdges,
  onNodesChange,
  onEdgesChange,
  selectedNode,
  selectedNodeData,
  setSelectedNode,
  setSelectedNodeData,
  updateSelectedNodeData,
  deleteSelectedNode
}: {
  nodes: Node[]
  edges: Edge[]
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  onNodesChange: any
  onEdgesChange: any
  selectedNode: Node | null
  selectedNodeData: NodeData | null
  setSelectedNode: React.Dispatch<React.SetStateAction<Node | null>>
  setSelectedNodeData: React.Dispatch<React.SetStateAction<NodeData | null>>
  updateSelectedNodeData: (field: keyof NodeData, value: any) => void
  deleteSelectedNode: () => void
}) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()
  
  // 노드 팔레트 설정 (ARS 전용)
  const nodePalette = [
    // 기본 노드
    { type: 'start', icon: Phone, label: '시작', color: 'bg-green-50 border-green-200 text-green-800' },
    { type: 'end', icon: Square, label: '종료', color: 'bg-red-50 border-red-200 text-red-800' },
    
    // ARS 노드
    { type: 'condition', icon: Settings, label: '조건 분기', color: 'bg-orange-50 border-orange-200 text-orange-800' },
    { type: 'voice_ment', icon: Volume2, label: '음성 멘트', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
    { type: 'menu_select', icon: HelpCircle, label: '메뉴 선택', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { type: 'input_collect', icon: Database, label: '정보 수집', color: 'bg-teal-50 border-teal-200 text-teal-800' },
    { type: 'external_api', icon: Database, label: '외부 API', color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
    { type: 'transfer', icon: PhoneCall, label: '상담원 연결', color: 'bg-purple-50 border-purple-200 text-purple-800' },
    
    // Legacy 노드 (하위 호환성)
    { type: 'message', icon: MessageSquare, label: '레거시 멘트', color: 'bg-blue-50 border-blue-200 text-blue-800' },
    { type: 'branch', icon: GitBranch, label: '레거시 분기', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
    { type: 'input', icon: Mic, label: '레거시 입력', color: 'bg-gray-50 border-gray-200 text-gray-800' },
  ]

  // 연결 생성 (개선된 스타일)
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
    },
    [setEdges]
  )

  // 노드 선택
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setSelectedNodeData({
      id: node.id,
      label: node.data.label || '',
      content: node.data.content || '',
      nodeType: node.data.nodeType || node.type || 'message',
      config: node.data.config || {}
    })
  }, [setSelectedNode, setSelectedNodeData])

  // 캔버스 클릭 (노드 선택 해제)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setSelectedNodeData(null)
  }, [setSelectedNode, setSelectedNodeData])

  // 드래그 시작
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  // 드롭 허용
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // 노드 드롭
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')

      if (typeof type === 'undefined' || !type) {
        return
      }

      // screenToFlowPosition을 사용하여 좌표 변환
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const nodeId = `${type}-${Date.now()}`
      const newNode: Node = {
        id: nodeId,
        type,
        position,
        data: { 
          label: getNodeLabel(type),
          nodeType: type,
          content: type === 'message' ? '멘트 내용을 입력하세요' : undefined
        },
        deletable: type !== 'start',
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [screenToFlowPosition, setNodes]
  )

  // 노드 타입별 기본 라벨
  const getNodeLabel = (type: string): string => {
    switch (type) {
      case 'start': return '시작'
      case 'end': return '종료'
      case 'condition': return '조건 분기'
      case 'voice_ment': return '음성 멘트'
      case 'menu_select': return '메뉴 선택'
      case 'input_collect': return '정보 수집'
      case 'external_api': return '외부 API'
      case 'transfer': return '상담원 연결'
      // Legacy 노드
      case 'message': return '레거시 멘트'
      case 'branch': return '레거시 분기'
      case 'input': return '레거시 입력'
      default: return '노드'
    }
  }

  return (
    <>
      {/* 좌측 사이드바 - 노드 팔레트 */}
      <div className="w-80 bg-gray-50 border-r flex flex-col">
        {/* 노드 팔레트 */}
        <Card className="m-4 mb-2 flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">ARS 노드 팔레트</CardTitle>
            <p className="text-xs text-muted-foreground">
              노드를 드래그해서 캔버스에 추가하세요
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 기본 노드 */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">기본 노드</div>
              <div className="space-y-1">
                {nodePalette.slice(1, 2).map((item) => (
                  <NodePaletteItem
                    key={item.type}
                    type={item.type}
                    icon={item.icon}
                    label={item.label}
                    color={item.color}
                    onDragStart={onDragStart}
                  />
                ))}
              </div>
            </div>

            {/* ARS 노드 */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">ARS 노드</div>
              <div className="space-y-1">
                {nodePalette.slice(2, 8).map((item) => (
                  <NodePaletteItem
                    key={item.type}
                    type={item.type}
                    icon={item.icon}
                    label={item.label}
                    color={item.color}
                    onDragStart={onDragStart}
                  />
                ))}
              </div>
            </div>

            {/* Legacy 노드 */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">레거시 노드</div>
              <div className="space-y-1">
                {nodePalette.slice(8).map((item) => (
                  <NodePaletteItem
                    key={item.type}
                    type={item.type}
                    icon={item.icon}
                    label={item.label}
                    color={item.color}
                    onDragStart={onDragStart}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 연결 가이드 */}
        <Card className="mx-4 mb-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">연결 가이드</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>• 노드의 원형 점이 <strong>연결점</strong>입니다</p>
            <p>• <strong>출발점</strong>에서 <strong>도착점</strong>으로 드래그하세요</p>
            <p>• 분기 노드는 여러 연결점을 가집니다</p>
          </CardContent>
        </Card>

        {/* 선택된 노드 속성 */}
        {selectedNodeData && (
          <Card className="mx-4 mb-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">노드 속성</CardTitle>
                {selectedNode?.data.nodeType !== 'start' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={deleteSelectedNode}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="node-label" className="text-xs">노드 이름</Label>
                <Input
                  id="node-label"
                  value={selectedNodeData.label}
                  onChange={(e) => updateSelectedNodeData('label', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              {/* ARS 노드 타입별 설정 */}
              {selectedNodeData.nodeType === 'voice_ment' && (
                <div>
                  <Label htmlFor="node-content" className="text-xs">음성 멘트 내용</Label>
                  <Textarea
                    id="node-content"
                    value={selectedNodeData.content || ''}
                    onChange={(e) => updateSelectedNodeData('content', e.target.value)}
                    placeholder="고객에게 전달할 음성 멘트를 입력하세요"
                    rows={3}
                    className="mt-1 resize-none"
                  />
                  <div className="mt-2 space-y-1">
                    <Button size="sm" variant="outline" className="w-full">
                      <Volume2 className="h-4 w-4 mr-2" />
                      TTS 생성
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedNodeData.nodeType === 'condition' && (
                <div>
                  <Label className="text-xs">조건 타입</Label>
                  <div className="mt-1 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      • 시간 검사: 영업시간 확인
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • 날짜 검사: 공휴일, 요일 확인
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • 값 비교: 변수 조건 분기
                    </div>
                  </div>
                </div>
              )}

              {selectedNodeData.nodeType === 'menu_select' && (
                <div>
                  <Label className="text-xs">메뉴 선택</Label>
                  <div className="mt-1 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      • DTMF 키패드 입력
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • 메뉴 옵션 1-9
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • 타임아웃 및 재시도 설정
                    </div>
                  </div>
                </div>
              )}

              {selectedNodeData.nodeType === 'input_collect' && (
                <div>
                  <Label className="text-xs">정보 수집</Label>
                  <div className="mt-1 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      • 생년월일, 전화번호 등
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • 입력 검증 및 패턴 매칭
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • 세션 변수에 저장
                    </div>
                  </div>
                </div>
              )}

              {selectedNodeData.nodeType === 'external_api' && (
                <div>
                  <Label className="text-xs">외부 API 호출</Label>
                  <div className="mt-1 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      • 호스트 시스템 연동
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • 계약 조회, 고객 정보 확인
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • 성공/실패 분기 처리
                    </div>
                  </div>
                </div>
              )}

              {selectedNodeData.nodeType === 'transfer' && (
                <div>
                  <Label className="text-xs">상담원 연결</Label>
                  <div className="mt-1 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      • 내선번호 또는 큐 연결
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • 대기 음악 및 안내
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • 통화 불가 시 대체 처리
                    </div>
                  </div>
                </div>
              )}

              {/* Legacy 노드 설정 */}
              {selectedNodeData.nodeType === 'message' && (
                <div>
                  <Label htmlFor="node-content" className="text-xs">레거시 멘트 내용</Label>
                  <Textarea
                    id="node-content"
                    value={selectedNodeData.content || ''}
                    onChange={(e) => updateSelectedNodeData('content', e.target.value)}
                    placeholder="레거시 멘트 내용을 입력하세요"
                    rows={3}
                    className="mt-1 resize-none"
                  />
                  <div className="mt-2 space-y-1">
                    <Button size="sm" variant="outline" className="w-full">
                      <Mic className="h-4 w-4 mr-2" />
                      TTS 생성
                    </Button>
                  </div>
                </div>
              )}
              
              {selectedNodeData.nodeType === 'branch' && (
                <div>
                  <Label className="text-xs">레거시 분기 옵션</Label>
                  <div className="mt-1 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      • 키 1: 첫 번째 선택지
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • 키 2: 두 번째 선택지  
                    </div>
                    <div className="text-xs text-muted-foreground">
                      • 키 9: 상담원 연결
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <Label className="text-xs">노드 타입</Label>
                <div className="mt-1 text-sm text-muted-foreground">
                  {selectedNodeData.nodeType}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 메인 캔버스 */}
      <div className="flex-1 relative">
        <div className="w-full h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="top-right"
            connectionLineStyle={{ strokeWidth: 2, stroke: '#555' }}
            connectionRadius={20}
            snapToGrid={true}
            snapGrid={[15, 15]}
            minZoom={0.2}
            maxZoom={4}
            defaultEdgeOptions={{
              style: { strokeWidth: 2, stroke: '#555' },
              type: 'smoothstep',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#555' },
            }}
          >
            <MiniMap 
              nodeStrokeColor="#555"
              nodeColor="#f0f0f0"
              pannable
              zoomable
            />
            <Controls />
            <Background color="#f0f0f0" gap={20} />
            <Panel position="top-left">
              <div className="text-sm text-muted-foreground bg-white px-2 py-1 rounded shadow">
                노드: {nodes.length} | 연결: {edges.length}
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </>
  )
}

export default function CreateScenarioPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // 시나리오 기본 정보
  const [scenarioForm, setScenarioForm] = useState<ScenarioFormData>({
    name: "",
    description: "",
    category: "",
    is_template: false
  })
  
  // React Flow 상태
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(null)
  
  // UI 상태
  const [isSaving, setIsSaving] = useState(false)

  // 선택된 노드 데이터 업데이트
  const updateSelectedNodeData = (field: keyof NodeData, value: any) => {
    if (!selectedNodeData) return

    const updatedData = { ...selectedNodeData, [field]: value }
    setSelectedNodeData(updatedData)

    // React Flow 노드 업데이트
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeData.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: updatedData.label,
              content: updatedData.content,
              config: updatedData.config,
            },
          }
        }
        return node
      })
    )
  }

  // 선택된 노드 삭제
  const deleteSelectedNode = () => {
    if (!selectedNode || selectedNode.data.nodeType === 'start') return

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
    setEdges((eds) => eds.filter((edge) => 
      edge.source !== selectedNode.id && edge.target !== selectedNode.id
    ))
    setSelectedNode(null)
    setSelectedNodeData(null)
  }

  // 시나리오 저장
  const saveScenario = async () => {
    if (!scenarioForm.name.trim()) {
      toast({
        title: "입력 오류",
        description: "시나리오 이름을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (nodes.length === 0) {
      toast({
        title: "입력 오류", 
        description: "시나리오에 최소 하나의 노드가 필요합니다.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
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

      // 1. 시나리오 생성
      const scenarioResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: scenarioForm.name.trim(),
          description: scenarioForm.description.trim() || null,
          category: scenarioForm.category || null,
          is_template: scenarioForm.is_template,
          scenario_metadata: {
            created_with_editor: true,
            node_count: nodes.length,
            edge_count: edges.length
          }
        }),
      })

      if (!scenarioResponse.ok) {
        throw new Error("시나리오 생성에 실패했습니다.")
      }

      const createdScenario = await scenarioResponse.json()
      const scenarioId = createdScenario.id

      // 2. 노드들 생성
      for (const node of nodes) {
        const nodeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}/nodes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            scenario_id: scenarioId,
            node_id: node.id,
            node_type: node.data.nodeType || node.type,
            name: node.data.label,
            position_x: node.position.x,
            position_y: node.position.y,
            config: {
              content: node.data.content,
              ...node.data.config
            }
          }),
        })

        if (!nodeResponse.ok) {
          console.error(`Failed to create node ${node.id}`)
        }
      }

      // 3. 연결들 생성
      for (const edge of edges) {
        const connectionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}/connections`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            scenario_id: scenarioId,
            source_node_id: edge.source,
            target_node_id: edge.target,
            condition: null,
            label: ""
          }),
        })

        if (!connectionResponse.ok) {
          console.error(`Failed to create connection ${edge.id}`)
        }
      }

      toast({
        title: "저장 완료",
        description: "시나리오가 성공적으로 생성되었습니다.",
      })

      // 목록 페이지로 이동
      router.push("/scenarios")

    } catch (error) {
      console.error("Save scenario error:", error)
      toast({
        title: "저장 실패",
        description: error instanceof Error ? error.message : "시나리오 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // 시뮬레이션
  const simulateScenario = () => {
    if (nodes.length === 0) {
      toast({
        title: "시뮬레이션 불가",
        description: "시나리오에 노드가 없습니다.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "시뮬레이션 시작",
      description: "시나리오 시뮬레이션을 시작합니다.",
    })
    // TODO: 시뮬레이션 로직 구현
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 상단 툴바 */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/scenarios")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-xl font-semibold">새 시나리오 생성</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={simulateScenario}
            disabled={nodes.length === 0}
          >
            <Play className="h-4 w-4 mr-2" />
            시뮬레이션
          </Button>
          <Button
            size="sm"
            onClick={saveScenario}
            disabled={isSaving || !scenarioForm.name.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                저장
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* 시나리오 기본 정보 입력 */}
        <div className="w-80 bg-white border-r p-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">시나리오 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-xs">시나리오 이름 *</Label>
                <Input
                  id="name"
                  value={scenarioForm.name}
                  onChange={(e) => setScenarioForm({...scenarioForm, name: e.target.value})}
                  placeholder="시나리오 이름"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-xs">설명</Label>
                <Textarea
                  id="description"
                  value={scenarioForm.description}
                  onChange={(e) => setScenarioForm({...scenarioForm, description: e.target.value})}
                  placeholder="시나리오 설명"
                  rows={2}
                  className="mt-1 resize-none"
                />
              </div>
              
              <div>
                <Label htmlFor="category" className="text-xs">카테고리</Label>
                <Select 
                  value={scenarioForm.category} 
                  onValueChange={(value) => setScenarioForm({...scenarioForm, category: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="보험접수">보험접수</SelectItem>
                    <SelectItem value="보험상담">보험상담</SelectItem>
                    <SelectItem value="보험문의">보험문의</SelectItem>
                    <SelectItem value="일반문의">일반문의</SelectItem>
                    <SelectItem value="보험안내">보험안내</SelectItem>
                    <SelectItem value="고객지원">고객지원</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* React Flow 영역 */}
        <ReactFlowProvider>
          <FlowEditor
            nodes={nodes}
            edges={edges}
            setNodes={setNodes}
            setEdges={setEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            selectedNode={selectedNode}
            selectedNodeData={selectedNodeData}
            setSelectedNode={setSelectedNode}
            setSelectedNodeData={setSelectedNodeData}
            updateSelectedNodeData={updateSelectedNodeData}
            deleteSelectedNode={deleteSelectedNode}
          />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
