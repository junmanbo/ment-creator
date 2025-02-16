"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Ment {
  id: number
  title: string
  subtitle: string
  author: string
  createdAt: string
}

// 15개의 임의 멘트 데이터
const dummyMents: Ment[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  title: `멘트 제목 ${i + 1}`,
  subtitle: `이것은 ${i + 1}번째 멘트의 부제목입니다.`,
  author: `작성자 ${i + 1}`,
  createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
}))

export default function MentListPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const mentsPerPage = 5

  // 현재 페이지의 멘트만 선택
  const currentMents = dummyMents.slice((currentPage - 1) * mentsPerPage, currentPage * mentsPerPage)

  const totalPages = Math.ceil(dummyMents.length / mentsPerPage)

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">멘트 목록</h1>
        <Button asChild>
          <Link href="/">홈으로</Link>
        </Button>
      </div>
      <div className="space-y-4 mb-6">
        {currentMents.map((ment) => (
          <Card key={ment.id}>
            <CardHeader>
              <CardTitle>{ment.title}</CardTitle>
              <CardDescription>{ment.subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>작성자: {ment.author}</span>
                <span>작성일: {new Date(ment.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-between items-center">
        <Button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          이전
        </Button>
        <span>
          페이지 {currentPage} / {totalPages}
        </span>
        <Button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          다음
        </Button>
      </div>
    </div>
  )
}

