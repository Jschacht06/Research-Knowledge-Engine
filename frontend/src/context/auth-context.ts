import { createContext } from 'react'

export type AuthUser = {
  id: number
  email: string
  full_name: string | null
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  email: string
  fullName: string
  password: string
}

export type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
