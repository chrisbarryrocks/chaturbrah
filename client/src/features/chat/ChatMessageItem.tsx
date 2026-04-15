import { clsx } from 'clsx'
import { formatTime } from '../../utils/chat'
import type { ChatMessage } from '../../types'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwn: boolean
}

export function ChatMessageItem({ message, isOwn }: ChatMessageItemProps) {
  const isBroadcaster = message.senderRole === 'broadcaster'

  return (
    <div className={clsx('flex flex-col gap-0.5', isOwn && 'items-end')}>
      <div className={clsx('flex items-baseline gap-2', isOwn && 'flex-row-reverse')}>
        <span className={clsx(
          'text-xs font-semibold',
          isBroadcaster && 'text-[var(--color-accent-400)]',
          !isBroadcaster && isOwn && 'text-[#a0a0b0]',
          !isBroadcaster && !isOwn && 'text-[#7070a0]',
        )}>
          {isBroadcaster ? '🎙 Streamer' : isOwn ? 'You' : 'Viewer'}
        </span>
        <span className="text-[10px] text-[#4a4a5a]">{formatTime(message.sentAt)}</span>
      </div>
      <div className={clsx(
        'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed break-words',
        isBroadcaster && 'bg-[var(--color-accent-500)]/15 text-[#e2e2ea] border border-[var(--color-accent-500)]/20',
        !isBroadcaster && isOwn && 'bg-[var(--color-surface-500)] text-[#e2e2ea]',
        !isBroadcaster && !isOwn && 'bg-[var(--color-surface-600)] text-[#c4c4d0]',
      )}>
        {message.text}
      </div>
    </div>
  )
}
