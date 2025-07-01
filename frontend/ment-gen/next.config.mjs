let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['localhost', '192.168.0.75'],
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  // API 경로 재작성 (백엔드 프록시)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://192.168.0.75:8000/api/v1/:path*',
      },
    ]
  },
  // 환경 변수 설정
  env: {
    CUSTOM_KEY: 'ARS_SCENARIO_MANAGER',
  },
  // 웹팩 설정 커스터마이징
  webpack: (config, { dev, isServer }) => {
    // 개발 환경에서 소스맵 최적화
    if (dev && !isServer) {
      config.devtool = 'eval-cheap-module-source-map'
    }
    
    // 번들 분석기 설정
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: true,
        })
      )
    }
    
    return config
  },
  // 개발 서버 설정
  devOptions: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // 압축 설정
  compress: true,
  // 파워드 바이 헤더 비활성화
  poweredByHeader: false,
  // 트레일링 슬래시 설정
  trailingSlash: false,
  // 빌드 ID 생성
  generateBuildId: async () => {
    return 'ars-scenario-manager-build'
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
