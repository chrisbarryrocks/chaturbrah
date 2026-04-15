import { LiveBadge, ConnectionBadge, LatencyBadge } from '../../components/StatusBadge'
import type { ConnectionQuality, LatencyLevel } from '../../types'

interface ViewerStatusBarProps {
  isLive: boolean
  connectionQuality: ConnectionQuality
  latency: LatencyLevel
}

export function ViewerStatusBar({ isLive, connectionQuality, latency }: ViewerStatusBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {isLive && <LiveBadge />}
      <ConnectionBadge quality={connectionQuality} />
      <LatencyBadge level={latency} />
    </div>
  )
}
