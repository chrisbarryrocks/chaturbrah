import { useEffect, useRef, useState } from 'react'
import { Room, RoomEvent, Track, type RemoteTrackPublication } from 'livekit-client'
import { fetchToken } from '../../lib/api'

interface StreamPreviewVideoProps {
  username: string
}

type PreviewState = 'loading' | 'captured' | 'failed'

const REFRESH_INTERVAL_MS = 30_000
const CAPTURE_TIMEOUT_MS = 15_000

/**
 * Briefly connects to a LiveKit room, captures one JPEG frame, then disconnects.
 * Uses autoSubscribe:false + setSubscribed(true) so it opts in to only one track.
 */
export function StreamPreviewVideo({ username }: StreamPreviewVideoProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [state, setState] = useState<PreviewState>('loading')
  const mountedRef = useRef(true)

  async function captureFrame(): Promise<void> {
    const room = new Room({ adaptiveStream: false, dynacast: false })

    try {
      const { token, url } = await fetchToken('preview', username)
      if (!mountedRef.current) { void room.disconnect(); return }

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout')), CAPTURE_TIMEOUT_MS)
        let captured = false

        function capturePublication(pub: RemoteTrackPublication) {
          if (captured || pub.kind !== Track.Kind.Video || !pub.track) return
          captured = true

          const video = document.createElement('video')
          video.muted = true
          video.playsInline = true
          pub.track.attach(video)

          const onPlaying = () => {
            try {
              const canvas = document.createElement('canvas')
              canvas.width = video.videoWidth || 640
              canvas.height = video.videoHeight || 360
              canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
              pub.track?.detach(video)
              clearTimeout(timeout)
              if (mountedRef.current && dataUrl.length > 1000) {
                setScreenshot(dataUrl)
                setState('captured')
              }
              resolve()
            } catch {
              reject(new Error('canvas error'))
            }
          }

          video.addEventListener('playing', onPlaying, { once: true })
          void video.play().catch(() => {})
        }

        room.on(RoomEvent.TrackSubscribed, (_track, pub) => {
          capturePublication(pub)
        })

        room.connect(url, token, { autoSubscribe: false })
          .then(() => {
            if (!mountedRef.current) { reject(new Error('unmounted')); return }
            // Subscribe to any video track already published
            for (const participant of room.remoteParticipants.values()) {
              for (const pub of participant.trackPublications.values()) {
                if (pub.kind === Track.Kind.Video) {
                  pub.setSubscribed(true)
                  return
                }
              }
            }
            // Watch for future publishes
            room.on(RoomEvent.TrackPublished, (pub) => {
              if (pub.kind === Track.Kind.Video) pub.setSubscribed(true)
            })
          })
          .catch(reject)
      })
    } catch {
      if (mountedRef.current && state === 'loading') setState('failed')
    } finally {
      // Brief pause before disconnect to avoid triggering ICE renegotiation for other viewers
      setTimeout(() => void room.disconnect(), 1000)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    void captureFrame()
    // Single capture — no auto-refresh so we never disrupt other viewers
    return () => { mountedRef.current = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  return (
    <div className="absolute inset-0">
      {screenshot ? (
        <img
          src={screenshot}
          alt={`${username}'s stream`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <Placeholder username={username} loading={state === 'loading'} />
      )}
    </div>
  )
}

function Placeholder({ username, loading }: { username: string; loading: boolean }) {
  const initials = username.slice(0, 2).toUpperCase()
  const hue = usernameHue(username)

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: `radial-gradient(ellipse at 50% 40%, hsl(${hue}, 40%, 14%) 0%, hsl(${hue}, 25%, 8%) 100%)`,
      }}
    >
      <span
        className="text-3xl font-black select-none"
        style={{ color: `hsl(${hue}, 55%, 55%)`, opacity: 0.45 }}
      >
        {initials}
      </span>
      {loading && (
        <span className="absolute bottom-3 right-3 size-2 rounded-full bg-[var(--color-live)] animate-pulse" />
      )}
    </div>
  )
}

function usernameHue(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return hash % 360
}
