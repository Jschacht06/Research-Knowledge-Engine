const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

type RequestOptions = {
  method?: 'DELETE' | 'GET' | 'POST' | 'PUT'
  body?: BodyInit | null
  headers?: HeadersInit
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getApiBaseUrl() {
  return API_BASE_URL
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ?? null,
    credentials: 'include',
  })

  if (!response.ok) {
    let detail = 'Request failed'

    try {
      const errorPayload = (await response.json()) as { detail?: string }
      detail = errorPayload.detail ?? detail
    } catch {
      detail = response.statusText || detail
    }

    throw new ApiError(detail, response.status)
  }

  return (await response.json()) as T
}
