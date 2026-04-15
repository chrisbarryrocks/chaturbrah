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
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#4a4a5a] text-sm text-center px-4">
          No messages yet. Say hello!
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
