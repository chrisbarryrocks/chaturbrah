import { useEffect, useRef } from 'react'
import type { RemoteParticipant } from 'livekit-client'
import { Track } from 'livekit-client'

interface ViewerPlayerProps {
  participant: RemoteParticipant | null
  hasVideo: boolean
}

export function ViewerPlayer({ participant, hasVideo }: ViewerPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (!participant || !videoRef.current || !audioRef.current) return

    const videoEl = videoRef.current
    const audioEl = audioRef.current

    const attachTracks = () => {
      for (const pub of participant.trackPublications.values()) {
        if (!pub.isSubscribed || !pub.track) continue
        if (pub.kind === Track.Kind.Video) {
          pub.track.attach(videoEl)
        } else if (pub.kind === Track.Kind.Audio) {
          pub.track.attach(audioEl)
        }
      }
    }

    attachTracks()

    const handleSubscribed = () => attachTracks()

    participant.on('trackSubscribed', handleSubscribed)
    participant.on('trackUnsubscribed', () => {
      participant.off('trackSubscribed', handleSubscribed)
    })

    return () => {
      participant.off('trackSubscribed', handleSubscribed)
      for (const pub of participant.trackPublications.values()) {
        pub.track?.detach()
      }
    }
  }, [participant])

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-500 ${hasVideo ? 'opacity-100' : 'opacity-0'}`}
      />
      <audio ref={audioRef} autoPlay />
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-900)]">
          <div className="text-center space-y-3">
            <div className="text-5xl opacity-20">📺</div>
            <p className="text-[#6b6b80] text-sm">Waiting for video…</p>
          </div>
        </div>
      )}
    </div>
  )
}
