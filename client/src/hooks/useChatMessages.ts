import { useState, useCallback, useEffect } from 'react'
import { Room, RoomEvent } from 'livekit-client'
import { encodePayload, decodePayload } from '../utils/chat'
import type { ChatMessage } from '../types'

export interface ChatState {
  messages: ChatMessage[]
  sendMessage: (text: string) => void
}

export function useChatMessages(
  room: Room | null,
  senderRole: 'broadcaster' | 'viewer',
  senderId: string,
): ChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    if (!room) return

    const handleData = (payload: Uint8Array) => {
      const data = decodePayload(payload)
      if (!data || data.type !== 'chat') return
      setMessages(prev => [...prev, data.message])
    }

    room.on(RoomEvent.DataReceived, handleData)
    return () => { room.off(RoomEvent.DataReceived, handleData) }
  }, [room])

  const sendMessage = useCallback((text: string) => {
    if (!room || !text.trim()) return

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      senderId,
      senderRole,
      text: text.trim(),
      sentAt: Date.now(),
    }

    const bytes = encodePayload({ type: 'chat', message })
    void room.localParticipant.publishData(bytes, { reliable: true })
    setMessages(prev => [...prev, message])
  }, [room, senderId, senderRole])

  return { messages, sendMessage }
}
