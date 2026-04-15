import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import cbHat from '../assets/cb.png'

export type WordmarkVariant = 'header' | 'hero'

interface ChaturbrahWordmarkProps {
  variant?: WordmarkVariant
  className?: string
  /** Wrap in a home link (header); false for decorative hero block */
  linkToHome?: boolean
}

const textSizes = {
  header:
    'text-[1.625rem] sm:text-[1.875rem] leading-none tracking-[-0.045em]',
  hero:
    'text-[2.75rem] sm:text-[3.35rem] md:text-[4rem] leading-[0.92] tracking-[-0.05em]',
} as const

// Heights match the font-size of each variant exactly so the icon appears
// the same height as the text cap. (em on a sibling img inherits the
// container's font-size, not the span's, so we use explicit rem values.)
const iconSizes = {
  header: 'h-[1.625rem] sm:h-[1.875rem] w-auto shrink-0',
  hero: 'h-[2.75rem] sm:h-[3.35rem] md:h-[4rem] w-auto shrink-0',
} as const

const inner = (variant: WordmarkVariant) => (
  <>
    <span
      className={clsx(
        'font-wordmark font-extrabold italic whitespace-nowrap',
        textSizes[variant],
      )}
    >
      <span className="text-[#F3F4F6]">Chatur</span>
      <span className="text-[#F5C400]">brah</span>
    </span>
    <img
      src={cbHat}
      alt=""
      decoding="async"
      className={clsx(iconSizes[variant], 'select-none pointer-events-none')}
      aria-hidden
    />
  </>
)

export function ChaturbrahWordmark({
  variant = 'header',
  className,
  linkToHome = true,
}: ChaturbrahWordmarkProps) {
  const row = clsx(
    'inline-flex items-center gap-[0.28em]',
    className,
  )

  if (linkToHome) {
    return (
      <Link
        to="/"
        className={clsx(
          row,
          'rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-500)]',
        )}
      >
        {inner(variant)}
      </Link>
    )
  }

  return <span className={row}>{inner(variant)}</span>
}
