"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Monitor,
  Palette,
  Volume2,
  Mail,
  Save,
  RefreshCw
} from "lucide-react"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  
  // 시스템 설정 상태
  const [systemSettings, setSystemSettings] = useState({
    tts_quality: "high",
    max_concurrent_generations: "5",
    auto_backup_enabled: true,
    maintenance_mode: false,
    debug_mode: false
  })
  
  // 사용자 설정 상태
  const [userSettings, setUserSettings] = useState({
    email_notifications: true,
    browser_notifications: true,
    auto_save: true,
    theme: "light",
    language: "ko"
  })

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000))
      // 실제 구현 시에는 API 호출
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">설정</h1>
          <p className="text-gray-600 mt-1">시스템 및 사용자 환경 설정</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              설정 저장
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system">시스템 설정</TabsTrigger>
          <TabsTrigger value="user">사용자 설정</TabsTrigger>
          <TabsTrigger value="notifications">알림 설정</TabsTrigger>
          <TabsTrigger value="security">보안 설정</TabsTrigger>
        </TabsList>

        {/* 시스템 설정 탭 */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6">
            {/* TTS 설정 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Volume2 className="h-5 w-5 mr-2" />
                  TTS 시스템 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tts-quality">기본 음질 설정</Label>
                    <Select
                      value={systemSettings.tts_quality}
                      onValueChange={(value) => 
                        setSystemSettings(prev => ({ ...prev, tts_quality: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="음질 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">낮음 (빠른 생성)</SelectItem>
                        <SelectItem value="medium">보통</SelectItem>
                        <SelectItem value="high">높음 (권장)</SelectItem>
                        <SelectItem value="ultra">최고품질</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-concurrent">최대 동시 생성 수</Label>
                    <Input
                      id="max-concurrent"
                      type="number"
                      min="1"
                      max="10"
                      value={systemSettings.max_concurrent_generations}
                      onChange={(e) => 
                        setSystemSettings(prev => ({ 
                          ...prev, 
                          max_concurrent_generations: e.target.value 
                        }))
                      }
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>자동 백업</Label>
                    <p className="text-sm text-gray-500">
                      TTS 파일 자동 백업 활성화
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.auto_backup_enabled}
                    onCheckedChange={(checked) =>
                      setSystemSettings(prev => ({ ...prev, auto_backup_enabled: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* 시스템 관리 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="h-5 w-5 mr-2" />
                  시스템 관리
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>유지보수 모드</Label>
                    <p className="text-sm text-gray-500">
                      시스템 점검 시 사용자 접근 차단
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={systemSettings.maintenance_mode}
                      onCheckedChange={(checked) =>
                        setSystemSettings(prev => ({ ...prev, maintenance_mode: checked }))
                      }
                    />
                    {systemSettings.maintenance_mode && (
                      <Badge variant="destructive">활성</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>디버그 모드</Label>
                    <p className="text-sm text-gray-500">
                      개발 및 디버깅용 로그 활성화
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.debug_mode}
                    onCheckedChange={(checked) =>
                      setSystemSettings(prev => ({ ...prev, debug_mode: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 사용자 설정 탭 */}
        <TabsContent value="user" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                개인 환경 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">테마 설정</Label>
                  <Select
                    value={userSettings.theme}
                    onValueChange={(value) => 
                      setUserSettings(prev => ({ ...prev, theme: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="테마 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">라이트</SelectItem>
                      <SelectItem value="dark">다크</SelectItem>
                      <SelectItem value="auto">시스템 설정 따름</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">언어 설정</Label>
                  <Select
                    value={userSettings.language}
                    onValueChange={(value) => 
                      setUserSettings(prev => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="언어 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>자동 저장</Label>
                  <p className="text-sm text-gray-500">
                    작업 내용 자동 저장 활성화
                  </p>
                </div>
                <Switch
                  checked={userSettings.auto_save}
                  onCheckedChange={(checked) =>
                    setUserSettings(prev => ({ ...prev, auto_save: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 알림 설정 탭 */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                알림 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>이메일 알림</Label>
                  <p className="text-sm text-gray-500">
                    중요한 시스템 알림을 이메일로 수신
                  </p>
                </div>
                <Switch
                  checked={userSettings.email_notifications}
                  onCheckedChange={(checked) =>
                    setUserSettings(prev => ({ ...prev, email_notifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>브라우저 알림</Label>
                  <p className="text-sm text-gray-500">
                    브라우저 푸시 알림 활성화
                  </p>
                </div>
                <Switch
                  checked={userSettings.browser_notifications}
                  onCheckedChange={(checked) =>
                    setUserSettings(prev => ({ ...prev, browser_notifications: checked }))
                  }
                />
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label>알림 유형별 설정</Label>
                <div className="space-y-3 pl-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">TTS 생성 완료</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">시나리오 배포 알림</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">시스템 오류 알림</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">정기 리포트</span>
                    <Switch defaultChecked={false} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 보안 설정 탭 */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                보안 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">현재 비밀번호</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">새 비밀번호</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="새 비밀번호를 입력하세요"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                </div>
                
                <Button variant="outline" className="w-full">
                  비밀번호 변경
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <Label>세션 관리</Label>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">현재 세션</span>
                    <Badge variant="outline">활성</Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    마지막 활동: 방금 전 • IP: 192.168.1.100
                  </p>
                  <Button variant="destructive" size="sm" className="w-full">
                    모든 세션 종료
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
