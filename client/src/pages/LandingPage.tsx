import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChaturbrahWordmark } from '../components/ChaturbrahWordmark'
import { UsernameModal } from '../components/UsernameModal'
import { StreamPreviewVideo } from '../features/watch/StreamPreviewVideo'
import { useUserProfile } from '../context/UserProfileContext'
import { useLiveStreams } from '../hooks/useLiveStreams'

export function LandingPage() {
  const { username } = useUserProfile()
  const navigate = useNavigate()
  const { streams, loading } = useLiveStreams()
  const [showUsernameModal, setShowUsernameModal] = useState(false)

  function handleStartBroadcasting() {
    if (!username) {
      setShowUsernameModal(true)
    } else {
      navigate('/broadcast')
    }
  }

  const isEmpty = !loading && streams.length === 0

  return (
    <div className="min-h-screen bg-[var(--color-surface-900)] flex flex-col">
      {/* Hero */}
      <div className="flex flex-col items-center px-6 pt-16 pb-10 text-center">
        <div className="max-w-lg w-full space-y-8">
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

          {/* CTA — always shown, but merged with empty state when no streams */}
          {!isEmpty && (
            <div className="flex items-center justify-center">
              <button
                onClick={handleStartBroadcasting}
                className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold cursor-pointer transition-all duration-150 active:scale-[0.97] px-6 py-3 text-base bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] text-white"
              >
                <RadioIcon />
                Start Broadcasting
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live stream directory */}
      <div className="w-full max-w-5xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="flex items-center gap-3 text-white/30 text-sm py-4">
            <span className="size-4 border border-white/20 border-t-white/50 rounded-full animate-spin" />
            Loading streams…
          </div>
        ) : streams.length === 0 ? (
          /* Empty state — button lives here so the two feel grouped */
          <div
            className="rounded-2xl px-8 py-12 flex flex-col items-center gap-5 text-center"
            style={{
              background: 'var(--color-surface-800)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex items-center justify-center size-14 rounded-full opacity-20"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
                <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
                <circle cx="12" cy="12" r="2" />
                <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
                <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-white/60 font-semibold text-sm">No one is live right now.</p>
              <p className="text-white/30 text-xs">Be the first to start broadcasting.</p>
            </div>
            <button
              onClick={handleStartBroadcasting}
              className="inline-flex items-center justify-center gap-2 rounded-lg font-semibold cursor-pointer transition-all duration-150 active:scale-[0.97] px-6 py-3 text-sm bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] text-white"
            >
              <RadioIcon />
              Start Broadcasting
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-white font-bold text-lg">Live now</h2>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: 'var(--color-live-bg)',
                  color: 'var(--color-live)',
                  border: '1px solid var(--color-live-border)',
                }}
              >
                {streams.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {streams.map(stream => (
                <StreamCard key={stream.username} stream={stream} />
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="mt-auto py-6 text-center text-xs border-t" style={{ borderColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.15)' }}>
        Chaturbrah &mdash; powered by <span style={{ color: 'rgba(255,255,255,0.25)' }}>LiveKit</span>
      </footer>

      {showUsernameModal && (
        <UsernameModal
          canCancel={false}
          onComplete={() => {
            setShowUsernameModal(false)
            navigate('/broadcast')
          }}
        />
      )}
    </div>
  )
}

interface StreamCardProps {
  stream: {
    username: string
    viewerCount: number
    startedAt: number
  }
}

function StreamCard({ stream }: StreamCardProps) {
  return (
    <Link
      to={`/watch/${stream.username}`}
      className="group block rounded-xl overflow-hidden transition-all duration-150 hover:scale-[1.02] active:scale-[0.99]"
      style={{
        background: 'var(--color-surface-800)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Preview area */}
      <div className="aspect-video relative overflow-hidden">
        <StreamPreviewVideo username={stream.username} />

        {/* Gradient scrim over the bottom for the LIVE badge readability */}
        <div
          className="absolute inset-x-0 bottom-0 h-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}
        />

        {/* LIVE badge */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md"
            style={{
              background: 'var(--color-live)',
              color: '#fff',
              letterSpacing: '0.08em',
            }}
          >
            LIVE
          </span>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-3.5 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{stream.username}</p>
          <p className="text-white/30 text-xs mt-0.5">streaming live</p>
        </div>
        <div className="flex items-center gap-1.5 text-white/35 text-xs shrink-0 ml-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {stream.viewerCount}
        </div>
      </div>
    </Link>
  )
}

function RadioIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
    </svg>
  )
}
