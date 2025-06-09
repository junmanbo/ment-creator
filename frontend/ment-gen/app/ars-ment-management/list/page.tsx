"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Play, Pause, Volume2, Plus, Search, Filter, Eye, Edit, Trash2, Mic } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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

  // 오디오 플레이어 상태
  const [audioState, setAudioState] = useState<AudioPlayerState>({
    scriptId: null,
    isPlaying: false,
    isLoading: false,
  })

  useEffect(() => {
    fetchScripts()
    fetchVoiceActors()
  }, [currentPage, searchTerm, selectedVoiceActor, sortBy, sortOrder])

  const fetchScripts = async () => {
    setIsLoading(true)
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-scripts?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data: TTSScript[] = await response.json()
        setScripts(data)
      } else {
        if (response.status === 401) {
          toast({
            title: "인증 오류",
            description: "로그인이 필요하거나 만료되었습니다.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "데이터 로드 실패",
            description: "TTS 스크립트 목록을 불러오는데 실패했습니다.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Fetch scripts error:", error)
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
      if (!accessToken) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data: VoiceActor[] = await response.json()
        setVoiceActors(data)
      }
    } catch (error) {
      console.error("Fetch voice actors error:", error)
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
            <p className="text-sm">새로운 멘트를 생성해보세요.</p>
          </div>
          <Link href="/ars-ment-management/tts">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              첫 번째 멘트 생성하기
            </Button>
          </Link>
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
