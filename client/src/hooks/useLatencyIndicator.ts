import { useState, useEffect, useRef } from 'react'
import { Room, RoomEvent } from 'livekit-client'
import { encodePayload, decodePayload } from '../utils/chat'
import type { LatencyLevel } from '../types'

const PING_INTERVAL_MS = 5000

export function useLatencyIndicator(
  room: Room | null,
  role: 'broadcaster' | 'viewer',
): LatencyLevel {
  const [latency, setLatency] = useState<LatencyLevel>('unknown')
  const pendingPings = useRef<Map<number, number>>(new Map())

  useEffect(() => {
    if (!room) return

    const handleData = (payload: Uint8Array) => {
      const data = decodePayload(payload)
      if (!data) return

      if (data.type === 'ping' && role === 'viewer') {
        // Viewer replies to pings from broadcaster
        const bytes = encodePayload({ type: 'pong', ts: data.ts })
        void room.localParticipant.publishData(bytes, { reliable: false })
      } else if (data.type === 'pong' && role === 'broadcaster') {
        const sentAt = pendingPings.current.get(data.ts)
        if (sentAt !== undefined) {
          const rtt = Date.now() - sentAt
          pendingPings.current.delete(data.ts)
          if (rtt < 300) {
            setLatency('low')
          } else if (rtt < 800) {
            setLatency('medium')
          } else {
            setLatency('high')
          }
        }
      }
    }

    room.on(RoomEvent.DataReceived, handleData)

    let intervalId: ReturnType<typeof setInterval> | undefined

    if (role === 'broadcaster') {
      intervalId = setInterval(() => {
        if (room.state !== 'connected') return
        const ts = Date.now()
        pendingPings.current.set(ts, ts)
        const bytes = encodePayload({ type: 'ping', ts })
        void room.localParticipant.publishData(bytes, { reliable: false })
      }, PING_INTERVAL_MS)
    }

    return () => {
      room.off(RoomEvent.DataReceived, handleData)
      if (intervalId !== undefined) clearInterval(intervalId)
    }
  }, [room, role])

  return latency
}
