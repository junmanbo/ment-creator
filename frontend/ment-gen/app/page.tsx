"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { 
  Activity, 
  Users, 
  Mic, 
  Server, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  PlayCircle,
  Loader2,
  Calendar,
  BarChart3,
  RefreshCw
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import Link from "next/link"
import { 
  dashboardApi, 
  type DashboardMetrics, 
  type RecentScenario, 
  type TtsStatistics, 
  type ActivityLog,
  startDashboardPolling
} from "@/lib/api/dashboard"

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeScenarios: 0,
    ttsInProgress: 0,
    ttsCompleted: 0,
    ttsQueue: 0,
    voiceActors: 0,
    systemStatus: 'normal',
    systemLoad: 0
  })
  
  const [recentScenarios, setRecentScenarios] = useState<RecentScenario[]>([])
  const [ttsStats, setTtsStats] = useState<TtsStatistics[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  const { toast } = useToast()

  // 대시보드 데이터 로드
  const loadDashboardData = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }

    try {
      const [metricsData, scenariosData, statsData, activityData] = await Promise.all([
        dashboardApi.getMetrics(),
        dashboardApi.getRecentScenarios(5),
        dashboardApi.getTtsStatistics(7),
        dashboardApi.getActivityLogs(5)
      ])

      setMetrics(metricsData)
      setRecentScenarios(scenariosData)
      setTtsStats(statsData)
      setActivities(activityData)
      setLastUpdated(new Date())

      if (!showLoader) {
        toast({
          title: "데이터 업데이트 완료",
          description: "최신 정보로 업데이트되었습니다.",
        })
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      if (!showLoader) {
        toast({
          title: "업데이트 실패",
          description: "데이터를 업데이트하는 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [toast])

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadDashboardData(true)
  }, [loadDashboardData])

  // 실시간 데이터 업데이트 (30초마다)
  useEffect(() => {
    const stopPolling = startDashboardPolling(() => {
      loadDashboardData(false)
    }, 30000)

    return stopPolling
  }, [loadDashboardData])

  // 수동 새로고침
  const handleRefresh = () => {
    loadDashboardData(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return "text-green-600"
      case 'warning': return "text-yellow-600"
      case 'error': return "text-red-600"
      default: return "text-gray-600"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal': return "정상"
      case 'warning': return "주의"
      case 'error': return "오류"
      default: return "알 수 없음"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityBadgeVariant = (type: string) => {
    switch (type) {
      case 'processing': return "default"
      case 'completed': return "secondary"
      case 'pending': return "outline"
      case 'error': return "destructive"
      default: return "outline"
    }
  }

  const getActivityTypeText = (type: string) => {
    switch (type) {
      case 'processing': return "진행중"
      case 'completed': return "완료"
      case 'pending': return "대기"
      case 'error': return "오류"
      default: return "알 수 없음"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg">대시보드를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">시스템 대시보드</h1>
          <p className="text-muted-foreground">
            ARS 시나리오 관리 시스템 현황 및 통계
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date().toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            새로고침
          </Button>
        </div>
      </div>

      {/* 상단 메트릭 카드 4개 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 시나리오</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeScenarios}개</div>
            <p className="text-xs text-muted-foreground">
              운영 중인 ARS 시나리오
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TTS 생성현황</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              진행중: {metrics.ttsInProgress}개
            </div>
            <p className="text-xs text-muted-foreground">
              완료: {metrics.ttsCompleted}개 | 대기: {metrics.ttsQueue}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">성우 모델수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.voiceActors}개</div>
            <p className="text-xs text-muted-foreground">
              학습된 음성 모델
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">시스템 상태</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.systemStatus)}`}>
              {getStatusText(metrics.systemStatus)}
            </div>
            <p className="text-xs text-muted-foreground">
              시스템 로드: {Math.round(metrics.systemLoad)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 중간 섹션: 최근 시나리오 + TTS 생성 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 시나리오 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PlayCircle className="h-5 w-5" />
              <span>최근 시나리오</span>
            </CardTitle>
            <CardDescription>
              최근 수정된 ARS 시나리오 목록
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentScenarios.map((scenario) => (
                <div key={scenario.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {scenario.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {scenario.category} • v{scenario.version} • {scenario.lastModified}
                    </p>
                  </div>
                  <Badge 
                    variant={scenario.status === "active" ? "default" : scenario.status === "inactive" ? "secondary" : "outline"}
                  >
                    {scenario.status === "active" ? "활성" : scenario.status === "inactive" ? "비활성" : "초안"}
                  </Badge>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <Button variant="outline" className="w-full" asChild>
              <Link href="/scenarios">전체 시나리오 보기</Link>
            </Button>
          </CardContent>
        </Card>

        {/* TTS 생성 통계 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>TTS 생성 통계</span>
            </CardTitle>
            <CardDescription>
              성우별/일별 TTS 생성 현황 (최근 7일)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ttsStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3">
                          <p className="font-medium">{`날짜: ${label}`}</p>
                          <p className="text-blue-600">
                            {`생성수: ${payload[0].value}개`}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {`주요 성우: ${payload[0].payload.voiceActor}`}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">+12% vs 지난주</span>
                </div>
                <div className="text-muted-foreground">
                  평균: {Math.round(ttsStats.reduce((sum, stat) => sum + stat.count, 0) / ttsStats.length || 0)}개/일
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/voice-actors">상세 통계</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 하단 섹션: 알림 및 작업 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>알림 및 작업 현황</span>
            </div>
            <div className="text-xs text-muted-foreground">
              마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
            </div>
          </CardTitle>
          <CardDescription>
            실시간 작업 진행 상황 및 시스템 알림
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                <div className="mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getActivityBadgeVariant(activity.type) as any}>
                        {getActivityTypeText(activity.type)}
                      </Badge>
                      <span className="text-sm font-medium">
                        {activity.message}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </span>
                  </div>
                  {activity.progress && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>진행률</span>
                        <span>{activity.progress}%</span>
                      </div>
                      <Progress value={activity.progress} className="h-2" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm">
              전체 알림 보기
            </Button>
            <span className="text-xs text-muted-foreground">
              {activities.length > 0 ? `${activities.length}개 알림` : '새로운 알림 없음'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
