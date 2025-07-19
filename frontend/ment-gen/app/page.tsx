"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts"
import {
  Activity,
  Users,
  Mic,
  Monitor,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  PlayCircle,
  FileText,
  Volume2,
  Settings,
  BarChart3
} from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  activeScenarios: number
  ttsInProgress: number
  ttsCompletedToday: number
  voiceModels: number
  totalMents: number
  systemStatus: "정상" | "주의" | "오류"
}

interface RecentScenario {
  id: string
  name: string
  status: "active" | "inactive" | "testing"
  lastModified: string
  category: string
}

interface TTSStatData {
  date: string
  count: number
  quality: number
}

interface WorkStatus {
  id: string
  type: "진행중" | "완료" | "대기"
  message: string
  progress?: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeScenarios: 0,
    ttsInProgress: 0,
    ttsCompletedToday: 0,
    voiceModels: 0,
    totalMents: 0,
    systemStatus: "정상"
  })

  const [recentScenarios, setRecentScenarios] = useState<RecentScenario[]>([])
  const [ttsChartData, setTtsChartData] = useState<TTSStatData[]>([])
  const [pieData, setPieData] = useState<any[]>([])
  const [workStatuses, setWorkStatuses] = useState<WorkStatus[]>([])
  const [loading, setLoading] = useState(true)

  // API 호출 함수들
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStats({
          activeScenarios: data.activeScenarios,
          ttsInProgress: data.ttsInProgress,
          ttsCompletedToday: data.ttsCompletedToday,
          voiceModels: data.voiceModels,
          totalMents: data.totalMents,
          systemStatus: data.systemStatus
        })
      }
    } catch (error) {
      console.error('통계 데이터 조회 실패:', error)
    }
  }

  const fetchRecentScenarios = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/recent-scenarios`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setRecentScenarios(data)
      }
    } catch (error) {
      console.error('최근 시나리오 조회 실패:', error)
    }
  }

  const fetchTtsStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/tts-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setTtsChartData(data)
      }
    } catch (error) {
      console.error('TTS 통계 조회 실패:', error)
    }
  }

  const fetchScenarioDistribution = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/scenario-status-distribution`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setPieData(data)
      }
    } catch (error) {
      console.error('시나리오 분포 조회 실패:', error)
    }
  }

  const fetchWorkStatuses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/dashboard/work-statuses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setWorkStatuses(data)
      }
    } catch (error) {
      console.error('작업 상태 조회 실패:', error)
    }
  }

  // 초기 데이터 로드
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      await Promise.all([
        fetchDashboardStats(),
        fetchRecentScenarios(),
        fetchTtsStats(),
        fetchScenarioDistribution(),
        fetchWorkStatuses()
      ])
      setLoading(false)
    }

    loadDashboardData()
  }, [])

  // 30초마다 데이터 자동 새로고침
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardStats()
      fetchWorkStatuses()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "정상":
        return "text-green-600 bg-green-100"
      case "주의":
        return "text-yellow-600 bg-yellow-100"
      case "오류":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getScenarioStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "testing":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getWorkStatusIcon = (type: string) => {
    switch (type) {
      case "진행중":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "완료":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "대기":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600 mt-1">ARS 시나리오 관리 시스템 현황</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/scenarios/create">
              <FileText className="h-4 w-4 mr-2" />
              새 시나리오
            </Link>
          </Button>
          <Button asChild>
            <Link href="/tts">
              <Volume2 className="h-4 w-4 mr-2" />
              TTS 생성
            </Link>
          </Button>
        </div>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 시나리오</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeScenarios}개</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              전월 대비 +2개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TTS 생성현황</CardTitle>
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">진행중: {stats.ttsInProgress}개</div>
            <p className="text-xs text-muted-foreground">
              오늘 완료: {stats.ttsCompletedToday}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">성우 모델수</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.voiceModels}개</div>
            <p className="text-xs text-muted-foreground">
              전체 멘트: {stats.totalMents}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">시스템 상태</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(stats.systemStatus)}>
                {stats.systemStatus}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              마지막 체크: 방금 전
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 시나리오 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              최근 시나리오
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-sm">{scenario.name}</h4>
                      <Badge className={getScenarioStatusColor(scenario.status)}>
                        {scenario.status === "active" ? "활성" : 
                         scenario.status === "inactive" ? "비활성" : "테스트"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {scenario.category} • {scenario.lastModified}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/scenarios/${scenario.id}`}>
                      <Settings className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/scenarios">모든 시나리오 보기</Link>
            </Button>
          </CardContent>
        </Card>

        {/* TTS 생성 통계 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              TTS 생성 통계
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ttsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                  name="생성 수량"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 하단 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 시나리오별 배포 상태 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              시나리오별 배포 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 알림 및 작업 현황 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              알림 및 작업 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workStatuses.map((work) => (
                <div
                  key={work.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    {getWorkStatusIcon(work.type)}
                    <Badge variant="outline">{work.type}</Badge>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{work.message}</p>
                    {work.progress && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>진행률</span>
                          <span>{work.progress}%</span>
                        </div>
                        <Progress value={work.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
