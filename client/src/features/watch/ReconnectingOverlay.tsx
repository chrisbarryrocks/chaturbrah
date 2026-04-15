interface ReconnectingOverlayProps {
  visible: boolean
}

export function ReconnectingOverlay({ visible }: ReconnectingOverlayProps) {
  if (!visible) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl transition-opacity duration-300 z-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="size-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <div className="space-y-1">
          <p className="text-white font-semibold text-sm">Reconnecting…</p>
          <p className="text-white/60 text-xs">This may take a moment</p>
        </div>
      </div>
    </div>
  )
}
