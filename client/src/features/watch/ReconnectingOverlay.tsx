interface ReconnectingOverlayProps {
  visible: boolean
}

export function ReconnectingOverlay({ visible }: ReconnectingOverlayProps) {
  if (!visible) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl z-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex items-center justify-center size-14">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 rounded-full border-2 border-t-white/70 border-x-transparent border-b-transparent animate-spin" />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-white font-semibold">Reconnecting…</p>
          <p className="text-white/45 text-sm">Hang tight, this may take a moment</p>
        </div>
      </div>
    </div>
  )
}
