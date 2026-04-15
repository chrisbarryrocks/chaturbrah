import type { TokenResponse } from '../types'

const API_BASE = import.meta.env['VITE_API_BASE_URL'] as string ?? 'http://localhost:4000'

export async function fetchToken(role: 'broadcaster' | 'viewer'): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' })) as { error?: string }
    throw new Error(err.error ?? `Request failed: ${res.status}`)
  }

  return res.json() as Promise<TokenResponse>
}
