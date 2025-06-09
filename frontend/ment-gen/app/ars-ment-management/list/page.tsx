"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Play, Pause, Volume2, Plus, Search, Filter, Eye, Edit, Trash2, Mic, AlertTriangle, CheckCircle, Server } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

interface VoiceActor {
  id: string
  name: string
  gender: string
  age_range: string
}

interface TTSGeneration {
  id: string
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  audio_file_path?: string
  quality_score?: number
  error_message?: string
  created_at: string
  completed_at?: string
}

interface TTSScript {
  id: string
  text_content: string
  voice_actor_id?: string
  voice_settings?: any
  created_at: string
  updated_at: string
  voice_actor_name?: string
  latest_generation?: TTSGeneration
}

interface AudioPlayerState {
  scriptId: string | null
  isPlaying: boolean
  isLoading: boolean
}

interface ApiDebugInfo {
  serverStatus: 'checking' | 'connected' | 'disconnected'
  lastError?: string
  requestCount: number
  lastResponseTime?: number
}

export default function MentListPage() {
  const [scripts, setScripts] = useState<TTSScript[]>([])
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVoiceActor, setSelectedVoiceActor] = useState<string>("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState("desc")
  const scriptsPerPage = 10
  const { toast } = useToast()

  // 디버깅 정보 상태
  const [debugInfo, setDebugInfo] = useState<ApiDebugInfo>({
    serverStatus: 'checking',
    requestCount: 0
  })
  const [showDebugInfo, setShowDebugInfo] = useState(false)

  // 오디오 플레이어 상태
  const [audioState, setAudioState] = useState<AudioPlayerState>({
    scriptId: null,
    isPlaying: false,
    isLoading: false,
  })

  useEffect(() => {
    checkServerStatus()
    fetchScripts()
    fetchVoiceActors()
  }, [currentPage, searchTerm, selectedVoiceActor, sortBy, sortOrder])

  // 서버 상태 확인
  const checkServerStatus = async () => {
    try {
      const startTime = Date.now()
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        setDebugInfo(prev => ({
          ...prev,
          serverStatus: 'connected',
          lastResponseTime: responseTime,
          lastError: undefined
        }))
      } else {
        setDebugInfo(prev => ({
          ...prev,
          serverStatus: 'disconnected',
          lastError: `HTTP ${response.status}: ${response.statusText}`
        }))
      }
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        serverStatus: 'disconnected',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  const fetchScripts = async () => {
    setIsLoading(true)
    const startTime = Date.now()
    
    try {
      const accessToken = localStorage.getItem("access_token")
      console.log("🔍 fetchScripts 시작")
      console.log("📍 API URL:", `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-scripts`)
      console.log("🔑 토큰 존재:", !!accessToken)
      
      if (!accessToken) {
        console.error("❌ 액세스 토큰이 없습니다")
        toast({
          title: "인증 오류",
          description: "로그인이 필요합니다.",
          variant: "destructive",
        })
        return
      }

      const params = new URLSearchParams({
        skip: ((currentPage - 1) * scriptsPerPage).toString(),
        limit: scriptsPerPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim())
      }

      if (selectedVoiceActor && selectedVoiceActor !== "all") {
        params.append("voice_actor_id", selectedVoiceActor)
      }

      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-scripts?${params}`
      console.log("🌐 요청 URL:", url)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      const responseTime = Date.now() - startTime
      console.log(`⏱️ 응답 시간: ${responseTime}ms`)
      console.log("📡 응답 상태:", response.status, response.statusText)

      // 디버그 정보 업데이트
      setDebugInfo(prev => ({
        ...prev,
        requestCount: prev.requestCount + 1,
        lastResponseTime: responseTime,
        serverStatus: response.ok ? 'connected' : 'disconnected'
      }))

      if (response.ok) {
        const data: TTSScript[] = await response.json()
        console.log("✅ 응답 데이터:", data)
        console.log("📊 스크립트 개수:", data.length)
        
        setScripts(data)
        
        if (data.length === 0) {
          console.log("ℹ️ TTS 스크립트가 없습니다. 샘플 데이터 생성을 제안합니다.")
          setShowDebugInfo(true)
        }
      } else {
        const errorText = await response.text()
        console.error("❌ API 응답 오류:", errorText)
        
        setDebugInfo(prev => ({
          ...prev,
          lastError: `HTTP ${response.status}: ${errorText}`
        }))

        if (response.status === 401) {
          toast({
            title: "인증 오류",
            description: "로그인이 필요하거나 만료되었습니다.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "데이터 로드 실패",
            description: `서버 오류 (${response.status}): TTS 스크립트 목록을 불러올 수 없습니다.`,
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      console.error("💥 fetchScripts 에러:", error)
      
      setDebugInfo(prev => ({
        ...prev,
        requestCount: prev.requestCount + 1,
        lastResponseTime: responseTime,
        serverStatus: 'disconnected',
        lastError: error instanceof Error ? error.message : 'Network error'
      }))

      toast({
        title: "네트워크 오류",
        description: `서버와의 연결에 문제가 있습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
      setShowDebugInfo(true)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchVoiceActors = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      if (!accessToken) return

      console.log("🎭 성우 목록 조회 시작")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data: VoiceActor[] = await response.json()
        console.log("✅ 성우 목록:", data)
        setVoiceActors(data)
      } else {
        console.error("❌ 성우 목록 조회 실패:", response.status)
      }
    } catch (error) {
      console.error("💥 fetchVoiceActors 에러:", error)
    }
  }

  // 샘플 데이터 생성
  const createSampleData = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      if (!accessToken) {
        toast({
          title: "인증 오류",
          description: "로그인이 필요합니다.",
          variant: "destructive",
        })
        return
      }

      console.log("🛠️ 샘플 데이터 생성 시작")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/create-sample-data`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log("✅ 샘플 데이터 생성 결과:", result)
        
        toast({
          title: "샘플 데이터 생성 완료",
          description: "페이지를 새로고침합니다.",
        })
        
        // 데이터 다시 로드
        setTimeout(() => {
          fetchScripts()
          fetchVoiceActors()
        }, 1000)
      } else {
        const errorText = await response.text()
        console.error("❌ 샘플 데이터 생성 실패:", errorText)
        toast({
          title: "샘플 데이터 생성 실패",
          description: "서버 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("💥 createSampleData 에러:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    }
  }

  // TTS 오디오 재생 함수
  const playTTSAudio = async (script: TTSScript) => {
    if (!script.latest_generation || script.latest_generation.status !== "completed") {
      toast({
        title: "재생 불가",
        description: "완료된 TTS 생성 결과가 없습니다.",
        variant: "destructive",
      })
      return
    }

    const generationId = script.latest_generation.id

    // 이미 재생 중인 스크립트인 경우
    if (script.id === audioState.scriptId) {
      if (audioState.isPlaying) {
        // 현재 재생 중이면 정지
        setAudioState({ scriptId: null, isPlaying: false, isLoading: false })
        return
      }
    }

    // 새로운 오디오 재생
    setAudioState({
      scriptId: script.id,
      isLoading: true,
      isPlaying: false,
    })

    try {
      const accessToken = localStorage.getItem("access_token")
      if (!accessToken) {
        toast({
          title: "인증 오류",
          description: "로그인이 필요합니다.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-generations/${generationId}/audio`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)

      audio.addEventListener("loadeddata", () => {
        setAudioState({
          scriptId: script.id,
          isLoading: false,
          isPlaying: true,
        })
        audio.play()
      })

      audio.addEventListener("ended", () => {
        setAudioState({
          scriptId: null,
          isLoading: false,
          isPlaying: false,
        })
        URL.revokeObjectURL(audioUrl)
      })

      audio.addEventListener("error", () => {
        setAudioState({
          scriptId: null,
          isLoading: false,
          isPlaying: false,
        })
        URL.revokeObjectURL(audioUrl)
        toast({
          title: "재생 오류",
          description: "오디오 재생 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      })
    } catch (error) {
      console.error("Audio playback error:", error)
      setAudioState({
        scriptId: null,
        isLoading: false,
        isPlaying: false,
      })
      toast({
        title: "오디오 로드 오류",
        description: "음성 파일을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // 스크립트 삭제
  const deleteScript = async (scriptId: string) => {
    if (!confirm("이 TTS 스크립트를 삭제하시겠습니까?")) return

    try {
      const accessToken = localStorage.getItem("access_token")
      if (!accessToken) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-scripts/${scriptId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        toast({
          title: "삭제 완료",
          description: "TTS 스크립트가 삭제되었습니다.",
        })
        fetchScripts()
      } else {
        toast({
          title: "삭제 실패",
          description: "스크립트 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete script error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    }
  }

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 텍스트 자르기 함수
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  // 상태 배지 색상
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

  // 상태 한글 표시
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

  return (
    <div className="container mx-auto p-4">
      {/* 서버 상태 표시 */}
      <div className="mb-4">
        <Alert className={debugInfo.serverStatus === 'connected' ? 'border-green-200 bg-green-50' : 
                       debugInfo.serverStatus === 'disconnected' ? 'border-red-200 bg-red-50' : 
                       'border-yellow-200 bg-yellow-50'}>
          <div className="flex items-center gap-2">
            {debugInfo.serverStatus === 'connected' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : debugInfo.serverStatus === 'disconnected' ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
            )}
            <AlertDescription>
              서버 상태: {debugInfo.serverStatus === 'connected' ? '연결됨' : 
                        debugInfo.serverStatus === 'disconnected' ? '연결 실패' : '확인 중...'}
              {debugInfo.lastResponseTime && ` (${debugInfo.lastResponseTime}ms)`}
              {debugInfo.lastError && ` - ${debugInfo.lastError}`}
            </AlertDescription>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="ml-auto"
            >
              <Server className="h-4 w-4 mr-2" />
              디버그 정보
            </Button>
          </div>
        </Alert>
      </div>

      {/* 디버그 정보 */}
      {showDebugInfo && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">🔧 디버그 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>API Base URL:</strong><br />
                {process.env.NEXT_PUBLIC_API_BASE_URL}
              </div>
              <div>
                <strong>요청 횟수:</strong><br />
                {debugInfo.requestCount}회
              </div>
              <div>
                <strong>마지막 응답 시간:</strong><br />
                {debugInfo.lastResponseTime ? `${debugInfo.lastResponseTime}ms` : '없음'}
              </div>
              <div>
                <strong>성우 수:</strong><br />
                {voiceActors.length}명
              </div>
            </div>
            {debugInfo.lastError && (
              <div className="mt-4 p-3 bg-red-100 rounded">
                <strong>마지막 오류:</strong><br />
                {debugInfo.lastError}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={checkServerStatus}>
                서버 상태 재확인
              </Button>
              <Button size="sm" onClick={createSampleData} variant="outline">
                샘플 데이터 생성
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">ARS 멘트 목록</h1>
          <p className="text-gray-600">등록된 TTS 스크립트와 생성된 음성 파일을 관리합니다</p>
        </div>
        <Link href="/ars-ment-management/tts">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            새 멘트 생성
          </Button>
        </Link>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="멘트 내용으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedVoiceActor} onValueChange={setSelectedVoiceActor}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="성우 선택" />
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
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">생성일</SelectItem>
              <SelectItem value="updated_at">수정일</SelectItem>
              <SelectItem value="text_content">내용</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">내림차순</SelectItem>
              <SelectItem value="asc">오름차순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 목록 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">멘트 목록을 불러오는 중...</span>
        </div>
      ) : scripts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Mic className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>등록된 TTS 스크립트가 없습니다.</p>
            <p className="text-sm">새로운 멘트를 생성하거나 샘플 데이터를 추가해보세요.</p>
          </div>
          <div className="flex justify-center gap-2">
            <Link href="/ars-ment-management/tts">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                첫 번째 멘트 생성하기
              </Button>
            </Link>
            <Button variant="outline" onClick={createSampleData}>
              <Server className="h-4 w-4 mr-2" />
              샘플 데이터 생성
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {scripts.map((script) => (
              <Card key={script.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {truncateText(script.text_content, 80)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        {script.voice_actor_name && (
                          <Badge variant="outline">{script.voice_actor_name}</Badge>
                        )}
                        {script.latest_generation && (
                          <Badge variant={getStatusBadgeVariant(script.latest_generation.status)}>
                            {getStatusText(script.latest_generation.status)}
                          </Badge>
                        )}
                        {script.latest_generation?.quality_score && (
                          <Badge variant="secondary">
                            품질: {script.latest_generation.quality_score.toFixed(1)}점
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{script.text_content}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>생성일: {formatDate(script.created_at)}</span>
                    <span>수정일: {formatDate(script.updated_at)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t pt-4">
                  <div className="flex gap-2">
                    {script.latest_generation?.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playTTSAudio(script)}
                        disabled={audioState.isLoading && audioState.scriptId === script.id}
                      >
                        {audioState.isLoading && audioState.scriptId === script.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            로딩 중...
                          </>
                        ) : audioState.isPlaying && audioState.scriptId === script.id ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            정지
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            재생
                          </>
                        )}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      상세보기
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      수정
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteScript(script.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* 페이지네이션 */}
          <div className="flex justify-between items-center">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              이전
            </Button>
            <span className="text-sm text-gray-600">페이지 {currentPage}</span>
            <Button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={scripts.length < scriptsPerPage}
              variant="outline"
            >
              다음
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
