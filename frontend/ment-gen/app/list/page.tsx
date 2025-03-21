"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Ment {
  id: string
  title: string
  sub_title: string
  content: string
  file_path: string
  modified_dt: string
}

export default function MentListPage() {
  const [ments, setMents] = useState<Ment[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const mentsPerPage = 5
  const { toast } = useToast()

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
  }, [toast])

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

