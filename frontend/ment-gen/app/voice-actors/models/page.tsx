"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { 
  Plus, 
  Play, 
  Settings, 
  Trash2,
  Brain,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MoreVertical
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface VoiceActor {
  id: string
  name: string
  gender: "male" | "female" | "neutral"
  age_range: "child" | "20s" | "30s" | "40s" | "50s" | "senior"
  language: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface VoiceModel {
  id: string
  voice_actor_id: string
  model_name: string
  model_version: string
  model_path: string
  training_data_duration?: number
  quality_score?: number
  status: "training" | "ready" | "error" | "deprecated"
  config?: any
  created_at: string
  updated_at: string
}

interface VoiceModelWithActor extends VoiceModel {
  voice_actor?: VoiceActor
}

export default function VoiceModelsPage() {
  const [voiceModels, setVoiceModels] = useState<VoiceModelWithActor[]>([])
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedActor, setSelectedActor] = useState<string>("all")
  
  // 새 모델 생성 상태
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newModel, setNewModel] = useState({
    voice_actor_id: "",
    model_name: "",
    model_version: "1.0",
    training_data_duration: "",
    config: {
      learning_rate: 0.001,
      batch_size: 32,
      epochs: 100
    }
  })
  
  const { toast } = useToast()

  // API Base URL 유틸리티 함수
  const getApiUrl = (endpoint: string) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'
    return `${apiBaseUrl}${endpoint}`
  }

  useEffect(() => {
    fetchVoiceModels()
    fetchVoiceActors()
  }, [selectedStatus, selectedActor])

  const fetchVoiceModels = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      
      // 쿼리 파라미터 구성
      const params = new URLSearchParams()
      if (selectedStatus !== "all") params.append("status", selectedStatus)
      if (selectedActor !== "all") params.append("voice_actor_id", selectedActor)
      
      console.log('Fetching voice models from:', getApiUrl(`/voice-actors/models?${params}`))
      
      const response = await fetch(getApiUrl(`/voice-actors/models?${params}`), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        // 성우 정보를 모델에 매핑
        const modelsWithActors = await Promise.all(
          data.map(async (model: VoiceModel) => {
            try {
              const actorResponse = await fetch(getApiUrl(`/voice-actors/${model.voice_actor_id}`), {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              })
              
              if (actorResponse.ok) {
                const actor = await actorResponse.json()
                return { ...model, voice_actor: actor }
              }
            } catch (error) {
              console.error("Error fetching actor for model:", error)
            }
            return model
          })
        )
        
        setVoiceModels(modelsWithActors)
      } else {
        toast({
          title: "데이터 로드 실패",
          description: "음성 모델 목록을 불러오는데 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Fetch voice models error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchVoiceActors = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(getApiUrl('/voice-actors'), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setVoiceActors(data.filter((actor: VoiceActor) => actor.is_active))
      }
    } catch (error) {
      console.error("Fetch voice actors error:", error)
    }
  }

  const createVoiceModel = async () => {
    if (!newModel.voice_actor_id || !newModel.model_name.trim()) {
      toast({
        title: "입력 오류",
        description: "성우와 모델명을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(getApiUrl(`/voice-actors/${newModel.voice_actor_id}/models`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          model_name: newModel.model_name,
          model_version: newModel.model_version,
          training_data_duration: newModel.training_data_duration ? parseInt(newModel.training_data_duration) : null,
          config: newModel.config
        }),
      })

      if (response.ok) {
        const createdModel = await response.json()
        
        // 성우 정보를 포함한 모델 생성
        const actor = voiceActors.find(a => a.id === newModel.voice_actor_id)
        const modelWithActor = { ...createdModel, voice_actor: actor }
        
        setVoiceModels([modelWithActor, ...voiceModels])
        setIsCreateDialogOpen(false)
        setNewModel({
          voice_actor_id: "",
          model_name: "",
          model_version: "1.0",
          training_data_duration: "",
          config: {
            learning_rate: 0.001,
            batch_size: 32,
            epochs: 100
          }
        })
        
        toast({
          title: "모델 생성 성공",
          description: "새로운 음성 모델이 생성되었습니다.",
        })
      } else {
        const error = await response.json()
        throw new Error(error.detail || "모델 생성 실패")
      }
    } catch (error) {
      console.error("Create voice model error:", error)
      toast({
        title: "생성 실패",
        description: "음성 모델 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const trainModel = async (modelId: string) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(getApiUrl(`/voice-actors/models/${modelId}/train`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        // 모델 상태를 training으로 업데이트
        setVoiceModels(prev => 
          prev.map(model => 
            model.id === modelId 
              ? { ...model, status: "training" as const }
              : model
          )
        )
        
        toast({
          title: "학습 시작",
          description: "음성 모델 학습이 시작되었습니다.",
        })
      } else {
        const error = await response.json()
        throw new Error(error.detail || "학습 시작 실패")
      }
    } catch (error) {
      console.error("Train model error:", error)
      toast({
        title: "학습 실패",
        description: "음성 모델 학습을 시작할 수 없습니다.",
        variant: "destructive",
      })
    }
  }

  const deleteModel = async (modelId: string) => {
    if (!confirm("정말로 이 음성 모델을 삭제하시겠습니까?")) {
      return
    }

    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(getApiUrl(`/voice-actors/models/${modelId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        setVoiceModels(prev => prev.filter(model => model.id !== modelId))
        toast({
          title: "모델 삭제 성공",
          description: "음성 모델이 삭제되었습니다.",
        })
      } else {
        throw new Error("삭제 실패")
      }
    } catch (error) {
      console.error("Delete model error:", error)
      toast({
        title: "삭제 실패",
        description: "음성 모델 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready": return <CheckCircle className="h-4 w-4 text-green-600" />
      case "training": return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case "error": return <XCircle className="h-4 w-4 text-red-600" />
      case "deprecated": return <Clock className="h-4 w-4 text-gray-600" />
      default: return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-green-100 text-green-800"
      case "training": return "bg-blue-100 text-blue-800"
      case "error": return "bg-red-100 text-red-800"
      case "deprecated": return "bg-gray-100 text-gray-800"
      default: return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "ready": return "준비완료"
      case "training": return "학습중"
      case "error": return "오류"
      case "deprecated": return "사용중단"
      default: return "알 수 없음"
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">음성 모델 목록을 불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">음성 모델 관리</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 모델 생성
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>새 음성 모델 생성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="voice-actor">성우 선택</Label>
                <Select 
                  value={newModel.voice_actor_id} 
                  onValueChange={(value) => setNewModel({...newModel, voice_actor_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="성우를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceActors.map((actor) => (
                      <SelectItem key={actor.id} value={actor.id}>
                        {actor.name} ({actor.gender === "male" ? "남성" : actor.gender === "female" ? "여성" : "중성"}, {actor.age_range})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model-name">모델명</Label>
                  <Input
                    id="model-name"
                    value={newModel.model_name}
                    onChange={(e) => setNewModel({...newModel, model_name: e.target.value})}
                    placeholder="예: 김소연_v1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="model-version">버전</Label>
                  <Input
                    id="model-version"
                    value={newModel.model_version}
                    onChange={(e) => setNewModel({...newModel, model_version: e.target.value})}
                    placeholder="1.0"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="training-duration">학습 데이터 시간 (초)</Label>
                <Input
                  id="training-duration"
                  type="number"
                  value={newModel.training_data_duration}
                  onChange={(e) => setNewModel({...newModel, training_data_duration: e.target.value})}
                  placeholder="예: 3600 (1시간)"
                />
              </div>
              
              <div>
                <Label>학습 설정</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label htmlFor="learning-rate" className="text-xs">Learning Rate</Label>
                    <Input
                      id="learning-rate"
                      type="number"
                      step="0.0001"
                      value={newModel.config.learning_rate}
                      onChange={(e) => setNewModel({
                        ...newModel, 
                        config: {...newModel.config, learning_rate: parseFloat(e.target.value)}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="batch-size" className="text-xs">Batch Size</Label>
                    <Input
                      id="batch-size"
                      type="number"
                      value={newModel.config.batch_size}
                      onChange={(e) => setNewModel({
                        ...newModel, 
                        config: {...newModel.config, batch_size: parseInt(e.target.value)}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="epochs" className="text-xs">Epochs</Label>
                    <Input
                      id="epochs"
                      type="number"
                      value={newModel.config.epochs}
                      onChange={(e) => setNewModel({
                        ...newModel, 
                        config: {...newModel.config, epochs: parseInt(e.target.value)}
                      })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={createVoiceModel}>생성</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 필터 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status-filter">상태 필터</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="ready">준비완료</SelectItem>
                  <SelectItem value="training">학습중</SelectItem>
                  <SelectItem value="error">오류</SelectItem>
                  <SelectItem value="deprecated">사용중단</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="actor-filter">성우 필터</Label>
              <Select value={selectedActor} onValueChange={setSelectedActor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 성우</SelectItem>
                  {voiceActors.map((actor) => (
                    <SelectItem key={actor.id} value={actor.id}>
                      {actor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedStatus("all")
                  setSelectedActor("all")
                }}
                className="w-full"
              >
                필터 초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 모델 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {voiceModels.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-500">
            음성 모델이 없습니다.
          </div>
        ) : (
          voiceModels.map((model) => (
            <Card key={model.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{model.model_name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {model.voice_actor?.name} • v{model.model_version}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>모델 관리</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {model.status === "ready" && (
                        <DropdownMenuItem onClick={() => trainModel(model.id)}>
                          <Brain className="h-4 w-4 mr-2" />
                          재학습 시작
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => deleteModel(model.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        모델 삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(model.status)}
                  <Badge className={getStatusBadgeColor(model.status)}>
                    {getStatusText(model.status)}
                  </Badge>
                </div>
                
                {model.quality_score && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>품질 점수</span>
                      <span>{model.quality_score.toFixed(1)}점</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${model.quality_score}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {model.training_data_duration && (
                  <p className="text-sm text-gray-600">
                    학습 데이터: {Math.floor(model.training_data_duration / 60)}분 {model.training_data_duration % 60}초
                  </p>
                )}
                
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">
                    생성일: {new Date(model.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    수정일: {new Date(model.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
              
              <CardFooter>
                <div className="flex space-x-2 w-full">
                  {model.status === "ready" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => trainModel(model.id)}
                      className="flex-1"
                    >
                      <Brain className="h-4 w-4 mr-1" />
                      재학습
                    </Button>
                  )}
                  
                  {model.status === "training" && (
                    <Button size="sm" variant="outline" disabled className="flex-1">
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      학습중...
                    </Button>
                  )}
                  
                  {model.status === "error" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => trainModel(model.id)}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      재시도
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
