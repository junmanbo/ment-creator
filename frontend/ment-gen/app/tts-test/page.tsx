"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Volume2,
  Mic,
  Settings,
  Info
} from "lucide-react"

interface VoiceActor {
  id: string
  name: string
  gender: string
  age_range: string
  is_active: boolean
}

interface TTSStatus {
  timestamp: string
  service_status: string
  tts_mode: string
  model_status: string
  gpu_status: string
  gpu_enabled: boolean
  directories: {
    audio_files: {
      path: string
      exists: boolean
      files_count: number
    }
    voice_samples: {
      path: string
      exists: boolean
      files_count: number
    }
  }
  recommendations: string[]
}

interface TestGeneration {
  message: string
  timestamp: string
  script_id: string
  generation_id: string
  text_content: string
  voice_actor_name?: string
  estimated_time: string
  status: string
}

interface GenerationStatus {
  id: string
  status: string
  audio_file_path?: string
  quality_score?: number
  duration?: number
  error_message?: string
  completed_at?: string
}

export default function TTSTestPage() {
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([])
  const [ttsStatus, setTtsStatus] = useState<TTSStatus | null>(null)
  const [testText, setTestText] = useState("안녕하세요. 이것은 TTS 테스트 음성입니다. 개선된 음성 품질을 확인해보세요.")
  const [selectedVoiceActor, setSelectedVoiceActor] = useState<string>("")
  const [currentGeneration, setCurrentGeneration] = useState<TestGeneration | null>(null)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [playingAudio, setPlayingAudio] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (isPolling && currentGeneration) {
      const pollInterval = setInterval(() => {
        checkGenerationStatus(currentGeneration.generation_id)
      }, 3000)
      
      return () => clearInterval(pollInterval)
    }
  }, [isPolling, currentGeneration])

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadVoiceActors(),
        loadTTSStatus()
      ])
    } catch (error) {
      console.error("Initial data load error:", error)
    }
  }

  const loadVoiceActors = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setVoiceActors(data.filter((actor: VoiceActor) => actor.is_active))
      }
    } catch (error) {
      console.error("Load voice actors error:", error)
    }
  }

  const loadTTSStatus = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-status`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTtsStatus(data)
      }
    } catch (error) {
      console.error("Load TTS status error:", error)
    }
  }

  const testTTSFunctionality = async () => {
    setIsLoading(true)
    
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/test-tts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.status === "success") {
        toast({
          title: "TTS 테스트 성공",
          description: `${data.test_result.mode} 모드로 테스트 완료`,
        })
      } else {
        toast({
          title: "TTS 테스트 실패",
          description: data.message || "테스트 중 오류가 발생했습니다",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("TTS functionality test error:", error)
      toast({
        title: "네트워크 오류",
        description: "TTS 테스트 중 오류가 발생했습니다",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateTestTTS = async () => {
    if (!testText.trim()) {
      toast({
        title: "입력 오류",
        description: "테스트할 텍스트를 입력해주세요",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setCurrentGeneration(null)
    setGenerationStatus(null)
    
    try {
      const accessToken = localStorage.getItem("access_token")
      const params = new URLSearchParams({
        test_text: testText,
      })
      
      if (selectedVoiceActor) {
        params.append("voice_actor_id", selectedVoiceActor)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/generate-test-tts?${params}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.status === "pending") {
        setCurrentGeneration(data)
        setIsPolling(true)
        
        toast({
          title: "TTS 생성 시작",
          description: `${data.estimated_time} 후 완료 예정`,
        })
      } else {
        toast({
          title: "TTS 생성 실패",
          description: data.message || "생성 요청 중 오류가 발생했습니다",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Generate test TTS error:", error)
      toast({
        title: "네트워크 오류",
        description: "TTS 생성 요청 중 오류가 발생했습니다",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkGenerationStatus = async (generationId: string) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-generations/${generationId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const status = await response.json()
        setGenerationStatus(status)
        
        if (status.status === "completed") {
          setIsPolling(false)
          toast({
            title: "TTS 생성 완료",
            description: `품질 점수: ${status.quality_score?.toFixed(1)}점`,
          })
        } else if (status.status === "failed") {
          setIsPolling(false)
          toast({
            title: "TTS 생성 실패",
            description: status.error_message || "생성 중 오류가 발생했습니다",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Check generation status error:", error)
    }
  }

  const playGeneratedAudio = async () => {
    if (!generationStatus?.audio_file_path) return

    try {
      setPlayingAudio(true)
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-generations/${generationStatus.id}/audio`,
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
        
        audio.addEventListener("ended", () => {
          setPlayingAudio(false)
          URL.revokeObjectURL(audioUrl)
        })
        
        await audio.play()
      }
    } catch (error) {
      console.error("Play audio error:", error)
      setPlayingAudio(false)
      toast({
        title: "재생 오류",
        description: "오디오 재생 중 오류가 발생했습니다",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "processing": return "bg-yellow-100 text-yellow-800"
      case "pending": return "bg-blue-100 text-blue-800"
      case "failed": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "processing": return <Loader2 className="h-4 w-4 animate-spin" />
      case "pending": return <Loader2 className="h-4 w-4 animate-spin" />
      case "failed": return <XCircle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">TTS 시스템 테스트</h1>
        <Button variant="outline" onClick={() => loadInitialData()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* TTS 서비스 상태 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            TTS 서비스 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ttsStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">서비스 상태</Label>
                  <Badge className={ttsStatus.service_status === "healthy" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {ttsStatus.service_status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">TTS 모드</Label>
                  <Badge className={ttsStatus.tts_mode === "Real TTS" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}>
                    {ttsStatus.tts_mode}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">GPU 상태</Label>
                  <Badge className={ttsStatus.gpu_status.includes("available") ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {ttsStatus.gpu_enabled ? "활성화" : "비활성화"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">오디오 파일</Label>
                  <Badge variant="outline">
                    {ttsStatus.directories.audio_files.files_count}개
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">권장사항</Label>
                <div className="space-y-1">
                  {ttsStatus.recommendations.map((rec, index) => (
                    <div key={index} className="text-sm p-2 bg-blue-50 rounded flex items-center">
                      <Info className="h-4 w-4 mr-2 text-blue-500" />
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              상태 확인 중...
            </div>
          )}
        </CardContent>
      </Card>

      {/* TTS 테스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 테스트 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mic className="h-5 w-5 mr-2" />
              TTS 테스트 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-text">테스트 텍스트</Label>
              <Textarea
                id="test-text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="TTS로 변환할 텍스트를 입력하세요..."
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="voice-actor">성우 선택 (선택사항)</Label>
              <Select value={selectedVoiceActor} onValueChange={setSelectedVoiceActor}>
                <SelectTrigger>
                  <SelectValue placeholder="기본 음성 또는 성우를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">기본 음성</SelectItem>
                  {voiceActors.map((actor) => (
                    <SelectItem key={actor.id} value={actor.id}>
                      {actor.name} ({actor.gender === "male" ? "남성" : actor.gender === "female" ? "여성" : "중성"}, {actor.age_range})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={testTTSFunctionality} 
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                기능 테스트
              </Button>
              
              <Button 
                onClick={generateTestTTS} 
                disabled={isLoading || !testText.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4 mr-2" />
                )}
                TTS 생성
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 테스트 결과 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Volume2 className="h-5 w-5 mr-2" />
              테스트 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentGeneration ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">생성 상태</span>
                    {generationStatus && (
                      <Badge className={getStatusBadgeColor(generationStatus.status)}>
                        <span className="flex items-center">
                          {getStatusIcon(generationStatus.status)}
                          <span className="ml-1">
                            {generationStatus.status === "pending" ? "대기중" :
                             generationStatus.status === "processing" ? "처리중" :
                             generationStatus.status === "completed" ? "완료" :
                             generationStatus.status === "failed" ? "실패" : "알 수 없음"}
                          </span>
                        </span>
                      </Badge>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>텍스트:</strong> {currentGeneration.text_content.substring(0, 100)}
                      {currentGeneration.text_content.length > 100 && "..."}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>성우:</strong> {currentGeneration.voice_actor_name || "기본 음성"}
                    </p>
                  </div>
                </div>
                
                {generationStatus && generationStatus.status === "completed" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">품질 점수:</span>
                        <span className="ml-2 font-medium">{generationStatus.quality_score?.toFixed(1)}점</span>
                      </div>
                      <div>
                        <span className="text-gray-500">길이:</span>
                        <span className="ml-2 font-medium">{generationStatus.duration?.toFixed(1)}초</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={playGeneratedAudio}
                      disabled={playingAudio}
                      className="w-full"
                    >
                      {playingAudio ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          재생 중...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          음성 재생
                        </>
                      )}
                    </Button>
                  </div>
                )}
                
                {generationStatus && generationStatus.status === "failed" && (
                  <div className="bg-red-50 p-3 rounded">
                    <div className="flex items-center text-red-800">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      생성 실패
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      {generationStatus.error_message || "알 수 없는 오류가 발생했습니다"}
                    </p>
                  </div>
                )}
                
                {isPolling && generationStatus?.status !== "completed" && generationStatus?.status !== "failed" && (
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="flex items-center text-blue-800">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      TTS 생성 중... ({currentGeneration.estimated_time})
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      생성이 완료되면 자동으로 업데이트됩니다
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>TTS 생성 버튼을 클릭하여 테스트를 시작하세요</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
