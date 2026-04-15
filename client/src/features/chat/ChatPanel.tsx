import type { Room } from 'livekit-client'
import { useChatMessages } from '../../hooks/useChatMessages'
import { ChatMessageList } from './ChatMessageList'
import { ChatComposer } from './ChatComposer'

interface ChatPanelProps {
  room: Room | null
  identity: string
  senderName: string
  role: 'broadcaster' | 'viewer'
  isConnected: boolean
  onToggleCollapse?: () => void
}

export function ChatPanel({
  room,
  identity,
  senderName,
  role,
  isConnected,
  onToggleCollapse,
}: ChatPanelProps) {
  const { messages, sendMessage } = useChatMessages(room, role, identity, senderName)

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--color-surface-800)' }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center justify-between border-b"
        style={{
          padding: '10px 14px',
          borderColor: 'rgba(255,255,255,0.05)',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white/80 text-sm">Live Chat</span>
          {isConnected && messages.length > 0 && (
            <span className="text-white/25 text-xs">{messages.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className={`size-1.5 rounded-full ${isConnected ? 'bg-[var(--color-live)]' : 'bg-white/15'}`} />
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              aria-label="Collapse chat"
              className="flex items-center justify-center size-6 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <ChatMessageList messages={messages} localSenderId={identity} />
      <ChatComposer onSend={sendMessage} disabled={!isConnected} />
    </div>
  )
}
