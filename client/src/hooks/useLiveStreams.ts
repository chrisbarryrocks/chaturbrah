import { useState, useEffect, useRef } from 'react'
import { fetchStreams, type LiveStream } from '../lib/api'

interface UseLiveStreamsResult {
  streams: LiveStream[]
  loading: boolean
  refresh: () => void
}

const POLL_INTERVAL_MS = 10_000

export function useLiveStreams(): UseLiveStreamsResult {
  const [streams, setStreams] = useState<LiveStream[]>([])
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  const load = async () => {
    try {
      const data = await fetchStreams()
      if (mountedRef.current) setStreams(data)
    } catch {
      // silently ignore network errors on polling
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    void load()
    const interval = setInterval(() => void load(), POLL_INTERVAL_MS)
    return () => {
      mountedRef.current = false
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { streams, loading, refresh: () => void load() }
}
