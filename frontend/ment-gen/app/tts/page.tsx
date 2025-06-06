"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Plus, 
  Play, 
  Pause, 
  Download, 
  Search,
  Loader2,
  Mic,
  Volume2,
  RefreshCw,
  Trash2,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react"

interface VoiceActor {
  id: string
  name: string
  gender: string
  age_range: string
  language: string
  is_active: boolean
}

interface TTSScript {
  id: string
  text_content: string
  voice_actor_id?: string
  voice_settings?: {
    speed?: number
    tone?: string
    emotion?: string
  }
  created_at: string
  updated_at: string
}

interface TTSGeneration {
  id: string
  script_id: string
  voice_model_id?: string
  audio_file_path?: string
  file_size?: number
  duration?: number
  quality_score?: number
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  error_message?: string
  requested_by: string
  started_at?: string
  completed_at?: string
  created_at: string
}

interface NewTTSRequest {
  text_content: string
  voice_actor_id: string
  voice_settings: {
    speed: number
    tone: string
    emotion: string
  }
}

export default function TTSManagementPage() {
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([])
  const [ttsGenerations, setTtsGenerations] = useState<TTSGeneration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("manage")
  
  // 새 TTS 생성 상태
  const [newTTS, setNewTTS] = useState<NewTTSRequest>({
    text_content: "",
    voice_actor_id: "",
    voice_settings: {
      speed: 1.0,
      tone: "친근",
      emotion: "밝음"
    }
  })
  const [isGenerating, setIsGenerating] = useState(false)
  
  // 필터링 및 검색 상태
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [voiceActorFilter, setVoiceActorFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  
  // 오디오 재생 상태
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchTTSGenerations()
  }, [statusFilter, voiceActorFilter, searchTerm, sortBy, sortOrder])

  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchVoiceActors(),
        fetchTTSGenerations()
      ])
    } catch (error) {
      console.error("Initial data fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchVoiceActors = async () => {
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
      console.error("Fetch voice actors error:", error)
    }
  }

  const fetchTTSGenerations = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const params = new URLSearchParams()
      
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (voiceActorFilter !== "all") params.append("voice_actor_id", voiceActorFilter)
      if (searchTerm.trim()) params.append("search", searchTerm.trim())
      params.append("sort_by", sortBy)
      params.append("sort_order", sortOrder)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/tts-generations?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setTtsGenerations(data)
      } else {
        toast({
          title: "데이터 로드 실패",
          description: "TTS 생성 목록을 불러오는데 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Fetch TTS generations error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    }
  }

  const generateTTS = async () => {
    if (!newTTS.text_content.trim() || !newTTS.voice_actor_id) {
      toast({
        title: "입력 오류",
        description: "텍스트와 성우를 모두 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    
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
          text_content: newTTS.text_content,
          voice_actor_id: newTTS.voice_actor_id,
          voice_settings: newTTS.voice_settings
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
              quality: "high",
              format: "wav"
            }
          }),
        }
      )

      if (generateResponse.ok) {
        const generation = await generateResponse.json()
        setTtsGenerations([generation, ...ttsGenerations])
        
        // 폼 초기화
        setNewTTS({
          text_content: "",
          voice_actor_id: "",
          voice_settings: {
            speed: 1.0,
            tone: "친근",
            emotion: "밝음"
          }
        })
        
        toast({
          title: "TTS 생성 시작",
          description: "음성 생성이 시작되었습니다. 잠시 후 결과를 확인해주세요.",
        })

        // 생성 상태 폴링
        pollGenerationStatus(generation.id)
        
        // 관리 탭으로 전환
        setActiveTab("manage")
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
      setIsGenerating(false)
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
            prev.map(g => g.id === generationId ? generation : g)
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

  const downloadAudio = async (generationId: string, fileName: string) => {
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
        const url = URL.createObjectURL(audioBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName || `tts_${generationId}.wav`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast({
          title: "다운로드 시작",
          description: "음성 파일 다운로드가 시작되었습니다.",
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

  const deleteGeneration = async (generationId: string) => {
    if (!confirm("이 TTS 생성 결과를 삭제하시겠습니까?")) {
      return
    }

    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-generations/${generationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        setTtsGenerations(prev => prev.filter(g => g.id !== generationId))
        toast({
          title: "삭제 완료",
          description: "TTS 생성 결과가 삭제되었습니다.",
        })
      }
    } catch (error) {
      console.error("Delete generation error:", error)
      toast({
        title: "삭제 실패",
        description: "삭제 중 오류가 발생했습니다.",
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
      case "cancelled": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "대기중"
      case "processing": return "처리중"
      case "completed": return "완료"
      case "failed": return "실패"
      case "cancelled": return "취소됨"
      default: return status
    }
  }

  const getVoiceActorName = (actorId: string) => {
    const actor = voiceActors.find(a => a.id === actorId)
    return actor ? actor.name : "알 수 없음"
  }

  const filteredGenerations = ttsGenerations.filter(generation => {
    let matches = true
    
    if (searchTerm.trim()) {
      // TTS 스크립트 내용으로 검색 (향후 스크립트 데이터 조인 필요)
      matches = false // 임시로 false, 실제로는 스크립트 내용 검색 로직 필요
    }
    
    return matches
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">TTS 관리 페이지를 불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">TTS 음성 관리</h1>
          <p className="text-muted-foreground mt-1">
            텍스트를 음성으로 변환하고 관리합니다
          </p>
        </div>
        <Button variant="outline" onClick={fetchTTSGenerations} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="manage">TTS 관리</TabsTrigger>
          <TabsTrigger value="generate">새 TTS 생성</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mic className="h-5 w-5 mr-2" />
                새 TTS 생성
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tts-text">생성할 텍스트 *</Label>
                <Textarea
                  id="tts-text"
                  value={newTTS.text_content}
                  onChange={(e) => setNewTTS({...newTTS, text_content: e.target.value})}
                  placeholder="음성으로 변환할 텍스트를 입력하세요..."
                  rows={6}
                  className="mt-1"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {newTTS.text_content.length} / 1000자
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="voice-actor">성우 선택 *</Label>
                  <Select value={newTTS.voice_actor_id} onValueChange={(value) => setNewTTS({...newTTS, voice_actor_id: value})}>
                    <SelectTrigger className="mt-1">
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

                <div>
                  <Label htmlFor="speed">음성 속도</Label>
                  <Select 
                    value={newTTS.voice_settings.speed.toString()} 
                    onValueChange={(value) => setNewTTS({
                      ...newTTS, 
                      voice_settings: {...newTTS.voice_settings, speed: parseFloat(value)}
                    })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.8">느림 (0.8x)</SelectItem>
                      <SelectItem value="1.0">보통 (1.0x)</SelectItem>
                      <SelectItem value="1.2">빠름 (1.2x)</SelectItem>
                      <SelectItem value="1.5">매우 빠름 (1.5x)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tone">음성 톤</Label>
                  <Select 
                    value={newTTS.voice_settings.tone} 
                    onValueChange={(value) => setNewTTS({
                      ...newTTS, 
                      voice_settings: {...newTTS.voice_settings, tone: value}
                    })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="친근">친근함</SelectItem>
                      <SelectItem value="차분">차분함</SelectItem>
                      <SelectItem value="활발">활발함</SelectItem>
                      <SelectItem value="신뢰">신뢰감</SelectItem>
                      <SelectItem value="따뜻">따뜻함</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="emotion">감정</Label>
                  <Select 
                    value={newTTS.voice_settings.emotion} 
                    onValueChange={(value) => setNewTTS({
                      ...newTTS, 
                      voice_settings: {...newTTS.voice_settings, emotion: value}
                    })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="밝음">밝음</SelectItem>
                      <SelectItem value="중성">중성</SelectItem>
                      <SelectItem value="진지">진지함</SelectItem>
                      <SelectItem value="유쾌">유쾌함</SelectItem>
                      <SelectItem value="안정">안정감</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={generateTTS} 
                disabled={isGenerating || !newTTS.text_content.trim() || !newTTS.voice_actor_id}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
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
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          {/* 필터 및 검색 섹션 */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="텍스트 내용으로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button variant="outline" onClick={fetchTTSGenerations}>
                    <Filter className="h-4 w-4 mr-2" />
                    적용
                  </Button>
                </div>
                
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">상태:</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="pending">대기중</SelectItem>
                        <SelectItem value="processing">처리중</SelectItem>
                        <SelectItem value="completed">완료</SelectItem>
                        <SelectItem value="failed">실패</SelectItem>
                        <SelectItem value="cancelled">취소됨</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">성우:</Label>
                    <Select value={voiceActorFilter} onValueChange={setVoiceActorFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="성우 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {voiceActors.map((actor) => (
                          <SelectItem key={actor.id} value={actor.id}>
                            {actor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">정렬:</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">생성일</SelectItem>
                        <SelectItem value="quality_score">품질</SelectItem>
                        <SelectItem value="duration">길이</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
                      {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TTS 생성 결과 테이블 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Volume2 className="h-5 w-5 mr-2" />
                  TTS 생성 결과 ({filteredGenerations.length}개)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredGenerations.length === 0 ? (
                <div className="text-center py-12">
                  <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg text-muted-foreground">생성된 TTS가 없습니다</p>
                  <p className="text-sm text-muted-foreground">새 TTS 생성 탭에서 음성을 생성해보세요.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>텍스트 내용</TableHead>
                      <TableHead>성우</TableHead>
                      <TableHead>품질</TableHead>
                      <TableHead>크기</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGenerations.map((generation) => (
                      <TableRow key={generation.id}>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="text-sm truncate">
                              {/* 실제로는 스크립트 데이터를 조인해야 함 */}
                              텍스트 내용을 표시하려면 스크립트 데이터가 필요합니다
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {/* 성우 정보 표시 */}
                            성우 정보
                          </div>
                        </TableCell>
                        <TableCell>
                          {generation.quality_score ? (
                            <Badge variant="outline">
                              {generation.quality_score.toFixed(1)}점
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {generation.file_size ? (
                            <span className="text-sm">
                              {(generation.file_size / 1024 / 1024).toFixed(1)}MB
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(generation.created_at).toLocaleDateString('ko-KR')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(generation.created_at).toLocaleTimeString('ko-KR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(generation.status)}>
                            {getStatusLabel(generation.status)}
                          </Badge>
                          {generation.status === "failed" && generation.error_message && (
                            <div className="text-xs text-red-600 mt-1">
                              {generation.error_message}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {generation.status === "completed" && generation.audio_file_path && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => playAudio(generation.id)}
                                  disabled={playingAudio === generation.id}
                                >
                                  {playingAudio === generation.id ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadAudio(generation.id, `tts_${generation.id}.wav`)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteGeneration(generation.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
