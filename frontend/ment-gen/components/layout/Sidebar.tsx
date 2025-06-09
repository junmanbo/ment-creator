"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  FileText,
  Mic,
  Volume2,
  Monitor,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Users,
  BarChart3,
  Database,
  Bell,
  HelpCircle
} from "lucide-react"

interface SidebarProps {
  isOpen?: boolean
  onToggle?: () => void
  className?: string
}

interface MenuItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    title: "대시보드",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "시나리오 관리",
    href: "/scenarios",
    icon: FileText,
    badge: "15",
    children: [
      {
        title: "시나리오 목록",
        href: "/scenarios",
        icon: FileText,
      },
      {
        title: "새 시나리오",
        href: "/scenarios/create",
        icon: FileText,
      },
      {
        title: "템플릿 관리",
        href: "/scenarios/templates",
        icon: FileText,
      },
    ],
  },
  {
    title: "ARS 멘트 관리",
    href: "/ars-ment-management",
    icon: Mic,
    badge: "8",
    children: [
      {
        title: "멘트 목록",
        href: "/ars-ment-management/list",
        icon: FileText,
      },
      {
        title: "성우 관리",
        href: "/ars-ment-management/voice-actors",
        icon: Users,
      },
      {
        title: "TTS 생성",
        href: "/ars-ment-management/tts",
        icon: Volume2,
      },
      {
        title: "음성 라이브러리",
        href: "/ars-ment-management/library",
        icon: Database,
      },
    ],
  },
  {
    title: "시스템 모니터링",
    href: "/monitoring",
    icon: BarChart3,
    badge: "실시간",
    badgeVariant: "secondary" as const,
    children: [
      {
        title: "실시간 모니터링",
        href: "/monitoring",
        icon: BarChart3,
      },
      {
        title: "배포 관리",
        href: "/monitoring/deployment",
        icon: Activity,
      },
      {
        title: "로그 관리",
        href: "/monitoring/logs",
        icon: FileText,
      },
      {
        title: "알림 설정",
        href: "/monitoring/notifications",
        icon: Bell,
      },
    ],
  },
  {
    title: "설정",
    href: "/settings",
    icon: Settings,
    children: [
      {
        title: "시스템 설정",
        href: "/settings/system",
        icon: Settings,
      },
      {
        title: "사용자 관리",
        href: "/settings/users",
        icon: Users,
      },
      {
        title: "도움말",
        href: "/settings/help",
        icon: HelpCircle,
      },
    ],
  },
]

export default function Sidebar({ isOpen = true, onToggle, className }: SidebarProps) {
  const pathname = usePathname()

  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  const hasActiveChild = (children?: MenuItem[]) => {
    if (!children) return false
    return children.some(child => isActiveRoute(child.href))
  }

  return (
    <div
      className={cn(
        "relative flex flex-col bg-gray-50 border-r border-gray-200 transition-all duration-300",
        isOpen ? "w-64" : "w-16",
        className
      )}
    >
      {/* 사이드바 토글 버튼 */}
      <div className="absolute -right-3 top-6 z-20">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="h-6 w-6 rounded-full bg-white shadow-sm border-gray-300 hidden lg:flex"
        >
          {isOpen ? (
            <ChevronLeft className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* 사이드바 헤더 */}
      <div className="p-4 border-b border-gray-200">
        {isOpen ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900">메뉴</h2>
            <p className="text-sm text-gray-500">시스템 관리</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <Monitor className="h-6 w-6 text-gray-600" />
          </div>
        )}
      </div>

      {/* 메뉴 리스트 */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActiveRoute(item.href) || hasActiveChild(item.children)

            return (
              <div key={item.href}>
                {/* 메인 메뉴 아이템 */}
                <Link href={item.href}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start h-10 px-3 mb-1",
                      isOpen ? "px-3" : "px-0 justify-center",
                      active && "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isOpen && "mr-2")} />
                    {isOpen && (
                      <>
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <Badge
                            variant={item.badgeVariant || "secondary"}
                            className="ml-auto text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </Button>
                </Link>

                {/* 서브 메뉴 아이템들 */}
                {isOpen && item.children && (active || hasActiveChild(item.children)) && (
                  <div className="ml-6 space-y-1 border-l border-gray-200 pl-4 py-2">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon
                      const childActive = isActiveRoute(child.href)

                      return (
                        <Link key={child.href} href={child.href}>
                          <Button
                            variant={childActive ? "secondary" : "ghost"}
                            size="sm"
                            className={cn(
                              "w-full justify-start h-8 text-sm",
                              childActive && "bg-primary/10 text-primary"
                            )}
                          >
                            <ChildIcon className="h-3 w-3 mr-2" />
                            <span className="truncate">{child.title}</span>
                            {child.badge && (
                              <Badge
                                variant={child.badgeVariant || "secondary"}
                                className="ml-auto text-xs"
                              >
                                {child.badge}
                              </Badge>
                            )}
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </ScrollArea>

      {/* 사이드바 푸터 */}
      <div className="p-4 border-t border-gray-200">
        {isOpen ? (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              © 2025 ARS 관리 시스템
            </p>
            <p className="text-xs text-gray-400 mt-1">
              v2.1.0
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  )
}
