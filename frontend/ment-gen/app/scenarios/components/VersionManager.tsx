"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { 
  History,
  GitBranch,
  Plus,
  RotateCcw,
  Download,
  Calendar,
  User,
  FileText,
  Loader2,
  GitCompare,
  Eye,
  Tag,
  GitMerge,
  TreePine,
  RefreshCw,
  Settings,
  Clock,
  AlertTriangle
} from "lucide-react"

interface ScenarioVersion {
  id: string
  version: string
  version_status: "draft" | "stable" | "release" | "deprecated"
  notes?: string
  tag?: string
  parent_version_id?: string
  change_summary?: any
  auto_generated: boolean
  created_by: string
  created_at: string
  updated_at: string
  snapshot: any
}

interface VersionDiff {
  version_from: string
  version_to: string
  changes: Array<{
    type: "added" | "modified" | "deleted" | "moved"
    object_type: "node" | "connection"
    object_id: string
    description: string
    details?: any
  }>
  summary: {
    total_changes: number
    nodes_added: number
    nodes_modified: number
    nodes_deleted: number
    connections_added: number
    connections_modified: number
    connections_deleted: number
  }
}

interface VersionManagerProps {
  scenarioId: string
  currentVersion: string
  onVersionChange?: (version: string) => void
}

export default function VersionManager({ 
  scenarioId, 
  currentVersion, 
  onVersionChange 
}: VersionManagerProps) {
  const [versions, setVersions] = useState<ScenarioVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("history")
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false)
  const [isRollbackDialogOpen, setIsRollbackDialogOpen] = useState(false)
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false)
  
  // Loading states
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [isComparing, setIsComparing] = useState(false)
  const [isCreatingBranch, setIsCreatingBranch] = useState(false)
  
  // Data states
  const [versionDiff, setVersionDiff] = useState<VersionDiff | null>(null)
  const [previewVersion, setPreviewVersion] = useState<ScenarioVersion | null>(null)
  const [includeAutoVersions, setIncludeAutoVersions] = useState(true)
  const [versionTree, setVersionTree] = useState<any>(null)
  
  // Form states
  const [newVersionData, setNewVersionData] = useState({
    version: "",
    version_status: "draft" as const,
    notes: "",
    tag: "",
    auto_create: false
  })
  
  const [compareVersions, setCompareVersions] = useState({
    from: "",
    to: ""
  })
  
  const [rollbackData, setRollbackData] = useState({
    target_version_id: "",
    create_backup: true,
    rollback_notes: ""
  })
  
  const [branchData, setBranchData] = useState({
    parent_version_id: "",
    version: "",
    version_status: "draft" as const,
    notes: "",
    tag: ""
  })
  
  const { toast } = useToast()

  useEffect(() => {
    loadVersions()
    loadVersionTree()
  }, [scenarioId, includeAutoVersions])

  const loadVersions = async () => {
    setIsLoading(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}/versions?include_auto=${includeAutoVersions}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setVersions(data.sort((a: ScenarioVersion, b: ScenarioVersion) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ))
      }
    } catch (error) {
      console.error("Load versions error:", error)
      toast({
        title: "버전 로드 실패",
        description: "버전 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadVersionTree = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}/versions/tree`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const tree = await response.json()
        setVersionTree(tree)
      }
    } catch (error) {
      console.error("Load version tree error:", error)
    }
  }

  const createVersion = async () => {
    if (!newVersionData.version.trim()) {
      toast({
        title: "입력 오류",
        description: "버전 번호를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}/versions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            scenario_id: scenarioId,
            ...newVersionData
          }),
        }
      )

      if (response.ok) {
        const newVersion = await response.json()
        setVersions([newVersion, ...versions])
        setIsCreateDialogOpen(false)
        setNewVersionData({ 
          version: "", 
          version_status: "draft", 
          notes: "", 
          tag: "", 
          auto_create: false 
        })
        
        toast({
          title: "버전 생성 완료",
          description: `버전 ${newVersion.version}이 생성되었습니다.`,
        })
        
        loadVersionTree()
      } else {
        const errorData = await response.json()
        toast({
          title: "버전 생성 실패",
          description: errorData.detail || "버전 생성 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Create version error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    }
  }

  const autoCreateVersion = async (changeDescription?: string) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const params = changeDescription ? `?change_description=${encodeURIComponent(changeDescription)}` : ""
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}/versions/auto${params}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const newVersion = await response.json()
        loadVersions()
        
        toast({
          title: "자동 버전 생성",
          description: `버전 ${newVersion.version}이 자동으로 생성되었습니다.`,
        })
      }
    } catch (error) {
      console.error("Auto create version error:", error)
    }
  }

  const compareVersionsData = async () => {
    if (!compareVersions.from || !compareVersions.to) {
      toast({
        title: "선택 오류",
        description: "비교할 두 버전을 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsComparing(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}/versions/${compareVersions.from}/compare/${compareVersions.to}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const diff = await response.json()
        setVersionDiff(diff)
        setIsCompareDialogOpen(true)
      }
    } catch (error) {
      console.error("Compare versions error:", error)
      toast({
        title: "버전 비교 실패",
        description: "버전 비교 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsComparing(false)
    }
  }

  const rollbackToVersion = async () => {
    if (!rollbackData.target_version_id) {
      toast({
        title: "선택 오류",
        description: "롤백할 버전을 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsRollingBack(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}/versions/rollback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(rollbackData),
        }
      )

      if (response.ok) {
        const newVersion = await response.json()
        setIsRollbackDialogOpen(false)
        loadVersions()
        
        toast({
          title: "롤백 완료",
          description: `버전 ${newVersion.version}으로 롤백되었습니다.`,
        })
        
        if (onVersionChange) {
          onVersionChange(newVersion.version)
        }
      } else {
        toast({
          title: "롤백 실패",
          description: "버전 롤백 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Rollback error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    } finally {
      setIsRollingBack(false)
    }
  }

  const createBranch = async () => {
    if (!branchData.parent_version_id || !branchData.version) {
      toast({
        title: "입력 오류",
        description: "부모 버전과 새 버전 번호를 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsCreatingBranch(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}/versions/${branchData.parent_version_id}/branch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            version: branchData.version,
            version_status: branchData.version_status,
            notes: branchData.notes,
            tag: branchData.tag
          }),
        }
      )

      if (response.ok) {
        const newBranch = await response.json()
        setIsBranchDialogOpen(false)
        loadVersions()
        loadVersionTree()
        
        toast({
          title: "브랜치 생성 완료",
          description: `브랜치 ${newBranch.version}이 생성되었습니다.`,
        })
      }
    } catch (error) {
      console.error("Create branch error:", error)
      toast({
        title: "브랜치 생성 실패",
        description: "브랜치 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingBranch(false)
    }
  }

  const previewVersionData = async (versionId: string) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}/versions/${versionId}/preview`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const preview = await response.json()
        setPreviewVersion(preview)
      }
    } catch (error) {
      console.error("Preview version error:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "초안", className: "bg-gray-100 text-gray-800" },
      stable: { label: "안정", className: "bg-blue-100 text-blue-800" },
      release: { label: "릴리즈", className: "bg-green-100 text-green-800" },
      deprecated: { label: "지원중단", className: "bg-red-100 text-red-800" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const generateNextVersion = () => {
    if (versions.length === 0) {
      return "1.0"
    }
    
    const latestVersion = versions[0].version
    const parts = latestVersion.split('.')
    if (parts.length >= 2) {
      const major = parseInt(parts[0])
      const minor = parseInt(parts[1]) + 1
      return `${major}.${minor}`
    }
    
    return "1.0"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>버전 관리</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={() => autoCreateVersion()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              자동 버전
            </Button>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  새 버전
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>새 버전 생성</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="version">버전 번호</Label>
                    <Input
                      id="version"
                      value={newVersionData.version}
                      onChange={(e) => setNewVersionData({...newVersionData, version: e.target.value})}
                      placeholder={generateNextVersion()}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="version_status">버전 상태</Label>
                    <Select 
                      value={newVersionData.version_status} 
                      onValueChange={(value: any) => setNewVersionData({...newVersionData, version_status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">초안</SelectItem>
                        <SelectItem value="stable">안정</SelectItem>
                        <SelectItem value="release">릴리즈</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tag">태그 (선택사항)</Label>
                    <Input
                      id="tag"
                      value={newVersionData.tag}
                      onChange={(e) => setNewVersionData({...newVersionData, tag: e.target.value})}
                      placeholder="예: v1.0-stable, hotfix-001"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">변경 사항</Label>
                    <Textarea
                      id="notes"
                      value={newVersionData.notes}
                      onChange={(e) => setNewVersionData({...newVersionData, notes: e.target.value})}
                      placeholder="이번 버전의 주요 변경사항을 입력하세요"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={createVersion}>생성</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="history">히스토리</TabsTrigger>
            <TabsTrigger value="compare">비교</TabsTrigger>
            <TabsTrigger value="tree">트리</TabsTrigger>
            <TabsTrigger value="tools">도구</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="include-auto" className="text-sm">자동 버전 포함</Label>
                <input
                  id="include-auto"
                  type="checkbox"
                  checked={includeAutoVersions}
                  onChange={(e) => setIncludeAutoVersions(e.target.checked)}
                  className="rounded"
                />
              </div>
            </div>

            <ScrollArea className="h-80">
              <div className="space-y-3">
                {/* 현재 버전 표시 */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <GitBranch className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">현재 버전: {currentVersion}</p>
                      <p className="text-sm text-blue-700">작업 중인 버전</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">CURRENT</Badge>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">버전 목록 로딩 중...</span>
                  </div>
                ) : (
                  <>
                    {versions.map((version) => (
                      <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">v{version.version}</span>
                            {getStatusBadge(version.version_status)}
                            {version.tag && (
                              <Badge variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {version.tag}
                              </Badge>
                            )}
                            {version.auto_generated && (
                              <Badge variant="outline" className="text-xs bg-gray-100">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                자동
                              </Badge>
                            )}
                          </div>
                          
                          {version.notes && (
                            <p className="text-sm text-gray-600 mb-1">{version.notes}</p>
                          )}
                          
                          {version.change_summary && (
                            <div className="text-xs text-gray-500 mb-1">
                              변경: 노드 {version.change_summary.nodes?.added || 0}개 추가, 
                              {version.change_summary.nodes?.modified || 0}개 수정, 
                              {version.change_summary.nodes?.deleted || 0}개 삭제
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(version.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{version.created_by}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => previewVersionData(version.id)}
                            title="미리보기"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRollbackData({...rollbackData, target_version_id: version.id})
                              setIsRollbackDialogOpen(true)
                            }}
                            title="이 버전으로 롤백"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {versions.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">저장된 버전이 없습니다</p>
                        <p className="text-sm text-gray-400">첫 번째 버전을 생성해보세요</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="compare" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>비교 시작 버전</Label>
                  <Select value={compareVersions.from} onValueChange={(value) => setCompareVersions({...compareVersions, from: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="버전 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          v{version.version} {version.tag && `(${version.tag})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>비교 대상 버전</Label>
                  <Select value={compareVersions.to} onValueChange={(value) => setCompareVersions({...compareVersions, to: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="버전 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          v{version.version} {version.tag && `(${version.tag})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={compareVersionsData} 
                disabled={isComparing || !compareVersions.from || !compareVersions.to}
                className="w-full"
              >
                {isComparing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    비교 중...
                  </>
                ) : (
                  <>
                    <GitCompare className="h-4 w-4 mr-2" />
                    버전 비교
                  </>
                )}
              </Button>
              
              {versionDiff && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      비교 결과: v{versionDiff.version_from} → v{versionDiff.version_to}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">노드 변경</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>추가:</span>
                            <span className="text-green-600">{versionDiff.summary.nodes_added}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>수정:</span>
                            <span className="text-blue-600">{versionDiff.summary.nodes_modified}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>삭제:</span>
                            <span className="text-red-600">{versionDiff.summary.nodes_deleted}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">연결 변경</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>추가:</span>
                            <span className="text-green-600">{versionDiff.summary.connections_added}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>수정:</span>
                            <span className="text-blue-600">{versionDiff.summary.connections_modified}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>삭제:</span>
                            <span className="text-red-600">{versionDiff.summary.connections_deleted}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {versionDiff.changes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">상세 변경 사항</p>
                        <ScrollArea className="h-40">
                          <div className="space-y-1">
                            {versionDiff.changes.map((change, index) => (
                              <div key={index} className="text-sm p-2 rounded border-l-2 border-gray-200">
                                <span className={`inline-block w-16 text-xs font-medium ${
                                  change.type === 'added' ? 'text-green-600' :
                                  change.type === 'modified' ? 'text-blue-600' :
                                  change.type === 'deleted' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {change.type.toUpperCase()}
                                </span>
                                <span>{change.description}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tree" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">버전 트리</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsBranchDialogOpen(true)}
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  브랜치 생성
                </Button>
              </div>
              
              {versionTree ? (
                <div className="border rounded-lg p-4">
                  <div className="space-y-2">
                    {versionTree.nodes.map((node: any) => (
                      <div key={node.id} className="flex items-center space-x-2 p-2 rounded border">
                        <TreePine className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">v{node.version}</span>
                        {getStatusBadge(node.status)}
                        {node.tag && (
                          <Badge variant="outline" className="text-xs">
                            {node.tag}
                          </Badge>
                        )}
                        {node.auto_generated && (
                          <Badge variant="outline" className="text-xs bg-gray-100">
                            자동
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TreePine className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">버전 트리를 로드하는 중...</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tools" className="mt-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>고급 도구</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsRollbackDialogOpen(true)}
                    className="w-full justify-start"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    버전 롤백
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setIsBranchDialogOpen(true)}
                    className="w-full justify-start"
                  >
                    <GitBranch className="h-4 w-4 mr-2" />
                    브랜치 생성
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => autoCreateVersion("수동 백업")}
                    className="w-full justify-start"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    수동 백업
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Rollback Dialog */}
        <Dialog open={isRollbackDialogOpen} onOpenChange={setIsRollbackDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <span>버전 롤백</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>롤백할 버전 선택</Label>
                <Select 
                  value={rollbackData.target_version_id} 
                  onValueChange={(value) => setRollbackData({...rollbackData, target_version_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="버전 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        v{version.version} {version.tag && `(${version.tag})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="create-backup"
                  checked={rollbackData.create_backup}
                  onChange={(e) => setRollbackData({...rollbackData, create_backup: e.target.checked})}
                />
                <Label htmlFor="create-backup" className="text-sm">롤백 전 현재 상태 백업</Label>
              </div>
              
              <div>
                <Label>롤백 사유</Label>
                <Textarea
                  value={rollbackData.rollback_notes}
                  onChange={(e) => setRollbackData({...rollbackData, rollback_notes: e.target.value})}
                  placeholder="롤백 사유를 입력하세요"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsRollbackDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={rollbackToVersion} disabled={isRollingBack}>
                  {isRollingBack ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      롤백 중...
                    </>
                  ) : (
                    "롤백 실행"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Branch Dialog */}
        <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5" />
                <span>브랜치 생성</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>기준 버전</Label>
                <Select 
                  value={branchData.parent_version_id} 
                  onValueChange={(value) => setBranchData({...branchData, parent_version_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="기준이 될 버전 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((version) => (
                      <SelectItem key={version.id} value={version.id}>
                        v{version.version} {version.tag && `(${version.tag})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>새 브랜치 버전</Label>
                <Input
                  value={branchData.version}
                  onChange={(e) => setBranchData({...branchData, version: e.target.value})}
                  placeholder="예: 1.1-feature"
                />
              </div>
              
              <div>
                <Label>상태</Label>
                <Select 
                  value={branchData.version_status} 
                  onValueChange={(value: any) => setBranchData({...branchData, version_status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">초안</SelectItem>
                    <SelectItem value="stable">안정</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>태그</Label>
                <Input
                  value={branchData.tag}
                  onChange={(e) => setBranchData({...branchData, tag: e.target.value})}
                  placeholder="예: feature-branch"
                />
              </div>
              
              <div>
                <Label>설명</Label>
                <Textarea
                  value={branchData.notes}
                  onChange={(e) => setBranchData({...branchData, notes: e.target.value})}
                  placeholder="브랜치 목적을 설명하세요"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsBranchDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={createBranch} disabled={isCreatingBranch}>
                  {isCreatingBranch ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    "브랜치 생성"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
