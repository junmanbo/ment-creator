"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useToast } from "@/components/ui/use-toast"
import { 
  Plus, 
  Edit, 
  Copy, 
  Play, 
  Trash2, 
  Search,
  MoreVertical,
  Loader2,
  Settings,
  Download,
  Share2,
  Archive,
  Eye,
  RefreshCw
} from "lucide-react"

interface User {
  id: string
  full_name: string
}

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
  created_at: string
  updated_at: string
  scenario_metadata?: Record<string, any>
}

interface NewScenario {
  name: string
  description: string
  category: string
  is_template: boolean
  scenario_metadata?: Record<string, any>
}

interface PaginationData {
  page: number
  size: number
  total: number
  pages: number
}

interface ScenariosResponse {
  items?: Scenario[]
  total?: number
  page?: number
  size?: number
  pages?: number
}

export default function ScenariosPage() {
  const router = useRouter()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    size: 20,
    total: 0,
    pages: 1
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("updated_at")
  const [sortOrder, setSortOrder] = useState<string>("desc")
  
  const [newScenario, setNewScenario] = useState<NewScenario>({
    name: "",
    description: "",
    category: "",
    is_template: false
  })
  
  const { toast } = useToast()

  useEffect(() => {
    fetchScenarios()
  }, [pagination.page, statusFilter, categoryFilter, searchTerm])

  const fetchScenarios = async () => {
    setIsLoading(true)
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

      const params = new URLSearchParams()
      params.append("skip", ((pagination.page - 1) * pagination.size).toString())
      params.append("limit", pagination.size.toString())
      
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (searchTerm.trim()) params.append("search", searchTerm.trim())
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data: Scenario[] = await response.json()
        
        // API가 배열을 직접 반환하는 경우
        if (Array.isArray(data)) {
          setScenarios(data)
          setPagination(prev => ({
            ...prev,
            total: data.length,
            pages: Math.max(1, Math.ceil(data.length / prev.size))
          }))
        } else {
          // API가 객체를 반환하는 경우
          const responseData = data as unknown as ScenariosResponse
          setScenarios(responseData.items || [])
          setPagination({
            page: responseData.page || pagination.page,
            size: responseData.size || pagination.size,
            total: responseData.total || 0,
            pages: responseData.pages || 1
          })
        }
      } else if (response.status === 401) {
        toast({
          title: "인증 만료",
          description: "다시 로그인해주세요.",
          variant: "destructive",
        })
        localStorage.removeItem("access_token")
        router.push("/login")
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("Fetch scenarios error:", error)
      toast({
        title: "데이터 로드 실패",
        description: "시나리오 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      })
      
      // 에러 시 빈 배열로 설정
      setScenarios([])
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

    setIsCreating(true)
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: newScenario.name.trim(),
          description: newScenario.description.trim() || null,
          category: newScenario.category || null,
          is_template: newScenario.is_template,
          scenario_metadata: newScenario.scenario_metadata || {}
        }),
      })

      if (response.ok) {
        const createdScenario = await response.json()
        
        // 다이얼로그 닫기 및 폼 초기화
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
        
        // 목록 새로고침
        await fetchScenarios()
        
        // 생성된 시나리오 편집 페이지로 이동
        setTimeout(() => {
          router.push(`/scenarios/${createdScenario.id}/edit`)
        }, 500)
      } else if (response.status === 401) {
        toast({
          title: "인증 만료",
          description: "다시 로그인해주세요.",
          variant: "destructive",
        })
        localStorage.removeItem("access_token")
        router.push("/login")
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || "시나리오 생성 실패")
      }
    } catch (error) {
      console.error("Create scenario error:", error)
      toast({
        title: "생성 실패",
        description: error instanceof Error ? error.message : "시나리오 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const deleteScenario = async (scenarioId: string, scenarioName: string) => {
    if (!confirm(`"${scenarioName}" 시나리오를 정말로 삭제하시겠습니까?\\n\\n이 작업은 되돌릴 수 없습니다.`)) {
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
        toast({
          title: "삭제 완료",
          description: "시나리오가 삭제되었습니다.",
        })
        
        // 목록 새로고침
        await fetchScenarios()
      } else {
        throw new Error("삭제 실패")
      }
    } catch (error) {
      console.error("Delete scenario error:", error)
      toast({
        title: "삭제 실패",
        description: "시나리오 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const copyScenario = async (scenario: Scenario) => {
    try {
      // 먼저 새 시나리오 생성
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: `${scenario.name} (복사본)`,
          description: scenario.description,
          category: scenario.category,
          is_template: scenario.is_template,
          scenario_metadata: scenario.scenario_metadata || {}
        }),
      })

      if (response.ok) {
        toast({
          title: "복사 완료",
          description: `"${scenario.name}" 시나리오가 복사되었습니다.`,
        })
        
        // 목록 새로고침
        await fetchScenarios()
      } else {
        throw new Error("복사 실패")
      }
    } catch (error) {
      console.error("Copy scenario error:", error)
      toast({
        title: "복사 실패",
        description: "시나리오 복사 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const resetFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setCategoryFilter("all")
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "testing": return "secondary"
      case "draft": return "outline"
      case "inactive": return "destructive"
      case "archived": return "secondary"
      default: return "outline"
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

  const handleAction = (action: string, scenario: Scenario) => {
    switch (action) {
      case "edit":
        router.push(`/scenarios/${scenario.id}/edit`)
        break
      case "copy":
        copyScenario(scenario)
        break
      case "simulate":
        router.push(`/scenarios/${scenario.id}/simulate`)
        break
      case "download":
        toast({
          title: "다운로드 시작",
          description: "시나리오 파일을 다운로드합니다.",
        })
        break
      case "archive":
        toast({
          title: "보관 완료",
          description: "시나리오가 보관되었습니다.",
        })
        break
      case "delete":
        deleteScenario(scenario.id, scenario.name)
        break
      default:
        break
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
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">ARS 시나리오 관리</h1>
          <p className="text-muted-foreground mt-1">
            콜센터 ARS 시나리오를 생성하고 관리합니다
          </p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
            <span>총 {pagination.total}개</span>
            <span>•</span>
            <span>{pagination.page}/{pagination.pages} 페이지</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchScenarios} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          
          {/* 플로우차트 에디터로 바로 이동 */}
          <Button 
            size="lg" 
            onClick={() => router.push("/scenarios/create")}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            플로우차트로 생성
          </Button>
          
          {/* 간단 생성 다이얼로그 */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                간단 생성
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>새 시나리오 생성</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">시나리오 이름 *</Label>
                  <Input
                    id="name"
                    value={newScenario.name}
                    onChange={(e) => setNewScenario({...newScenario, name: e.target.value})}
                    placeholder="시나리오 이름을 입력하세요"
                    disabled={isCreating}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={newScenario.description}
                    onChange={(e) => setNewScenario({...newScenario, description: e.target.value})}
                    placeholder="시나리오 설명을 입력하세요"
                    rows={3}
                    disabled={isCreating}
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">카테고리</Label>
                  <Select 
                    value={newScenario.category} 
                    onValueChange={(value) => setNewScenario({...newScenario, category: value})}
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리를 선택하세요" />
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
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    취소
                  </Button>
                  <Button onClick={createScenario} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      "생성"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-card p-4 rounded-lg border space-y-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="시나리오명 또는 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>
          
          <Button onClick={handleSearch}>
            검색
          </Button>
          
          <Button variant="outline" onClick={resetFilters}>
            초기화
          </Button>
        </div>
        
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <Label className="text-sm">상태:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="testing">테스트</SelectItem>
                <SelectItem value="draft">초안</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
                <SelectItem value="archived">보관됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Label className="text-sm">카테고리:</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="보험접수">보험접수</SelectItem>
                <SelectItem value="보험상담">보험상담</SelectItem>
                <SelectItem value="보험문의">보험문의</SelectItem>
                <SelectItem value="일반문의">일반문의</SelectItem>
                <SelectItem value="보험안내">보험안내</SelectItem>
                <SelectItem value="고객지원">고객지원</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 시나리오 테이블 */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>시나리오명</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>버전</TableHead>
              <TableHead>최종수정일</TableHead>
              <TableHead>생성자</TableHead>
              <TableHead className="text-right">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scenarios.map((scenario) => (
              <TableRow key={scenario.id} className="hover:bg-muted/50">
                <TableCell>
                  <div>
                    <div className="font-medium">{scenario.name}</div>
                    {scenario.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {scenario.description}
                      </div>
                    )}
                    {scenario.category && (
                      <div className="text-xs text-muted-foreground mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {scenario.category}
                        </Badge>
                        {scenario.is_template && (
                          <Badge variant="outline" className="text-xs ml-1">
                            템플릿
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(scenario.status)}>
                    {getStatusLabel(scenario.status)}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {scenario.version}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(scenario.updated_at).toLocaleDateString('ko-KR')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(scenario.updated_at).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">생성자 ID: {scenario.created_by}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(scenario.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction("edit", scenario)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      편집
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction("copy", scenario)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      복사
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAction("simulate", scenario)}>
                          <Play className="h-4 w-4 mr-2" />
                          시뮬레이션
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("download", scenario)}>
                          <Download className="h-4 w-4 mr-2" />
                          다운로드
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          공유
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAction("archive", scenario)}>
                          <Archive className="h-4 w-4 mr-2" />
                          보관
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleAction("delete", scenario)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {scenarios.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">조건에 맞는 시나리오가 없습니다</p>
              <p className="text-sm">새로운 시나리오를 생성하거나 다른 검색 조건을 사용해보세요.</p>
            </div>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {pagination.pages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                  className={pagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {[...Array(pagination.pages)].map((_, index) => {
                const page = index + 1
                if (
                  page === 1 ||
                  page === pagination.pages ||
                  (page >= pagination.page - 2 && page <= pagination.page + 2)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={page === pagination.page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                } else if (page === pagination.page - 3 || page === pagination.page + 3) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                }
                return null
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                  className={pagination.page >= pagination.pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
