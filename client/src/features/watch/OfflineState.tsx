import type { StreamState } from '../../types'

interface OfflineStateProps {
  streamState: StreamState
}

export function OfflineState({ streamState }: OfflineStateProps) {
  const isOffline = streamState === 'offline'
  const isEnded = streamState === 'ended'

  return (
    <div
      className="w-full aspect-video rounded-xl overflow-hidden flex flex-col items-center justify-center gap-5 text-center px-6 relative"
      style={{
        background: 'var(--color-surface-800)',
        boxShadow: 'var(--shadow-panel)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Accent stripe at the top */}
      <div
        className="absolute top-0 inset-x-0 h-0.5 rounded-t-xl"
        style={{
          background: isOffline
            ? 'linear-gradient(to right, transparent, #F5C400 40%, #F5C400 60%, transparent)'
            : isEnded
            ? 'linear-gradient(to right, transparent, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.15) 60%, transparent)'
            : 'transparent',
        }}
      />

      {/* Inner card */}
      <div
        className="flex flex-col items-center gap-5 rounded-xl px-8 py-7 max-w-xs"
        style={{
          background: 'var(--color-surface-inner)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center justify-center size-14 rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          {isOffline ? <AntennaIcon /> : isEnded ? <ClapperIcon /> : <SpinnerIcon />}
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold text-lg">
            {isOffline ? 'Stream is offline' : isEnded ? 'Stream has ended' : 'Loading stream…'}
          </p>
          <p className="text-white/35 text-sm leading-relaxed">
            {isOffline
              ? "The broadcaster hasn't started yet. Hang tight."
              : isEnded
              ? 'Thanks for watching. The broadcaster has wrapped up.'
              : 'Connecting to the live broadcast.'}
          </p>
        </div>
        {isOffline && (
          <div className="flex items-center gap-2 text-[#F5C400]/60 text-xs font-medium">
            <span className="size-1.5 rounded-full bg-[#F5C400]/60 animate-pulse" />
            Waiting for broadcast
          </div>
        )}
      </div>
    </div>
  )
}

function AntennaIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F5C400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
      <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10" />
      <path d="M5 12c0-3.87 3.13-7 7-7s7 3.13 7 7" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <path d="M12 13v8" />
      <path d="M9 21h6" />
    </svg>
  )
}

function ClapperIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/25">
      <path d="M2 6h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Z" />
      <path d="M2 6 7 2h10l5 4" />
      <path d="M7 2v4" />
      <path d="M12 2v4" />
      <path d="M17 2v4" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <div className="size-6 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
  )
}
