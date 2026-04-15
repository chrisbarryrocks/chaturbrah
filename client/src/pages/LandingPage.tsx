import { Link } from 'react-router-dom'
import { ChaturbrahWordmark } from '../components/ChaturbrahWordmark'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-900)] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-lg w-full space-y-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-[var(--color-live-bg)] text-[var(--color-live)] text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-live)]/20 mb-2">
              <span className="size-1.5 rounded-full bg-[var(--color-live)] animate-pulse" />
              Live Streaming
            </div>
            <div className="flex justify-center">
              <ChaturbrahWordmark variant="hero" linkToHome={false} />
            </div>
            <p className="text-[#8b8ba0] text-lg leading-relaxed">
              a place to <span className="text-[#F5C400] font-semibold">chat</span> with ur{' '}
              <span className="text-[#F5C400] font-semibold">brahs</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/watch"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-lg font-medium cursor-pointer transition-all duration-150 active:scale-[0.97] px-6 py-3 text-base bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] text-white"
            >
              <EyeIcon />
              Watch Stream
            </Link>
            <Link
              to="/broadcast"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-lg font-medium cursor-pointer transition-all duration-150 active:scale-[0.97] px-6 py-3 text-base bg-[var(--color-surface-600)] hover:bg-[var(--color-surface-500)] text-[#c4c4d0] border border-[var(--color-border)]"
            >
              <RadioIcon />
              Start Broadcasting
            </Link>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs border-t" style={{ borderColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.15)' }}>
        Chaturbrah &mdash; powered by <span style={{ color: 'rgba(255,255,255,0.25)' }}>LiveKit</span>
      </footer>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function RadioIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
    </svg>
  )
}
