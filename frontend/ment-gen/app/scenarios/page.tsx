"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Eye
} from "lucide-react"

interface Scenario {
  id: string
  name: string
  description?: string
  category?: string
  version: string
  status: "draft" | "testing" | "active" | "inactive" | "archived"
  is_template: boolean
  created_by: {
    id: string
    full_name: string
  }
  updated_by?: {
    id: string  
    full_name: string
  }
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

interface PaginationData {
  page: number
  size: number
  total: number
  pages: number
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
  }, [pagination.page, statusFilter, categoryFilter, searchTerm, sortBy, sortOrder])

  const fetchScenarios = async () => {
    setIsLoading(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios?`
      
      const params = new URLSearchParams()
      params.append("page", pagination.page.toString())
      params.append("size", pagination.size.toString())
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (categoryFilter !== "all") params.append("category", categoryFilter)
      if (searchTerm) params.append("search", searchTerm)
      params.append("sort_by", sortBy)
      params.append("sort_order", sortOrder)
      
      const response = await fetch(`${url}${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setScenarios(data.items || mockScenarios)
        setPagination({
          page: data.page || 1,
          size: data.size || 20,
          total: data.total || mockScenarios.length,
          pages: data.pages || Math.ceil(mockScenarios.length / 20)
        })
      } else {
        // API가 없으면 목업 데이터 사용
        setScenarios(mockScenarios)
        setPagination({
          page: 1,
          size: 20,
          total: mockScenarios.length,
          pages: Math.ceil(mockScenarios.length / 20)
        })
      }
    } catch (error) {
      console.error("Fetch scenarios error:", error)
      // 에러 시 목업 데이터 사용
      setScenarios(mockScenarios)
      setPagination({
        page: 1,
        size: 20,
        total: mockScenarios.length,
        pages: Math.ceil(mockScenarios.length / 20)
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 목업 데이터
  const mockScenarios: Scenario[] = [
    {
      id: "1",
      name: "자동차보험 접수",
      description: "자동차 보험 접수 관련 ARS 시나리오",
      category: "보험접수",
      version: "v2.1",
      status: "active",
      is_template: false,
      created_by: { id: "1", full_name: "김운영" },
      updated_by: { id: "1", full_name: "김운영" },
      deployed_at: "2025-05-20T14:30:00Z",
      created_at: "2025-05-01T09:00:00Z",
      updated_at: "2025-05-20T14:00:00Z"
    },
    {
      id: "2",
      name: "화재보험 문의",
      description: "화재보험 관련 문의 처리 시나리오",
      category: "보험문의",
      version: "v1.3",
      status: "inactive",
      is_template: false,
      created_by: { id: "2", full_name: "이상담" },
      updated_by: { id: "2", full_name: "이상담" },
      created_at: "2025-04-15T09:00:00Z",
      updated_at: "2025-05-18T10:00:00Z"
    },
    {
      id: "3",
      name: "생명보험 상담",
      description: "생명보험 상담 및 안내 시나리오",
      category: "보험상담",
      version: "v3.0",
      status: "active",
      is_template: false,
      created_by: { id: "3", full_name: "박상담" },
      updated_by: { id: "3", full_name: "박상담" },
      deployed_at: "2025-05-15T09:00:00Z",
      created_at: "2025-03-01T09:00:00Z",
      updated_at: "2025-05-15T15:30:00Z"
    },
    {
      id: "4",
      name: "고객센터 일반",
      description: "일반적인 고객 문의 처리 시나리오",
      category: "일반문의",
      version: "v1.8",
      status: "active",
      is_template: false,
      created_by: { id: "4", full_name: "최지원" },
      updated_by: { id: "4", full_name: "최지원" },
      deployed_at: "2025-05-10T11:00:00Z",
      created_at: "2025-02-10T09:00:00Z",
      updated_at: "2025-05-10T16:45:00Z"
    },
    {
      id: "5",
      name: "건강보험 안내",
      description: "건강보험 관련 안내 시나리오",
      category: "보험안내",
      version: "v2.0",
      status: "draft",
      is_template: false,
      created_by: { id: "1", full_name: "김운영" },
      updated_by: { id: "1", full_name: "김운영" },
      created_at: "2025-05-25T09:00:00Z",
      updated_at: "2025-05-25T14:20:00Z"
    }
  ]

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
      // 목업에서는 생성 시뮬레이션
      setIsCreateDialogOpen(false)
      toast({
        title: "시나리오 생성 완료",
        description: "새로운 시나리오가 생성되었습니다. (데모 모드)",
      })
      setNewScenario({
        name: "",
        description: "",
        category: "",
        is_template: false
      })
    }
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchScenarios()
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
        toast({
          title: "복사 완료",
          description: `"${scenario.name}" 시나리오가 복사되었습니다.`,
        })
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
        if (confirm("정말로 이 시나리오를 삭제하시겠습니까?")) {
          toast({
            title: "삭제 완료",
            description: "시나리오가 삭제되었습니다.",
          })
        }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ARS 시나리오 관리</h1>
          <p className="text-muted-foreground">
            콜센터 ARS 시나리오를 생성하고 관리합니다
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
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
                    <SelectItem value="보험문의">보험문의</SelectItem>
                    <SelectItem value="일반문의">일반문의</SelectItem>
                    <SelectItem value="보험안내">보험안내</SelectItem>
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
      <div className="bg-card p-4 rounded-lg border space-y-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="시나리오명으로 검색..."
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
        </div>
        
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <Label className="text-sm">필터:</Label>
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
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={`${sortBy}:${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split(':')
              setSortBy(field)
              setSortOrder(order)
            }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_at:desc">최근 수정</SelectItem>
                <SelectItem value="created_at:desc">최근 생성</SelectItem>
                <SelectItem value="name:asc">이름 순</SelectItem>
                <SelectItem value="status:asc">상태 순</SelectItem>
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
              <TableHead>작성자</TableHead>
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
                      <div className="text-sm text-muted-foreground">{scenario.description}</div>
                    )}
                    {scenario.category && (
                      <div className="text-xs text-muted-foreground mt-1">
                        카테고리: {scenario.category}
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
                  <div className="text-sm">{scenario.created_by.full_name}</div>
                  {scenario.updated_by && scenario.updated_by.id !== scenario.created_by.id && (
                    <div className="text-xs text-muted-foreground">
                      수정: {scenario.updated_by.full_name}
                    </div>
                  )}
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
        
        {scenarios.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">조건에 맞는 시나리오가 없습니다</p>
              <p className="text-sm">다른 검색 조건을 사용해보세요.</p>
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
