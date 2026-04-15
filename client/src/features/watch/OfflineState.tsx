import type { StreamState } from '../../types'

interface OfflineStateProps {
  streamState: StreamState
}

const config: Record<StreamState, { icon: string; title: string; description: string }> = {
  offline: {
    icon: '📡',
    title: 'Stream is offline',
    description: 'The broadcaster hasn\'t started yet. Hang tight.',
  },
  ended: {
    icon: '🎬',
    title: 'Stream has ended',
    description: 'Thanks for watching. The broadcaster has wrapped up.',
  },
  live: {
    icon: '📺',
    title: 'Loading stream…',
    description: 'Connecting to the live broadcast.',
  },
}

export function OfflineState({ streamState }: OfflineStateProps) {
  const { icon, title, description } = config[streamState]

  return (
    <div className="w-full aspect-video bg-[var(--color-surface-800)] rounded-xl border border-[var(--color-border)] flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="text-6xl opacity-25">{icon}</div>
      <div className="space-y-2">
        <p className="text-[#e2e2ea] font-semibold text-xl">{title}</p>
        <p className="text-[#6b6b80] text-sm max-w-sm">{description}</p>
      </div>
      {streamState === 'offline' && (
        <div className="mt-2 flex items-center gap-2 text-[#6b6b80] text-xs">
          <span className="size-1.5 rounded-full bg-[#6b6b80] animate-pulse" />
          Waiting for broadcast
        </div>
      )}
    </div>
  )
}
