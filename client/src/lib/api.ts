import type { ChatMessage, TokenResponse } from '../types'

const API_BASE = (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? 'http://localhost:4000'

export interface LiveStream {
  username: string
  roomName: string
  startedAt: number
  viewerCount: number
  isLive: boolean
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' })) as { error?: string }
    throw new Error(err.error ?? `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function fetchToken(role: 'broadcaster' | 'viewer' | 'preview', roomName: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, roomName }),
  })
}

export async function fetchStreams(): Promise<LiveStream[]> {
  return apiFetch<LiveStream[]>('/streams')
}

export async function startStream(username: string): Promise<void> {
  await apiFetch('/streams/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
}

export async function endStream(username: string): Promise<void> {
  await apiFetch(`/streams/${encodeURIComponent(username)}`, {
    method: 'DELETE',
  })
}

export async function heartbeatStream(username: string, sessionId: string): Promise<void> {
  await apiFetch(`/streams/${encodeURIComponent(username)}/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })
}

export interface AiChatterResponse {
  messages: ChatMessage[]
  transcript: string
}

export async function sendAiChatterAudio({
  audioBlob,
  roomName,
  streamerName,
}: {
  audioBlob: Blob
  roomName: string
  streamerName: string
}): Promise<AiChatterResponse> {
  const form = new FormData()
  form.append('audio', audioBlob, 'audio.webm')
  form.append('roomName', roomName)
  form.append('streamerName', streamerName)

  const res = await fetch(`${API_BASE}/ai-chatters/respond`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' })) as { error?: string }
    throw new Error(err.error ?? `AI chatters request failed: ${res.status}`)
  }

  return res.json() as Promise<AiChatterResponse>
}
