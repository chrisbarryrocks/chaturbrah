import { useEffect, useRef, useState } from 'react'
import { Room, RoomEvent, Track } from 'livekit-client'
import { fetchToken } from '../../lib/api'

interface StreamPreviewVideoProps {
  username: string
}

type PreviewState = 'loading' | 'captured' | 'failed'

const REFRESH_INTERVAL_MS = 30_000

/**
 * Briefly connects to a LiveKit room, captures a single video frame to a
 * canvas, then immediately disconnects. Re-captures every 30s.
 */
export function StreamPreviewVideo({ username }: StreamPreviewVideoProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [state, setState] = useState<PreviewState>('loading')
  const mountedRef = useRef(true)

  async function captureFrame(): Promise<void> {
    const room = new Room({ adaptiveStream: false, dynacast: false })

    try {
      const { token, url } = await fetchToken('viewer', username)
      if (!mountedRef.current) return

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('timeout'))
        }, 12_000)

        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind !== Track.Kind.Video) return

          const video = document.createElement('video')
          video.muted = true
          video.playsInline = true
          track.attach(video)

          video.addEventListener('playing', () => {
            try {
              const canvas = document.createElement('canvas')
              canvas.width = video.videoWidth || 640
              canvas.height = video.videoHeight || 360
              canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
              const dataUrl = canvas.toDataURL('image/jpeg', 0.75)

              track.detach(video)
              clearTimeout(timeout)
              resolve()

              if (mountedRef.current && dataUrl.length > 1000) {
                setScreenshot(dataUrl)
                setState('captured')
              }
            } catch {
              reject(new Error('canvas error'))
            }
          }, { once: true })

          void video.play().catch(() => {})
        })

        room.connect(url, token, { autoSubscribe: true }).catch(reject)
      })
    } catch {
      if (mountedRef.current && state === 'loading') {
        setState('failed')
      }
    } finally {
      void room.disconnect()
    }
  }

  useEffect(() => {
    mountedRef.current = true
    void captureFrame()

    const interval = setInterval(() => {
      if (mountedRef.current) void captureFrame()
    }, REFRESH_INTERVAL_MS)

    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
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
