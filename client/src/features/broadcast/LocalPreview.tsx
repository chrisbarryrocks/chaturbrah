import { useEffect, useRef } from 'react'

interface LocalPreviewProps {
  stream: MediaStream | null
  micEnabled: boolean
  camEnabled: boolean
}

export function LocalPreview({ stream, micEnabled, camEnabled }: LocalPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative w-full aspect-video bg-[var(--color-surface-800)] rounded-xl overflow-hidden border border-[var(--color-border)]">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="text-4xl opacity-20">📹</div>
            <p className="text-[#6b6b80] text-sm">Camera preview will appear here</p>
          </div>
        </div>
      )}

      {stream && (
        <div className="absolute bottom-3 left-3 flex gap-2">
          {!camEnabled && (
            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
              Camera off
            </span>
          )}
          {!micEnabled && (
            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
              Mic muted
            </span>
          )}
        </div>
      )}
    </div>
  )
}
