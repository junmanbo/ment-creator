"use client"

import type React from "react"

import { useEffect } from "react"
import { Provider } from "react-redux"
import { store } from "../store/store"
import { login } from "../store/authSlice"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 페이지 로드 시 로컬 스토리지의 토큰을 확인하여 로그인 상태 복원
    const token = localStorage.getItem("access_token")
    if (token) {
      store.dispatch(login(token))
    }
  }, [])

  return <Provider store={store}>{children}</Provider>
}

