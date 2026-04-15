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
    <div className="px-3 py-3 border-t border-[var(--color-border)]">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Connect to chat…' : 'Send a message…'}
          maxLength={300}
          className="flex-1 bg-[var(--color-surface-700)] text-[#e2e2ea] placeholder-[#4a4a5a] text-sm rounded-lg px-3 py-2 border border-[var(--color-border)] focus:border-[var(--color-accent-500)] focus:outline-none transition-colors duration-150 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !draft.trim()}
          className="flex-shrink-0 bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] text-white rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}
