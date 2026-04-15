import { clsx } from 'clsx'
import type { ConnectionQuality, LatencyLevel } from '../types'

interface BadgeProps {
  className?: string
}

export function LiveBadge({ className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase',
      'bg-[var(--color-live)] text-white shadow-[0_0_8px_rgba(34,197,94,0.35)]',
      className,
    )}>
      <span className="size-1.5 rounded-full bg-white/80 animate-pulse" />
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
      style: 'bg-[var(--color-live-bg)] text-[var(--color-live)]',
      border: 'border-[var(--color-live-border)]',
      dot: 'bg-[var(--color-live)]',
    },
    unstable: {
      label: 'Unstable',
      style: 'bg-[var(--color-unstable-bg)] text-[var(--color-unstable)]',
      border: 'border-[rgba(245,158,11,0.25)]',
      dot: 'bg-[var(--color-unstable)]',
    },
    reconnecting: {
      label: 'Reconnecting',
      style: 'bg-[var(--color-reconnecting-bg)] text-[var(--color-reconnecting)]',
      border: 'border-[rgba(239,68,68,0.25)]',
      dot: 'bg-[var(--color-reconnecting)] animate-pulse',
    },
  }[quality]

  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold border',
      config.style,
      config.border,
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
    low: {
      label: 'Low delay',
      style: 'bg-[var(--color-live-bg)] text-[var(--color-live)] border-[var(--color-live-border)]',
    },
    medium: {
      label: 'Med delay',
      style: 'bg-[var(--color-unstable-bg)] text-[var(--color-unstable)] border-[rgba(245,158,11,0.25)]',
    },
    high: {
      label: 'High delay',
      style: 'bg-[var(--color-reconnecting-bg)] text-[var(--color-reconnecting)] border-[rgba(239,68,68,0.25)]',
    },
  }[level]

  return (
    <span className={clsx(
      'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold border',
      config.style,
      className,
    )}>
      {config.label}
    </span>
  )
}
