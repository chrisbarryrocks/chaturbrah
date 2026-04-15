import { useEffect, useRef } from 'react'
import { ChatMessageItem } from './ChatMessageItem'
import type { ChatMessage } from '../../types'

interface ChatMessageListProps {
  messages: ChatMessage[]
  localSenderId: string
}

export function ChatMessageList({ messages, localSenderId }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5">
        <div className="flex items-center justify-center size-10 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-white/25 text-xs text-center">
          No messages yet.<br />Be the first to say hello!
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
      {messages.map(msg => (
        <ChatMessageItem
          key={msg.id}
          message={msg}
          isOwn={msg.senderId === localSenderId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
