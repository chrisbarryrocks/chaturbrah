export type AppState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error'

export type StreamState = 'offline' | 'live' | 'ended'

export type ConnectionQuality = 'good' | 'unstable' | 'reconnecting'

export type LatencyLevel = 'low' | 'medium' | 'high' | 'unknown'

export interface ChatMessage {
  id: string
  senderId: string
  senderRole: 'broadcaster' | 'viewer' | 'system'
  senderName: string
  text: string
  sentAt: number
}

export interface TokenResponse {
  token: string
  url: string
  roomName: string
  identity: string
}

export type DataMessagePayload =
  | { type: 'chat'; message: ChatMessage }
  | { type: 'announce'; event: 'join' | 'stream-start' | 'stream-end'; displayName: string }
  | { type: 'ping'; ts: number }
  | { type: 'pong'; ts: number }
