import { create } from "zustand"
import { persist } from "zustand/middleware"

export type UserRole = "admin" | "pm" | "worker"

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

        // Simulate API call - replace with actual API
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Demo users for different roles
        const demoUsers: Record<string, User> = {
          "admin@sosab.com": { id: "1", email: "admin@sosab.com", name: "Admin User", role: "admin" },
          "pm@sosab.com": { id: "2", email: "pm@sosab.com", name: "Project Manager", role: "pm" },
          "worker@sosab.com": { id: "3", email: "worker@sosab.com", name: "Field Worker", role: "worker" },
        }

        const user = demoUsers[email]
        if (user && password === "demo123") {
          const token = `demo-token-${Date.now()}`
          set({ token, user, isAuthenticated: true, isLoading: false })
        } else {
          set({ isLoading: false })
          throw new Error("Invalid credentials")
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
