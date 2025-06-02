"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { 
  Plus, 
  Edit, 
  Copy, 
  Play, 
  Trash2, 
  Search,
  Filter,
  MoreVertical,
  Loader2
} from "lucide-react"

interface Scenario {
  id: string
  name: string
  description?: string
  category?: string
  version: string
  status: "draft" | "testing" | "active" | "inactive" | "archived"
  is_template: boolean
  created_by: string
  updated_by?: string
  deployed_at?: string
  created_at: string
  updated_at: string
}

interface NewScenario {
  name: string
  description: string
  category: string
  is_template: boolean
}

export default function ScenariosPage() {
  const router = useRouter()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  
  const [newScenario, setNewScenario] = useState<NewScenario>({
    name: "",
    description: "",
    category: "",
    is_template: false
  })
  
  const { toast } = useToast()

  useEffect(() => {
    fetchScenarios()
  }, [statusFilter, categoryFilter, searchTerm])

  const fetchScenarios = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios?`
      
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (searchTerm) params.append("search", searchTerm)
      
      const response = await fetch(`${url}${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setScenarios(data)
      } else {
        toast({
          title: "데이터 로드 실패",
          description: "시나리오 목록을 불러오는데 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Fetch scenarios error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createScenario = async () => {
    if (!newScenario.name.trim()) {
      toast({
        title: "입력 오류",
        description: "시나리오 이름을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newScenario),
      })

      if (response.ok) {
        const createdScenario = await response.json()
        setScenarios([createdScenario, ...scenarios])
        setIsCreateDialogOpen(false)
        setNewScenario({
          name: "",
          description: "",
          category: "",
          is_template: false
        })
        toast({
          title: "시나리오 생성 성공",
          description: "새로운 시나리오가 생성되었습니다.",
        })
        
        // 생성된 시나리오 편집 페이지로 이동
        router.push(`/scenarios/${createdScenario.id}/edit`)
      } else {
        toast({
          title: "생성 실패",
          description: "시나리오 생성 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Create scenario error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    }
  }

  const deleteScenario = async (scenarioId: string) => {
    if (!confirm("정말로 이 시나리오를 삭제하시겠습니까?")) {
      return
    }

    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        setScenarios(scenarios.filter(s => s.id !== scenarioId))
        toast({
          title: "삭제 완료",
          description: "시나리오가 삭제되었습니다.",
        })
      } else {
        toast({
          title: "삭제 실패",
          description: "시나리오 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete scenario error:", error)
    }
  }

  const copyScenario = async (scenario: Scenario) => {
    const newScenarioData = {
      name: `${scenario.name} (복사본)`,
      description: scenario.description || "",
      category: scenario.category || "",
      is_template: false
    }

    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newScenarioData),
      })

      if (response.ok) {
        const copiedScenario = await response.json()
        setScenarios([copiedScenario, ...scenarios])
        toast({
          title: "복사 완료",
          description: "시나리오가 복사되었습니다.",
        })
      }
    } catch (error) {
      console.error("Copy scenario error:", error)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "testing": return "bg-yellow-100 text-yellow-800"
      case "draft": return "bg-gray-100 text-gray-800"
      case "inactive": return "bg-red-100 text-red-800"
      case "archived": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "활성"
      case "testing": return "테스트"
      case "draft": return "초안"
      case "inactive": return "비활성"
      case "archived": return "보관됨"
      default: return status
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">시나리오 목록을 불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">ARS 시나리오 관리</h1>
          <p className="text-gray-600">시나리오를 생성하고 관리할 수 있습니다.</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 시나리오
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>새 시나리오 생성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">시나리오 이름</Label>
                <Input
                  id="name"
                  value={newScenario.name}
                  onChange={(e) => setNewScenario({...newScenario, name: e.target.value})}
                  placeholder="시나리오 이름을 입력하세요"
                />
              </div>
              
              <div>
                <Label htmlFor="description">설명</Label>
                <Input
                  id="description"
                  value={newScenario.description}
                  onChange={(e) => setNewScenario({...newScenario, description: e.target.value})}
                  placeholder="시나리오 설명을 입력하세요"
                />
              </div>
              
              <div>
                <Label htmlFor="category">카테고리</Label>
                <Select 
                  value={newScenario.category} 
                  onValueChange={(value) => setNewScenario({...newScenario, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="보험접수">보험접수</SelectItem>
                    <SelectItem value="보험상담">보험상담</SelectItem>
                    <SelectItem value="고객지원">고객지원</SelectItem>
                    <SelectItem value="일반문의">일반문의</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={createScenario}>생성</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex space-x-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="시나리오 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="testing">테스트</SelectItem>
            <SelectItem value="draft">초안</SelectItem>
            <SelectItem value="inactive">비활성</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="카테고리 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 카테고리</SelectItem>
            <SelectItem value="보험접수">보험접수</SelectItem>
            <SelectItem value="보험상담">보험상담</SelectItem>
            <SelectItem value="고객지원">고객지원</SelectItem>
            <SelectItem value="일반문의">일반문의</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 시나리오 카드 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario) => (
          <Card key={scenario.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{scenario.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                </div>
                <div className="flex space-x-1">
                  <Badge className={getStatusBadgeColor(scenario.status)}>
                    {getStatusLabel(scenario.status)}
                  </Badge>
                  {scenario.is_template && (
                    <Badge variant="outline">템플릿</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                {scenario.category && (
                  <p className="text-xs text-gray-500">카테고리: {scenario.category}</p>
                )}
                <p className="text-xs text-gray-500">버전: {scenario.version}</p>
                <p className="text-xs text-gray-500">
                  최종 수정: {new Date(scenario.updated_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
            
            <CardFooter>
              <div className="flex justify-between items-center w-full">
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => router.push(`/scenarios/${scenario.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    편집
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyScenario(scenario)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => router.push(`/scenarios/${scenario.id}/simulate`)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => deleteScenario(scenario.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {scenarios.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">시나리오가 없습니다</p>
            <p className="text-sm">새 시나리오를 생성해보세요.</p>
          </div>
        </div>
      )}
    </div>
  )
}
