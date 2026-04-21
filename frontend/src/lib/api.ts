const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

type RequestOptions = {
  method?: 'DELETE' | 'GET' | 'POST' | 'PUT'
  body?: BodyInit | null
  headers?: HeadersInit
  token?: string | null
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

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ?? null,
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
