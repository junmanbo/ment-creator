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
import { Switch } from "@/components/ui/switch"
import { 
  Trash2,
  Play,
  Pause,
  Mic,
  Volume2,
  Plus,
  X,
  Loader2,
  Clock,
  Calendar,
  Settings,
  Phone,
  Database,
  ArrowRight
} from "lucide-react"

interface VoiceActor {
  id: string
  name: string
  gender: "male" | "female" | "neutral"
  age_range: string
}

interface MenuOption {
  key: string
  label: string
  target_node: string
}

interface ConditionRule {
  condition: string
  target_node: string
  label: string
  operator?: string
  compare_value?: any
}

interface BranchOption {
  key: string
  label: string
  target?: string
}

// Node type definitions for the new ARS system
type NodeType = "start" | "end" | "condition" | "voice_ment" | "menu_select" | 
               "input_collect" | "external_api" | "transfer" | 
               "message" | "branch" | "input" // Legacy types

type ConditionType = "time_check" | "date_check" | "value_compare" | "api_result" | "session_data"
type InputCollectType = "dtmf_digit" | "dtmf_string" | "voice_recognition" | "birth_date" | 
                       "phone_number" | "business_number"
type ExternalApiType = "host_system" | "third_party" | "database_query"

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
  
  // New ARS node state
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([])
  const [conditionRules, setConditionRules] = useState<ConditionRule[]>([])
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [holidays, setHolidays] = useState<string[]>([])
  const [errorHandling, setErrorHandling] = useState<{[key: string]: string}>({})
  const [requestMapping, setRequestMapping] = useState<{[key: string]: any}>({})
  const [responseMapping, setResponseMapping] = useState<{[key: string]: string}>({})
  
  const { toast } = useToast()

  useEffect(() => {
    loadVoiceActors()
  }, [])

  useEffect(() => {
    if (!selectedNode) return
    
    const config = selectedNode?.data?.config || {}
    
    // Legacy branch node
    if (selectedNode.data.nodeType === "branch" && config.branches) {
      setBranchOptions(config.branches)
    } else {
      setBranchOptions([])
    }
    
    // New ARS node types
    if (selectedNode.data.nodeType === "menu_select" && config.menu_items) {
      setMenuOptions(config.menu_items)
    } else {
      setMenuOptions([])
    }
    
    if (selectedNode.data.nodeType === "condition" && config.rules) {
      setConditionRules(config.rules)
      setWeekdays(config.weekdays || [])
      setHolidays(config.holidays || [])
    } else {
      setConditionRules([])
      setWeekdays([])
      setHolidays([])
    }
    
    if (selectedNode.data.nodeType === "external_api") {
      setErrorHandling(config.error_handling || {})
      setRequestMapping(config.request_mapping || {})
      setResponseMapping(config.response_mapping || {})
    } else {
      setErrorHandling({})
      setRequestMapping({})
      setResponseMapping({})
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

    // 시나리오 ID 가져오기 (상위 컴포넌트에서 전달받아야 함)
    const scenarioId = selectedNode?.data?.scenarioId
    if (!scenarioId) {
      toast({
        title: "시나리오 정보 오류",
        description: "시나리오 정보를 찾을 수 없습니다.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingTTS(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      
      // 시나리오 전용 TTS 생성 API 사용
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/scenario-tts/scenario/${scenarioId}/node/${selectedNode.id}/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            scenario_id: scenarioId,
            node_id: selectedNode.id,
            text_content: selectedNode.data.config.text,
            voice_actor_id: selectedNode.data.config.voice_actor_id,
            voice_settings: selectedNode.data.config.voice_settings || {}
          }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        
        // 노드에 시나리오 TTS ID와 생성 ID 저장
        onUpdateConfig("scenario_tts_id", result.scenario_tts_id)
        onUpdateConfig("tts_generation_id", result.generation_id)
        
        toast({
          title: "TTS 생성 시작",
          description: "시나리오 전용 음성 생성이 시작되었습니다.",
        })

        // 생성 상태 폴링
        pollTTSStatus(result.generation_id)
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

  // Menu options helpers
  const addMenuOption = () => {
    const newOption: MenuOption = {
      key: (menuOptions.length + 1).toString(),
      label: "",
      target_node: ""
    }
    const updatedOptions = [...menuOptions, newOption]
    setMenuOptions(updatedOptions)
    onUpdateConfig("menu_items", updatedOptions)
  }

  const updateMenuOption = (index: number, field: keyof MenuOption, value: string) => {
    const updatedOptions = menuOptions.map((option, i) => 
      i === index ? { ...option, [field]: value } : option
    )
    setMenuOptions(updatedOptions)
    onUpdateConfig("menu_items", updatedOptions)
  }

  const removeMenuOption = (index: number) => {
    const updatedOptions = menuOptions.filter((_, i) => i !== index)
    setMenuOptions(updatedOptions)
    onUpdateConfig("menu_items", updatedOptions)
  }

  // Condition rules helpers
  const addConditionRule = () => {
    const newRule: ConditionRule = {
      condition: "",
      target_node: "",
      label: ""
    }
    const updatedRules = [...conditionRules, newRule]
    setConditionRules(updatedRules)
    onUpdateConfig("rules", updatedRules)
  }

  const updateConditionRule = (index: number, field: keyof ConditionRule, value: any) => {
    const updatedRules = conditionRules.map((rule, i) => 
      i === index ? { ...rule, [field]: value } : rule
    )
    setConditionRules(updatedRules)
    onUpdateConfig("rules", updatedRules)
  }

  const removeConditionRule = (index: number) => {
    const updatedRules = conditionRules.filter((_, i) => i !== index)
    setConditionRules(updatedRules)
    onUpdateConfig("rules", updatedRules)
  }

  // Weekday helpers
  const toggleWeekday = (day: number) => {
    const updatedWeekdays = weekdays.includes(day) 
      ? weekdays.filter(d => d !== day)
      : [...weekdays, day].sort()
    setWeekdays(updatedWeekdays)
    onUpdateConfig("weekdays", updatedWeekdays)
  }

  // Holiday helpers
  const addHoliday = (date: string) => {
    if (date && !holidays.includes(date)) {
      const updatedHolidays = [...holidays, date].sort()
      setHolidays(updatedHolidays)
      onUpdateConfig("holidays", updatedHolidays)
    }
  }

  const removeHoliday = (date: string) => {
    const updatedHolidays = holidays.filter(h => h !== date)
    setHolidays(updatedHolidays)
    onUpdateConfig("holidays", updatedHolidays)
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

        {/* 음성 멘트 노드 설정 (Voice Ment) */}
        {(selectedNode.data.nodeType === "voice_ment" || selectedNode.data.nodeType === "message") && (
          <>
            <Separator />
            <div>
              <Label htmlFor="message-text">
                <Volume2 className="h-4 w-4 inline mr-1" />
                음성 멘트 내용
              </Label>
              <Textarea
                id="message-text"
                value={selectedNode.data.config.text_content || selectedNode.data.config.text || ""}
                onChange={(e) => onUpdateConfig(selectedNode.data.nodeType === "voice_ment" ? "text_content" : "text", e.target.value)}
                placeholder="TTS로 변환할 텍스트를 입력하세요 (예: 메뉴 개수는 6개입니다. 사고접수는 1번...)"
                rows={4}
              />
            </div>

            {/* 음성 설정 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>재생 속도</Label>
                <Select 
                  value={selectedNode.data.config.tts_speed?.toString() || "1.0"} 
                  onValueChange={(value) => onUpdateConfig("tts_speed", parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x (느림)</SelectItem>
                    <SelectItem value="0.8">0.8x</SelectItem>
                    <SelectItem value="1.0">1.0x (보통)</SelectItem>
                    <SelectItem value="1.2">1.2x</SelectItem>
                    <SelectItem value="1.5">1.5x (빠름)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>음량</Label>
                <Select 
                  value={selectedNode.data.config.volume?.toString() || "1.0"} 
                  onValueChange={(value) => onUpdateConfig("volume", parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">50%</SelectItem>
                    <SelectItem value="0.8">80%</SelectItem>
                    <SelectItem value="1.0">100%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>반복 횟수</Label>
                <Input
                  type="number"
                  value={selectedNode.data.config.repeat_count || 1}
                  onChange={(e) => onUpdateConfig("repeat_count", parseInt(e.target.value))}
                  min="1"
                  max="5"
                />
              </div>
              <div>
                <Label>재생 후 대기 (초)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={selectedNode.data.config.wait_after || 0.5}
                  onChange={(e) => onUpdateConfig("wait_after", parseFloat(e.target.value))}
                  min="0"
                  max="10"
                />
              </div>
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

        {/* 조건 분기 노드 설정 (Condition) */}
        {selectedNode.data.nodeType === "condition" && (
          <>
            <Separator />
            <div>
              <Label>
                <Settings className="h-4 w-4 inline mr-1" />
                조건 타입
              </Label>
              <Select 
                value={selectedNode.data.config.condition_type || "time_check"} 
                onValueChange={(value) => onUpdateConfig("condition_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_check">시간 체크 (영업시간)</SelectItem>
                  <SelectItem value="date_check">날짜 체크 (요일/공휴일)</SelectItem>
                  <SelectItem value="value_compare">값 비교</SelectItem>
                  <SelectItem value="api_result">API 결과 분기</SelectItem>
                  <SelectItem value="session_data">세션 데이터 분기</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 시간 체크 설정 */}
            {selectedNode.data.config.condition_type === "time_check" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>시작 시간</Label>
                  <Input
                    type="time"
                    value={selectedNode.data.config.start_time || "09:00"}
                    onChange={(e) => onUpdateConfig("start_time", e.target.value)}
                  />
                </div>
                <div>
                  <Label>종료 시간</Label>
                  <Input
                    type="time"
                    value={selectedNode.data.config.end_time || "18:00"}
                    onChange={(e) => onUpdateConfig("end_time", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 날짜 체크 설정 */}
            {selectedNode.data.config.condition_type === "date_check" && (
              <>
                <div>
                  <Label>영업 요일 선택</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { num: 1, label: "월" }, { num: 2, label: "화" }, { num: 3, label: "수" },
                      { num: 4, label: "목" }, { num: 5, label: "금" }, { num: 6, label: "토" }, { num: 7, label: "일" }
                    ].map((day) => (
                      <Button
                        key={day.num}
                        variant={weekdays.includes(day.num) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleWeekday(day.num)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>공휴일 목록</Label>
                  <div className="space-y-2">
                    {holidays.map((holiday) => (
                      <div key={holiday} className="flex items-center space-x-2">
                        <Input value={holiday} readOnly className="flex-1" />
                        <Button size="sm" variant="outline" onClick={() => removeHoliday(holiday)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex space-x-2">
                      <Input
                        type="date"
                        placeholder="YYYY-MM-DD"
                        onBlur={(e) => addHoliday(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 값 비교 설정 */}
            {selectedNode.data.config.condition_type === "value_compare" && (
              <>
                <div>
                  <Label>비교할 변수명</Label>
                  <Input
                    value={selectedNode.data.config.variable_name || ""}
                    onChange={(e) => onUpdateConfig("variable_name", e.target.value)}
                    placeholder="예: customer_grade"
                  />
                </div>
                <div>
                  <Label>기본 경로 (조건 불만족시)</Label>
                  <Input
                    value={selectedNode.data.config.default_path || ""}
                    onChange={(e) => onUpdateConfig("default_path", e.target.value)}
                    placeholder="기본으로 이동할 노드 ID"
                  />
                </div>
              </>
            )}

            {/* 조건 규칙 설정 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>조건 규칙</Label>
                <Button size="sm" onClick={addConditionRule}>
                  <Plus className="h-4 w-4 mr-1" />
                  규칙 추가
                </Button>
              </div>
              <div className="space-y-3">
                {conditionRules.map((rule, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={rule.condition}
                        onChange={(e) => updateConditionRule(index, "condition", e.target.value)}
                        placeholder="조건 (예: within_hours)"
                      />
                      <Input
                        value={rule.target_node}
                        onChange={(e) => updateConditionRule(index, "target_node", e.target.value)}
                        placeholder="대상 노드 ID"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={rule.label}
                        onChange={(e) => updateConditionRule(index, "label", e.target.value)}
                        placeholder="조건 레이블"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeConditionRule(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {conditionRules.length === 0 && (
                  <p className="text-center text-gray-500 py-4">조건 규칙을 추가해주세요</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* 메뉴 선택 노드 설정 (Menu Select) */}
        {selectedNode.data.nodeType === "menu_select" && (
          <>
            <Separator />
            <div>
              <Label>
                <Phone className="h-4 w-4 inline mr-1" />
                DTMF 메뉴 설정
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>입력 대기시간 (초)</Label>
                <Input
                  type="number"
                  value={selectedNode.data.config.timeout_seconds || 10}
                  onChange={(e) => onUpdateConfig("timeout_seconds", parseInt(e.target.value))}
                  min="5"
                  max="60"
                />
              </div>
              <div>
                <Label>최대 재시도 횟수</Label>
                <Input
                  type="number"
                  value={selectedNode.data.config.max_retries || 3}
                  onChange={(e) => onUpdateConfig("max_retries", parseInt(e.target.value))}
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <div>
              <Label>잘못된 입력 안내</Label>
              <Input
                value={selectedNode.data.config.invalid_message || "잘못된 번호입니다. 다시 입력해주세요."}
                onChange={(e) => onUpdateConfig("invalid_message", e.target.value)}
              />
            </div>

            <div>
              <Label>타임아웃 안내</Label>
              <Input
                value={selectedNode.data.config.timeout_message || "입력 시간이 초과되었습니다."}
                onChange={(e) => onUpdateConfig("timeout_message", e.target.value)}
              />
            </div>

            {/* 메뉴 항목 설정 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>메뉴 항목</Label>
                <Button size="sm" onClick={addMenuOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  항목 추가
                </Button>
              </div>
              <div className="space-y-3">
                {menuOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Input
                      value={option.key}
                      onChange={(e) => updateMenuOption(index, "key", e.target.value)}
                      placeholder="키 (1, 2, 3...)"
                      className="w-20"
                    />
                    <Input
                      value={option.label}
                      onChange={(e) => updateMenuOption(index, "label", e.target.value)}
                      placeholder="메뉴 레이블 (예: 사고접수)"
                      className="flex-1"
                    />
                    <Input
                      value={option.target_node}
                      onChange={(e) => updateMenuOption(index, "target_node", e.target.value)}
                      placeholder="대상 노드 ID"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeMenuOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {menuOptions.length === 0 && (
                  <p className="text-center text-gray-500 py-4">메뉴 항목을 추가해주세요</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* 입력 수집 노드 설정 (Input Collect) */}
        {selectedNode.data.nodeType === "input_collect" && (
          <>
            <Separator />
            <div>
              <Label>
                <Database className="h-4 w-4 inline mr-1" />
                입력 수집 타입
              </Label>
              <Select 
                value={selectedNode.data.config.input_type || "dtmf_digit"} 
                onValueChange={(value) => onUpdateConfig("input_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dtmf_digit">DTMF 숫자</SelectItem>
                  <SelectItem value="dtmf_string">DTMF 문자열</SelectItem>
                  <SelectItem value="birth_date">생년월일 (8자리)</SelectItem>
                  <SelectItem value="phone_number">전화번호 (11자리)</SelectItem>
                  <SelectItem value="business_number">사업자번호</SelectItem>
                  <SelectItem value="voice_recognition">음성 인식</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>저장할 변수명</Label>
              <Input
                value={selectedNode.data.config.variable_name || ""}
                onChange={(e) => onUpdateConfig("variable_name", e.target.value)}
                placeholder="예: customer_birth_date"
              />
            </div>

            <div>
              <Label>입력 안내 멘트</Label>
              <Textarea
                value={selectedNode.data.config.prompt_message || ""}
                onChange={(e) => onUpdateConfig("prompt_message", e.target.value)}
                placeholder="고객에게 입력을 안내하는 멘트"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>최소 입력 길이</Label>
                <Input
                  type="number"
                  value={selectedNode.data.config.min_length || 1}
                  onChange={(e) => onUpdateConfig("min_length", parseInt(e.target.value))}
                  min="1"
                />
              </div>
              <div>
                <Label>최대 입력 길이</Label>
                <Input
                  type="number"
                  value={selectedNode.data.config.max_length || 20}
                  onChange={(e) => onUpdateConfig("max_length", parseInt(e.target.value))}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>입력 대기시간 (초)</Label>
                <Input
                  type="number"
                  value={selectedNode.data.config.timeout_seconds || 15}
                  onChange={(e) => onUpdateConfig("timeout_seconds", parseInt(e.target.value))}
                  min="5"
                  max="60"
                />
              </div>
              <div>
                <Label>최대 재시도 횟수</Label>
                <Input
                  type="number"
                  value={selectedNode.data.config.max_retries || 3}
                  onChange={(e) => onUpdateConfig("max_retries", parseInt(e.target.value))}
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <div>
              <Label>검증 패턴 (정규식)</Label>
              <Input
                value={selectedNode.data.config.validation_pattern || ""}
                onChange={(e) => onUpdateConfig("validation_pattern", e.target.value)}
                placeholder="예: ^(19|20)\\d{6}$ (생년월일용)"
              />
            </div>

            <div>
              <Label>DTMF 종료 문자</Label>
              <Select 
                value={selectedNode.data.config.dtmf_terminator || "#"} 
                onValueChange={(value) => onUpdateConfig("dtmf_terminator", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="#"># (우물정자)</SelectItem>
                  <SelectItem value="*">* (별표)</SelectItem>
                  <SelectItem value="">없음 (자동 종료)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* 외부 API 호출 노드 설정 (External API) */}
        {selectedNode.data.nodeType === "external_api" && (
          <>
            <Separator />
            <div>
              <Label>
                <Database className="h-4 w-4 inline mr-1" />
                API 호출 타입
              </Label>
              <Select 
                value={selectedNode.data.config.api_type || "host_system"} 
                onValueChange={(value) => onUpdateConfig("api_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="host_system">기간계 시스템 호출</SelectItem>
                  <SelectItem value="third_party">외부 API 호출</SelectItem>
                  <SelectItem value="database_query">직접 DB 조회</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>엔드포인트/전문명</Label>
              <Input
                value={selectedNode.data.config.endpoint_name || ""}
                onChange={(e) => onUpdateConfig("endpoint_name", e.target.value)}
                placeholder="예: LtrF020 (계약조회 전문)"
              />
            </div>

            {selectedNode.data.config.api_type === "host_system" && (
              <>
                <div>
                  <Label>기간계 시스템 ID</Label>
                  <Input
                    value={selectedNode.data.config.host_system_id || ""}
                    onChange={(e) => onUpdateConfig("host_system_id", e.target.value)}
                    placeholder="예: CORE_INSURANCE"
                  />
                </div>
                <div>
                  <Label>거래 코드</Label>
                  <Input
                    value={selectedNode.data.config.transaction_code || ""}
                    onChange={(e) => onUpdateConfig("transaction_code", e.target.value)}
                    placeholder="예: CONTRACT_INQUIRY"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>타임아웃 (초)</Label>
                <Input
                  type="number"
                  value={selectedNode.data.config.timeout_seconds || 30}
                  onChange={(e) => onUpdateConfig("timeout_seconds", parseInt(e.target.value))}
                  min="5"
                  max="300"
                />
              </div>
              <div>
                <Label>재시도 횟수</Label>
                <Input
                  type="number"
                  value={selectedNode.data.config.retry_count || 1}
                  onChange={(e) => onUpdateConfig("retry_count", parseInt(e.target.value))}
                  min="0"
                  max="5"
                />
              </div>
            </div>

            <div>
              <Label>요청 데이터 매핑 (JSON)</Label>
              <Textarea
                value={JSON.stringify(selectedNode.data.config.request_mapping || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    onUpdateConfig("request_mapping", parsed)
                  } catch {}
                }}
                placeholder={`{
  "birth_date": "{session.customer_birth_date}",
  "phone_number": "{caller_id}"
}`}
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label>응답 데이터 매핑 (JSON)</Label>
              <Textarea
                value={JSON.stringify(selectedNode.data.config.response_mapping || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    onUpdateConfig("response_mapping", parsed)
                  } catch {}
                }}
                placeholder={`{
  "contract_list": "session.customer_contracts",
  "customer_name": "session.customer_name"
}`}
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label>에러 처리 매핑 (JSON)</Label>
              <Textarea
                value={JSON.stringify(selectedNode.data.config.error_handling || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    onUpdateConfig("error_handling", parsed)
                  } catch {}
                }}
                placeholder={`{
  "E001": "no_contract_found",
  "E002": "system_error_flow",
  "timeout": "api_timeout_flow"
}`}
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </>
        )}

        {/* 상담사 연결 노드 설정 (Transfer) - 기존 + 개선 */}
        {selectedNode.data.nodeType === "transfer" && (
          <>
            <Separator />
            <div>
              <Label>
                <Phone className="h-4 w-4 inline mr-1" />
                연결 유형
              </Label>
              <Select 
                value={selectedNode.data.config.transfer_type || "agent"} 
                onValueChange={(value) => onUpdateConfig("transfer_type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">일반 상담사</SelectItem>
                  <SelectItem value="department">특정 부서</SelectItem>
                  <SelectItem value="external">외부 번호</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>연결 대상</Label>
              <Input
                value={selectedNode.data.config.destination || ""}
                onChange={(e) => onUpdateConfig("destination", e.target.value)}
                placeholder="내선번호, 부서코드 또는 외부번호"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>최대 대기시간 (초)</Label>
                <Input
                  type="number"
                  value={selectedNode.data.config.max_wait_time || 300}
                  onChange={(e) => onUpdateConfig("max_wait_time", parseInt(e.target.value))}
                  min="30"
                  max="1800"
                />
              </div>
              <div>
                <Label>우선순위 (1-10)</Label>
                <Input
                  type="number"
                  value={selectedNode.data.config.priority || 5}
                  onChange={(e) => onUpdateConfig("priority", parseInt(e.target.value))}
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <div>
              <Label>연결 전 안내 멘트</Label>
              <Textarea
                value={selectedNode.data.config.transfer_message || ""}
                onChange={(e) => onUpdateConfig("transfer_message", e.target.value)}
                placeholder="상담사 연결 전 안내 멘트"
                rows={2}
              />
            </div>

            <div>
              <Label>대기음악 파일</Label>
              <Input
                value={selectedNode.data.config.queue_music || ""}
                onChange={(e) => onUpdateConfig("queue_music", e.target.value)}
                placeholder="예: hold_music_01.wav"
              />
            </div>

            <div>
              <Label>대기시간 초과시 동작</Label>
              <Select 
                value={selectedNode.data.config.overflow_action || "voicemail"} 
                onValueChange={(value) => onUpdateConfig("overflow_action", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voicemail">음성사서함</SelectItem>
                  <SelectItem value="callback">콜백 예약</SelectItem>
                  <SelectItem value="redirect">다른 부서로 전환</SelectItem>
                  <SelectItem value="hangup">통화 종료</SelectItem>
                </SelectContent>
              </Select>
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