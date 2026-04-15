import { useEffect, useRef, useCallback, type RefObject } from 'react'
import type { RemoteParticipant } from 'livekit-client'
import { Track } from 'livekit-client'
import { useVideoPlayer } from '../../hooks/useVideoPlayer'
import { VideoControlBar } from './VideoControlBar'

interface ViewerPlayerProps {
  participant: RemoteParticipant | null
  hasVideo: boolean
  isLive: boolean
  containerRef: RefObject<HTMLDivElement | null>
}

export function ViewerPlayer({
  participant,
  hasVideo,
  isLive,
  containerRef,
}: ViewerPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const player = useVideoPlayer(videoRef)

  useEffect(() => {
    if (!participant || !videoRef.current) return

    const videoEl = videoRef.current

    const attachTracks = () => {
      for (const pub of participant.trackPublications.values()) {
        if (!pub.isSubscribed || !pub.track) continue
        if (pub.kind === Track.Kind.Video) {
          pub.track.attach(videoEl)
        } else if (pub.kind === Track.Kind.Audio) {
          pub.track.attach(videoEl)
        }
      }
    }

    attachTracks()

    const handleSubscribed = () => attachTracks()
    participant.on('trackSubscribed', handleSubscribed)

    return () => {
      participant.off('trackSubscribed', handleSubscribed)
      for (const pub of participant.trackPublications.values()) {
        pub.track?.detach()
      }
    }
  }, [participant])

  const handleMouseMove = useCallback(() => player.onActivity(), [player])
  const handleTouchMove = useCallback(() => player.onActivity(), [player])

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black overflow-hidden"
      style={{ aspectRatio: '16/9', borderRadius: '12px' }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-contain transition-opacity duration-500 ${hasVideo ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Waiting overlay */}
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-900)]">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center size-12 rounded-full bg-white/5 mx-auto">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" />
                <path d="m10 9 5 3-5 3V9z" />
              </svg>
            </div>
            <p className="text-white/20 text-xs">Waiting for stream…</p>
          </div>
        </div>
      )}

      {/* Custom control bar — only when live */}
      {isLive && (
        <VideoControlBar
          player={player}
          containerRef={containerRef}
          isLive={isLive}
        />
      )}
    </div>
  )
}
