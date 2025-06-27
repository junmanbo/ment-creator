# 🔧 즉시 구현 가능한 개선사항 가이드

> 현재 85% 완성된 프로젝트에서 바로 작업할 수 있는 핵심 기능들

## 🎯 우선순위 1: 시나리오 관리 API 구현

### 필요성
현재 TTS 생성 시스템은 완성되었지만, 이를 체계적으로 관리할 시나리오 시스템이 없습니다. 시나리오 관리가 완성되면 전체 플랫폼이 완성됩니다.

### 구현할 파일들

#### 1. 백엔드 모델 (backend/app/models/)

##### scenario.py
```python
from datetime import datetime
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from enum import Enum
import uuid

class ScenarioStatus(str, Enum):
    DRAFT = "draft"
    TESTING = "testing" 
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

class ScenarioBase(SQLModel):
    name: str = Field(max_length=200)
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, max_length=100)
    version: str = Field(default="1.0", max_length=20)
    status: ScenarioStatus = ScenarioStatus.DRAFT
    is_template: bool = Field(default=False)
    metadata: Optional[dict] = None

class ScenarioCreate(ScenarioBase):
    pass

class ScenarioUpdate(ScenarioBase):
    name: Optional[str] = None
    version: Optional[str] = None

class Scenario(ScenarioBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by: uuid.UUID = Field(foreign_key="user.id")
    updated_by: Optional[uuid.UUID] = Field(foreign_key="user.id")
    deployed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # 관계 정의
    nodes: List["ScenarioNode"] = Relationship(back_populates="scenario")
    connections: List["ScenarioConnection"] = Relationship(back_populates="scenario")
    created_by_user: Optional["User"] = Relationship()
```

##### scenario_node.py  
```python
from typing import Optional
from sqlmodel import Field, SQLModel, Relationship
from enum import Enum
import uuid

class NodeType(str, Enum):
    START = "start"
    MESSAGE = "message"
    BRANCH = "branch"
    TRANSFER = "transfer"
    END = "end"
    INPUT = "input"

class ScenarioNodeBase(SQLModel):
    node_id: str = Field(max_length=50)  # 플로우차트 내 고유 ID
    node_type: NodeType
    name: str = Field(max_length=200)
    position_x: float = Field(default=0)
    position_y: float = Field(default=0)
    config: Optional[dict] = Field(default={})

class ScenarioNodeCreate(ScenarioNodeBase):
    scenario_id: uuid.UUID

class ScenarioNode(ScenarioNodeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    scenario_id: uuid.UUID = Field(foreign_key="scenario.id")
    
    # 관계 정의
    scenario: Optional["Scenario"] = Relationship(back_populates="nodes")
```

#### 2. API 라우터 (backend/app/api/routes/scenarios.py)
```python
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.scenario import Scenario, ScenarioCreate, ScenarioUpdate
from app.models.scenario_node import ScenarioNode, ScenarioNodeCreate

router = APIRouter(prefix="/scenarios", tags=["scenarios"])

@router.post("/", response_model=Scenario)
def create_scenario(
    *,
    session: SessionDep,
    scenario_in: ScenarioCreate,
    current_user: CurrentUser
) -> Scenario:
    """새 시나리오 생성"""
    scenario = Scenario(
        **scenario_in.model_dump(),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    session.add(scenario)
    session.commit()
    session.refresh(scenario)
    return scenario

@router.get("/", response_model=List[Scenario])
def get_scenarios(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    category: Optional[str] = None
) -> List[Scenario]:
    """시나리오 목록 조회"""
    statement = select(Scenario)
    
    if status:
        statement = statement.where(Scenario.status == status)
    if category:
        statement = statement.where(Scenario.category == category)
    
    statement = statement.offset(skip).limit(limit)
    scenarios = session.exec(statement).all()
    return scenarios

# 더 많은 CRUD 엔드포인트...
```

#### 3. 프론트엔드 페이지 (frontend/app/scenarios/page.tsx)
```typescript
"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Copy, Play } from "lucide-react"

interface Scenario {
  id: string
  name: string
  description?: string
  category?: string
  version: string
  status: "draft" | "testing" | "active" | "inactive" | "archived"
  created_at: string
  updated_at: string
}

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchScenarios()
  }, [])

  const fetchScenarios = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setScenarios(data)
      }
    } catch (error) {
      console.error("Fetch scenarios error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      testing: "bg-yellow-100 text-yellow-800", 
      active: "bg-green-100 text-green-800",
      inactive: "bg-red-100 text-red-800",
      archived: "bg-purple-100 text-purple-800"
    }
    return colors[status as keyof typeof colors] || colors.draft
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ARS 시나리오 관리</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          새 시나리오
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario) => (
          <Card key={scenario.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{scenario.name}</CardTitle>
                <Badge className={getStatusBadge(scenario.status)}>
                  {scenario.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{scenario.description}</p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">
                    버전 {scenario.version} • {scenario.category}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(scenario.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

---

## 🎯 우선순위 2: React Flow 플로우차트 에디터

### 필요 패키지 설치
```bash
cd frontend/ment-gen
npm install reactflow @reactflow/controls @reactflow/background
```

### 구현할 컴포넌트

#### FlowchartEditor.tsx
```typescript
"use client"

import React, { useState, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  NodeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'

import StartNode from './nodes/StartNode'
import MessageNode from './nodes/MessageNode'
import BranchNode from './nodes/BranchNode'
import EndNode from './nodes/EndNode'

const nodeTypes: NodeTypes = {
  start: StartNode,
  message: MessageNode,
  branch: BranchNode,
  end: EndNode,
}

const initialNodes: Node[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 100, y: 100 },
    data: { label: '시작' },
  },
]

const initialEdges: Edge[] = []

interface FlowchartEditorProps {
  scenarioId?: string
  onSave?: (nodes: Node[], edges: Edge[]) => void
}

export default function FlowchartEditor({ scenarioId, onSave }: FlowchartEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      data: { label: `새 ${type} 노드` },
    }
    setNodes((nds) => nds.concat(newNode))
  }, [setNodes])

  const handleSave = useCallback(() => {
    onSave?.(nodes, edges)
  }, [nodes, edges, onSave])

  return (
    <div className="h-screen flex">
      {/* 노드 팔레트 */}
      <div className="w-60 bg-gray-50 p-4 border-r">
        <h3 className="font-semibold mb-4">노드 팔레트</h3>
        <div className="space-y-2">
          <button
            onClick={() => addNode('start')}
            className="w-full p-2 text-left bg-blue-100 hover:bg-blue-200 rounded"
          >
            📞 시작
          </button>
          <button
            onClick={() => addNode('message')}
            className="w-full p-2 text-left bg-green-100 hover:bg-green-200 rounded"
          >
            🎙️ 멘트
          </button>
          <button
            onClick={() => addNode('branch')}
            className="w-full p-2 text-left bg-yellow-100 hover:bg-yellow-200 rounded"
          >
            ❓ 분기
          </button>
          <button
            onClick={() => addNode('end')}
            className="w-full p-2 text-left bg-red-100 hover:bg-red-200 rounded"
          >
            🔚 종료
          </button>
        </div>
        
        <div className="mt-6">
          <button
            onClick={handleSave}
            className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>

      {/* 플로우차트 캔버스 */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* 노드 설정 패널 */}
      {selectedNode && (
        <div className="w-80 bg-gray-50 p-4 border-l">
          <h3 className="font-semibold mb-4">노드 설정</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">노드 이름</label>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={(e) => {
                  setNodes((nds) =>
                    nds.map((n) =>
                      n.id === selectedNode.id
                        ? { ...n, data: { ...n.data, label: e.target.value } }
                        : n
                    )
                  )
                }}
                className="w-full p-2 border rounded"
              />
            </div>
            
            {selectedNode.type === 'message' && (
              <div>
                <label className="block text-sm font-medium mb-1">멘트 내용</label>
                <textarea
                  value={selectedNode.data.content || ''}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, data: { ...n.data, content: e.target.value } }
                          : n
                      )
                    )
                  }}
                  className="w-full p-2 border rounded h-24"
                  placeholder="멘트 내용을 입력하세요"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 🎯 우선순위 3: TTS-시나리오 통합 서비스

### 구현할 서비스 (backend/app/services/scenario_tts_service.py)
```python
from typing import List, Dict, Optional
from sqlmodel import Session, select
from fastapi import BackgroundTasks

from app.models.scenario import Scenario
from app.models.scenario_node import ScenarioNode, NodeType
from app.models.tts import TTSScript, TTSGeneration, TTSGenerateRequest
from app.services.tts_service import tts_service

class ScenarioTTSService:
    def __init__(self, session: Session):
        self.session = session

    async def generate_all_tts_for_scenario(
        self,
        scenario_id: str,
        voice_actor_id: str,
        user_id: str,
        background_tasks: BackgroundTasks
    ) -> Dict[str, str]:
        """시나리오의 모든 멘트 노드에 대해 TTS 생성"""
        
        # 시나리오 조회
        scenario = self.session.get(Scenario, scenario_id)
        if not scenario:
            raise ValueError("시나리오를 찾을 수 없습니다")

        # 멘트 노드들 조회
        statement = select(ScenarioNode).where(
            ScenarioNode.scenario_id == scenario_id,
            ScenarioNode.node_type == NodeType.MESSAGE
        )
        message_nodes = self.session.exec(statement).all()

        generation_ids = {}
        
        for node in message_nodes:
            if node.config and 'text_content' in node.config:
                # TTS 스크립트 생성
                script = TTSScript(
                    text_content=node.config['text_content'],
                    voice_actor_id=voice_actor_id,
                    voice_settings=node.config.get('voice_settings', {}),
                    created_by=user_id
                )
                self.session.add(script)
                self.session.commit()
                self.session.refresh(script)

                # TTS 생성 요청
                generation = TTSGeneration(
                    script_id=script.id,
                    voice_model_id=node.config.get('voice_model_id'),
                    requested_by=user_id
                )
                self.session.add(generation)
                self.session.commit()
                self.session.refresh(generation)

                # 백그라운드에서 TTS 생성
                background_tasks.add_task(
                    tts_service.process_tts_generation,
                    generation.id,
                    self.session
                )

                generation_ids[node.node_id] = generation.id

        return generation_ids

    def get_scenario_tts_status(self, scenario_id: str) -> Dict[str, Dict]:
        """시나리오의 TTS 생성 상태 조회"""
        
        statement = select(ScenarioNode, TTSScript, TTSGeneration).join(
            TTSScript, ScenarioNode.node_id == TTSScript.node_id, isouter=True
        ).join(
            TTSGeneration, TTSScript.id == TTSGeneration.script_id, isouter=True
        ).where(
            ScenarioNode.scenario_id == scenario_id,
            ScenarioNode.node_type == NodeType.MESSAGE
        )
        
        results = self.session.exec(statement).all()
        
        status_map = {}
        for node, script, generation in results:
            status_map[node.node_id] = {
                "node_name": node.name,
                "has_script": script is not None,
                "generation_status": generation.status if generation else None,
                "audio_file_path": generation.audio_file_path if generation else None,
                "quality_score": generation.quality_score if generation else None
            }
        
        return status_map

scenario_tts_service = ScenarioTTSService
```

---

## 🎯 우선순위 4: 데이터베이스 마이그레이션

### 새 마이그레이션 생성
```bash
cd backend
alembic revision --autogenerate -m "Add scenario management tables"
```

### 예상 마이그레이션 내용
```python
"""Add scenario management tables

Revision ID: abc123
Create Date: 2025-06-28
"""

from alembic import op
import sqlalchemy as sa
import sqlmodel

def upgrade():
    # 시나리오 테이블 생성
    op.create_table('scenario',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('version', sa.String(length=20), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'TESTING', 'ACTIVE', 'INACTIVE', 'ARCHIVED'), nullable=False),
        sa.Column('is_template', sa.Boolean(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_by', sa.UUID(), nullable=False),
        sa.Column('updated_by', sa.UUID(), nullable=True),
        sa.Column('deployed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['user.id']),
        sa.ForeignKeyConstraint(['updated_by'], ['user.id']),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 시나리오 노드 테이블 생성
    op.create_table('scenarionode',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('scenario_id', sa.UUID(), nullable=False),
        sa.Column('node_id', sa.String(length=50), nullable=False),
        sa.Column('node_type', sa.Enum('START', 'MESSAGE', 'BRANCH', 'TRANSFER', 'END', 'INPUT'), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('position_x', sa.Float(), nullable=False),
        sa.Column('position_y', sa.Float(), nullable=False),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['scenario_id'], ['scenario.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('scenario_id', 'node_id')
    )

def downgrade():
    op.drop_table('scenarionode')
    op.drop_table('scenario')
```

---

## 🎯 우선순위 5: 프론트엔드 라우팅 업데이트

### app/layout.tsx 네비게이션 업데이트
```typescript
// 기존 네비게이션에 시나리오 메뉴 추가
const navigation = [
  { name: '대시보드', href: '/', icon: HomeIcon },
  { name: '멘트 관리', href: '/list', icon: SpeakerWaveIcon },
  { name: '시나리오 관리', href: '/scenarios', icon: DocumentTextIcon }, // 추가
  { name: '성우 관리', href: '/voice-actors', icon: UserIcon },
  { name: '모니터링', href: '/monitoring', icon: ChartBarIcon },
]
```

### 시나리오 에디터 페이지 (app/scenarios/[id]/edit/page.tsx)
```typescript
"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import FlowchartEditor from '@/components/FlowchartEditor'
import { Node, Edge } from 'reactflow'

export default function ScenarioEditPage() {
  const params = useParams()
  const scenarioId = params.id as string
  
  const [scenario, setScenario] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchScenario()
  }, [scenarioId])

  const fetchScenario = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setScenario(data)
      }
    } catch (error) {
      console.error("Fetch scenario error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (nodes: Node[], edges: Edge[]) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            nodes: nodes.map(node => ({
              node_id: node.id,
              node_type: node.type,
              name: node.data.label,
              position_x: node.position.x,
              position_y: node.position.y,
              config: node.data
            })),
            connections: edges.map(edge => ({
              source_node_id: edge.source,
              target_node_id: edge.target,
              condition: edge.data?.condition || null,
              label: edge.label || ""
            }))
          }),
        }
      )

      if (response.ok) {
        alert("시나리오가 저장되었습니다.")
      }
    } catch (error) {
      console.error("Save scenario error:", error)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">로딩 중...</div>
  }

  return (
    <div className="h-screen">
      <div className="bg-white border-b px-4 py-2 flex justify-between items-center">
        <h1 className="text-xl font-semibold">
          시나리오 편집: {scenario?.name}
        </h1>
        <div className="space-x-2">
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            미리보기
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            배포
          </button>
        </div>
      </div>
      
      <FlowchartEditor 
        scenarioId={scenarioId}
        onSave={handleSave}
      />
    </div>
  )
}
```

---

## 🔧 즉시 적용 가능한 개선사항

### 1. 기존 TTS 시스템 개선
```python
# backend/app/services/tts_service.py 개선
async def batch_generate_tts(
    self,
    scripts: List[TTSScript],
    voice_model_id: str,
    user_id: str
) -> List[str]:
    """여러 TTS를 일괄 생성"""
    generation_ids = []
    
    for script in scripts:
        generation = TTSGeneration(
            script_id=script.id,
            voice_model_id=voice_model_id,
            requested_by=user_id
        )
        self.session.add(generation)
        generation_ids.append(generation.id)
    
    self.session.commit()
    
    # 백그라운드에서 병렬 처리
    for generation_id in generation_ids:
        await self.process_tts_generation(generation_id, self.session)
    
    return generation_ids
```

### 2. 에러 처리 및 로깅 강화
```python
# backend/app/core/logging.py 추가
import logging
from datetime import datetime

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('logs/app.log'),
            logging.StreamHandler()
        ]
    )

# API에서 사용
import logging
logger = logging.getLogger(__name__)

@router.post("/scenarios")
def create_scenario(...):
    try:
        # 로직 실행
        logger.info(f"시나리오 생성 성공: {scenario.name}")
        return scenario
    except Exception as e:
        logger.error(f"시나리오 생성 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="시나리오 생성 중 오류가 발생했습니다")
```

### 3. 프론트엔드 상태 관리 개선
```typescript
// frontend/hooks/useScenarios.ts
import { useState, useEffect } from 'react'

interface Scenario {
  id: string
  name: string
  status: string
  // ... 기타 필드
}

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchScenarios = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/scenarios', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('시나리오 목록을 불러오는데 실패했습니다')
      }

      const data = await response.json()
      setScenarios(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchScenarios()
  }, [])

  const createScenario = async (scenarioData: Partial<Scenario>) => {
    // 시나리오 생성 로직
  }

  const updateScenario = async (id: string, updates: Partial<Scenario>) => {
    // 시나리오 업데이트 로직
  }

  return {
    scenarios,
    isLoading,
    error,
    fetchScenarios,
    createScenario,
    updateScenario
  }
}
```

---

## 📋 구현 체크리스트

### Phase 1: 백엔드 API (1주)
- [ ] `backend/app/models/scenario.py` 구현
- [ ] `backend/app/models/scenario_node.py` 구현
- [ ] `backend/app/models/scenario_connection.py` 구현  
- [ ] `backend/app/api/routes/scenarios.py` 구현
- [ ] 데이터베이스 마이그레이션 생성 및 적용
- [ ] API 테스트 (Postman/Thunder Client)

### Phase 2: 프론트엔드 UI (1주)  
- [ ] React Flow 패키지 설치
- [ ] `frontend/app/scenarios/page.tsx` 구현
- [ ] `frontend/components/FlowchartEditor.tsx` 구현
- [ ] 노드 타입별 컴포넌트 구현
- [ ] 시나리오 목록 ↔ 에디터 네비게이션

### Phase 3: 통합 테스트 (3일)
- [ ] 시나리오-TTS 통합 서비스 구현
- [ ] 전체 워크플로우 테스트
- [ ] 사용자 시나리오 테스트
- [ ] 버그 수정 및 최적화

---

**💡 시작 권장**: `시나리오 모델` → `API 구현` → `기본 UI` → `플로우차트 에디터` 순으로 단계적 구현을 추천합니다!