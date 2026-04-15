import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'accent' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function PrimaryButton({
  children,
  variant = 'accent',
  size = 'md',
  loading = false,
  className,
  disabled,
  ...props
}: PrimaryButtonProps) {
  const variants = {
    accent: 'bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-[var(--color-surface-600)] hover:bg-[var(--color-surface-500)] text-[#c4c4d0] border border-[var(--color-border)]',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      {...props}
      disabled={disabled ?? loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium cursor-pointer',
        'transition-all duration-150 active:scale-[0.97]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading && (
        <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
