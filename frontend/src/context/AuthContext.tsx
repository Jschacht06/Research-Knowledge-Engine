import type { ReactNode } from 'react'
import { startTransition, useEffect, useState } from 'react'
import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from './auth-context'
import { apiRequest } from '../lib/api'

type TokenResponse = {
  access_token: string
  token_type: string
}

const AUTH_TOKEN_KEY = 'rke-auth-token'

async function fetchCurrentUser(token: string) {
  return apiRequest<AuthUser>('/me', { token })
}

async function loginRequest(payload: LoginPayload) {
  const body = new URLSearchParams()
  body.set('username', payload.email)
  body.set('password', payload.password)

  return apiRequest<TokenResponse>('/auth/login', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
}

async function registerRequest(payload: RegisterPayload) {
  await apiRequest<AuthUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY))
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    if (!token) {
      startTransition(() => {
        setUser(null)
        setIsInitializing(false)
      })
      return
    }

    const activeToken = token
    let cancelled = false

    async function loadUser() {
      try {
        const currentUser = await fetchCurrentUser(activeToken)
        if (!cancelled) {
          startTransition(() => {
            setUser(currentUser)
            setIsInitializing(false)
          })
        }
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        if (!cancelled) {
          startTransition(() => {
            setToken(null)
            setUser(null)
            setIsInitializing(false)
          })
        }
      }
    }

    void loadUser()

    return () => {
      cancelled = true
    }
  }, [token])

  async function login(payload: LoginPayload) {
    const normalizedEmail = payload.email.trim().toLowerCase()
    const tokenResponse = await loginRequest({
      ...payload,
      email: normalizedEmail,
    })

    localStorage.setItem(AUTH_TOKEN_KEY, tokenResponse.access_token)
    setToken(tokenResponse.access_token)

    const currentUser = await fetchCurrentUser(tokenResponse.access_token)
    startTransition(() => {
      setUser(currentUser)
    })
  }

  async function register(payload: RegisterPayload) {
    const normalizedEmail = payload.email.trim().toLowerCase()
    await registerRequest({
      ...payload,
      email: normalizedEmail,
    })

    await login({
      ...payload,
      email: normalizedEmail,
    })
  }

  async function refreshUser() {
    if (!token) {
      setUser(null)
      return
    }

    const currentUser = await fetchCurrentUser(token)
    startTransition(() => {
      setUser(currentUser)
    })
  }

  function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    startTransition(() => {
      setToken(null)
      setUser(null)
    })
  }

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isInitializing,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
