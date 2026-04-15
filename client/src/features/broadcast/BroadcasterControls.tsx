import { useState, useEffect, useCallback, useRef } from 'react'
import {
  type Room,
  createLocalVideoTrack,
  createLocalAudioTrack,
  type LocalVideoTrack,
  type LocalAudioTrack,
} from 'livekit-client'
import { clsx } from 'clsx'
import { PrimaryButton } from '../../components/PrimaryButton'
import { IconButton } from '../../components/IconButton'
import type { AppState } from '../../types'

interface BroadcasterControlsProps {
  appState: AppState
  onGoLive: () => Promise<Room | null>
  onEndStream: () => Promise<void>
}

export function BroadcasterControls({
  appState,
  onGoLive,
  onEndStream,
}: BroadcasterControlsProps) {
  const [micEnabled, setMicEnabled] = useState(true)
  const [camEnabled, setCamEnabled] = useState(true)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
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
    try {
      // Connect first — returns the live Room instance immediately,
      // bypassing the React state flush delay.
      const connectedRoom = await onGoLive()
      if (!connectedRoom) return  // connection failed, error shown by parent

      // Create and publish tracks using the room we just received.
      const videoTrack = await createLocalVideoTrack({ facingMode: 'user' })
      const audioTrack = await createLocalAudioTrack()
      videoTrackRef.current = videoTrack
      audioTrackRef.current = audioTrack
      liveRoomRef.current = connectedRoom

      await connectedRoom.localParticipant.publishTrack(videoTrack)
      await connectedRoom.localParticipant.publishTrack(audioTrack)

      // New tracks are always created enabled — sync UI state to match.
      setCamEnabled(true)
      setMicEnabled(true)

      // Mirror the published video into the preview element so the
      // broadcaster keeps seeing themselves without a second camera instance.
      const liveStream = new MediaStream([videoTrack.mediaStreamTrack])
      setLocalStream(liveStream)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to publish stream'
      setPublishError(msg)
      videoTrackRef.current?.stop()
      audioTrackRef.current?.stop()
      videoTrackRef.current = null
      audioTrackRef.current = null
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
        // LiveKit replaces the underlying MediaStreamTrack when re-enabling.
        // Update localStream so the self-view reflects the new track.
        const pub = Array.from(room.localParticipant.videoTrackPublications.values())[0]
        if (pub?.track) {
          setLocalStream(new MediaStream([pub.track.mediaStreamTrack]))
        }
      }
    } else {
      localStream?.getVideoTracks().forEach(t => { t.enabled = next })
    }
  }

  const isLive = appState === 'connected' || appState === 'reconnecting'
  const isConnecting = appState === 'connecting'
  const isPreview = !isLive && !isConnecting

  return (
    <div className="space-y-3">
      {previewError && (
        <div className="rounded-lg bg-[var(--color-reconnecting-bg)] border border-[var(--color-reconnecting)]/30 px-4 py-3 text-[var(--color-reconnecting)] text-sm">
          {previewError}
        </div>
      )}
      {publishError && (
        <div className="rounded-lg bg-[var(--color-reconnecting-bg)] border border-[var(--color-reconnecting)]/30 px-4 py-3 text-[var(--color-reconnecting)] text-sm">
          Failed to publish stream: {publishError}
        </div>
      )}

      {/* Mode banner */}
      {isPreview && !previewError && (
        <div className="flex items-center gap-2.5 rounded-lg bg-[var(--color-surface-700)] border border-[var(--color-border)] px-4 py-2.5">
          <span className="size-2 rounded-full bg-[#6b6b80]" />
          <span className="text-[#8b8ba0] text-sm font-medium">Preview mode</span>
          <span className="text-[#4a4a5a] text-xs ml-auto">Not broadcasting</span>
        </div>
      )}
      {isConnecting && (
        <div className="flex items-center gap-2.5 rounded-lg bg-[var(--color-unstable-bg)] border border-[var(--color-unstable)]/30 px-4 py-2.5">
          <span className="size-4 border-2 border-[var(--color-unstable)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <span className="text-[var(--color-unstable)] text-sm font-medium">Connecting to LiveKit…</span>
        </div>
      )}
      {isLive && (
        <div className="flex items-center gap-2.5 rounded-lg bg-[var(--color-live-bg)] border border-[var(--color-live)]/30 px-4 py-2.5">
          <span className="size-2 rounded-full bg-[var(--color-live)] animate-pulse" />
          <span className="text-[var(--color-live)] text-sm font-semibold">You are live</span>
          <span className="text-[#4a4a5a] text-xs ml-auto">Viewers can see you now</span>
        </div>
      )}

      {/* Video area */}
      <div className={clsx(
        'relative w-full aspect-video rounded-xl overflow-hidden transition-all duration-300',
        isLive
          ? 'border-2 border-[var(--color-live)]/60 shadow-[0_0_0_1px_rgba(34,197,94,0.15)]'
          : 'border border-[var(--color-border)] bg-[var(--color-surface-800)]',
      )}>
        {localStream ? (
          <LocalPreviewVideo stream={localStream} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            <div className="text-5xl opacity-20">📹</div>
            <p className="text-[#6b6b80] text-sm">
              {previewError ? 'Camera unavailable' : 'Starting preview…'}
            </p>
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          {isPreview && localStream && (
            <span className="bg-black/60 text-[#9090a8] text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-sm tracking-wide uppercase">
              Preview
            </span>
          )}
          {isLive && (
            <span className="bg-[var(--color-live)] text-white text-[11px] font-bold px-2.5 py-1 rounded-md tracking-widest uppercase shadow-lg">
              ● Live
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 flex gap-2">
          {!camEnabled && (
            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
              Camera off
            </span>
          )}
          {!micEnabled && (
            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
              Muted
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
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

        <div className="flex gap-2">
          {!isLive ? (
            <PrimaryButton
              variant="accent"
              size="md"
              loading={isConnecting}
              onClick={() => void handleGoLive()}
              disabled={isConnecting || !!previewError}
            >
              {isConnecting ? 'Connecting…' : 'Go Live'}
            </PrimaryButton>
          ) : (
            <PrimaryButton
              variant="danger"
              size="md"
              onClick={() => void handleEndStream()}
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  )
}

function CamOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8" />
      <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l10 10Z" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}
