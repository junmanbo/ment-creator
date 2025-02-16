"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

export default function CreateMentPage() {
  const [text, setText] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ text }),
      })

      if (response.ok) {
        toast({
          title: "멘트 생성 성공",
          description: "멘트가 성공적으로 생성되었습니다.",
        })
        router.push("/list")
      } else {
        throw new Error("멘트 생성 실패")
      }
    } catch (error) {
      console.error("Create ment error:", error)
      toast({
        title: "멘트 생성 오류",
        description: "멘트 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">멘트 생성</h1>
      <form onSubmit={handleSubmit}>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="멘트를 입력하세요"
          className="mb-4"
        />
        <Button type="submit">멘트 생성</Button>
      </form>
    </div>
  )
}

