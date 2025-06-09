"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { User, ChevronDown, Mic, Users, Volume2, Library } from "lucide-react"
import { useAppSelector } from "../store/hooks"
import { cn } from "@/lib/utils"

export function Navbar() {
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn)

  return (
    <header className="border-b">
      <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Link href="/" className="font-bold text-lg">
              ARS 멘트 관리 시스템
            </Link>
            
            {isLoggedIn && (
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-9 px-4 py-2">
                      <Mic className="h-4 w-4 mr-2" />
                      ARS 멘트 관리
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        <li className="row-span-3">
                          <NavigationMenuLink asChild>
                            <Link
                              className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                              href="/ars-ment-management/list"
                            >
                              <Mic className="h-6 w-6" />
                              <div className="mb-2 mt-4 text-lg font-medium">
                                멘트 목록
                              </div>
                              <p className="text-sm leading-tight text-muted-foreground">
                                등록된 TTS 스크립트와 생성된 음성 파일을 관리합니다
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              href="/ars-ment-management/voice-actors"
                              className={cn(
                                "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              )}
                            >
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                <div className="text-sm font-medium leading-none">성우 관리</div>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                성우 등록 및 음성 샘플 관리
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              href="/ars-ment-management/tts"
                              className={cn(
                                "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              )}
                            >
                              <div className="flex items-center">
                                <Volume2 className="h-4 w-4 mr-2" />
                                <div className="text-sm font-medium leading-none">TTS 생성</div>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                텍스트를 음성으로 변환
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              href="/ars-ment-management/library"
                              className={cn(
                                "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              )}
                            >
                              <div className="flex items-center">
                                <Library className="h-4 w-4 mr-2" />
                                <div className="text-sm font-medium leading-none">음성 라이브러리</div>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                재사용 가능한 멘트 템플릿
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <Button variant="ghost" asChild>
                      <Link href="/scenarios">시나리오 관리</Link>
                    </Button>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <Button variant="ghost" asChild>
                      <Link href="/monitoring">모니터링</Link>
                    </Button>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>
          
          {isLoggedIn ? (
            <Link href="/mypage" className="flex flex-col items-center hover:bg-accent hover:text-accent-foreground rounded-md p-2">
              <User className="h-6 w-6" />
              <span className="text-sm">마이페이지</span>
            </Link>
          ) : (
            <Button asChild>
              <Link href="/login">로그인</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
