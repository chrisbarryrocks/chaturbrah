import type { ReactNode } from 'react'
import { ChaturbrahWordmark } from './ChaturbrahWordmark'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-full flex flex-col" style={{ background: 'var(--color-surface-900)' }}>
      <header
        className="flex-shrink-0 flex items-center px-4 sm:px-5 min-h-14 py-2 border-b"
        style={{
          background: 'var(--gradient-header)',
          borderColor: 'rgba(255,255,255,0.06)',
          boxShadow: 'var(--shadow-panel)',
        }}
      >
        <ChaturbrahWordmark variant="header" />
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
