import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

interface User {
  id: string
  username: string
  full_name?: string
  email?: string
  role?: string
  department?: string
}

interface AuthState {
  isLoggedIn: boolean
  token: string | null
  user: User | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  isLoggedIn: false,
  token: null,
  user: null,
  loading: false,
  error: null,
}

// 사용자 정보 로드 async thunk
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) {
        throw new Error("No token found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // 토큰 만료 시 로컬 스토리지에서 제거
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          throw new Error("Token expired")
        }
        throw new Error("Failed to fetch user profile")
      }

      const userData = await response.json()
      return userData as User
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Unknown error")
    }
  }
)

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ token: string; user?: User }>) => {
      state.isLoggedIn = true
      state.token = action.payload.token
      if (action.payload.user) {
        state.user = action.payload.user
      }
      state.error = null
    },
    logout: (state) => {
      state.isLoggedIn = false
      state.token = null
      state.user = null
      state.error = null
      state.loading = false
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isLoggedIn = true
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isLoggedIn = false
        state.token = null
        state.user = null
      })
  },
})

export const { login, logout, setUser, clearError } = authSlice.actions

export default authSlice.reducer

