import { useState, useEffect, useCallback, useRef } from 'react'
import {
  type Room,
  createLocalVideoTrack,
  createLocalAudioTrack,
  type LocalVideoTrack,
  type LocalAudioTrack,
} from 'livekit-client'
import { PrimaryButton } from '../../components/PrimaryButton'
import { IconButton } from '../../components/IconButton'
import type { AppState } from '../../types'

interface BroadcasterControlsProps {
  appState: AppState
  onGoLive: () => Promise<Room | null>
  onEndStream: () => Promise<void>
  onStreamingChange?: (isStreaming: boolean) => void
}

export function BroadcasterControls({
  appState,
  onGoLive,
  onEndStream,
  onStreamingChange,
}: BroadcasterControlsProps) {
  const [micEnabled, setMicEnabled] = useState(true)
  const [camEnabled, setCamEnabled] = useState(true)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isGoingLive, setIsGoingLive] = useState(false)
  const videoTrackRef = useRef<LocalVideoTrack | null>(null)
  const audioTrackRef = useRef<LocalAudioTrack | null>(null)
  const liveRoomRef = useRef<Room | null>(null)

  const startPreview = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setLocalStream(stream)
      setPreviewError(null)
    } catch {
      setPreviewError('Unable to access camera or microphone. Check your browser permissions.')
    }
  }, [])

  useEffect(() => {
    void startPreview()
    return () => {
      localStream?.getTracks().forEach(t => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGoLive = async () => {
    setPublishError(null)
    setIsGoingLive(true)
    try {
      const connectedRoom = await onGoLive()
      if (!connectedRoom) {
        setIsGoingLive(false)
        return
      }

      const videoTrack = await createLocalVideoTrack({ facingMode: 'user' })
      const audioTrack = await createLocalAudioTrack()
      videoTrackRef.current = videoTrack
      audioTrackRef.current = audioTrack
      liveRoomRef.current = connectedRoom

      await connectedRoom.localParticipant.publishTrack(videoTrack)
      await connectedRoom.localParticipant.publishTrack(audioTrack)

      setCamEnabled(true)
      setMicEnabled(true)
      setIsStreaming(true)
      onStreamingChange?.(true)

      const liveStream = new MediaStream([videoTrack.mediaStreamTrack])
      setLocalStream(liveStream)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to publish stream'
      setPublishError(msg)
      videoTrackRef.current?.stop()
      audioTrackRef.current?.stop()
      videoTrackRef.current = null
      audioTrackRef.current = null
    } finally {
      setIsGoingLive(false)
    }
  }

  const handleEndStream = async () => {
    videoTrackRef.current?.stop()
    audioTrackRef.current?.stop()
    videoTrackRef.current = null
    audioTrackRef.current = null
    liveRoomRef.current = null
    setLocalStream(null)
    setPublishError(null)
    setIsStreaming(false)
    onStreamingChange?.(false)
    await onEndStream()
    void startPreview()
  }

  const toggleMic = async () => {
    const room = liveRoomRef.current
    const next = !micEnabled
    setMicEnabled(next)
    if (room) {
      await room.localParticipant.setMicrophoneEnabled(next)
    } else {
      localStream?.getAudioTracks().forEach(t => { t.enabled = next })
    }
  }

  const toggleCam = async () => {
    const room = liveRoomRef.current
    const next = !camEnabled
    setCamEnabled(next)
    if (room) {
      await room.localParticipant.setCameraEnabled(next)
      if (next) {
        const pub = Array.from(room.localParticipant.videoTrackPublications.values())[0]
        if (pub?.track) {
          setLocalStream(new MediaStream([pub.track.mediaStreamTrack]))
        }
      }
    } else {
      localStream?.getVideoTracks().forEach(t => { t.enabled = next })
    }
  }

  const isLive = isStreaming
  const isConnecting = isGoingLive && appState === 'connecting'
  const isPreview = !isLive && !isGoingLive

  return (
    <div className="flex flex-col gap-3">
      {/* Error banners */}
      {previewError && (
        <div className="rounded-lg px-4 py-3 text-sm flex items-start gap-2.5"
          style={{
            background: 'var(--color-reconnecting-bg)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: 'var(--color-reconnecting)',
          }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {previewError}
        </div>
      )}
      {publishError && (
        <div className="rounded-lg px-4 py-3 text-sm flex items-start gap-2.5"
          style={{
            background: 'var(--color-reconnecting-bg)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: 'var(--color-reconnecting)',
          }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          Failed to publish stream: {publishError}
        </div>
      )}

      {/* Mode banner */}
      {isPreview && !previewError && (
        <div className="flex items-center gap-2.5 rounded-lg px-4 py-2.5"
          style={{
            background: 'var(--color-surface-700)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'var(--shadow-panel)',
          }}>
          <span className="size-2 rounded-full bg-white/20" />
          <span className="text-white/50 text-sm font-medium">Preview mode</span>
          <span className="text-white/20 text-xs ml-auto">Not broadcasting</span>
        </div>
      )}
      {isConnecting && (
        <div className="flex items-center gap-2.5 rounded-lg px-4 py-2.5"
          style={{
            background: 'var(--color-unstable-bg)',
            border: '1px solid rgba(245,158,11,0.25)',
          }}>
          <span className="size-4 border-2 border-[var(--color-unstable)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <span className="text-[var(--color-unstable)] text-sm font-medium">Connecting to LiveKit…</span>
        </div>
      )}
      {isLive && (
        <div className="flex items-center gap-2.5 rounded-lg px-4 py-2.5"
          style={{
            background: 'var(--color-live-bg)',
            border: '1px solid var(--color-live-border)',
          }}>
          <span className="size-2 rounded-full bg-[var(--color-live)] animate-pulse" />
          <span className="text-[var(--color-live)] text-sm font-semibold">You are live</span>
          <span className="text-white/25 text-xs ml-auto">Viewers can see you now</span>
        </div>
      )}

      {/* Video area */}
      <div
        className="relative w-full overflow-hidden transition-all duration-300"
        style={{
          aspectRatio: '16/9',
          borderRadius: '12px',
          border: isLive
            ? '1.5px solid rgba(34,197,94,0.5)'
            : '1px solid rgba(255,255,255,0.06)',
          background: 'var(--color-surface-900)',
          boxShadow: isLive
            ? '0 0 0 3px rgba(34,197,94,0.08), var(--shadow-card)'
            : 'var(--shadow-card)',
        }}
      >
        {localStream ? (
          <LocalPreviewVideo stream={localStream} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="flex items-center justify-center size-12 rounded-full bg-white/4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                <path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
              </svg>
            </div>
            <p className="text-white/25 text-sm">
              {previewError ? 'Camera unavailable' : 'Starting preview…'}
            </p>
          </div>
        )}

        {/* Corner badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isPreview && localStream && (
            <span className="bg-black/60 text-white/40 text-[10px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm tracking-widest uppercase">
              Preview
            </span>
          )}
          {isLive && (
            <span className="bg-[var(--color-live)] text-white text-[10px] font-bold px-2.5 py-1 rounded-md tracking-widest uppercase shadow-lg">
              ● LIVE
            </span>
          )}
        </div>

        {/* Media status overlays */}
        <div className="absolute bottom-3 left-3 flex gap-2">
          {!camEnabled && (
            <span className="bg-black/70 text-white/70 text-xs px-2 py-0.5 rounded-md backdrop-blur-sm">
              Camera off
            </span>
          )}
          {!micEnabled && (
            <span className="bg-black/70 text-white/70 text-xs px-2 py-0.5 rounded-md backdrop-blur-sm">
              Muted
            </span>
          )}
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        {/* Device toggles in a subtle panel */}
        <div
          className="flex items-center gap-1 rounded-xl p-1"
          style={{
            background: 'var(--color-surface-700)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'var(--shadow-panel)',
          }}
        >
          <IconButton
            active={micEnabled}
            label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
            onClick={() => void toggleMic()}
          >
            {micEnabled ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
          <IconButton
            active={camEnabled}
            label={camEnabled ? 'Turn off camera' : 'Turn on camera'}
            onClick={() => void toggleCam()}
          >
            {camEnabled ? <CamIcon /> : <CamOffIcon />}
          </IconButton>
        </div>

        {/* Go Live / End Stream */}
        <div>
          {!isLive ? (
            <PrimaryButton
              variant="accent"
              size="md"
              loading={isConnecting}
              onClick={() => void handleGoLive()}
              disabled={isConnecting || !!previewError}
              className="min-w-[110px]"
            >
              {isConnecting ? 'Connecting…' : 'Go Live'}
            </PrimaryButton>
          ) : (
            <PrimaryButton
              variant="danger"
              size="md"
              onClick={() => void handleEndStream()}
              className="min-w-[110px]"
            >
              End Stream
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  )
}

function LocalPreviewVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
  }, [stream])
  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-cover scale-x-[-1]"
    />
  )
}

function MicIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function CamIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  )
}

function CamOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8" />
      <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l10 10Z" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}
