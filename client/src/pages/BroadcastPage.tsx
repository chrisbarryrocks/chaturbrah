import { useState, useCallback, useRef } from 'react'
import type { Room } from 'livekit-client'
import { AppLayout } from '../components/AppLayout'
import { BroadcasterControls } from '../features/broadcast/BroadcasterControls'
import { ChatPanel } from '../features/chat/ChatPanel'
import { useRoomConnection } from '../hooks/useRoomConnection'
import { useLatencyIndicator } from '../hooks/useLatencyIndicator'

export function BroadcastPage() {
  const { appState, room, error, connect, disconnect } = useRoomConnection('broadcaster')
  const latency = useLatencyIndicator(room, 'broadcaster')
  const [identity] = useState(() => `broadcaster-${Date.now()}`)
  const connectRef = useRef(connect)
  connectRef.current = connect

  // Return the Room directly so BroadcasterControls can publish tracks
  // immediately without waiting for React state to flush.
  const handleGoLive = useCallback(async (): Promise<Room | null> => {
    return await connectRef.current()
  }, [])

  const handleEndStream = useCallback(async () => {
    await disconnect()
  }, [disconnect])

  const isConnected = appState === 'connected' || appState === 'reconnecting'

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col lg:flex-row gap-0 min-h-0">
        <div className="flex-1 flex flex-col p-5 gap-4 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[#e2e2ea] font-bold text-xl">Broadcast</h1>
              <p className="text-[#4a4a5a] text-xs mt-0.5">chaturbrah-main</p>
            </div>
            {isConnected && latency !== 'unknown' && (
              <span className="text-xs text-[#6b6b80] bg-[var(--color-surface-700)] border border-[var(--color-border)] px-2.5 py-1 rounded-full">
                {latency} latency
              </span>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-[var(--color-reconnecting-bg)] border border-[var(--color-reconnecting)]/30 px-4 py-3 text-[var(--color-reconnecting)] text-sm">
              {error}
            </div>
          )}

          <BroadcasterControls
            appState={appState}
            onGoLive={handleGoLive}
            onEndStream={handleEndStream}
          />
        </div>

        <div className="lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-[var(--color-border)] flex flex-col min-h-0">
          <div className="h-80 lg:h-full flex flex-col">
            <ChatPanel
              room={room}
              identity={identity}
              role="broadcaster"
              isConnected={isConnected}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
