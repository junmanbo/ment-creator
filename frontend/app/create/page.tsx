"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function CreateMentPage() {
  const [title, setTitle] = useState("")
  const [subTitle, setSubTitle] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 필수 필드 검증
    if (!title.trim()) {
      toast({
        title: "입력 오류",
        description: "제목을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!subTitle.trim()) {
      toast({
        title: "입력 오류",
        description: "설명을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "입력 오류",
        description: "멘트 내용을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const accessToken = localStorage.getItem("access_token")

      if (!accessToken) {
        toast({
          title: "인증 오류",
          description: "로그인이 필요합니다.",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: title,
          sub_title: subTitle,
          content: content,
          current_user: accessToken,
        }),
      })

      if (response.ok) {
        toast({
          title: "멘트 생성 성공",
          description: "멘트가 성공적으로 생성되었습니다.",
        })
        router.push("/list")
      } else {
        if (response.status === 401) {
          toast({
            title: "인증 오류",
            description: "로그인이 만료되었습니다. 다시 로그인해주세요.",
            variant: "destructive",
          })
          router.push("/login")
        } else {
          toast({
            title: "멘트 생성 실패",
            description: "멘트 생성 중 오류가 발생했습니다.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Create ment error:", error)
      toast({
        title: "멘트 생성 오류",
        description: "서버와의 통신 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>멘트 생성</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subTitle">설명</Label>
              <Input
                id="subTitle"
                value={subTitle}
                onChange={(e) => setSubTitle(e.target.value)}
                placeholder="설명을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">멘트 내용</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="멘트 내용을 입력하세요"
                rows={6}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                "멘트 생성"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
