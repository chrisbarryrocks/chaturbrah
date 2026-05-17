import { useState, useRef, useCallback, useEffect } from 'react'
import type { Room } from 'livekit-client'
import { encodePayload } from '../../utils/chat'
import { sendAiChatterAudio } from '../../lib/api'
import type { ChatMessage } from '../../types'

const SPEECH_RMS_THRESHOLD = 0.02
const SPEECH_POLL_MS = 200
const INTERVAL_MS = 8_000

interface UseAiChattersOptions {
  room: Room | null
  roomName: string
  streamerName: string
  isStreaming: boolean
  audioStream: MediaStream | null
}

interface UseAiChattersResult {
  isAiChattersActive: boolean
  isAiChattersLoading: boolean
  aiChattersError: string | null
  startAiChatters: () => void
  stopAiChatters: () => void
  botMessages: ChatMessage[]
}

export function useAiChatters({
  room,
  roomName,
  streamerName,
  isStreaming,
  audioStream,
}: UseAiChattersOptions): UseAiChattersResult {
  const [isAiChattersActive, setIsAiChattersActive] = useState(false)
  const [isAiChattersLoading, setIsAiChattersLoading] = useState(false)
  const [aiChattersError, setAiChattersError] = useState<string | null>(null)
  const [botMessages, setBotMessages] = useState<ChatMessage[]>([])

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const staggerTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const isActiveRef = useRef(false)
  const isSendingRef = useRef(false)
  const initSegmentRef = useRef<Blob | null>(null)

  // Speech detection
  const audioCtxRef = useRef<AudioContext | null>(null)
  const speechPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasSpeechInWindowRef = useRef(false)

  const publishBotMessages = useCallback(
    (messages: ChatMessage[]) => {
      if (!room || messages.length === 0) return

      let cumulative = 0
      messages.forEach((message, index) => {
        if (index > 0) cumulative += 1500 + Math.random() * 1500
        const delay = cumulative

        const t = setTimeout(() => {
          staggerTimeoutsRef.current = staggerTimeoutsRef.current.filter(x => x !== t)
          if (!room) return
          const bytes = encodePayload({ type: 'chat', message })
          void room.localParticipant.publishData(bytes, { reliable: true })
          setBotMessages(prev => [...prev, message])
        }, delay)

        staggerTimeoutsRef.current.push(t)
      })
    },
    [room],
  )

  const teardownSpeechDetection = useCallback(() => {
    if (speechPollRef.current) {
      clearInterval(speechPollRef.current)
      speechPollRef.current = null
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    hasSpeechInWindowRef.current = false
  }, [])

  const stopRecorder = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    for (const t of staggerTimeoutsRef.current) clearTimeout(t)
    staggerTimeoutsRef.current = []
    recorderRef.current = null
    chunksRef.current = []
    initSegmentRef.current = null
    isActiveRef.current = false
    teardownSpeechDetection()
  }, [teardownSpeechDetection])

  const flushChunks = useCallback(
    async (mimeType: string) => {
      if (isSendingRef.current) return

      if (!hasSpeechInWindowRef.current) {
        chunksRef.current = []
        return
      }
      hasSpeechInWindowRef.current = false

      if (chunksRef.current.length === 0) return

      const chunks = [...chunksRef.current]
      chunksRef.current = []

      const blobParts: Blob[] =
        initSegmentRef.current && chunks[0] !== initSegmentRef.current
          ? [initSegmentRef.current, ...chunks]
          : chunks

      const blob = new Blob(blobParts, { type: mimeType })
      if (blob.size < 1000) return

      isSendingRef.current = true
      try {
        const response = await sendAiChatterAudio({ audioBlob: blob, roomName, streamerName })

        if (response.transcript) {
          console.log(`[AI Chatters] Heard: "${response.transcript}"`)
        }

        if (response.messages.length > 0) {
          publishBotMessages(response.messages)
        }
        setAiChattersError(null)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI chatters request failed'
        setAiChattersError(msg)
      } finally {
        isSendingRef.current = false
      }
    },
    [roomName, streamerName, publishBotMessages],
  )

  const startAiChatters = useCallback(() => {
    if (isActiveRef.current) return
    if (!isStreaming || !audioStream) return

    isActiveRef.current = true
    setIsAiChattersActive(true)
    setIsAiChattersLoading(true)
    setAiChattersError(null)

    console.log('[AI Chatters] Started')

    try {
      const audioCtx = new AudioContext()
      void audioCtx.resume()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(audioStream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      speechPollRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(dataArray)
        let sumSq = 0
        for (const v of dataArray) {
          const sample = (v - 128) / 128
          sumSq += sample * sample
        }
        if (Math.sqrt(sumSq / dataArray.length) > SPEECH_RMS_THRESHOLD) {
          hasSpeechInWindowRef.current = true
        }
      }, SPEECH_POLL_MS)
    } catch {
      hasSpeechInWindowRef.current = true
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'

    const recorder = new MediaRecorder(audioStream, { mimeType })
    recorderRef.current = recorder
    chunksRef.current = []
    initSegmentRef.current = null

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) {
        if (!initSegmentRef.current) initSegmentRef.current = e.data
        chunksRef.current.push(e.data)
      }
    }

    recorder.onstart = () => {
      setIsAiChattersLoading(false)
    }

    recorder.onerror = () => {
      setAiChattersError('MediaRecorder error — AI chatters stopped.')
      stopRecorder()
      setIsAiChattersActive(false)
    }

    // 1s timeslice so chunks land in chunksRef continuously;
    // the interval then flushes whatever has accumulated.
    recorder.start(1000)

    intervalRef.current = setInterval(() => {
      if (!isActiveRef.current) return
      void flushChunks(mimeType)
    }, INTERVAL_MS)
  }, [isStreaming, audioStream, flushChunks, stopRecorder])

  const stopAiChatters = useCallback(() => {
    console.log('[AI Chatters] Stopped')
    stopRecorder()
    setIsAiChattersActive(false)
    setIsAiChattersLoading(false)
  }, [stopRecorder])

  useEffect(() => {
    if (!isStreaming && isActiveRef.current) stopAiChatters()
  }, [isStreaming, stopAiChatters])

  useEffect(() => {
    if (!audioStream && isActiveRef.current) stopAiChatters()
  }, [audioStream, stopAiChatters])

  useEffect(() => {
    return () => { stopRecorder() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    isAiChattersActive,
    isAiChattersLoading,
    aiChattersError,
    startAiChatters,
    stopAiChatters,
    botMessages,
  }
}
