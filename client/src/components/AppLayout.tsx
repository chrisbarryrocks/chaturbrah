import { useState, type ReactNode } from 'react'
import { ChaturbrahWordmark } from './ChaturbrahWordmark'
import { UsernameModal } from './UsernameModal'
import { useUserProfile } from '../context/UserProfileContext'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { username } = useUserProfile()
  const [showEditModal, setShowEditModal] = useState(false)

  return (
    <div className="min-h-full flex flex-col" style={{ background: 'var(--color-surface-900)' }}>
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 sm:px-5 min-h-14 py-2 border-b"
        style={{
          background: 'var(--gradient-header)',
          borderColor: 'rgba(255,255,255,0.06)',
          boxShadow: 'var(--shadow-panel)',
        }}
      >
        <ChaturbrahWordmark variant="header" />

        {/* Username pill */}
        <div>
          {username ? (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/60 hover:text-white/90 transition-colors cursor-pointer group"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              title="Change username"
            >
              <span>{username}</span>
              <PencilIcon />
            </button>
          ) : (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/40 hover:text-white/70 transition-colors cursor-pointer"
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              Set username
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {showEditModal && (
        <UsernameModal
          canCancel
          onComplete={() => setShowEditModal(false)}
          onCancel={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}

function PencilIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-90">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}
