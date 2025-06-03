"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { 
  Trash2,
  Play,
  Pause,
  Mic,
  Volume2,
  Plus,
  X,
  Loader2
} from "lucide-react"

interface VoiceActor {
  id: string
  name: string
  gender: "male" | "female" | "neutral"
  age_range: string
}

interface BranchOption {
  key: string
  label: string
  target?: string
}

interface NodeEditorProps {
  selectedNode: any
  onUpdateNode: (field: string, value: any) => void
  onUpdateConfig: (configField: string, value: any) => void
  onDeleteNode: () => void
  scenarios?: any[]
}

export default function NodeEditor({ 
  selectedNode, 
  onUpdateNode, 
  onUpdateConfig, 
  onDeleteNode 
}: NodeEditorProps) {
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([])
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([])
  const [isVoiceActorsLoading, setIsVoiceActorsLoading] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    loadVoiceActors()
  }, [])

  useEffect(() => {
    if (selectedNode?.data.nodeType === "branch" && selectedNode?.data.config?.branches) {
      setBranchOptions(selectedNode.data.config.branches)
    } else {
      setBranchOptions([])
    }
  }, [selectedNode])

  const loadVoiceActors = async () => {
    setIsVoiceActorsLoading(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors?is_active=true`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setVoiceActors(data)
      }
    } catch (error) {
      console.error("Load voice actors error:", error)
    } finally {
      setIsVoiceActorsLoading(false)
    }
  }

  const generateTTS = async () => {
    if (!selectedNode?.data.config?.text || !selectedNode?.data.config?.voice_actor_id) {
      toast({
        title: "입력 오류",
        description: "텍스트와 성우를 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingTTS(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      
      // 1. TTS 스크립트 생성
      const scriptResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-scripts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          text_content: selectedNode.data.config.text,
          voice_actor_id: selectedNode.data.config.voice_actor_id,
          voice_settings: selectedNode.data.config.voice_settings || {}
        }),
      })

      if (!scriptResponse.ok) {
        throw new Error("스크립트 생성 실패")
      }

      const script = await scriptResponse.json()

      // 2. TTS 생성 요청
      const generateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-scripts/${script.id}/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            script_id: script.id,
            generation_params: {
              quality: "high"
            }
          }),
        }
      )

      if (generateResponse.ok) {
        const generation = await generateResponse.json()
        
        // 노드에 TTS 생성 ID 저장
        onUpdateConfig("tts_generation_id", generation.id)
        
        toast({
          title: "TTS 생성 시작",
          description: "음성 생성이 시작되었습니다. 잠시 후 결과를 확인해주세요.",
        })

        // 생성 상태 폴링
        pollTTSStatus(generation.id)
      } else {
        throw new Error("TTS 생성 요청 실패")
      }
    } catch (error) {
      console.error("Generate TTS error:", error)
      toast({
        title: "TTS 생성 실패",
        description: "음성 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingTTS(false)
    }
  }

  const pollTTSStatus = async (generationId: string) => {
    const accessToken = localStorage.getItem("access_token")
    
    const poll = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-generations/${generationId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (response.ok) {
          const generation = await response.json()

          if (generation.status === "completed") {
            onUpdateConfig("audio_file_path", generation.audio_file_path)
            toast({
              title: "TTS 생성 완료",
              description: "음성이 성공적으로 생성되었습니다.",
            })
          } else if (generation.status === "failed") {
            toast({
              title: "TTS 생성 실패",
              description: generation.error_message || "음성 생성에 실패했습니다.",
              variant: "destructive",
            })
          } else if (generation.status === "processing" || generation.status === "pending") {
            // 3초 후 다시 폴링
            setTimeout(poll, 3000)
          }
        }
      } catch (error) {
        console.error("Poll TTS status error:", error)
      }
    }

    poll()
  }

  const playAudio = async () => {
    if (!selectedNode?.data.config?.audio_file_path) {
      toast({
        title: "재생 오류",
        description: "생성된 음성 파일이 없습니다.",
        variant: "destructive",
      })
      return
    }

    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-generations/${selectedNode.data.config.tts_generation_id}/audio`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        setPlayingAudio(selectedNode.id)
        
        audio.addEventListener("ended", () => {
          setPlayingAudio(null)
          URL.revokeObjectURL(audioUrl)
        })
        
        await audio.play()
      }
    } catch (error) {
      console.error("Play audio error:", error)
      toast({
        title: "재생 오류",
        description: "오디오 재생 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const addBranchOption = () => {
    const newOption: BranchOption = {
      key: (branchOptions.length + 1).toString(),
      label: "",
      target: ""
    }
    const updatedOptions = [...branchOptions, newOption]
    setBranchOptions(updatedOptions)
    onUpdateConfig("branches", updatedOptions)
  }

  const updateBranchOption = (index: number, field: keyof BranchOption, value: string) => {
    const updatedOptions = branchOptions.map((option, i) => 
      i === index ? { ...option, [field]: value } : option
    )
    setBranchOptions(updatedOptions)
    onUpdateConfig("branches", updatedOptions)
  }

  const removeBranchOption = (index: number) => {
    const updatedOptions = branchOptions.filter((_, i) => i !== index)
    setBranchOptions(updatedOptions)
    onUpdateConfig("branches", updatedOptions)
  }

  if (!selectedNode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>노드 편집</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            편집할 노드를 선택하세요
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          노드 편집
          <Badge variant="outline">{selectedNode.data.nodeType}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 기본 정보 */}
        <div>
          <Label htmlFor="node-name">노드 이름</Label>
          <Input
            id="node-name"
            value={selectedNode.data.label}
            onChange={(e) => onUpdateNode("label", e.target.value)}
            placeholder="노드 이름을 입력하세요"
          />
        </div>

        {/* 메시지 노드 설정 */}
        {selectedNode.data.nodeType === "message" && (
          <>
            <Separator />
            <div>
              <Label htmlFor="message-text">메시지 내용</Label>
              <Textarea
                id="message-text"
                value={selectedNode.data.config.text || ""}
                onChange={(e) => onUpdateConfig("text", e.target.value)}
                placeholder="고객에게 전달할 메시지를 입력하세요"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="voice-actor">성우 선택</Label>
              {isVoiceActorsLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">성우 목록 로딩 중...</span>
                </div>
              ) : (
                <Select 
                  value={selectedNode.data.config.voice_actor_id || ""} 
                  onValueChange={(value) => onUpdateConfig("voice_actor_id", value)}
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
              )}
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={generateTTS} 
                disabled={isGeneratingTTS || !selectedNode.data.config.text || !selectedNode.data.config.voice_actor_id}
                className="flex-1"
              >
                {isGeneratingTTS ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    TTS 생성
                  </>
                )}
              </Button>
              
              {selectedNode.data.config.audio_file_path && (
                <Button 
                  variant="outline" 
                  onClick={playAudio}
                  disabled={playingAudio === selectedNode.id}
                >
                  {playingAudio === selectedNode.id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {selectedNode.data.config.audio_file_path && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <Volume2 className="h-4 w-4" />
                <span>음성 파일이 생성되었습니다</span>
              </div>
            )}
          </>
        )}

        {/* 분기 노드 설정 */}
        {selectedNode.data.nodeType === "branch" && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>분기 옵션</Label>
                <Button size="sm" onClick={addBranchOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  옵션 추가
                </Button>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                고객이 선택할 수 있는 옵션들을 설정하세요
              </p>
              
              <div className="space-y-3">
                {branchOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Input
                      value={option.key}
                      onChange={(e) => updateBranchOption(index, "key", e.target.value)}
                      placeholder="키"
                      className="w-16"
                    />
                    <Input
                      value={option.label}
                      onChange={(e) => updateBranchOption(index, "label", e.target.value)}
                      placeholder="옵션 레이블"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeBranchOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {branchOptions.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    분기 옵션을 추가해주세요
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* 상담원 연결 노드 설정 */}
        {selectedNode.data.nodeType === "transfer" && (
          <>
            <Separator />
            <div>
              <Label htmlFor="transfer-type">연결 유형</Label>
              <Select 
                value={selectedNode.data.config.transfer_type || "general"} 
                onValueChange={(value) => onUpdateConfig("transfer_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">일반 상담</SelectItem>
                  <SelectItem value="insurance">보험 상담</SelectItem>
                  <SelectItem value="claim">사고 접수</SelectItem>
                  <SelectItem value="emergency">긴급 상담</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="transfer-message">연결 멘트</Label>
              <Textarea
                id="transfer-message"
                value={selectedNode.data.config.transfer_message || ""}
                onChange={(e) => onUpdateConfig("transfer_message", e.target.value)}
                placeholder="상담원 연결 전 안내 멘트를 입력하세요"
                rows={2}
              />
            </div>
          </>
        )}

        {/* 입력 노드 설정 */}
        {selectedNode.data.nodeType === "input" && (
          <>
            <Separator />
            <div>
              <Label htmlFor="input-type">입력 타입</Label>
              <Select 
                value={selectedNode.data.config.input_type || "number"} 
                onValueChange={(value) => onUpdateConfig("input_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">숫자</SelectItem>
                  <SelectItem value="text">텍스트</SelectItem>
                  <SelectItem value="voice">음성</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="input-prompt">입력 안내 멘트</Label>
              <Textarea
                id="input-prompt"
                value={selectedNode.data.config.input_prompt || ""}
                onChange={(e) => onUpdateConfig("input_prompt", e.target.value)}
                placeholder="고객에게 입력을 안내하는 멘트를 입력하세요"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="input-validation">입력 검증</Label>
              <Input
                id="input-validation"
                value={selectedNode.data.config.input_validation || ""}
                onChange={(e) => onUpdateConfig("input_validation", e.target.value)}
                placeholder="입력 검증 규칙 (정규식 등)"
              />
            </div>
          </>
        )}

        <Separator />
        
        {/* 노드 삭제 */}
        <Button
          variant="destructive"
          onClick={onDeleteNode}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          노드 삭제
        </Button>
      </CardContent>
    </Card>
  )
}