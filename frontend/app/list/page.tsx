"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Play, Pause, Volume2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Slider } from "@/components/ui/slider"

interface Ment {
  id: string
  title: string
  sub_title: string
  content: string
  file_path: string
  modified_dt: string
}

interface AudioPlayerState {
  mentId: string | null
  isPlaying: boolean
  isLoading: boolean
  duration: number
  currentTime: number
  volume: number
}

export default function MentListPage() {
  const [ments, setMents] = useState<Ment[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const mentsPerPage = 5
  const { toast } = useToast()

  // 오디오 플레이어 상태
  const [audioState, setAudioState] = useState<AudioPlayerState>({
    mentId: null,
    isPlaying: false,
    isLoading: false,
    duration: 0,
    currentTime: 0,
    volume: 0.7,
  })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  useEffect(() => {
    const fetchMents = async () => {
      setIsLoading(true)
      try {
        const accessToken = localStorage.getItem("access_token")
        const headers: HeadersInit = {}

        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ments`, {
          headers,
        })

        if (response.ok) {
          const data: Ment[] = await response.json()
          setMents(data)
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
              description: "멘트 목록을 불러오는데 실패했습니다.",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error("Fetch ments error:", error)
        toast({
          title: "데이터 로드 오류",
          description: "서버와의 통신 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMents()

    // 오디오 요소 생성
    audioRef.current = new Audio()

    // 오디오 이벤트 리스너 설정
    const audio = audioRef.current

    const handleTimeUpdate = () => {
      if (audio) {
        setAudioState((prev) => ({
          ...prev,
          currentTime: audio.currentTime,
        }))
      }
    }

    const handleLoadedMetadata = () => {
      if (audio) {
        setAudioState((prev) => ({
          ...prev,
          duration: audio.duration,
          isLoading: false,
          isPlaying: true,
        }))
        audio.play()
      }
    }

    const handleEnded = () => {
      setAudioState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }))
    }

    const handleError = (e: ErrorEvent) => {
      console.error("Audio playback error:", e)
      setAudioState((prev) => ({
        ...prev,
        isLoading: false,
        isPlaying: false,
      }))
      toast({
        title: "오디오 재생 오류",
        description: "멘트 음성을 재생하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError as EventListener)

    return () => {
      // 컴포넌트 언마운트 시 오디오 정리
      audio.pause()
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError as EventListener)

      // Blob URL 정리
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [toast])

  // 볼륨 변경 처리
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioState.volume
    }
  }, [audioState.volume])

  // 멘트 오디오 재생 함수
  const playMentAudio = async (mentId: string) => {
    // 이미 재생 중인 멘트인 경우 일시 정지/재생 토글
    if (mentId === audioState.mentId) {
      if (audioState.isPlaying) {
        audioRef.current?.pause()
        setAudioState((prev) => ({ ...prev, isPlaying: false }))
      } else {
        audioRef.current?.play()
        setAudioState((prev) => ({ ...prev, isPlaying: true }))
      }
      return
    }

    // 새로운 멘트 재생
    setAudioState((prev) => ({
      ...prev,
      mentId,
      isLoading: true,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    }))

    try {
      // 기존 Blob URL 정리
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
        audioUrlRef.current = null
      }

      const accessToken = localStorage.getItem("access_token")

      if (!accessToken) {
        toast({
          title: "인증 오류",
          description: "로그인이 필요합니다.",
          variant: "destructive",
        })
        setAudioState((prev) => ({
          ...prev,
          isLoading: false,
        }))
        return
      }

      // fetch API를 사용하여 오디오 데이터 가져오기 (Authorization 헤더 포함)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ments/${mentId}/audio`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 응답 데이터를 Blob으로 변환
      const audioBlob = await response.blob()

      // Blob에서 URL 생성
      const audioUrl = URL.createObjectURL(audioBlob)
      audioUrlRef.current = audioUrl

      // 오디오 요소에 URL 설정 및 재생
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = audioUrl
        audioRef.current.load()
      }
    } catch (error) {
      console.error("Audio fetch error:", error)
      setAudioState((prev) => ({
        ...prev,
        isLoading: false,
        isPlaying: false,
      }))
      toast({
        title: "오디오 로드 오류",
        description: "멘트 음성을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // 시간 포맷 함수
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // 현재 페이지의 멘트만 선택
  const currentMents = ments.slice((currentPage - 1) * mentsPerPage, currentPage * mentsPerPage)

  const totalPages = Math.ceil(ments.length / mentsPerPage)

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">멘트 목록</h1>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">멘트 목록을 불러오는 중...</span>
        </div>
      ) : ments.length === 0 ? (
        <div className="text-center py-12">
          <p>등록된 멘트가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {currentMents.map((ment) => (
              <Card key={ment.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{ment.title}</CardTitle>
                  <CardDescription>{ment.sub_title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{ment.content}</p>
                  <div className="text-sm text-muted-foreground">작성일: {formatDate(ment.modified_dt)}</div>
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => playMentAudio(ment.id)}
                    disabled={audioState.isLoading && audioState.mentId === ment.id}
                  >
                    {audioState.isLoading && audioState.mentId === ment.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        로딩 중...
                      </>
                    ) : audioState.isPlaying && audioState.mentId === ment.id ? (
                      <>
                        <Pause className="h-4 w-4" />
                        일시정지
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        멘트 듣기
                      </>
                    )}
                  </Button>

                  {audioState.mentId === ment.id && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(audioState.currentTime)} / {formatTime(audioState.duration || 0)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <Slider
                          className="w-20"
                          value={[audioState.volume * 100]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(value) => {
                            setAudioState((prev) => ({ ...prev, volume: value[0] / 100 }))
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="outline"
              >
                이전
              </Button>
              <span>
                페이지 {currentPage} / {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                variant="outline"
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
