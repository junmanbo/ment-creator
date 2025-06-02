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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { 
  Plus, 
  Play, 
  Pause, 
  Upload, 
  Mic, 
  Settings, 
  User,
  Volume2,
  Download,
  Loader2
} from "lucide-react"

interface VoiceActor {
  id: string
  name: string
  gender: "male" | "female" | "neutral"
  age_range: "child" | "20s" | "30s" | "40s" | "50s" | "senior"
  language: string
  description?: string
  characteristics?: {
    tone?: string
    style?: string
    specialty?: string
  }
  is_active: boolean
  sample_audio_url?: string
  created_at: string
  updated_at: string
}

interface VoiceSample {
  id: string
  voice_actor_id: string
  text_content: string
  duration?: number
  created_at: string
}

interface TTSGeneration {
  id: string
  script_id: string
  status: "pending" | "processing" | "completed" | "failed" | "cancelled"
  audio_file_path?: string
  quality_score?: number
  error_message?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

export default function VoiceActorsPage() {
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([])
  const [selectedActor, setSelectedActor] = useState<VoiceActor | null>(null)
  const [voiceSamples, setVoiceSamples] = useState<VoiceSample[]>([])
  const [ttsGenerations, setTtsGenerations] = useState<TTSGeneration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("actors")
  
  // 새 성우 등록 상태
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newActor, setNewActor] = useState({
    name: "",
    gender: "female" as const,
    age_range: "30s" as const,
    language: "ko",
    description: "",
    characteristics: {
      tone: "",
      style: "",
      specialty: ""
    }
  })
  
  // TTS 생성 상태
  const [ttsText, setTtsText] = useState("")
  const [selectedActorForTts, setSelectedActorForTts] = useState<string>("")
  const [isTtsGenerating, setIsTtsGenerating] = useState(false)
  
  // 오디오 재생 상태
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchVoiceActors()
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
        setVoiceActors(data)
      } else {
        toast({
          title: "데이터 로드 실패",
          description: "성우 목록을 불러오는데 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Fetch voice actors error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchVoiceSamples = async (actorId: string) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/${actorId}/samples`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setVoiceSamples(data)
      }
    } catch (error) {
      console.error("Fetch voice samples error:", error)
    }
  }

  const createVoiceActor = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newActor),
      })

      if (response.ok) {
        const createdActor = await response.json()
        setVoiceActors([...voiceActors, createdActor])
        setIsCreateDialogOpen(false)
        setNewActor({
          name: "",
          gender: "female",
          age_range: "30s",
          language: "ko",
          description: "",
          characteristics: {
            tone: "",
            style: "",
            specialty: ""
          }
        })
        toast({
          title: "성우 등록 성공",
          description: "새로운 성우가 등록되었습니다.",
        })
      } else {
        toast({
          title: "등록 실패",
          description: "성우 등록 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Create voice actor error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    }
  }

  const generateTTS = async () => {
    if (!ttsText.trim() || !selectedActorForTts) {
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
          voice_actor_id: selectedActorForTts,
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
        setTtsGenerations([generation, ...ttsGenerations])
        
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

  const playAudio = async (audioId: string, audioType: "sample" | "generation") => {
    try {
      const accessToken = localStorage.getItem("access_token")
      let url = ""
      
      if (audioType === "sample") {
        url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/${selectedActor?.id}/samples/${audioId}/audio`
      } else {
        url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-generations/${audioId}/audio`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)
        
        setPlayingAudio(audioId)
        
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

  const getGenderBadgeColor = (gender: string) => {
    switch (gender) {
      case "male": return "bg-blue-100 text-blue-800"
      case "female": return "bg-pink-100 text-pink-800"
      default: return "bg-gray-100 text-gray-800"
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">성우 목록을 불러오는 중...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">성우 및 음성 관리</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 성우 등록
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>새 성우 등록</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">성우명</Label>
                <Input
                  id="name"
                  value={newActor.name}
                  onChange={(e) => setNewActor({...newActor, name: e.target.value})}
                  placeholder="성우 이름을 입력하세요"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">성별</Label>
                  <Select 
                    value={newActor.gender} 
                    onValueChange={(value: any) => setNewActor({...newActor, gender: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">여성</SelectItem>
                      <SelectItem value="male">남성</SelectItem>
                      <SelectItem value="neutral">중성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="age_range">연령대</Label>
                  <Select 
                    value={newActor.age_range} 
                    onValueChange={(value: any) => setNewActor({...newActor, age_range: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child">아동</SelectItem>
                      <SelectItem value="20s">20대</SelectItem>
                      <SelectItem value="30s">30대</SelectItem>
                      <SelectItem value="40s">40대</SelectItem>
                      <SelectItem value="50s">50대</SelectItem>
                      <SelectItem value="senior">시니어</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={newActor.description}
                  onChange={(e) => setNewActor({...newActor, description: e.target.value})}
                  placeholder="성우에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={createVoiceActor}>등록</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="actors">성우 관리</TabsTrigger>
          <TabsTrigger value="tts">TTS 생성</TabsTrigger>
          <TabsTrigger value="library">음성 라이브러리</TabsTrigger>
        </TabsList>

        <TabsContent value="actors">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {voiceActors.map((actor) => (
              <Card key={actor.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                    onClick={() => {
                      setSelectedActor(actor)
                      fetchVoiceSamples(actor.id)
                    }}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{actor.name}</CardTitle>
                    <div className="flex space-x-1">
                      <Badge className={getGenderBadgeColor(actor.gender)}>
                        {actor.gender === "male" ? "남성" : actor.gender === "female" ? "여성" : "중성"}
                      </Badge>
                      <Badge variant="outline">{actor.age_range}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">{actor.description}</p>
                  {actor.characteristics && (
                    <div className="space-y-1">
                      {actor.characteristics.tone && (
                        <p className="text-xs"><strong>톤:</strong> {actor.characteristics.tone}</p>
                      )}
                      {actor.characteristics.style && (
                        <p className="text-xs"><strong>스타일:</strong> {actor.characteristics.style}</p>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <div className="flex justify-between items-center w-full">
                    <Badge variant={actor.is_active ? "default" : "secondary"}>
                      {actor.is_active ? "활성" : "비활성"}
                    </Badge>
                    {actor.sample_audio_url && (
                      <Button size="sm" variant="outline">
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* 선택된 성우 상세 정보 */}
          {selectedActor && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{selectedActor.name} 상세 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">음성 샘플</h4>
                    <div className="space-y-2">
                      {voiceSamples.map((sample) => (
                        <div key={sample.id} className="flex justify-between items-center p-2 border rounded">
                          <div className="flex-1">
                            <p className="text-sm">{sample.text_content.substring(0, 50)}...</p>
                            <p className="text-xs text-gray-500">
                              {sample.duration ? `${sample.duration.toFixed(1)}초` : ""} • 
                              {new Date(sample.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => playAudio(sample.id, "sample")}
                            disabled={playingAudio === sample.id}
                          >
                            {playingAudio === sample.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                      {voiceSamples.length === 0 && (
                        <p className="text-sm text-gray-500">등록된 음성 샘플이 없습니다.</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">음성 샘플 업로드</h4>
                    <div className="space-y-2">
                      <Input placeholder="샘플 텍스트 내용" />
                      <Input type="file" accept="audio/*" />
                      <Button size="sm" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        샘플 업로드
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* TTS 생성 폼 */}
            <Card>
              <CardHeader>
                <CardTitle>새 TTS 생성</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tts-text">생성할 텍스트</Label>
                  <Textarea
                    id="tts-text"
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="음성으로 변환할 텍스트를 입력하세요..."
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="voice-actor">성우 선택</Label>
                  <Select value={selectedActorForTts} onValueChange={setSelectedActorForTts}>
                    <SelectTrigger>
                      <SelectValue placeholder="성우를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceActors.filter(actor => actor.is_active).map((actor) => (
                        <SelectItem key={actor.id} value={actor.id}>
                          {actor.name} ({actor.gender === "male" ? "남성" : actor.gender === "female" ? "여성" : "중성"}, {actor.age_range})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={generateTTS} 
                  disabled={isTtsGenerating || !ttsText.trim() || !selectedActorForTts}
                  className="w-full"
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
              </CardContent>
            </Card>
            
            {/* TTS 생성 결과 */}
            <Card>
              <CardHeader>
                <CardTitle>생성 결과</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ttsGenerations.map((generation) => (
                    <div key={generation.id} className="p-3 border rounded">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className={getStatusBadgeColor(generation.status)}>
                          {generation.status === "pending" ? "대기중" :
                           generation.status === "processing" ? "처리중" :
                           generation.status === "completed" ? "완료" :
                           generation.status === "failed" ? "실패" : "취소됨"}
                        </Badge>
                        {generation.quality_score && (
                          <span className="text-sm text-gray-500">
                            품질: {generation.quality_score.toFixed(1)}점
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        생성일: {new Date(generation.created_at).toLocaleString()}
                      </p>
                      
                      {generation.status === "completed" && generation.audio_file_path && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => playAudio(generation.id, "generation")}
                            disabled={playingAudio === generation.id}
                          >
                            {playingAudio === generation.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {generation.status === "failed" && generation.error_message && (
                        <p className="text-sm text-red-600">
                          오류: {generation.error_message}
                        </p>
                      )}
                    </div>
                  ))}
                  
                  {ttsGenerations.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      생성된 TTS가 없습니다.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="library">
          <Card>
            <CardHeader>
              <CardTitle>음성 라이브러리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                재사용 가능한 공통 멘트 라이브러리 기능을 준비 중입니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
