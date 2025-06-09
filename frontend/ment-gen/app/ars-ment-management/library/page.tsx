"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { 
  Plus, 
  Play, 
  Pause, 
  Download,
  Loader2,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  BookOpen,
  Archive,
  Star,
  Copy,
  Share
} from "lucide-react"

interface VoiceActor {
  id: string
  name: string
}

interface TTSLibraryItem {
  id: string
  name: string
  text_content: string
  category?: string
  tags?: string
  voice_actor_id?: string
  audio_file_path?: string
  usage_count: number
  is_public: boolean
  created_at: string
  updated_at: string
}

export default function TTSLibraryPage() {
  const [libraryItems, setLibraryItems] = useState<TTSLibraryItem[]>([])
  const [voiceActors, setVoiceActors] = useState<VoiceActor[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [isPublicFilter, setIsPublicFilter] = useState<string>("")
  
  // 새 라이브러리 아이템 생성 상태
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    name: "",
    text_content: "",
    category: "",
    tags: "",
    voice_actor_id: "",
    is_public: false
  })
  const [isCreating, setIsCreating] = useState(false)
  
  // 오디오 재생 상태
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchLibraryItems()
    fetchVoiceActors()
    fetchCategories()
  }, [searchTerm, selectedCategory, isPublicFilter])

  const fetchLibraryItems = async () => {
    setIsLoading(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const params = new URLSearchParams({
        limit: "50"
      })

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim())
      }

      if (selectedCategory) {
        params.append("category", selectedCategory)
      }

      if (isPublicFilter !== "") {
        params.append("is_public", isPublicFilter)
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-library?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setLibraryItems(data)
      } else {
        toast({
          title: "데이터 로드 실패",
          description: "라이브러리 목록을 불러오는데 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Fetch library items error:", error)
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setVoiceActors(data.filter((actor: any) => actor.is_active))
      }
    } catch (error) {
      console.error("Fetch voice actors error:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-library/categories`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Fetch categories error:", error)
    }
  }

  const createLibraryItem = async () => {
    if (!newItem.name.trim() || !newItem.text_content.trim()) {
      toast({
        title: "입력 오류",
        description: "이름과 텍스트 내용은 필수입니다.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-library`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...newItem,
            voice_actor_id: newItem.voice_actor_id || null
          }),
        }
      )

      if (response.ok) {
        const createdItem = await response.json()
        setLibraryItems([createdItem, ...libraryItems])
        setIsCreateDialogOpen(false)
        setNewItem({
          name: "",
          text_content: "",
          category: "",
          tags: "",
          voice_actor_id: "",
          is_public: false
        })
        toast({
          title: "생성 완료",
          description: "라이브러리 아이템이 생성되었습니다.",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "생성 실패",
          description: errorData.detail || "라이브러리 아이템 생성에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Create library item error:", error)
      toast({
        title: "네트워크 오류",
        description: "서버와의 연결에 문제가 있습니다.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const useLibraryItem = async (itemId: string) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-library/${itemId}/use`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const result = await response.json()
        setLibraryItems(prev =>
          prev.map(item =>
            item.id === itemId ? { ...item, usage_count: result.usage_count } : item
          )
        )
        toast({
          title: "사용 기록됨",
          description: "라이브러리 아이템 사용이 기록되었습니다.",
        })
      }
    } catch (error) {
      console.error("Use library item error:", error)
    }
  }

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      useLibraryItem(itemId)
      toast({
        title: "복사 완료",
        description: "텍스트가 클립보드에 복사되었습니다.",
      })
    } catch (error) {
      console.error("Copy to clipboard error:", error)
      toast({
        title: "복사 실패",
        description: "클립보드 복사에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const playAudio = async (itemId: string) => {
    try {
      const accessToken = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/voice-actors/tts-library/${itemId}/audio`,
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
        
        setPlayingAudio(itemId)
        
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
        useLibraryItem(itemId)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const parseTags = (tags?: string) => {
    if (!tags) return []
    return tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
  }

  return (
    <div className="container mx-auto p-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            음성 라이브러리
          </h1>
          <p className="text-gray-600">재사용 가능한 공통 멘트를 관리합니다</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 라이브러리 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>새 라이브러리 아이템 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  placeholder="라이브러리 아이템 이름"
                />
              </div>
              
              <div>
                <Label htmlFor="text_content">텍스트 내용</Label>
                <Textarea
                  id="text_content"
                  value={newItem.text_content}
                  onChange={(e) => setNewItem({...newItem, text_content: e.target.value})}
                  placeholder="멘트 내용을 입력하세요..."
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">카테고리</Label>
                  <Input
                    id="category"
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    placeholder="예: 인사말"
                  />
                </div>
                
                <div>
                  <Label htmlFor="voice_actor">성우 (선택)</Label>
                  <Select value={newItem.voice_actor_id} onValueChange={(value) => setNewItem({...newItem, voice_actor_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="성우 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">선택 안함</SelectItem>
                      {voiceActors.map((actor) => (
                        <SelectItem key={actor.id} value={actor.id}>
                          {actor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="tags">태그</Label>
                <Input
                  id="tags"
                  value={newItem.tags}
                  onChange={(e) => setNewItem({...newItem, tags: e.target.value})}
                  placeholder="태그1, 태그2, 태그3 (쉼표로 구분)"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={newItem.is_public}
                  onChange={(e) => setNewItem({...newItem, is_public: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="is_public">공개 (다른 사용자도 사용 가능)</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={createLibraryItem} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    "추가"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="이름, 내용, 태그로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체 카테고리</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={isPublicFilter} onValueChange={setIsPublicFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="공개여부" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">전체</SelectItem>
              <SelectItem value="true">공개</SelectItem>
              <SelectItem value="false">비공개</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 라이브러리 목록 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">라이브러리를 불러오는 중...</span>
        </div>
      ) : libraryItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Archive className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>등록된 라이브러리 아이템이 없습니다.</p>
            <p className="text-sm">새로운 라이브러리 아이템을 추가해보세요.</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                첫 번째 라이브러리 추가하기
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {libraryItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    {item.is_public && (
                      <Badge variant="secondary" className="text-xs">
                        공개
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {item.usage_count}회 사용
                    </Badge>
                  </div>
                </div>
                {item.category && (
                  <Badge variant="outline" className="w-fit">
                    {item.category}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4 min-h-[3rem]">
                  {truncateText(item.text_content, 120)}
                </p>
                
                {item.tags && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {parseTags(item.tags).slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {parseTags(item.tags).length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{parseTags(item.tags).length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mb-4">
                  생성일: {formatDate(item.created_at)}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(item.text_content, item.id)}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    복사
                  </Button>
                  
                  {item.audio_file_path && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => playAudio(item.id)}
                      disabled={playingAudio === item.id}
                    >
                      {playingAudio === item.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
