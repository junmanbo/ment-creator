import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, BarChart3, TrendingUp, Clock, DollarSign, Zap, Users, Target, CheckCircle, ArrowRight, Mic, FileText, Settings, Brain, Lightbulb, Award } from 'lucide-react';

const Presentation = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const slides = [
    // 슬라이드 1: 타이틀
    {
      type: 'title',
      title: 'ARS 시나리오 관리 플랫폼',
      subtitle: 'Voice Cloning 기반 통합 시나리오·멘트 관리 솔루션',
      author: 'HPMP 신입사원 1주년 프로젝트',
      company: '한화손해보험 인프라운영팀',
      date: '2025년'
    },
    
    // 슬라이드 2: 프로젝트 배경
    {
      type: 'problem',
      title: '💡 왜 이 프로젝트를 시작했을까?',
      subtitle: '현재 ARS 관리의 이중 고통',
      problems: [
        {
          icon: '📊',
          title: '시나리오 관리 문제',
          items: [
            '파워포인트로 산재된 시나리오 관리',
            '버전별 파일 관리의 어려움 (v1.2_최종_진짜최종...)',
            '수정 이력 추적의 한계'
          ]
        },
        {
          icon: '🎤',
          title: '멘트 제작 문제',
          items: [
            '성우 녹음 요청 → 대기 → 수정 요청 → 재녹음 (2~3주 소요)',
            '한 번 녹음하면 수정 어려움',
            '발음·톤 조정의 한계'
          ]
        }
      ],
      goal: '⭐ 목표: 현업이 직접 관리하는 통합 플랫폼 구축'
    },

    // 슬라이드 3: 현재 상황의 문제점
    {
      type: 'issues',
      title: '🔴 현재의 아픈 손가락들',
      sections: [
        {
          title: '📁 시나리오 관리의 혼재',
          items: [
            '시나리오별 개별 PPT 파일',
            '버전 관리 혼란 (파일명으로만 구분)',
            '공유 폴더 속 수십 개 파일들',
            '현업-개발 간 커뮤니케이션 오버헤드'
          ]
        },
        {
          title: '🎙️ 멘트 제작의 비효율',
          stats: [
            { label: '평균 소요기간', value: '2~3주', icon: '📅' },
            { label: '건당 비용', value: '10만원~20만원', icon: '💰' },
            { label: '재작업률', value: '40% 이상', icon: '🔄' }
          ],
          process: '성우 → 스크립트 전달 → 녹음 일정 조율 → 녹음 → 검토 → 수정사항 발견 → 다시 성우 요청 → 재녹음 → 재검토'
        }
      ]
    },

    // 슬라이드 4: 솔루션 개요
    {
      type: 'solution',
      title: '🔵 TO-BE: AI 기반 통합 관리 플랫폼',
      sections: [
        {
          title: '📊 시나리오 관리 혁신',
          items: [
            '플로우차트 기반 시각적 관리',
            '중앙화된 시나리오 저장소',
            '체계적 버전 관리 시스템'
          ],
          color: 'bg-blue-50 border-blue-200'
        },
        {
          title: '🤖 멘트 제작 혁신',
          items: [
            'Voice Cloning 기반 즉시 음성 생성',
            '무제한 수정·재생성 가능',
            '일관된 음질과 톤 보장',
            '실시간 시뮬레이션 테스트'
          ],
          color: 'bg-orange-50 border-orange-200'
        }
      ]
    },

    // 슬라이드 5: 핵심 가치 제안
    {
      type: 'value',
      title: '✨ 3가지 혁신적 개선',
      values: [
        {
          icon: '⚡',
          title: '작업 시간 혁신',
          items: [
            '시나리오 수정: 2-3일 → 2-3시간',
            '멘트 제작: 2-3주 → 30분',
            '버전 관리: 수동 → 자동'
          ],
          color: 'bg-yellow-500'
        },
        {
          icon: '💰',
          title: '비용 효율성',
          items: [
            '멘트 제작비: 10만원/건 → 무료',
            '재작업 비용: 무제한 → 0원',
            '연간 예상 절약: 500만원+'
          ],
          color: 'bg-green-500'
        },
        {
          icon: '🎯',
          title: '품질 향상',
          items: [
            '무제한 수정으로 완벽한 퀄리티',
            '일관된 음성 톤앤매너',
            '즉시 시뮬레이션으로 사전 검증'
          ],
          color: 'bg-orange-500'
        }
      ]
    },

    // 슬라이드 6: 시스템 아키텍처
    {
      type: 'architecture',
      title: '🏗️ 전체 시스템 구조',
      components: [
        {
          layer: 'Frontend',
          tech: 'React + TypeScript',
          features: [
            '플로우차트 에디터',
            '시나리오 관리 대시보드',
            'TTS 멘트 생성 인터페이스'
          ],
          color: 'bg-blue-500'
        },
        {
          layer: 'Backend',
          tech: 'FastAPI + Python',
          features: [
            'RESTful API',
            'Voice Cloning 엔진 연동',
            '비즈니스 로직 처리'
          ],
          color: 'bg-orange-500'
        },
        {
          layer: 'Database',
          tech: 'PostgreSQL',
          features: [
            '시나리오 메타데이터',
            '멘트 스크립트 관리',
            '버전 관리 데이터'
          ],
          color: 'bg-green-500'
        },
        {
          layer: 'AI Engine',
          tech: 'Coqui XTTS v2',
          features: [
            '고품질 음성 합성',
            '성우별 음성 복제'
          ],
          color: 'bg-purple-500'
        }
      ]
    },

    // 슬라이드 7: 플로우차트 에디터
    {
      type: 'feature',
      title: '📊 직관적인 시나리오 편집',
      subtitle: 'PPT 대비 장점: 논리적 구조 시각화 + 멘트 통합 관리',
      features: [
        '드래그앤드롭 노드 배치',
        '다양한 노드 타입 (시작/멘트/분기/종료)',
        '실시간 연결선 그리기',
        '각 노드별 세부 설정',
        '노드별 멘트 스크립트 입력'
      ],
      mockup: true
    },

    // 슬라이드 8: Voice Cloning TTS 시스템
    {
      type: 'tts',
      title: '🤖 혁신적인 AI 멘트 생성',
      comparison: {
        before: { label: '기존 성우 녹음', time: '3주 소요' },
        after: { label: 'AI 생성 음성', time: '30초 소요' }
      },
      features: [
        'Coqui XTTS v2 최신 모델',
        '3-5분 샘플로 음성 완벽 복제',
        '자연스러운 감정·톤 표현',
        '무제한 수정·재생성'
      ],
      improvement: {
        before: '성우 요청 → 2-3주 → 재수정 시 또 2-3주',
        after: '텍스트 입력 → 30초 → 마음에 들 때까지 즉시 재생성'
      }
    },

    // 슬라이드 9: 통합 관리 대시보드
    {
      type: 'dashboard',
      title: '📋 시나리오·멘트 통합 관리',
      features: [
        '시나리오별 멘트 현황 한눈에 보기',
        '생성 완료/대기 상태 실시간 확인',
        '음성 파일 즉시 재생·다운로드',
        '버전별 변경 이력 완벽 추적'
      ],
      improvement: '산재된 PPT + 음성파일 → 통합 플랫폼 관리'
    },

    // 슬라이드 10: 개발 성과
    {
      type: 'achievement',
      title: '📊 8주간의 개발 성과',
      stats: [
        { label: 'Backend', value: '3,500 라인', tech: 'FastAPI' },
        { label: 'Frontend', value: '2,800 라인', tech: 'React/TS' },
        { label: 'AI Integration', value: 'Voice Cloning', tech: '엔진 연동' },
        { label: 'Database', value: '12개 테이블', tech: '설계' },
        { label: '완성도', value: '85%', tech: 'MVP 기준' }
      ],
      features: [
        '플로우차트 에디터',
        '시나리오 CRUD & 버전관리',
        'AI 멘트 생성 시스템',
        '통합 대시보드',
        '실시간 시뮬레이션'
      ]
    },

    // 슬라이드 11: AI 멘트 생성 실제 비교
    {
      type: 'comparison',
      title: '🎤 기존 vs AI: 실제 사례 비교',
      subtitle: '자동차보험 접수 멘트 제작 사례',
      comparison: {
        traditional: {
          title: '🔴 기존 방식 (성우 녹음)',
          timeline: [
            { day: 'Day 1', task: '스크립트 전달' },
            { day: 'Day 3-5', task: '성우 일정 조율' },
            { day: 'Day 7', task: '녹음 완료' },
            { day: 'Day 8', task: '검토 → "발음 수정 필요"' },
            { day: 'Day 15', task: '재녹음 완료' },
            { day: 'Day 16', task: '최종 승인' }
          ],
          total: '총 소요기간: 16일'
        },
        ai: {
          title: '🔵 AI 방식',
          process: [
            '스크립트 입력 → 30초 후 생성 완료',
            '마음에 안 들면 → 즉시 재생성',
            '하루에 10번도 수정 가능'
          ],
          total: '총 소요기간: 30분'
        }
      }
    },

    // 슬라이드 12: 실시간 시뮬레이션
    {
      type: 'simulation',
      title: '⚡ 완성된 시나리오 즉시 체험',
      features: [
        '고객 관점에서 전체 여정 체험',
        '각 단계별 AI 생성 음성 실제 재생',
        '분기 조건 실시간 테스트',
        '예상 소요 시간 측정',
        '문제점 즉시 발견 및 수정'
      ],
      innovation: {
        before: 'PPT 문서 검토 → 상상으로 시나리오 검증',
        after: '실제 고객 경험 → 완벽한 사전 검증'
      }
    },

    // 슬라이드 13: 기대되는 업무 개선 효과
    {
      type: 'impact',
      title: '💼 현업에 기대되는 혁신적 변화',
      metrics: [
        {
          category: '⏰ 시간 효율성 (연간 기준)',
          items: [
            '시나리오 작성·수정: 120시간 → 30시간',
            '멘트 제작·수정: 200시간 → 20시간',
            '버전 관리: 80시간 → 자동화'
          ],
          summary: '총 370시간 → 50시간 (87% 단축)'
        },
        {
          category: '💰 비용 효율성',
          items: [
            '성우 녹음비: 연 500만원 → 0원',
            '재작업 비용: 연 200만원 → 0원',
            '시간 비용 절약: 320시간 × 5만원 = 1,600만원'
          ],
          summary: '연간 총 절약: 2,300만원'
        },
        {
          category: '🎯 품질 및 만족도',
          items: [
            '무제한 수정으로 완벽한 퀄리티 달성',
            '일관된 브랜드 음성 톤앤매너',
            '즉시 피드백·수정으로 스트레스 제거'
          ]
        }
      ]
    },

    // 슬라이드 14: 신입사원으로서의 성장
    {
      type: 'growth',
      title: '🌱 1년간의 기술적 성장',
      skills: [
        { category: '🎨 Frontend', techs: ['React', 'TypeScript', 'React Flow'] },
        { category: '⚙️ Backend', techs: ['FastAPI', 'SQLModel', 'PostgreSQL'] },
        { category: '🤖 AI/ML', techs: ['Voice Cloning', 'TTS 모델', 'Coqui XTTS'] },
        { category: '🔧 DevOps', techs: ['Docker', 'API 설계', 'Git'] }
      ],
      capabilities: [
        '현업 페인포인트 정확한 분석 능력',
        '사용자 중심의 UX 설계 사고',
        '최신 AI 기술의 실무 적용 능력',
        '비용·시간 효율성을 고려한 솔루션 설계'
      ],
      insight: '"기술은 도구일 뿐, 진짜 중요한 건 문제 해결"'
    },

    // 슬라이드 15: 마무리 및 향후 계획
    {
      type: 'conclusion',
      title: '🎯 프로젝트를 마치며',
      achievements: [
        '현업 친화적 통합 관리 플랫폼',
        'AI 기반 혁신적 멘트 제작 시스템',
        '87% 시간 단축, 2,300만원 비용 절약 기대',
        '무제한 수정 가능한 완벽한 품질 관리'
      ],
      future: [
        '실제 운영 적용을 위한 안정성 강화',
        '다양한 성우 모델 확장 (남성, 연령대별)',
        '감정 표현 고도화 (기쁨, 사과, 안내 등)',
        '시나리오 템플릿 라이브러리 구축'
      ],
      commitment: '단순한 기술 구현이 아닌, 실무진의 진짜 고민을 해결하는 솔루션으로 더 나은 업무 환경을 만들어가겠습니다!'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Auto-play functionality
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(nextSlide, 8000); // 8 seconds per slide
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const renderSlide = (slide) => {
    switch (slide.type) {
      case 'title':
        return (
          <div className="h-full flex flex-col justify-center items-center text-center bg-gradient-to-br from-orange-500 to-orange-700 text-white">
            <div className="mb-8">
              <div className="text-6xl font-bold mb-4 animate-fade-in">
                {slide.title}
              </div>
              <div className="text-2xl opacity-90 mb-8">
                {slide.subtitle}
              </div>
            </div>
            <div className="text-xl mb-4 opacity-80">
              {slide.author}
            </div>
            <div className="text-lg opacity-70">
              {slide.company} | {slide.date}
            </div>
          </div>
        );

      case 'problem':
        return (
          <div className="h-full p-16 bg-gradient-to-br from-gray-50 to-gray-100">
            <h1 className="text-5xl font-bold text-gray-800 mb-8 text-center">
              {slide.title}
            </h1>
            <h2 className="text-3xl text-gray-600 mb-12 text-center">
              {slide.subtitle}
            </h2>
            <div className="grid grid-cols-2 gap-12 mb-12">
              {slide.problems.map((problem, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg border-l-4 border-red-500">
                  <div className="flex items-center mb-6">
                    <span className="text-4xl mr-4">{problem.icon}</span>
                    <h3 className="text-2xl font-bold text-gray-800">{problem.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {problem.items.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-red-500 mr-3 mt-1">•</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="text-center">
              <div className="inline-block bg-orange-100 border-2 border-orange-300 rounded-xl p-6">
                <span className="text-2xl font-bold text-orange-700">{slide.goal}</span>
              </div>
            </div>
          </div>
        );

      case 'issues':
        return (
          <div className="h-full p-16 bg-gradient-to-br from-red-50 to-red-100">
            <h1 className="text-5xl font-bold text-red-700 mb-12 text-center">
              {slide.title}
            </h1>
            <div className="space-y-8">
              {slide.sections.map((section, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">{section.title}</h3>
                  {section.items && (
                    <ul className="grid grid-cols-2 gap-4 mb-6">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-red-500 mr-3 mt-1">•</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.stats && (
                    <div className="grid grid-cols-3 gap-6 mb-6">
                      {section.stats.map((stat, i) => (
                        <div key={i} className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-2xl mb-2">{stat.icon}</div>
                          <div className="text-lg font-bold text-red-700">{stat.value}</div>
                          <div className="text-sm text-gray-600">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.process && (
                    <div className="text-sm text-gray-600 italic border-l-4 border-red-300 pl-4">
                      {section.process}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'solution':
        return (
          <div className="h-full p-16 bg-gradient-to-br from-blue-50 to-orange-50">
            <h1 className="text-5xl font-bold text-gray-800 mb-12 text-center">
              {slide.title}
            </h1>
            <div className="grid grid-cols-2 gap-12">
              {slide.sections.map((section, index) => (
                <div key={index} className={`rounded-xl p-8 shadow-lg border-2 ${section.color}`}>
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">{section.title}</h3>
                  <ul className="space-y-4">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle className="text-green-500 mr-3 mt-1 flex-shrink-0" size={20} />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 'value':
        return (
          <div className="h-full p-16 bg-gradient-to-br from-yellow-50 to-orange-50">
            <h1 className="text-5xl font-bold text-gray-800 mb-12 text-center">
              {slide.title}
            </h1>
            <div className="grid grid-cols-3 gap-8">
              {slide.values.map((value, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${value.color} text-white text-2xl mb-6`}>
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">{value.title}</h3>
                  <ul className="space-y-3 text-left">
                    {value.items.map((item, i) => (
                      <li key={i} className="flex items-start">
                        <ArrowRight className="text-orange-500 mr-2 mt-1 flex-shrink-0" size={16} />
                        <span className="text-gray-700 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );

      case 'architecture':
        return (
          <div className="h-full p-16 bg-gradient-to-br from-gray-50 to-blue-50">
            <h1 className="text-5xl font-bold text-gray-800 mb-12 text-center">
              {slide.title}
            </h1>
            <div className="space-y-6">
              {slide.components.map((component, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg flex items-center">
                  <div className={`w-32 h-20 ${component.color} rounded-lg flex items-center justify-center mr-8`}>
                    <div className="text-white font-bold text-center">
                      <div className="text-lg">{component.layer}</div>
                      <div className="text-sm opacity-80">{component.tech}</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-3 gap-4">
                      {component.features.map((feature, i) => (
                        <div key={i} className="flex items-center">
                          <CheckCircle className="text-green-500 mr-2" size={16} />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'feature':
        return (
          <div className="h-full p-16 bg-gradient-to-br from-blue-50 to-indigo-50">
            <h1 className="text-5xl font-bold text-gray-800 mb-6 text-center">
              {slide.title}
            </h1>
            <p className="text-xl text-gray-600 mb-12 text-center">{slide.subtitle}</p>
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                {slide.features.map((feature, index) => (
                  <div key={index} className="flex items-center p-4 bg-white rounded-lg shadow">
                    <CheckCircle className="text-blue-500 mr-4" size={24} />
                    <span className="text-gray-700 text-lg">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="text-center text-gray-500 text-lg">
                  📊 플로우차트 에디터 미리보기
                </div>
                <div className="mt-6 border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-gray-400">
                    [플로우차트 에디터 스크린샷 영역]
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tts':
        return (
          <div className="h-full p-16 bg-gradient-to-br from-purple-50 to-pink-50">
            <h1 className="text-5xl font-bold text-gray-800 mb-8 text-center">
              {slide.title}
            </h1>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-red-100 rounded-xl p-6 text-center">
                <Mic className="mx-auto mb-4 text-red-500" size={48} />
                <div className="text-lg font-bold text-red-700">{slide.comparison.before.label}</div>
                <div className="text-red-600">{slide.comparison.before.time}</div>
              </div>
              <div className="bg-green-100 rounded-xl p-6 text-center">
                <Brain className="mx-auto mb-4 text-green-500" size={48} />
                <div className="text-lg font-bold text-green-700">{slide.comparison.after.label}</div>
                <div className="text-green-600">{slide.comparison.after.time}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">기술적 특징:</h3>
              <div className="grid grid-cols-2 gap-4">
                {slide.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="text-purple-500 mr-3" size={20} />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-orange-100 rounded-xl p-6">
              <h3 className="text-xl font-bold text-orange-700 mb-4">⚡ 혁신적 개선:</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600 mb-2">기존:</div>
                  <div className="text-red-700">{slide.improvement.before}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">현재:</div>
                  <div className="text-green-700">{slide.improvement.after}</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="h-full p-16 bg-gradient-to-br from-green-50 to-blue-50">
            <h1 className="text-5xl font-bold text-gray-800 mb-12 text-center">
              {slide.title}
            </h1>
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                {slide.features.map((feature, index) => (
                  <div key={index} className="flex items-center p-4 bg-white rounded-lg shadow">
                    <CheckCircle className="text-green-500 mr-4" size={24} />
                    <span className="text-gray-700 text-lg">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="text-center text-gray-500 text-lg mb-6">
                  📋 통합 대시보드 미리보기
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex items-center justify-center">
                  <div className="text-gray-400">
                    [대시보드 스크린샷 영역]
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <div className="inline-block bg-green-100 border-2 border-green-300 rounded-xl p-4">
                <span className="text-lg font-bold text-green-700">
                  📈 기존 대비 개선: {slide.improvement}
                </span>
              </div>
            </div>
          </div>
        );

      case 'achievement':
        return (
          <div className="h-full p-16 bg-gradient-to-br from-blue-50 to-purple-50">
            <h1 className="text-5xl font-bold text-gray-800 mb-12 text-center">
              {slide.title}
            </h1>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">기술적 성과:</h3>
                <div className="space-y-4">
                  {slide.stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 shadow flex justify-between items-center">
                      <div>
                        <div className="font-bold text-gray-800">{stat.label}</div>
                        <div className="text-sm text-gray-600">{stat.tech}</div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">구현 기능:</h3>
                <div className="space-y-3">
                  {slide.features.map((feature, index) => (
                    <div key={index} className="flex items-center p-3 bg-white rounded-lg shadow">
                      <CheckCircle className="text-green-500 mr-3" size={20} />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'comparison':
        return (
          <div className="h-full p-16 bg-gradient-to-br from-orange-50 to-red-50">
            <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
              {slide.title}
            </h1>
            <p className="text-xl text-gray-600 mb-12 text-center">{slide.subtitle}</p>
            <div className="grid grid-cols-2 gap-12">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-red-700 mb-6">{slide.comparison.traditional.title}</h3>
                <div className="space-y-3">
                  {slide.comparison.traditional.timeline.map((item, index) => (
                    <div key={index} className="flex items-center p-3 bg-red-50 rounded-lg">
                      <Clock className="text-red-500 mr-3" size={20} />
                      <div>
                        <span className="font-bold text-red-700">{item.day}:</span>
                        <span className="text-gray-700 ml-2">{item.task}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-red-100 rounded-lg text-center">
                  <span className="text-xl font-bold text-red-700">{slide.comparison.traditional.total}</span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-green-700 mb-6">{slide.comparison.ai.title}</h3>
                <div className="space-y-4">
                  {slide.comparison.ai.process.map((item, index) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <Zap className="text-green-500 mr-3" size={20} />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-green-100 rounded-lg text-center">
                  <span className="text-xl font-bold text-green-700">{slide.comparison.ai.total}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'simulation':
        return (
          <div className="h-full p-16 bg-gradient-to-br from-indigo-50 to-purple-50">
            <h1 className="text-5xl font-bold text-gray-800 mb-12 text-center">
              {slide.title}
            </h1>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">시뮬레이션 기능:</h3>
                <div className="space-y-4">
                  {slide.features.map((feature, index) => (
                    <div key={index} className="flex items-center p-4 bg-white rounded-lg shadow">
                      <CheckCircle className="text-indigo-500 mr-4" size={24} />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="text-center text-gray-500 text-lg mb-6">
                  ⚡ 시뮬레이션 모드 미리보기
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex items-center justify-center">
                  <div className="text-gray-400">
                    [시뮬레이션 화면 영역]
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <div className="bg-purple-100 rounded-xl p-6">
                <h3 className="text-xl font-bold text-purple-700 mb-4">🎯 혁신적 변화:</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">기존:</div>
                    <div className="text-red-700">{slide.innovation.before}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-2">현재:</div>
                    <div className="text-green-700">{slide.innovation.after}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'impact':
        return (
          <div className="h-full p-16 bg-gradient-to-br from-green-50 to-yellow-50">
            <h1 className="text-4xl font-bold text-gray-800 mb-12 text-center">
              {slide.title}
            </h1>
            <div className="space-y-8">
              {slide.metrics.map((metric, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">{metric.category}</h3>
                  <div className="grid grid-cols-3 gap-6 mb-4">
                    {metric.items.map((item, i) => (
                      <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-2">
                          {item.split(':')[0]}:
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {item.split(':')[1]}
                        </div>
                      </div>
                    ))}
                  </div>
                  {metric.summary && (
                    <div className="text-center p-4 bg-green-100 rounded-lg">
                      <span className="text-xl font-bold text-green-700">{metric.summary}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'growth':
        return (
          <div className="h-full p-16 bg-gradient-to-br from-blue-50 to-green-50">
            <h1 className="text-5xl font-bold text-gray-800 mb-12 text-center">
              {slide.title}
            </h1>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">새로 습득한 기술:</h3>
                <div className="space-y-4">
                  {slide.skills.map((skill, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 shadow">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-3">{skill.category.split(' ')[0]}</span>
                        <span className="font-bold text-gray-800">{skill.category.split(' ')[1]}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {skill.techs.map((tech, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">💡 업무 역량 향상:</h3>
                <div className="space-y-3 mb-8">
                  {slide.capabilities.map((capability, index) => (
                    <div key={index} className="flex items-start p-3 bg-white rounded-lg shadow">
                      <Target className="text-green-500 mr-3 mt-1" size={20} />
                      <span className="text-gray-700">{capability}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-yellow-100 rounded-xl p-6 text-center">
                  <Lightbulb className="mx-auto mb-4 text-yellow-600" size={48} />
                  <h4 className="text-lg font-bold text-yellow-700 mb-2">🎯 가장 큰 배움:</h4>
                  <p className="text-yellow-800 italic">{slide.insight}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'conclusion':
        return (
          <div className="h-full p-16 bg-gradient-to-br from-orange-500 to-red-500 text-white">
            <h1 className="text-5xl font-bold mb-12 text-center">
              {slide.title}
            </h1>
            <div className="grid grid-cols-2 gap-12 mb-8">
              <div>
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <Award className="mr-3" size={32} />
                  📈 달성한 것:
                </h3>
                <div className="space-y-3">
                  {slide.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="mr-3 mt-1" size={20} />
                      <span>{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <Target className="mr-3" size={32} />
                  🚀 향후 발전 방향:
                </h3>
                <div className="space-y-3">
                  {slide.future.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <ArrowRight className="mr-3 mt-1" size={20} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">💪 신입사원으로서의 다짐:</h3>
              <p className="text-xl leading-relaxed">{slide.commitment}</p>
              <div className="mt-8 text-3xl font-bold">
                🙏 감사합니다!
              </div>
            </div>
          </div>
        );

      default:
        return <div className="h-full flex items-center justify-center">Slide content</div>;
    }
  };

  return (
    <div className="w-full h-screen bg-gray-100 relative overflow-hidden">
      {/* Main slide area */}
      <div className="w-full h-full">
        {renderSlide(slides[currentSlide])}
      </div>

      {/* Navigation controls */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black bg-opacity-50 rounded-full px-6 py-3">
        <button
          onClick={prevSlide}
          className="text-white hover:text-orange-300 transition-colors"
          disabled={currentSlide === 0}
        >
          <ChevronLeft size={24} />
        </button>
        
        <span className="text-white font-medium">
          {currentSlide + 1} / {slides.length}
        </span>
        
        <button
          onClick={nextSlide}
          className="text-white hover:text-orange-300 transition-colors"
          disabled={currentSlide === slides.length - 1}
        >
          <ChevronRight size={24} />
        </button>
        
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="text-white hover:text-orange-300 transition-colors ml-4"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>

      {/* Slide indicator dots */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? 'bg-orange-500' : 'bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-300">
        <div
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default Presentation;