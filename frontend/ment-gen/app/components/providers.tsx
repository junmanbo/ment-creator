"use client"

import type React from "react"

import { useEffect } from "react"
import { Provider } from "react-redux"
import { store } from "../store/store"
import { login, fetchUserProfile } from "../store/authSlice"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 페이지 로드 시 로컬 스토리지의 토큰을 확인하여 로그인 상태 복원
    const token = localStorage.getItem("access_token")
    if (token) {
      // 토큰이 있으면 먼저 로그인 상태로 설정하고 사용자 정보 로드
      store.dispatch(login({ token }))
      store.dispatch(fetchUserProfile())
    }
  }, [])

  return <Provider store={store}>{children}</Provider>
}

