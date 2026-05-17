interface AiChattersToggleProps {
  isActive: boolean
  isLoading: boolean
  isDisabled: boolean
  error: string | null
  onStart: () => void
  onStop: () => void
}

export function AiChattersToggle({
  isActive,
  isLoading,
  isDisabled,
  error,
  onStart,
  onStop,
}: AiChattersToggleProps) {
  const handleClick = () => {
    if (isLoading || isDisabled) return
    if (isActive) {
      onStop()
    } else {
      onStart()
    }
  }

  const label = isLoading
    ? isActive
      ? 'Stopping…'
      : 'Starting…'
    : isActive
      ? 'Stop AI Chatters'
      : 'Start AI Chatters'

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handleClick}
        disabled={isDisabled || isLoading}
        className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        style={
          isActive
            ? {
                background: 'rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.4)',
                color: '#a78bfa',
              }
            : {
                background: 'var(--color-surface-700)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
              }
        }
        aria-label={label}
      >
        {isLoading ? (
          <span
            className="size-3.5 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
            style={{ borderColor: isActive ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.3)', borderTopColor: 'transparent' }}
          />
        ) : (
          <BotIcon active={isActive} />
        )}
        {label}
        {isActive && !isLoading && (
          <span className="ml-auto size-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
        )}
      </button>

      {error && (
        <p className="text-[11px] leading-snug px-1" style={{ color: 'var(--color-reconnecting)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

function BotIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: active ? '#a78bfa' : 'rgba(255,255,255,0.35)', flexShrink: 0 }}
    >
      <rect width="18" height="10" x="3" y="11" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" x2="8" y1="16" y2="16" />
      <line x1="16" x2="16" y1="16" y2="16" />
    </svg>
  )
}
