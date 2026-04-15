import { useState, useEffect, useRef } from 'react'
import { AppLayout } from '../components/AppLayout'
import { ViewerPlayer } from '../features/watch/ViewerPlayer'
import { ViewerStatusBar } from '../features/watch/ViewerStatusBar'
import { OfflineState } from '../features/watch/OfflineState'
import { ReconnectingOverlay } from '../features/watch/ReconnectingOverlay'
import { ChatPanel } from '../features/chat/ChatPanel'
import { PrimaryButton } from '../components/PrimaryButton'
import { useRoomConnection } from '../hooks/useRoomConnection'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import { useLatencyIndicator } from '../hooks/useLatencyIndicator'
import { useLiveTimer } from '../hooks/useLiveTimer'
import type { StreamState } from '../types'

function randomViewerName() {
  const n = Math.floor(Math.random() * 9000) + 1000
  return `Viewer ${n}`
}

export function WatchPage() {
  const { appState, room, remoteParticipant, hasRemoteVideo, viewerCount, error, connect, disconnect } =
    useRoomConnection('viewer')
  const connectionQuality = useConnectionStatus(room)
  const latency = useLatencyIndicator(room, 'viewer')
  const [identity] = useState(() => `viewer-${Date.now()}`)
  const [viewerName] = useState(randomViewerName)
  const [streamState, setStreamState] = useState<StreamState>('offline')
  const [showChat, setShowChat] = useState(true)
  const elapsedTime = useLiveTimer(streamState === 'live')
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const didConnectRef = useRef(false)

  useEffect(() => {
    if (didConnectRef.current) return
    didConnectRef.current = true
    void connect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (hasRemoteVideo) {
      setStreamState('live')
    } else if (appState === 'connected' || appState === 'reconnecting') {
      setStreamState(prev => (prev === 'ended' ? 'ended' : 'offline'))
    } else if (appState === 'disconnected') {
      setStreamState(prev => (prev === 'live' ? 'ended' : 'offline'))
    }
  }, [appState, hasRemoteVideo])

  const isLive = streamState === 'live'
  const isConnecting = appState === 'connecting'
  const isReconnecting = appState === 'reconnecting'
  const showError = appState === 'error'
  const showPlayer = hasRemoteVideo || (isReconnecting && streamState === 'live')
  const showOffline = !showPlayer && !isConnecting && !showError

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        {/* Video column */}
        <div className="flex-1 flex flex-col p-4 sm:p-5 gap-4 min-w-0">

          {isConnecting && (
            <div className="w-full aspect-video rounded-xl flex flex-col items-center justify-center gap-4"
              style={{
                background: 'var(--color-surface-800)',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: 'var(--shadow-panel)',
              }}>
              <div className="size-10 border-2 border-white/10 border-t-[var(--color-accent-400)] rounded-full animate-spin" />
              <p className="text-white/30 text-sm">Connecting to stream…</p>
            </div>
          )}

          {showError && (
            <div className="w-full aspect-video rounded-xl flex flex-col items-center justify-center gap-5 px-6 text-center"
              style={{
                background: 'var(--color-surface-800)',
                border: '1px solid rgba(239,68,68,0.2)',
                boxShadow: 'var(--shadow-panel)',
              }}>
              <div className="flex items-center justify-center size-14 rounded-full bg-[var(--color-reconnecting-bg)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-reconnecting)]">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" /><path d="M12 17h.01" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <p className="text-white font-semibold">Failed to connect</p>
                <p className="text-white/40 text-sm">{error ?? 'Something went wrong.'}</p>
              </div>
              <PrimaryButton variant="ghost" size="sm" onClick={() => void connect()}>
                Try Again
              </PrimaryButton>
            </div>
          )}

          {showOffline && <OfflineState streamState={streamState} />}

          {showPlayer && (
            <div className="relative">
              <ViewerPlayer
                participant={remoteParticipant}
                hasVideo={hasRemoteVideo}
                isLive={isLive}
                containerRef={playerContainerRef}
              />
              <ReconnectingOverlay visible={isReconnecting} />
            </div>
          )}

          {/* Info bar — only when live */}
          {isLive && (
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-white font-bold text-base leading-tight truncate">Live on Chaturbrah</h1>
                  {elapsedTime && (
                    <span className="flex-shrink-0 text-[11px] text-white/30 font-mono bg-white/5 px-2 py-0.5 rounded-md">
                      {elapsedTime}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <ViewerCountBadge count={viewerCount} />
                </div>
              </div>
              <ViewerStatusBar
                isLive={isLive}
                connectionQuality={connectionQuality}
                latency={latency}
              />
            </div>
          )}

          {appState === 'disconnected' && streamState === 'ended' && (
            <div className="flex justify-center">
              <PrimaryButton
                variant="ghost"
                size="sm"
                onClick={() => void disconnect().then(() => connect())}
              >
                Reconnect
              </PrimaryButton>
            </div>
          )}
        </div>

        {/* Chat column */}
        {showChat ? (
          <div
            className="border-t lg:border-t-0 lg:border-l flex flex-col min-h-0 lg:w-80 xl:w-96 h-80 lg:h-auto"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <ChatPanel
              room={room}
              identity={identity}
              senderName={viewerName}
              role="viewer"
              isConnected={appState === 'connected' || isReconnecting}
              onToggleCollapse={() => setShowChat(false)}
            />
          </div>
        ) : (
          <div className="hidden lg:flex absolute top-4 right-4 z-20">
            <button
              onClick={() => setShowChat(true)}
              aria-label="Open chat"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/50 hover:text-white/90 transition-colors cursor-pointer"
              style={{
                background: 'var(--color-surface-800)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'var(--shadow-float)',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span className="text-xs font-medium">Chat</span>
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function ViewerCountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-white/35 text-xs">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      {count} {count === 1 ? 'viewer' : 'viewers'}
    </span>
  )
}
