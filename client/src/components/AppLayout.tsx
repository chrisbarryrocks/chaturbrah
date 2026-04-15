import type { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-full flex flex-col bg-[var(--color-surface-900)]">
      <header className="flex-shrink-0 flex items-center px-5 h-14 border-b border-[var(--color-border)] bg-[var(--color-surface-800)]">
        <a href="/" className="text-white font-bold text-lg tracking-tight hover:text-[var(--color-accent-400)] transition-colors duration-150">
          Chaturbrah
        </a>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
