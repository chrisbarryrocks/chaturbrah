import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  active?: boolean
  destructive?: boolean
  label: string
}

export function IconButton({
  children,
  active = true,
  destructive = false,
  label,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex items-center justify-center size-10 rounded-xl cursor-pointer',
        'transition-all duration-150 active:scale-[0.95]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        !active && 'bg-[var(--color-reconnecting-bg)] text-[var(--color-reconnecting)] hover:bg-red-900/30',
        active && !destructive && 'bg-[var(--color-surface-600)] text-[#c4c4d0] hover:bg-[var(--color-surface-500)] hover:text-white border border-[var(--color-border)]',
        destructive && 'bg-red-600 text-white hover:bg-red-700',
        className,
      )}
    >
      {children}
    </button>
  )
}
