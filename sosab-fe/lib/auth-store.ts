import { create } from "zustand"
import { persist } from "zustand/middleware"

export type UserRole = "admin" | "pm" | "worker" | "gerant" | "accountant"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const { default: api } = await import("@/lib/api")
          const res = await api.post("/auth/login", { email, password })
          if (res.data.success) {
            set({ token: res.data.token, user: res.data.user, isAuthenticated: true, isLoading: false })
          } else {
            set({ isLoading: false })
            throw new Error(res.data.message || "Invalid credentials")
          }
        } catch (error: any) {
          set({ isLoading: false })
          throw new Error(error.response?.data?.message || error.message || "Invalid credentials")
        }
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
      },

      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "sosab-auth",
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
