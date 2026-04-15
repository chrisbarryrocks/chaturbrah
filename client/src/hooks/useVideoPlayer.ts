import { useState, useEffect, useRef, useCallback, type RefObject } from 'react'

export interface UseVideoPlayerReturn {
  isMuted: boolean
  volume: number
  isFullscreen: boolean
  isPiP: boolean
  isPiPSupported: boolean
  controlsVisible: boolean
  toggleMute: () => void
  setVolume: (v: number) => void
  toggleFullscreen: (containerRef: RefObject<HTMLElement | null>) => void
  togglePiP: () => Promise<void>
  onActivity: () => void
}

const HIDE_DELAY_MS = 3000

export function useVideoPlayer(
  videoRef: RefObject<HTMLVideoElement | null>,
  muteOnJoin: boolean = false,
): UseVideoPlayerReturn {
  const [isMuted, setIsMuted] = useState(muteOnJoin)
  const [volume, setVolumeState] = useState(muteOnJoin ? 0 : 1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPiP, setIsPiP] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPiPSupported = typeof document !== 'undefined' && 'pictureInPictureEnabled' in document

  // Sync initial muted state to video element when it becomes available
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = muteOnJoin
    video.volume = muteOnJoin ? 0 : 1
  }, [videoRef, muteOnJoin])

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // PiP change listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onEnterPiP = () => setIsPiP(true)
    const onLeavePiP = () => setIsPiP(false)
    video.addEventListener('enterpictureinpicture', onEnterPiP)
    video.addEventListener('leavepictureinpicture', onLeavePiP)
    return () => {
      video.removeEventListener('enterpictureinpicture', onEnterPiP)
      video.removeEventListener('leavepictureinpicture', onLeavePiP)
    }
  }, [videoRef])

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), HIDE_DELAY_MS)
  }, [])

  const onActivity = useCallback(() => {
    setControlsVisible(true)
    scheduleHide()
  }, [scheduleHide])

  // Auto-hide on mount
  useEffect(() => {
    scheduleHide()
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [scheduleHide])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const next = !isMuted
    video.muted = next
    if (!next && video.volume === 0) {
      video.volume = 0.8
      setVolumeState(0.8)
    }
    setIsMuted(next)
  }, [isMuted, videoRef])

  const setVolume = useCallback((v: number) => {
    const video = videoRef.current
    if (!video) return
    const clamped = Math.max(0, Math.min(1, v))
    video.volume = clamped
    video.muted = clamped === 0
    setVolumeState(clamped)
    setIsMuted(clamped === 0)
  }, [videoRef])

  const toggleFullscreen = useCallback((containerRef: RefObject<HTMLElement | null>) => {
    if (!document.fullscreenElement) {
      void containerRef.current?.requestFullscreen()
    } else {
      void document.exitFullscreen()
    }
  }, [])

  const togglePiP = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else {
      await video.requestPictureInPicture()
    }
  }, [videoRef])

  return {
    isMuted,
    volume,
    isFullscreen,
    isPiP,
    isPiPSupported,
    controlsVisible,
    toggleMute,
    setVolume,
    toggleFullscreen,
    togglePiP,
    onActivity,
  }
}
