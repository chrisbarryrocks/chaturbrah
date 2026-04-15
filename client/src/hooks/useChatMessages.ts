import { useState, useCallback, useEffect, useRef } from 'react'
import { Room, RoomEvent, type RemoteParticipant } from 'livekit-client'
import { encodePayload, decodePayload } from '../utils/chat'
import type { ChatMessage } from '../types'

export interface ChatState {
  messages: ChatMessage[]
  sendMessage: (text: string) => void
}

function makeSystemMessage(text: string): ChatMessage {
  return {
    id: `sys-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    senderId: 'system',
    senderRole: 'system',
    senderName: '',
    text,
    sentAt: Date.now(),
  }
}

export function useChatMessages(
  room: Room | null,
  senderRole: 'broadcaster' | 'viewer',
  senderId: string,
  senderName: string,
  options?: {
    /** Broadcast a join announcement once when connected (only if user has a real username) */
    announceJoin?: boolean
    /** Broadcaster passes current streaming state to trigger stream-start/end announces */
    isStreaming?: boolean
  },
): ChatState {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // identity → display name; populated from announce:join messages for leave detection
  const identityMapRef = useRef<Map<string, string>>(new Map())
  const prevIsStreamingRef = useRef<boolean | undefined>(undefined)
  const joinAnnouncedRef = useRef(false)

  const addSystem = useCallback((text: string) => {
    setMessages(prev => [...prev, makeSystemMessage(text)])
  }, [])

  // Publish an announce data message to other participants
  const sendAnnounce = useCallback(
    (event: 'join' | 'stream-start' | 'stream-end', displayName: string) => {
      if (!room) return
      const bytes = encodePayload({ type: 'announce', event, displayName })
      void room.localParticipant.publishData(bytes, { reliable: true })
    },
    [room],
  )

  // Send join announcement once when room is first available
  useEffect(() => {
    if (!room || joinAnnouncedRef.current) return
    if (!options?.announceJoin || !senderName) return
    joinAnnouncedRef.current = true
    sendAnnounce('join', senderName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room])

  // Track isStreaming changes to send stream-start / stream-end announces (broadcaster only)
  const isStreaming = options?.isStreaming
  useEffect(() => {
    const prev = prevIsStreamingRef.current
    prevIsStreamingRef.current = isStreaming

    // Only act on actual transitions after mount
    if (prev === undefined || prev === isStreaming || isStreaming === undefined) return
    if (!room || !senderName) return

    if (isStreaming) {
      sendAnnounce('stream-start', senderName)
      addSystem(`🔴 ${senderName} is now live!`)
    } else {
      sendAnnounce('stream-end', senderName)
      addSystem('Stream has ended.')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming])

  // Room event listeners — single DataReceived handler to avoid double-firing
  useEffect(() => {
    if (!room) return

    // LiveKit DataReceived: (payload, participant, kind, topic)
    const handleData = (
      payload: Uint8Array,
      participant: RemoteParticipant | undefined,
    ) => {
      const data = decodePayload(payload)
      if (!data) return

      if (data.type === 'chat') {
        setMessages(prev => [...prev, data.message])
        return
      }

      if (data.type === 'announce') {
        const { event, displayName } = data

        // Track identity → name for leave detection
        if (event === 'join' && participant) {
          identityMapRef.current.set(participant.identity, displayName)
          addSystem(`${displayName} joined the chat`)
        } else if (event === 'stream-start') {
          addSystem(`🔴 ${displayName} is now live!`)
        } else if (event === 'stream-end') {
          addSystem('Stream has ended.')
        }
      }
    }

    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      const name = identityMapRef.current.get(participant.identity)
      identityMapRef.current.delete(participant.identity)
      // Only show if we have a real display name (not a raw identity string like "viewer-123-abc")
      if (name && !/^(viewer|broadcaster)-\d/.test(name)) {
        addSystem(`${name} left the chat`)
      }
    }

    room.on(RoomEvent.DataReceived, handleData)
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)

    return () => {
      room.off(RoomEvent.DataReceived, handleData)
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
    }
  }, [room, addSystem])

  const sendMessage = useCallback(
    (text: string) => {
      if (!room || !text.trim()) return

      const message: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        senderId,
        senderRole,
        senderName,
        text: text.trim(),
        sentAt: Date.now(),
      }

      const bytes = encodePayload({ type: 'chat', message })
      void room.localParticipant.publishData(bytes, { reliable: true })
      setMessages(prev => [...prev, message])
    },
    [room, senderId, senderRole, senderName],
  )

  return { messages, sendMessage }
}
