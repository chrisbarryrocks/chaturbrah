import { useState, useEffect } from 'react'
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
import type { StreamState } from '../types'

export function WatchPage() {
  const { appState, room, remoteParticipant, hasRemoteVideo, error, connect, disconnect } =
    useRoomConnection('viewer')
  const connectionQuality = useConnectionStatus(room)
  const latency = useLatencyIndicator(room, 'viewer')
  const [identity] = useState(() => `viewer-${Date.now()}`)
  const [streamState, setStreamState] = useState<StreamState>('offline')

  useEffect(() => {
    void connect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Stream is only "live" when there is actual video being published.
  // A remote participant being present in the room is not enough — the
  // broadcaster must have published a video track.
  useEffect(() => {
    if (hasRemoteVideo) {
      setStreamState('live')
    } else if (appState === 'connected' || appState === 'reconnecting') {
      // Connected but no video yet — keep any 'ended' state, otherwise offline
      setStreamState(prev => (prev === 'ended' ? 'ended' : 'offline'))
    } else if (appState === 'disconnected') {
      setStreamState(prev => (prev === 'live' ? 'ended' : 'offline'))
    }
  }, [appState, hasRemoteVideo])

  const isLive = streamState === 'live'
  const isConnecting = appState === 'connecting'
  const isReconnecting = appState === 'reconnecting'
  const showError = appState === 'error'

  // Show the player only when there is actual video (or we're reconnecting mid-stream)
  const showPlayer = hasRemoteVideo || (isReconnecting && streamState === 'live')
  const showOffline = !showPlayer && !isConnecting && !showError

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <div className="flex-1 flex flex-col p-4 sm:p-5 gap-4 min-w-0">

          {isConnecting && (
            <div className="w-full aspect-video bg-[var(--color-surface-800)] rounded-xl border border-[var(--color-border)] flex flex-col items-center justify-center gap-4">
              <div className="size-10 border-2 border-[var(--color-border)] border-t-[var(--color-accent-400)] rounded-full animate-spin" />
              <p className="text-[#6b6b80] text-sm">Connecting to stream…</p>
            </div>
          )}

          {showError && (
            <div className="w-full aspect-video bg-[var(--color-surface-800)] rounded-xl border border-[var(--color-reconnecting)]/30 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="text-4xl opacity-30">⚠️</div>
              <div className="space-y-2">
                <p className="text-[#e2e2ea] font-semibold">Failed to connect</p>
                <p className="text-[#6b6b80] text-sm">{error ?? 'Something went wrong.'}</p>
              </div>
              <PrimaryButton variant="ghost" size="sm" onClick={() => void connect()}>
                Try Again
              </PrimaryButton>
            </div>
          )}

          {showOffline && (
            <OfflineState streamState={streamState} />
          )}

          {showPlayer && (
            <div className="relative">
              <ViewerPlayer participant={remoteParticipant} hasVideo={hasRemoteVideo} />
              <ReconnectingOverlay visible={isReconnecting} />
            </div>
          )}

          {/* Info bar — only shown when actually live */}
          {isLive && (
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-[#e2e2ea] font-bold text-lg leading-tight">Live on Chaturbrah</h1>
                <p className="text-[#6b6b80] text-xs">chaturbrah-main</p>
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

        <div className="lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-[var(--color-border)] flex flex-col min-h-0">
          <div className="h-80 lg:h-full flex flex-col">
            <ChatPanel
              room={room}
              identity={identity}
              role="viewer"
              isConnected={appState === 'connected' || isReconnecting}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
