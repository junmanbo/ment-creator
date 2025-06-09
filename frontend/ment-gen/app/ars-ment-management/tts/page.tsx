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
import { useRouter } from "next/navigation"
import { 
  Plus, 
  Play, 
  Pause, 
  Mic, 
  Download,
  Loader2,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle
} from "lucide-react"

interface VoiceActor {
  id: string
  name: string
  gender: "male" | "female" | "neutral"
  age_range: "child" | "20s" | "30s" | "40s" | "50s" | "senior"
  is_active: boolean
}

interface TTSGeneration {
  id: string
  script_id: string
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  audio_file_path?: string
  quality_score?: number
  error_message?: string
  created_at: string
  script?: {
    text_content: string
  }
  voice_actor_name?: string
}

export default function TTSGenerationPage() {
  const router = useRouter()
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([])
  const [ttsGenerations, setTtsGenerations] = useState<TTSGeneration[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // TTS 생성 폼 상태
  const [ttsText, setTtsText] = useState("")
  const [selectedActorId, setSelectedActorId] = useState<string>("")
  const [isTtsGenerating, setIsTtsGenerating] = useState(false)
  
  // 오디오 재생 상태
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchVoiceActors()
    fetchTTSGenerations()
  }, [])

  const fetchVoiceActors = async () => {
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
      console.error("Fetch voice actors error:", error)
    }
  }

  const fetchTTSGenerations = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-generations?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setTtsGenerations(data)
      }
    } catch (error) {
      console.error("Fetch TTS generations error:", error)
    }
  }

  const generateTTS = async () => {
    if (!ttsText.trim() || !selectedActorId) {
      toast({
        title: "입력 오류",
        description: "텍스트와 성우를 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsTtsGenerating(true)
    
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
          text_content: ttsText,
          voice_actor_id: selectedActorId,
          voice_settings: {
            speed: 1.0,
            temperature: 0.7
          }
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
        
        // 성우 이름 추가
        const selectedActor = voiceActors.find(actor => actor.id === selectedActorId)
        const generationWithInfo = {
          ...generation,
          script: { text_content: ttsText },
          voice_actor_name: selectedActor?.name
        }
        
        setTtsGenerations([generationWithInfo, ...ttsGenerations])
        
        // 폼 리셋
        setTtsText("")
        setSelectedActorId("")
        
        toast({
          title: "TTS 생성 시작",
          description: "음성 생성이 시작되었습니다. 잠시 후 결과를 확인해주세요.",
        })

        // 생성 상태 폴링
        pollGenerationStatus(generation.id)
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
      setIsTtsGenerating(false)
    }
  }

  const pollGenerationStatus = async (generationId: string) => {
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
          
          // 상태 업데이트
          setTtsGenerations(prev => 
            prev.map(g => g.id === generationId ? { ...g, ...generation } : g)
          )

          if (generation.status === "completed") {
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
        console.error("Poll generation status error:", error)
      }
    }

    poll()
  }

  const playAudio = async (generationId: string) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-generations/${generationId}/audio`,
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
        
        setPlayingAudio(generationId)
        
        audio.addEventListener("ended", () => {
          setPlayingAudio(null)
          URL.revokeObjectURL(audioUrl)
        })
        
        audio.addEventListener("error", () => {
          setPlayingAudio(null)
          URL.revokeObjectURL(audioUrl)
          toast({
            title: "재생 오류",
            description: "오디오 파일을 재생할 수 없습니다.",
            variant: "destructive",
          })
        })
        
        await audio.play()
      } else {
        toast({
          title: "재생 오류",
          description: "오디오 파일을 찾을 수 없습니다.",
          variant: "destructive",
        })
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

  const downloadAudio = async (generationId: string, filename?: string) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-generations/${generationId}/audio`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        
        const link = document.createElement('a')
        link.href = audioUrl
        link.download = filename || `tts_${generationId}.wav`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        URL.revokeObjectURL(audioUrl)
        
        toast({
          title: "다운로드 시작",
          description: "음성 파일 다운로드가 시작되었습니다.",
        })
      } else {
        toast({
          title: "다운로드 오류",
          description: "오디오 파일을 찾을 수 없습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Download audio error:", error)
      toast({
        title: "다운로드 오류",
        description: "파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case "pending":
        return <Clock className="h-4 w-4 text-gray-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "processing":
        return "secondary"
      case "pending":
        return "outline"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "완료"
      case "processing":
        return "처리중"
      case "pending":
        return "대기중"
      case "failed":
        return "실패"
      case "cancelled":
        return "취소됨"
      default:
        return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="container mx-auto p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로
        </Button>
        <div>
          <h1 className="text-2xl font-bold">TTS 음성 생성</h1>
          <p className="text-gray-600">텍스트를 고품질 음성으로 변환합니다</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TTS 생성 폼 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              새 TTS 생성
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tts-text">생성할 텍스트</Label>
              <Textarea
                id="tts-text"
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="음성으로 변환할 텍스트를 입력하세요..."
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{ttsText.length}자</span>
                <span>권장: 500자 이하</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="voice-actor">성우 선택</Label>
              <Select value={selectedActorId} onValueChange={setSelectedActorId}>
                <SelectTrigger>
                  <SelectValue placeholder="성우를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {voiceActors.map((actor) => (
                    <SelectItem key={actor.id} value={actor.id}>
                      <div className="flex items-center gap-2">
                        <span>{actor.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {actor.gender === "male" ? "남성" : actor.gender === "female" ? "여성" : "중성"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {actor.age_range}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                onClick={generateTTS} 
                disabled={isTtsGenerating || !ttsText.trim() || !selectedActorId}
                className="w-full"
                size="lg"
              >
                {isTtsGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    TTS 생성하기
                  </>
                )}
              </Button>
            </div>
            
            {/* 생성 팁 */}
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <h4 className="font-medium text-blue-900 mb-1">💡 TTS 생성 팁</h4>
              <ul className="text-blue-800 space-y-1">
                <li>• 문장 부호를 적절히 사용하면 자연스러운 발음이 됩니다</li>
                <li>• 긴 문장보다는 짧은 문장으로 나누어 입력하세요</li>
                <li>• 숫자나 영어 단어는 한글로 읽는 법을 병기하면 좋습니다</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
        {/* TTS 생성 결과 */}
        <Card>
          <CardHeader>
            <CardTitle>생성 결과 ({ttsGenerations.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ttsGenerations.map((generation) => (
                <div key={generation.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(generation.status)}
                      <Badge variant={getStatusBadgeVariant(generation.status)}>
                        {getStatusText(generation.status)}
                      </Badge>
                      {generation.quality_score && (
                        <Badge variant="secondary" className="text-xs">
                          품질: {generation.quality_score.toFixed(1)}점
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(generation.created_at)}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {generation.script?.text_content || "텍스트 로드 중..."}
                    </p>
                    {generation.voice_actor_name && (
                      <p className="text-xs text-gray-600">
                        성우: {generation.voice_actor_name}
                      </p>
                    )}
                  </div>
                  
                  {generation.status === "completed" && generation.audio_file_path && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => playAudio(generation.id)}
                        disabled={playingAudio === generation.id}
                        className="flex-1"
                      >
                        {playingAudio === generation.id ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            정지
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            재생
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadAudio(generation.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {generation.status === "failed" && generation.error_message && (
                    <div className="bg-red-50 p-2 rounded text-sm text-red-600">
                      <strong>오류:</strong> {generation.error_message}
                    </div>
                  )}
                  
                  {(generation.status === "pending" || generation.status === "processing") && (
                    <div className="bg-blue-50 p-2 rounded text-sm text-blue-600">
                      음성 생성 중입니다. 잠시만 기다려주세요...
                    </div>
                  )}
                </div>
              ))}
              
              {ttsGenerations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Mic className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">생성된 TTS가 없습니다.</p>
                  <p className="text-xs mt-1">왼쪽 폼에서 새로운 음성을 생성해보세요.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
