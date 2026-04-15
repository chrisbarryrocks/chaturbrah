import { clsx } from 'clsx'
import type { ConnectionQuality, LatencyLevel } from '../types'

interface BadgeProps {
  className?: string
}

export function LiveBadge({ className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
      'bg-[var(--color-live-bg)] text-[var(--color-live)] border border-[var(--color-live)]/20',
      className,
    )}>
      <span className="size-1.5 rounded-full bg-[var(--color-live)] animate-pulse" />
      LIVE
    </span>
  )
}

interface ConnectionBadgeProps extends BadgeProps {
  quality: ConnectionQuality
}

export function ConnectionBadge({ quality, className }: ConnectionBadgeProps) {
  const config = {
    good: {
      label: 'Good',
      color: 'bg-[var(--color-live-bg)] text-[var(--color-live)] border-[var(--color-live)]/20',
      dot: 'bg-[var(--color-live)]',
    },
    unstable: {
      label: 'Unstable',
      color: 'bg-[var(--color-unstable-bg)] text-[var(--color-unstable)] border-[var(--color-unstable)]/20',
      dot: 'bg-[var(--color-unstable)]',
    },
    reconnecting: {
      label: 'Reconnecting',
      color: 'bg-[var(--color-reconnecting-bg)] text-[var(--color-reconnecting)] border-[var(--color-reconnecting)]/20',
      dot: 'bg-[var(--color-reconnecting)] animate-pulse',
    },
  }[quality]

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border',
      config.color,
      className,
    )}>
      <span className={clsx('size-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}

interface LatencyBadgeProps extends BadgeProps {
  level: LatencyLevel
}

export function LatencyBadge({ level, className }: LatencyBadgeProps) {
  if (level === 'unknown') return null

  const config = {
    low: { label: 'Low delay', color: 'text-[var(--color-live)] bg-[var(--color-live-bg)] border-[var(--color-live)]/20' },
    medium: { label: 'Medium delay', color: 'text-[var(--color-unstable)] bg-[var(--color-unstable-bg)] border-[var(--color-unstable)]/20' },
    high: { label: 'High delay', color: 'text-[var(--color-reconnecting)] bg-[var(--color-reconnecting-bg)] border-[var(--color-reconnecting)]/20' },
  }[level]

  return (
    <span className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border',
      config.color,
      className,
    )}>
      {config.label}
    </span>
  )
}
