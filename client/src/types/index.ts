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
  senderRole: 'broadcaster' | 'viewer'
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
  | { type: 'ping'; ts: number }
  | { type: 'pong'; ts: number }
