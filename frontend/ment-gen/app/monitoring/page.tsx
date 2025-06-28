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
    total_generated: 1247,
    in_progress: 3,
    completed_today: 47,
    failed_today: 2,
    average_generation_time: 45,
    quality_average: 93.2
  })
  
  const [scenarioMetrics, setScenarioMetrics] = useState<ScenarioMetrics>({
    total_scenarios: 15,
    active_scenarios: 12,
    inactive_scenarios: 2,
    testing_scenarios: 1,
  })
  
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([
    {
      id: "1",
      level: "ERROR",
      message: "TTS 생성 실패: 음성 모델 로딩 오류",
      module: "TTS Engine",
      timestamp: "2025-06-06T14:30:00Z",
      count: 2
    },
    {
      id: "2",
      level: "WARNING",
      message: "높은 메모리 사용량 감지",
      module: "System Monitor",
      timestamp: "2025-06-06T14:15:00Z",
      count: 1
    },
    {
      id: "3",
      level: "ERROR",
      message: "데이터베이스 연결 시간 초과",
      module: "Database",
      timestamp: "2025-06-06T13:45:00Z",
      count: 1
    }
  ])
  
  const [chartData, setChartData] = useState<ChartData[]>([
    { date: "06/01", tts_count: 45, quality: 92, response_time: 245, cpu_usage: 68, memory_usage: 72 },
    { date: "06/02", tts_count: 52, quality: 94, response_time: 234, cpu_usage: 65, memory_usage: 75 },
    { date: "06/03", tts_count: 38, quality: 91, response_time: 267, cpu_usage: 72, memory_usage: 78 },
    { date: "06/04", tts_count: 65, quality: 93, response_time: 198, cpu_usage: 58, memory_usage: 68 },
    { date: "06/05", tts_count: 58, quality: 95, response_time: 223, cpu_usage: 62, memory_usage: 74 },
    { date: "06/06", tts_count: 47, quality: 94, response_time: 234, cpu_usage: 65, memory_usage: 78 }
  ])
  
  const [pieData, setPieData] = useState([
    { name: "활성", value: 12, color: "#00C49F" },
    { name: "비활성", value: 2, color: "#FFBB28" },
    { name: "테스트", value: 1, color: "#FF8042" }
  ])
  
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  const { toast } = useToast()

  useEffect(() => {
    fetchMetrics()
    
    // 실시간 모드일 때 10초마다 업데이트
    const interval = timeRange === "realtime" 
      ? setInterval(fetchMetrics, 10000) 
      : setInterval(fetchMetrics, 60000) // 다른 모드는 1분마다
    
    return () => clearInterval(interval)
  }, [timeRange])

  const fetchMetrics = async () => {
    setIsLoading(true)
    try {
      const accessToken = localStorage.getItem("access_token")
      if (!accessToken) {
        throw new Error("인증 토큰이 없습니다")
      }

      // 시스템 메트릭 조회
      const systemResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/metrics/system?time_range=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      // TTS 메트릭 조회
      const ttsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/metrics/tts?time_range=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      // 시나리오 메트릭 조회
      const scenarioResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/metrics/scenarios?time_range=${timeRange}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      // 임시로 더미 데이터 사용 (실제 API가 없는 경우)
      if (!systemResponse.ok || !ttsResponse.ok || !scenarioResponse.ok) {
        // 더미 데이터로 업데이트
        updateWithRandomData()
      } else {
        // 실제 데이터 처리
        const systemData = await systemResponse.json()
        const ttsData = await ttsResponse.json()
        const scenarioData = await scenarioResponse.json()
        
        setSystemMetrics(systemData)
        setTtsMetrics(ttsData)
        setScenarioMetrics(scenarioData)
      }
      
      setLastUpdated(new Date())
      
    } catch (error) {
      console.error("Fetch metrics error:", error)
      
      // 에러 시 더미 데이터로 업데이트
      updateWithRandomData()
      
      toast({
        title: "데이터 로드 실패",
        description: "모니터링 데이터를 불러오는데 실패했습니다. 더미 데이터를 표시합니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateWithRandomData = () => {
    // 더미 데이터 생성 (실제로는 서버에서 받아올 데이터)
    setSystemMetrics({
      cpu_usage: Math.random() * 30 + 50, // 50-80%
      memory_usage: Math.random() * 20 + 70, // 70-90%
      disk_usage: Math.random() * 20 + 40, // 40-60%
      response_time: Math.random() * 100 + 200, // 200-300ms
      active_connections: Math.floor(Math.random() * 20 + 30), // 30-50
      requests_per_minute: Math.floor(Math.random() * 50 + 100) // 100-150
    })
    
    setTtsMetrics(prev => ({
      ...prev,
      in_progress: Math.floor(Math.random() * 5 + 1), // 1-5
      completed_today: prev.completed_today + Math.floor(Math.random() * 3),
      failed_today: Math.random() > 0.8 ? prev.failed_today + 1 : prev.failed_today
    }))
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
