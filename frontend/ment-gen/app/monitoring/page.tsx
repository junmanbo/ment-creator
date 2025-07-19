"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
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
  Bar,
  LineChart,
  Line
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
  Server,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
  Download,
  Eye,
  Zap,
  Database,
  Globe,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react"

interface SystemMetrics {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  response_time: number
  active_connections: number
  requests_per_minute: number
}

interface TTSMetrics {
  total_generated: number
  in_progress: number
  completed_today: number
  failed_today: number
  average_generation_time: number
  quality_average: number
}

interface ScenarioMetrics {
  total_scenarios: number
  active_scenarios: number
  inactive_scenarios: number
  testing_scenarios: number
}

interface ErrorLog {
  id: string
  level: "ERROR" | "WARNING" | "INFO"
  message: string
  module: string
  timestamp: string
  count: number
}

interface ChartData {
  date: string
  tts_count: number
  quality: number
  response_time: number
  cpu_usage: number
  memory_usage: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function SystemMonitoringPage() {
  const [timeRange, setTimeRange] = useState<"realtime" | "daily" | "weekly" | "monthly">("daily")
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu_usage: 65,
    memory_usage: 78,
    disk_usage: 45,
    response_time: 234,
    active_connections: 42,
    requests_per_minute: 127
  })
  
  const [ttsMetrics, setTtsMetrics] = useState<TTSMetrics>({
    total_generated: 1863,
    in_progress: 2,
    completed_today: 53,
    failed_today: 1,
    average_generation_time: 38,
    quality_average: 94.1
  })
  
  const [scenarioMetrics, setScenarioMetrics] = useState<ScenarioMetrics>({
    total_scenarios: 18,
    active_scenarios: 14,
    inactive_scenarios: 3,
    testing_scenarios: 1,
  })
  
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([
    {
      id: "1",
      level: "WARNING",
      message: "높은 메모리 사용량 감지 (85% 사용 중)",
      module: "System Monitor",
      timestamp: "2025-07-19T15:30:00Z",
      count: 1
    },
    {
      id: "2",
      level: "INFO",
      message: "성우 모델 학습 완료: 김수진 성우",
      module: "Voice Training",
      timestamp: "2025-07-19T14:45:00Z",
      count: 1
    },
    {
      id: "3",
      level: "ERROR",
      message: "TTS 생성 실패: 네트워크 연결 오류",
      module: "TTS Engine",
      timestamp: "2025-07-19T13:20:00Z",
      count: 1
    },
    {
      id: "4",
      level: "INFO",
      message: "시나리오 배포 완료: 자동차보험 상담",
      module: "Scenario Manager",
      timestamp: "2025-07-19T12:15:00Z",
      count: 1
    }
  ])
  
  const [chartData, setChartData] = useState<ChartData[]>([
    { date: "07/13", tts_count: 45, quality: 92.1, response_time: 245, cpu_usage: 68, memory_usage: 72 },
    { date: "07/14", tts_count: 52, quality: 94.3, response_time: 234, cpu_usage: 65, memory_usage: 75 },
    { date: "07/15", tts_count: 38, quality: 91.8, response_time: 267, cpu_usage: 72, memory_usage: 78 },
    { date: "07/16", tts_count: 65, quality: 93.5, response_time: 198, cpu_usage: 58, memory_usage: 68 },
    { date: "07/17", tts_count: 58, quality: 95.2, response_time: 223, cpu_usage: 62, memory_usage: 74 },
    { date: "07/18", tts_count: 47, quality: 94.1, response_time: 234, cpu_usage: 65, memory_usage: 78 },
    { date: "07/19", tts_count: 53, quality: 93.8, response_time: 218, cpu_usage: 69, memory_usage: 76 }
  ])
  
  const [pieData, setPieData] = useState([
    { name: "활성", value: 14, color: "#00C49F" },
    { name: "비활성", value: 3, color: "#FFBB28" },
    { name: "테스트", value: 1, color: "#FF8042" }
  ])
  
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  const { toast } = useToast()

  useEffect(() => {
    // 실시간 모드일 때 10초마다 업데이트, 다른 모드는 30초마다
    const interval = timeRange === "realtime" 
      ? setInterval(updateWithRandomData, 10000) 
      : setInterval(updateWithRandomData, 30000)
    
    return () => clearInterval(interval)
  }, [timeRange])

  const fetchMetrics = () => {
    setIsLoading(true)
    // 하드코딩된 데이터로 업데이트
    setTimeout(() => {
      updateWithRandomData()
      setLastUpdated(new Date())
      setIsLoading(false)
      
      toast({
        title: "데이터 업데이트",
        description: "모니터링 데이터가 업데이트되었습니다.",
      })
    }, 1000) // 1초 지연으로 로딩 효과
  }

  const updateWithRandomData = () => {
    // 하드코딩된 더미 데이터로 실시간 효과 구현
    const currentTime = new Date()
    const hour = currentTime.getHours()
    
    // 시간대별로 다른 데이터 패턴 적용
    const isBusinessHour = hour >= 9 && hour <= 18
    const cpuBase = isBusinessHour ? 65 : 45
    const memoryBase = isBusinessHour ? 75 : 60
    const connectionsBase = isBusinessHour ? 40 : 25
    
    setSystemMetrics({
      cpu_usage: cpuBase + Math.random() * 15, // 비즈니스 시간 기준 변동
      memory_usage: memoryBase + Math.random() * 10,
      disk_usage: 42 + Math.random() * 8, // 40-50% 범위
      response_time: 200 + Math.random() * 80, // 200-280ms
      active_connections: Math.floor(connectionsBase + Math.random() * 15),
      requests_per_minute: Math.floor((isBusinessHour ? 120 : 80) + Math.random() * 40)
    })
    
    setTtsMetrics(prev => ({
      ...prev,
      in_progress: Math.floor(Math.random() * 4 + 1), // 1-4개
      completed_today: isBusinessHour ? 
        Math.min(prev.completed_today + Math.floor(Math.random() * 2), 65) : 
        prev.completed_today,
      failed_today: Math.random() > 0.9 ? Math.min(prev.failed_today + 1, 5) : prev.failed_today,
      quality_average: 92 + Math.random() * 4 // 92-96% 품질
    }))
    
    // 차트 데이터도 업데이트
    const today = new Date().toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
    const todayData = {
      date: today,
      tts_count: isBusinessHour ? Math.floor(Math.random() * 15 + 40) : Math.floor(Math.random() * 10 + 20),
      quality: 92 + Math.random() * 4,
      response_time: 200 + Math.random() * 80,
      cpu_usage: cpuBase + Math.random() * 15,
      memory_usage: memoryBase + Math.random() * 10
    }
    
    setChartData(prev => {
      const updated = [...prev]
      if (updated[updated.length - 1].date !== today) {
        // 새로운 날짜 데이터 추가
        updated.push(todayData)
        if (updated.length > 7) updated.shift() // 최근 7일만 유지
      } else {
        // 오늘 데이터 업데이트
        updated[updated.length - 1] = todayData
      }
      return updated
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "정상":
        return "text-green-600 bg-green-100"
      case "주의":
        return "text-yellow-600 bg-yellow-100"
      case "위험":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getSystemStatus = () => {
    if (systemMetrics.cpu_usage > 90 || systemMetrics.memory_usage > 90) return "위험"
    if (systemMetrics.cpu_usage > 80 || systemMetrics.memory_usage > 80) return "주의"
    return "정상"
  }

  const getErrorLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "text-red-600 bg-red-100"
      case "WARNING":
        return "text-yellow-600 bg-yellow-100"
      case "INFO":
        return "text-blue-600 bg-blue-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const exportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      timeRange,
      systemMetrics,
      ttsMetrics,
      scenarioMetrics,
      errorLogs
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "리포트 다운로드",
      description: "시스템 리포트가 다운로드되었습니다.",
    })
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">시스템 모니터링</h1>
          <p className="text-gray-600 mt-1">실시간 시스템 상태 및 성능 지표</p>
          <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}</span>
            {isLoading && (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>업데이트 중...</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Tabs value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <TabsList>
              <TabsTrigger value="realtime">실시간</TabsTrigger>
              <TabsTrigger value="daily">일간</TabsTrigger>
              <TabsTrigger value="weekly">주간</TabsTrigger>
              <TabsTrigger value="monthly">월간</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="outline" onClick={fetchMetrics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            리포트 다운로드
          </Button>
        </div>
      </div>

      {/* 시스템 상태 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">시스템 상태</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(getSystemStatus())}>
                {getSystemStatus()}
              </Badge>
              {getSystemStatus() === "정상" && <CheckCircle className="h-4 w-4 text-green-500" />}
              {getSystemStatus() === "주의" && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
              {getSystemStatus() === "위험" && <AlertTriangle className="h-4 w-4 text-red-500" />}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              CPU: {systemMetrics.cpu_usage.toFixed(1)}% | 메모리: {systemMetrics.memory_usage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TTS 생성 현황</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">진행중: {ttsMetrics.in_progress}건</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>오늘 완료: {ttsMetrics.completed_today}건</span>
              <span className="mx-2">•</span>
              <span>실패: {ttsMetrics.failed_today}건</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              평균 생성시간: {ttsMetrics.average_generation_time}초
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 시나리오</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{scenarioMetrics.active_scenarios}개</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>전체: {scenarioMetrics.total_scenarios}개</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              전월 대비 +2개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">응답 성능</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.response_time.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              활성 연결: {systemMetrics.active_connections}개
            </p>
            <p className="text-xs text-muted-foreground">
              분당 요청: {systemMetrics.requests_per_minute}건
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TTS 생성 추이 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              TTS 생성 추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="tts_count"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                  name="TTS 생성 수"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 시나리오별 배포 상태 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="h-5 w-5 mr-2" />
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
      </div>

      {/* 시스템 성능 및 오류 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시스템 성능 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              시스템 성능
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">CPU 사용률</span>
                </div>
                <span className="text-sm">{systemMetrics.cpu_usage.toFixed(1)}%</span>
              </div>
              <Progress value={systemMetrics.cpu_usage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">메모리 사용률</span>
                </div>
                <span className="text-sm">{systemMetrics.memory_usage.toFixed(1)}%</span>
              </div>
              <Progress value={systemMetrics.memory_usage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">디스크 사용률</span>
                </div>
                <span className="text-sm">{systemMetrics.disk_usage.toFixed(1)}%</span>
              </div>
              <Progress value={systemMetrics.disk_usage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{systemMetrics.response_time.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">평균 응답시간 (ms)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemMetrics.active_connections}</div>
                <div className="text-xs text-muted-foreground">활성 연결</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 오류 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              오류 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {errorLogs.filter(log => log.level === "ERROR").length}
                  </div>
                  <div className="text-xs text-muted-foreground">오류</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {errorLogs.filter(log => log.level === "WARNING").length}
                  </div>
                  <div className="text-xs text-muted-foreground">경고</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {errorLogs.filter(log => log.level === "INFO").length}
                  </div>
                  <div className="text-xs text-muted-foreground">정보</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">최근 오류 로그</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {errorLogs.map((log) => (
                    <div key={log.id} className="text-xs border rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <Badge className={getErrorLevelColor(log.level)} variant="outline">
                          {log.level}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="text-gray-700">{log.message}</div>
                      <div className="text-muted-foreground mt-1">
                        {log.module} • 발생 {log.count}회
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Eye className="h-4 w-4 mr-2" />
                  전체 로그 보기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 성능 추이 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            성능 추이
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="response_time"
                stroke="#8884d8"
                strokeWidth={2}
                name="응답시간 (ms)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cpu_usage"
                stroke="#82ca9d"
                strokeWidth={2}
                name="CPU 사용률 (%)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="memory_usage"
                stroke="#ffc658"
                strokeWidth={2}
                name="메모리 사용률 (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
