import { formatTime } from '../../utils/chat'
import type { ChatMessage } from '../../types'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwn: boolean
}

export function ChatMessageItem({ message, isOwn }: ChatMessageItemProps) {
  if (message.senderRole === 'system') {
    return (
      <div className="flex items-center gap-2 my-1">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <span className="text-[11px] text-white/30 italic shrink-0 select-none">
          {message.text}
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </div>
    )
  }

  const isBroadcaster = message.senderRole === 'broadcaster'
  const isAiBot = message.senderRole === 'ai-bot'
  const displayName = message.senderName || (isBroadcaster ? 'Streamer' : 'Viewer')

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-baseline gap-1.5">
        <span className={[
          'font-semibold text-xs shrink-0',
          isBroadcaster ? 'text-[#F5C400]' : isOwn ? 'text-white/60' : 'text-white/45',
        ].join(' ')}>
          {displayName}
        </span>
        {isAiBot && (
          <span
            className="text-[9px] font-semibold px-1 py-px rounded shrink-0 tracking-wide"
            style={{
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.25)',
              color: '#a78bfa',
            }}
          >
            AI
          </span>
        )}
        <span className="text-[10px] text-white/20 font-mono">
          {formatTime(message.sentAt)}
        </span>
      </div>
      <p className={[
        'text-sm break-words leading-relaxed',
        isBroadcaster ? 'text-white/90' : 'text-white/70',
      ].join(' ')}>
        {message.text}
      </p>
    </div>
  )
}
