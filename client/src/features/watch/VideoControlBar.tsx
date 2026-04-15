import { useEffect, type RefObject } from 'react'
import { clsx } from 'clsx'
import type { UseVideoPlayerReturn } from '../../hooks/useVideoPlayer'

interface VideoControlBarProps {
  player: UseVideoPlayerReturn
  containerRef: RefObject<HTMLElement | null>
  isLive: boolean
}

export function VideoControlBar({ player, containerRef, isLive }: VideoControlBarProps) {
  const {
    isMuted, volume, isFullscreen, isPiP, isPiPSupported,
    controlsVisible, toggleMute, setVolume, toggleFullscreen, togglePiP, onActivity,
  } = player

  // Keyboard shortcuts (only when chat input is not focused)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'm' || e.key === 'M') { toggleMute(); onActivity() }
      if (e.key === 'f' || e.key === 'F') { toggleFullscreen(containerRef); onActivity() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [toggleMute, toggleFullscreen, onActivity, containerRef])

  return (
    <>
      {/* Gradient scrim — always present so it fades in/out with the controls */}
      <div
        className={clsx(
          'absolute inset-x-0 bottom-0 h-24 pointer-events-none transition-opacity duration-300',
          controlsVisible ? 'opacity-100' : 'opacity-0',
        )}
        style={{ background: 'var(--gradient-scrim-bottom)' }}
      />

      {/* Control bar */}
      <div
        className={clsx(
          'absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-3 pb-3 pt-6',
          'transition-opacity duration-300',
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        {/* Left: mute + volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="flex items-center justify-center size-8 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isMuted || volume === 0 ? <MutedIcon /> : volume < 0.5 ? <VolumeLowIcon /> : <VolumeHighIcon />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={isMuted ? 0 : volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            className="volume-slider w-20"
            aria-label="Volume"
          />
        </div>

        {/* Center: live indicator */}
        {isLive && (
          <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium select-none">
            <span className="size-1.5 rounded-full bg-[var(--color-live)] animate-pulse" />
            LIVE
          </div>
        )}

        {/* Right: PiP + fullscreen */}
        <div className="flex items-center gap-1">
          {isPiPSupported && (
            <button
              onClick={() => void togglePiP()}
              aria-label={isPiP ? 'Exit Picture-in-Picture' : 'Picture-in-Picture'}
              className="flex items-center justify-center size-8 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {isPiP ? <PiPExitIcon /> : <PiPIcon />}
            </button>
          )}
          <button
            onClick={() => toggleFullscreen(containerRef)}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="flex items-center justify-center size-8 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </button>
        </div>
      </div>
    </>
  )
}

function VolumeHighIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

function VolumeLowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

function MutedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" x2="16" y1="9" y2="15" />
      <line x1="16" x2="22" y1="9" y2="15" />
    </svg>
  )
}

function FullscreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" x2="14" y1="3" y2="10" />
      <line x1="3" x2="10" y1="21" y2="14" />
    </svg>
  )
}

function ExitFullscreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="10" x2="3" y1="14" y2="21" />
      <line x1="21" x2="14" y1="3" y2="10" />
    </svg>
  )
}

function PiPIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <rect x="12" y="12" width="8" height="6" rx="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function PiPExitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <rect x="12" y="12" width="8" height="6" rx="1" fill="currentColor" stroke="none" opacity="0.4" />
      <line x1="9" x2="15" y1="9" y2="15" />
      <line x1="15" x2="9" y1="9" y2="15" />
    </svg>
  )
}
