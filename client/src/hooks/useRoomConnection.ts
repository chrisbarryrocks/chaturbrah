import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Room,
  RoomEvent,
  ConnectionState,
  type RemoteParticipant,
  type RemoteTrackPublication,
  type RemoteTrack,
} from 'livekit-client'
import { fetchToken } from '../lib/api'
import type { AppState } from '../types'

export interface RoomConnectionState {
  appState: AppState
  room: Room | null
  remoteParticipant: RemoteParticipant | null
  hasRemoteVideo: boolean
  viewerCount: number
  error: string | null
  connect: () => Promise<Room | null>
  disconnect: () => Promise<void>
}

function countViewers(r: Room, selfIsViewer: boolean): number {
  const remoteViewers = Array.from(r.remoteParticipants.values()).filter(p =>
    p.identity.startsWith('viewer-'),
  ).length
  return remoteViewers + (selfIsViewer ? 1 : 0)
}

export function useRoomConnection(role: 'broadcaster' | 'viewer'): RoomConnectionState {
  const [appState, setAppState] = useState<AppState>('idle')
  const [room, setRoom] = useState<Room | null>(null)
  const [remoteParticipant, setRemoteParticipant] = useState<RemoteParticipant | null>(null)
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const roomRef = useRef<Room | null>(null)
  const isViewer = role === 'viewer'

  const checkRemoteVideo = useCallback((r: Room) => {
    for (const participant of r.remoteParticipants.values()) {
      for (const pub of participant.trackPublications.values()) {
        if (pub.kind === 'video' && pub.isSubscribed && pub.track) {
          setHasRemoteVideo(true)
          return
        }
      }
    }
    setHasRemoteVideo(false)
  }, [])

  const connect = useCallback(async (): Promise<Room | null> => {
    if (appState === 'connecting' || appState === 'connected') return roomRef.current
    setAppState('connecting')
    setError(null)

    try {
      const { token, url } = await fetchToken(role)
      const newRoom = new Room()
      roomRef.current = newRoom

      newRoom.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        if (state === ConnectionState.Connected) {
          setAppState('connected')
        } else if (state === ConnectionState.Reconnecting) {
          setAppState('reconnecting')
        } else if (state === ConnectionState.Disconnected) {
          setAppState('disconnected')
          setHasRemoteVideo(false)
          setViewerCount(0)
        }
      })

      newRoom.on(RoomEvent.ParticipantConnected, () => {
        const remaining = Array.from(newRoom.remoteParticipants.values())
        // Update the broadcaster video participant ref
        const broadcaster = remaining.find(p => p.identity.startsWith('broadcaster-')) ?? null
        if (broadcaster || remaining.length > 0) {
          setRemoteParticipant(
            remaining.find(p => p.identity.startsWith('broadcaster-')) ?? remaining[0] ?? null,
          )
        }
        setViewerCount(countViewers(newRoom, isViewer))
      })

      newRoom.on(RoomEvent.ParticipantDisconnected, () => {
        const remaining = Array.from(newRoom.remoteParticipants.values())
        setRemoteParticipant(
          remaining.find(p => p.identity.startsWith('broadcaster-')) ?? remaining[0] ?? null,
        )
        checkRemoteVideo(newRoom)
        setViewerCount(countViewers(newRoom, isViewer))
      })

      newRoom.on(RoomEvent.TrackSubscribed, (_track: RemoteTrack, pub: RemoteTrackPublication, participant: RemoteParticipant) => {
        if (participant.identity.startsWith('broadcaster-')) {
          setRemoteParticipant(participant)
        }
        if (pub.kind === 'video') setHasRemoteVideo(true)
      })

      newRoom.on(RoomEvent.TrackUnsubscribed, (_track: RemoteTrack, pub: RemoteTrackPublication) => {
        if (pub.kind === 'video') checkRemoteVideo(newRoom)
      })

      newRoom.on(RoomEvent.Disconnected, () => {
        setAppState('disconnected')
        setHasRemoteVideo(false)
        setRemoteParticipant(null)
        setViewerCount(0)
      })

      await newRoom.connect(url, token)
      setRoom(newRoom)

      const existing = Array.from(newRoom.remoteParticipants.values())
      setRemoteParticipant(
        existing.find(p => p.identity.startsWith('broadcaster-')) ?? existing[0] ?? null,
      )
      checkRemoteVideo(newRoom)
      setViewerCount(countViewers(newRoom, isViewer))

      return newRoom
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err)
      const msg = raw.toLowerCase().includes('unauthorized') || raw.toLowerCase().includes('403')
        ? 'LiveKit authentication failed — check your API key and secret.'
        : raw.toLowerCase().includes('not found') || raw.toLowerCase().includes('404')
          ? 'LiveKit room not found — verify your project URL and room name.'
          : raw
      setError(msg)
      setAppState('error')
      return null
    }
  }, [appState, role, checkRemoteVideo, isViewer])

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect()
      roomRef.current = null
      setRoom(null)
      setAppState('idle')
      setRemoteParticipant(null)
      setHasRemoteVideo(false)
      setViewerCount(0)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        void roomRef.current.disconnect()
      }
    }
  }, [])

  return { appState, room, remoteParticipant, hasRemoteVideo, viewerCount, error, connect, disconnect }
}
