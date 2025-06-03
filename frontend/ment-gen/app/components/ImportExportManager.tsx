"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  Download, 
  FileJson, 
  Check, 
  X, 
  AlertTriangle,
  Loader2 
} from "lucide-react"

interface ImportExportManagerProps {
  onImport?: (scenarioData: any) => void
  onExport?: () => any
  scenarioName?: string
}

export default function ImportExportManager({ 
  onImport, 
  onExport,
  scenarioName = "시나리오"
}: ImportExportManagerProps) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<any>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      toast({
        title: "파일 형식 오류",
        description: "JSON 파일만 업로드 가능합니다.",
        variant: "destructive",
      })
      return
    }

    setImportFile(file)
    parseJsonFile(file)
  }

  const parseJsonFile = async (file: File) => {
    setIsProcessing(true)
    setImportProgress(0)
    setValidationErrors([])

    try {
      const text = await file.text()
      setImportProgress(30)
      
      const data = JSON.parse(text)
      setImportProgress(60)
      
      // 데이터 검증
      const errors = validateScenarioData(data)
      setValidationErrors(errors)
      
      if (errors.length === 0) {
        setImportData(data)
        setImportProgress(100)
        toast({
          title: "파일 읽기 완료",
          description: "시나리오 데이터를 성공적으로 읽었습니다.",
        })
      } else {
        toast({
          title: "데이터 검증 실패",
          description: `${errors.length}개의 오류가 발견되었습니다.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "파일 읽기 실패",
        description: "JSON 파일을 파싱하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const validateScenarioData = (data: any): string[] => {
    const errors: string[] = []

    // 기본 구조 검증
    if (!data.scenario) {
      errors.push("시나리오 기본 정보가 없습니다.")
    } else {
      if (!data.scenario.name) {
        errors.push("시나리오 이름이 없습니다.")
      }
    }

    if (!Array.isArray(data.nodes)) {
      errors.push("노드 배열이 잘못되었습니다.")
    } else {
      // 시작 노드 검증
      const startNodes = data.nodes.filter((node: any) => node.type === 'start')
      if (startNodes.length === 0) {
        errors.push("시작 노드가 없습니다.")
      } else if (startNodes.length > 1) {
        errors.push("시작 노드가 여러 개입니다.")
      }

      // 노드 ID 중복 검증
      const nodeIds = data.nodes.map((node: any) => node.id)
      const duplicateIds = nodeIds.filter((id: string, index: number) => nodeIds.indexOf(id) !== index)
      if (duplicateIds.length > 0) {
        errors.push(`중복된 노드 ID가 있습니다: ${duplicateIds.join(', ')}`)
      }
    }

    if (!Array.isArray(data.edges)) {
      errors.push("연결 배열이 잘못되었습니다.")
    } else {
      // 연결 검증
      data.edges.forEach((edge: any, index: number) => {
        if (!edge.source || !edge.target) {
          errors.push(`연결 ${index + 1}: source 또는 target이 없습니다.`)
        }
      })
    }

    return errors
  }

  const handleImport = async () => {
    if (!importData || validationErrors.length > 0 || !onImport) return

    setIsProcessing(true)
    try {
      await onImport(importData)
      setIsImportDialogOpen(false)
      setImportFile(null)
      setImportData(null)
      toast({
        title: "가져오기 완료",
        description: "시나리오를 성공적으로 가져왔습니다.",
      })
    } catch (error) {
      toast({
        title: "가져오기 실패",
        description: "시나리오 가져오기 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExport = () => {
    if (!onExport) return

    try {
      const exportData = onExport()
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${scenarioName.replace(/\s+/g, '_')}_scenario_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      
      setIsExportDialogOpen(false)
      toast({
        title: "내보내기 완료",
        description: "시나리오를 성공적으로 내보냈습니다.",
      })
    } catch (error) {
      toast({
        title: "내보내기 실패",
        description: "시나리오 내보내기 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex space-x-2">
      {/* 가져오기 버튼 */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            가져오기
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>시나리오 가져오기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!importFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileJson className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-4">
                  JSON 파일을 선택하거나 드래그하여 놓으세요
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  파일 선택
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FileJson className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">{importFile.name}</span>
                </div>
                
                {isProcessing && (
                  <div>
                    <Label>처리 중...</Label>
                    <Progress value={importProgress} className="mt-2" />
                  </div>
                )}
                
                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">검증 오류:</p>
                        <ul className="list-disc list-inside text-sm">
                          {validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                {importData && validationErrors.length === 0 && (
                  <Alert>
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">검증 완료</p>
                        <p className="text-sm">
                          노드 {importData.nodes?.length}개, 연결 {importData.edges?.length}개
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsImportDialogOpen(false)
                      setImportFile(null)
                      setImportData(null)
                      setValidationErrors([])
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!importData || validationErrors.length > 0 || isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    가져오기
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 내보내기 버튼 */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>시나리오 내보내기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              현재 시나리오를 JSON 파일로 내보냅니다. 다른 시스템에서 가져오거나 백업 용도로 사용할 수 있습니다.
            </p>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium">내보낼 내용:</p>
              <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                <li>시나리오 기본 정보</li>
                <li>모든 노드 및 설정</li>
                <li>노드 간 연결 정보</li>
                <li>노드 위치 정보</li>
              </ul>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsExportDialogOpen(false)}
              >
                취소
              </Button>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                내보내기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
