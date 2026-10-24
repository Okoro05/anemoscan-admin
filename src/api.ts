const API_URL = (import.meta.env.VITE_API_URL || 'https://anemoscan-binary-backend.onrender.com').replace(/\/$/, '')

export type Capture = {
  id: number
  patientId: string
  scanNumber: number
  name: string
  status: string
  cameraLabel: string
  threshold: number
  brightness: number
  sharpness: number
  contrast: number
  overall: number
  age: number | null
  gender: string | null
  imageUrl: string
  anemiaDetected: boolean | null
  anemiaProbability: number | null
  anemiaStatus: string | null
  analyzedAt: string | null
  createdAt: string
}

export type Stats = {
  totalScans: number
  uniquePatients: number
  anemiaDetected: number
  noAnemia: number
  unanalyzed: number
  averageAnemiaProbability: number | null
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      message = body.detail || message
    } catch {
      // Keep the HTTP status message.
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

async function download(path: string, filename: string): Promise<void> {
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include' })
  if (!response.ok) {
    let message = `Download failed (${response.status})`
    try {
      const body = await response.json()
      message = body.detail || message
    } catch {
      // Keep the HTTP status message.
    }
    throw new Error(message)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function csrfToken(): string {
  return document.cookie.split('; ').find((item) => item.startsWith('anemoscan_admin_csrf='))?.split('=')[1] || ''
}

export const adminApi = {
  login: (username: string, password: string) =>
    request<{ authenticated: boolean; username: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ authenticated: boolean; username: string; expiresAt: string }>('/api/admin/me'),
  logout: () =>
    request<{ authenticated: boolean }>('/api/admin/logout', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken() },
    }),
  stats: () => request<Stats>('/api/admin/stats'),
  captures: (q: string, result: string, offset = 0) =>
    request<{ captures: Capture[]; total: number; hasMore: boolean }>(
      `/api/admin/captures?q=${encodeURIComponent(q)}&result=${encodeURIComponent(result)}&limit=24&offset=${offset}`,
    ),
  deleteCapture: (id: number) =>
    request<void>(`/api/admin/captures/${id}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken() },
    }),
  imageUrl: (id: number) => `${API_URL}/api/admin/captures/${id}/image`,
  exportUrl: () => `${API_URL}/api/admin/export`,
  downloadImage: (capture: Capture) => download(`/api/admin/captures/${capture.id}/image`, `${capture.name || `scan-${capture.id}`}.jpg`),
  downloadReport: (capture: Capture) => download(`/api/admin/captures/${capture.id}/report`, `${capture.name || `scan-${capture.id}`}-report.pdf`),
  downloadAll: () => download('/api/admin/export', 'anemoscan-admin-export.zip'),
}
