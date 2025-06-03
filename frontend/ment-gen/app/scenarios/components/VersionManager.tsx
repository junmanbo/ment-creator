"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
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
  Loader2
} from "lucide-react"

interface ScenarioVersion {
  id: string
  version: string
  notes?: string
  created_by: string
  created_at: string
  snapshot: any
}

interface VersionManagerProps {
  scenarioId: string
  currentVersion: string
}

export default function VersionManager({ scenarioId, currentVersion }: VersionManagerProps) {
  const [versions, setVersions] = useState<ScenarioVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isReverting, setIsReverting] = useState(false)
  const [newVersionData, setNewVersionData] = useState({
    version: "",
    notes: ""
  })
  
  const { toast } = useToast()

  useEffect(() => {
    loadVersions()
  }, [scenarioId])

  const loadVersions = async () => {
    setIsLoading(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}/versions`,
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
            version: newVersionData.version,
            notes: newVersionData.notes,
            snapshot: {} // 현재 시나리오 스냅샷이 포함되어야 함
          }),
        }
      )

      if (response.ok) {
        const newVersion = await response.json()
        setVersions([newVersion, ...versions])
        setIsCreateDialogOpen(false)
        setNewVersionData({ version: "", notes: "" })
        
        toast({
          title: "버전 생성 완료",
          description: `버전 ${newVersion.version}이 생성되었습니다.`,
        })
      } else {
        toast({
          title: "버전 생성 실패",
          description: "버전 생성 중 오류가 발생했습니다.",
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

  const revertToVersion = async (version: ScenarioVersion) => {
    if (!confirm(`버전 ${version.version}으로 되돌리시겠습니까? 현재 변경사항은 저장됩니다.`)) {
      return
    }

    setIsReverting(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenarios/${scenarioId}/revert/${version.version}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        toast({
          title: "복원 완료",
          description: `버전 ${version.version}으로 복원되었습니다. 페이지를 새로고침합니다.`,
        })
        
        // 페이지 새로고침으로 변경사항 반영
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast({
          title: "복원 실패",
          description: "버전 복원 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Revert version error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    } finally {
      setIsReverting(false)
    }
  }

  const downloadVersionSnapshot = (version: ScenarioVersion) => {
    const dataStr = JSON.stringify(version.snapshot, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `scenario_${scenarioId}_v${version.version}.json`
    link.click()
    URL.revokeObjectURL(url)
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
                  <p className="text-sm text-gray-500 mt-1">
                    권장: {generateNextVersion()}
                  </p>
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
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
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
                      {version.version === currentVersion && (
                        <Badge variant="outline" className="text-xs">현재</Badge>
                      )}
                    </div>
                    
                    {version.notes && (
                      <p className="text-sm text-gray-600 mb-1">{version.notes}</p>
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
                      onClick={() => downloadVersionSnapshot(version)}
                      title="스냅샷 다운로드"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    {version.version !== currentVersion && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revertToVersion(version)}
                        disabled={isReverting}
                        title="이 버전으로 복원"
                      >
                        {isReverting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                      </Button>
                    )}
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
      </CardContent>
    </Card>
  )
}