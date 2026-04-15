import { useState, type KeyboardEvent } from 'react'

interface ChatComposerProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export function ChatComposer({ onSend, disabled = false }: ChatComposerProps) {
  const [draft, setDraft] = useState('')

  const handleSend = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onSend(trimmed)
    setDraft('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="flex-shrink-0 flex items-center gap-2"
      style={{
        padding: '10px 12px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <input
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? 'Connect to chat…' : 'Say something…'}
        maxLength={300}
        className="flex-1 bg-white/5 text-white/80 placeholder-white/20 text-sm rounded-lg px-3 py-2 border transition-colors duration-150 disabled:opacity-40 focus:outline-none focus:border-[var(--color-accent-500)]"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !draft.trim()}
        className="flex-shrink-0 flex items-center justify-center size-8 bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] text-white rounded-lg transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
        aria-label="Send message"
      >
        <SendIcon />
      </button>
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}
