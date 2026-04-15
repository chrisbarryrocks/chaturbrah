import { useState, useEffect } from 'react'
import {
  Room,
  RoomEvent,
  ConnectionQuality as LKConnectionQuality,
  type Participant,
} from 'livekit-client'
import type { ConnectionQuality } from '../types'

export function useConnectionStatus(room: Room | null): ConnectionQuality {
  const [quality, setQuality] = useState<ConnectionQuality>('good')

  useEffect(() => {
    if (!room) return

    const handleQuality = (_quality: LKConnectionQuality, participant: Participant) => {
      if (participant.isLocal) return
      if (_quality === LKConnectionQuality.Poor || _quality === LKConnectionQuality.Lost) {
        setQuality('unstable')
      } else {
        setQuality('good')
      }
    }

    const handleReconnecting = () => setQuality('reconnecting')
    const handleReconnected = () => setQuality('good')

    room.on(RoomEvent.ConnectionQualityChanged, handleQuality)
    room.on(RoomEvent.Reconnecting, handleReconnecting)
    room.on(RoomEvent.Reconnected, handleReconnected)

    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, handleQuality)
      room.off(RoomEvent.Reconnecting, handleReconnecting)
      room.off(RoomEvent.Reconnected, handleReconnected)
    }
  }, [room])

  return quality
}
