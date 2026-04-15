import type { DataMessagePayload } from '../types'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function encodePayload(payload: DataMessagePayload): Uint8Array {
  return encoder.encode(JSON.stringify(payload))
}

export function decodePayload(data: Uint8Array): DataMessagePayload | null {
  try {
    return JSON.parse(decoder.decode(data)) as DataMessagePayload
  } catch {
    return null
  }
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
