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

async function fetchCurrentUser() {
  return apiRequest<AuthUser>('/me')
}

async function loginRequest(payload: LoginPayload) {
  const body = new URLSearchParams()
  body.set('username', payload.email)
  body.set('password', payload.password)

  return apiRequest<{ ok: boolean }>('/auth/login', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
}

async function logoutRequest() {
  return apiRequest<{ ok: boolean }>('/auth/logout', {
    method: 'POST',
  })
}

async function registerRequest(payload: RegisterPayload) {
  await apiRequest<AuthUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      full_name: payload.fullName,
      password: payload.password,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      try {
        const currentUser = await fetchCurrentUser()
        if (!cancelled) {
          startTransition(() => {
            setUser(currentUser)
            setIsInitializing(false)
          })
        }
      } catch {
        if (!cancelled) {
          startTransition(() => {
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
  }, [])

  async function login(payload: LoginPayload) {
    const normalizedEmail = payload.email.trim().toLowerCase()
    await loginRequest({
      ...payload,
      email: normalizedEmail,
    })

    const currentUser = await fetchCurrentUser()
    startTransition(() => {
      setUser(currentUser)
    })
  }

  async function register(payload: RegisterPayload) {
    const normalizedEmail = payload.email.trim().toLowerCase()
    await registerRequest({
      ...payload,
      email: normalizedEmail,
      fullName: payload.fullName.trim(),
    })

    await login({
      ...payload,
      email: normalizedEmail,
    })
  }

  async function refreshUser() {
    try {
      const currentUser = await fetchCurrentUser()
      startTransition(() => {
        setUser(currentUser)
      })
    } catch {
      startTransition(() => {
        setUser(null)
      })
    }
  }

  async function logout() {
    try {
      await logoutRequest()
    } finally {
      startTransition(() => {
        setUser(null)
      })
    }
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isInitializing,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
