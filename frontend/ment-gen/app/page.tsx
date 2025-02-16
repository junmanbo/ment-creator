import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-between items-center">
          <div className="flex space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/create">멘트 생성하기</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/list">멘트 목록</Link>
            </Button>
          </div>
          <Button asChild>
            <Link href="/login">로그인</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold mb-6">AI 멘트 생성기</h1>
        <p className="text-xl mb-8 max-w-2xl">
          텍스트를 입력하면 AI가 학습하여 맞춤형 음성 멘트를 생성합니다. 당신만의 특별한 멘트를 쉽고 빠르게
          만들어보세요.
        </p>
        <Button size="lg" asChild>
          <Link href="/create">멘트 만들기 시작</Link>
        </Button>
      </main>
      <footer className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
        © 2023 AI 멘트 생성기. All rights reserved.
      </footer>
    </div>
  )
}

