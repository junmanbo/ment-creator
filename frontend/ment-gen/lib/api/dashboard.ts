// API 베이스 URL 및 공통 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'

// API 요청 헬퍼 함수
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token')
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

// 대시보드 메트릭 타입 정의
export interface DashboardMetrics {
  activeScenarios: number
  ttsInProgress: number
  ttsCompleted: number
  ttsQueue: number
  voiceActors: number
  systemStatus: 'normal' | 'warning' | 'error'
  systemLoad: number
}

export interface RecentScenario {
  id: string
  name: string
  category: string
  lastModified: string
  status: 'active' | 'inactive' | 'draft'
  version: string
}

export interface TtsStatistics {
  date: string
  count: number
  voiceActor: string
  avgDuration: number
}

export interface ActivityLog {
  id: string
  type: 'processing' | 'completed' | 'pending' | 'error'
  message: string
  progress?: number
  timestamp: string
  userId?: string
  resourceId?: string
}

// 대시보드 API 함수들
export const dashboardApi = {
  // 대시보드 메트릭 조회
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      // 실제 API 호출 시도
      const [scenarios, ttsGenerations, voiceActors] = await Promise.all([
        apiRequest('/scenarios?status=active'),
        apiRequest('/voice-actors/tts-generations?status=all'),
        apiRequest('/voice-actors?is_active=true')
      ])

      // 실제 데이터로 메트릭 계산
      const activeScenarios = scenarios.total || 0
      const allGenerations = ttsGenerations.items || []
      
      return {
        activeScenarios,
        ttsInProgress: allGenerations.filter((g: any) => g.status === 'processing').length,
        ttsCompleted: allGenerations.filter((g: any) => g.status === 'completed').length,
        ttsQueue: allGenerations.filter((g: any) => g.status === 'pending').length,
        voiceActors: voiceActors.length || 0,
        systemStatus: 'normal',
        systemLoad: Math.random() * 100
      }
    } catch (error) {
      console.warn('API not available, using mock data:', error)
      // API가 준비되지 않았을 때 목업 데이터 반환
      return {
        activeScenarios: 15,
        ttsInProgress: 3,
        ttsCompleted: 127,
        ttsQueue: 8,
        voiceActors: 8,
        systemStatus: 'normal',
        systemLoad: 65
      }
    }
  },

  // 최근 시나리오 조회
  async getRecentScenarios(limit: number = 10): Promise<RecentScenario[]> {
    try {
      const response = await apiRequest(`/scenarios?limit=${limit}&sort=updated_at:desc`)
      return response.items?.map((scenario: any) => ({
        id: scenario.id,
        name: scenario.name,
        category: scenario.category || '일반',
        lastModified: new Date(scenario.updated_at).toLocaleDateString('ko-KR'),
        status: scenario.status,
        version: scenario.version || '1.0'
      })) || []
    } catch (error) {
      console.warn('API not available, using mock scenarios:', error)
      return [
        {
          id: '1',
          name: '자동차보험 접수',
          category: '보험접수',
          lastModified: '2025-06-03',
          status: 'active',
          version: '2.1'
        },
        {
          id: '2',
          name: '화재보험 문의',
          category: '보험문의',
          lastModified: '2025-06-02',
          status: 'active',
          version: '1.8'
        },
        {
          id: '3',
          name: '생명보험 상담',
          category: '보험상담',
          lastModified: '2025-06-01',
          status: 'active',
          version: '3.0'
        },
        {
          id: '4',
          name: '고객센터 일반',
          category: '일반문의',
          lastModified: '2025-05-31',
          status: 'inactive',
          version: '1.5'
        }
      ]
    }
  },

  // TTS 생성 통계 조회
  async getTtsStatistics(days: number = 7): Promise<TtsStatistics[]> {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))
      
      const response = await apiRequest(
        `/voice-actors/tts-generations/statistics?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
      )
      
      return response.data || []
    } catch (error) {
      console.warn('API not available, using mock TTS statistics:', error)
      // 목업 데이터 생성
      const mockData: TtsStatistics[] = []
      const voiceActors = ['김소연', '이민수', '박지영', '최정훈']
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        
        mockData.push({
          date: date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
          count: Math.floor(Math.random() * 20) + 5,
          voiceActor: voiceActors[Math.floor(Math.random() * voiceActors.length)],
          avgDuration: Math.random() * 30 + 10
        })
      }
      
      return mockData
    }
  },

  // 활동 로그 조회
  async getActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    try {
      const response = await apiRequest(`/activity-logs?limit=${limit}`)
      return response.items || []
    } catch (error) {
      console.warn('API not available, using mock activity logs:', error)
      return [
        {
          id: '1',
          type: 'processing',
          message: '자동차보험 시나리오 TTS 생성 중...',
          progress: 70,
          timestamp: '방금 전'
        },
        {
          id: '2',
          type: 'completed',
          message: '화재보험 멘트 업데이트 완료',
          timestamp: '2분 전'
        },
        {
          id: '3',
          type: 'pending',
          message: '새로운 성우 음성 모델 학습 대기 중',
          timestamp: '5분 전'
        },
        {
          id: '4',
          type: 'completed',
          message: '생명보험 시나리오 배포 완료',
          timestamp: '10분 전'
        }
      ]
    }
  },

  // 시스템 상태 조회
  async getSystemStatus() {
    try {
      const response = await apiRequest('/system/health')
      return {
        status: response.status || 'normal',
        uptime: response.uptime || '99.9%',
        version: response.version || '1.0.0',
        lastCheck: new Date().toISOString()
      }
    } catch (error) {
      console.warn('API not available, using mock system status:', error)
      return {
        status: 'normal',
        uptime: '99.9%',
        version: '1.0.0',
        lastCheck: new Date().toISOString()
      }
    }
  }
}

// 실시간 데이터 업데이트를 위한 폴링 함수
export function startDashboardPolling(
  callback: () => void,
  interval: number = 30000 // 30초
): () => void {
  const intervalId = setInterval(callback, interval)
  
  return () => {
    clearInterval(intervalId)
  }
}
