import { useState, useCallback, useRef, useEffect } from 'react'
import type { Room } from 'livekit-client'
import { AppLayout } from '../components/AppLayout'
import { UsernameModal } from '../components/UsernameModal'
import { BroadcasterControls } from '../features/broadcast/BroadcasterControls'
import { ChatPanel } from '../features/chat/ChatPanel'
import { useRoomConnection } from '../hooks/useRoomConnection'
import { useLatencyIndicator } from '../hooks/useLatencyIndicator'
import { useUserProfile } from '../context/UserProfileContext'
import { startStream, endStream } from '../lib/api'

export function BroadcastPage() {
  const { username } = useUserProfile()
  const roomName = username ?? undefined

  const { appState, room, viewerCount, hasRemoteBroadcaster, error, connect, disconnect } =
    useRoomConnection('broadcaster', roomName)

  const [isStreaming, setIsStreaming] = useState(false)
  const latency = useLatencyIndicator(room, 'broadcaster')
  const [identity] = useState(() => `broadcaster-${Date.now()}`)
  const connectRef = useRef(connect)
  connectRef.current = connect
  const didConnectRef = useRef(false)

  // Only connect once we have a username (room name)
  useEffect(() => {
    if (!username) return
    if (didConnectRef.current) return
    didConnectRef.current = true
    void connectRef.current()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  const handleStreamingChange = useCallback(async (streaming: boolean) => {
    setIsStreaming(streaming)
    if (!username) return
    if (streaming) {
      try {
        await startStream(username)
      } catch {
        // stream may already be registered — ignore conflict errors
      }
    } else {
      try {
        await endStream(username)
      } catch {
        // ignore if not found
      }
    }
  }, [username])

  const handleGoLive = useCallback(async (): Promise<Room | null> => {
    return await connectRef.current()
  }, [])

  const handleEndStream = useCallback(async () => {
    await disconnect()
    if (username) {
      didConnectRef.current = false
    }
    void connectRef.current()
  }, [disconnect, username])

  const isConnected = appState === 'connected' || appState === 'reconnecting'

  // If no username, show blocking modal
  if (!username) {
    return (
      <AppLayout>
        <UsernameModal
          canCancel={false}
          onComplete={() => {
            // Context update will re-render with username set
          }}
        />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col lg:flex-row gap-0 min-h-0">
        {/* Main broadcast column */}
        <div className="flex-1 flex flex-col p-5 gap-4 min-w-0">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-extrabold text-2xl tracking-tight">Broadcast</h1>
              <p className="text-white/30 text-xs mt-0.5">
                streaming as <span className="text-white/50 font-medium">{username}</span>
              </p>
              {isStreaming && (
                <span className="inline-flex items-center gap-1.5 text-white/30 text-xs mt-0.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
                </span>
              )}
            </div>
            {/* Status row */}
            <div className="flex items-center gap-2">
              {isConnected && latency !== 'unknown' && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    color: latency === 'low' ? 'var(--color-live)' : latency === 'medium' ? 'var(--color-unstable)' : 'var(--color-reconnecting)',
                    background: latency === 'low' ? 'var(--color-live-bg)' : latency === 'medium' ? 'var(--color-unstable-bg)' : 'var(--color-reconnecting-bg)',
                    border: `1px solid ${latency === 'low' ? 'var(--color-live-border)' : latency === 'medium' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  }}
                >
                  {latency} latency
                </span>
              )}
              {appState === 'connecting' && (
                <span className="text-xs text-white/30 flex items-center gap-1.5">
                  <span className="size-3 border border-white/20 border-t-white/50 rounded-full animate-spin" />
                  Connecting…
                </span>
              )}
            </div>
          </div>

          {/* Another broadcaster is already live */}
          {hasRemoteBroadcaster && !isStreaming && (
            <div className="rounded-lg px-4 py-3 text-sm flex items-start gap-2.5"
              style={{
                background: 'var(--color-unstable-bg)',
                border: '1px solid rgba(245,158,11,0.25)',
                color: 'var(--color-unstable)',
              }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" /><path d="M12 17h.01" />
              </svg>
              Someone is already broadcasting in this room. Go Live is disabled until they end their stream.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm flex items-start gap-2.5"
              style={{
                background: 'var(--color-reconnecting-bg)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: 'var(--color-reconnecting)',
              }}>
              {error}
            </div>
          )}

          {/* Controls */}
          <BroadcasterControls
            appState={appState}
            onGoLive={handleGoLive}
            onEndStream={handleEndStream}
            onStreamingChange={handleStreamingChange}
            goLiveDisabled={hasRemoteBroadcaster}
          />
        </div>

        {/* Chat column */}
        <div
          className="lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l flex flex-col min-h-0"
          style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="h-80 lg:h-full flex flex-col">
            <ChatPanel
              room={room}
              identity={identity}
              senderName={username}
              role="broadcaster"
              isConnected={isConnected}
              isStreaming={isStreaming}
              announceJoin
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
