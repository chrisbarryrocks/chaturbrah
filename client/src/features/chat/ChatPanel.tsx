import type { Room } from 'livekit-client'
import { useChatMessages } from '../../hooks/useChatMessages'
import { ChatMessageList } from './ChatMessageList'
import { ChatComposer } from './ChatComposer'

interface ChatPanelProps {
  room: Room | null
  identity: string
  role: 'broadcaster' | 'viewer'
  isConnected: boolean
}

export function ChatPanel({ room, identity, role, isConnected }: ChatPanelProps) {
  const { messages, sendMessage } = useChatMessages(room, role, identity)

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface-800)] border border-[var(--color-border)] rounded-xl overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#e2e2ea]">Chat</h2>
          {isConnected && (
            <span className="text-xs text-[#6b6b80]">{messages.length} messages</span>
          )}
        </div>
      </div>

      <ChatMessageList messages={messages} localSenderId={identity} />

      <ChatComposer onSend={sendMessage} disabled={!isConnected} />
    </div>
  )
}
