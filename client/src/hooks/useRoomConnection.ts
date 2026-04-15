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
  error: string | null
  connect: () => Promise<Room | null>
  disconnect: () => Promise<void>
}

export function useRoomConnection(role: 'broadcaster' | 'viewer'): RoomConnectionState {
  const [appState, setAppState] = useState<AppState>('idle')
  const [room, setRoom] = useState<Room | null>(null)
  const [remoteParticipant, setRemoteParticipant] = useState<RemoteParticipant | null>(null)
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const roomRef = useRef<Room | null>(null)

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

  // Returns the Room instance directly so callers can use it immediately
  // without waiting for React state to flush.
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
        }
      })

      newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        setRemoteParticipant(participant)
      })

      newRoom.on(RoomEvent.ParticipantDisconnected, () => {
        const remaining = Array.from(newRoom.remoteParticipants.values())[0] ?? null
        setRemoteParticipant(remaining)
        checkRemoteVideo(newRoom)
      })

      newRoom.on(RoomEvent.TrackSubscribed, (_track: RemoteTrack, pub: RemoteTrackPublication, participant: RemoteParticipant) => {
        setRemoteParticipant(participant)
        if (pub.kind === 'video') setHasRemoteVideo(true)
      })

      newRoom.on(RoomEvent.TrackUnsubscribed, (_track: RemoteTrack, pub: RemoteTrackPublication) => {
        if (pub.kind === 'video') checkRemoteVideo(newRoom)
      })

      newRoom.on(RoomEvent.Disconnected, () => {
        setAppState('disconnected')
        setHasRemoteVideo(false)
        setRemoteParticipant(null)
      })

      await newRoom.connect(url, token)
      setRoom(newRoom)

      const existing = Array.from(newRoom.remoteParticipants.values())[0] ?? null
      setRemoteParticipant(existing)
      checkRemoteVideo(newRoom)

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
  }, [appState, role, checkRemoteVideo])

  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect()
      roomRef.current = null
      setRoom(null)
      setAppState('idle')
      setRemoteParticipant(null)
      setHasRemoteVideo(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (roomRef.current) {
        void roomRef.current.disconnect()
      }
    }
  }, [])

  return { appState, room, remoteParticipant, hasRemoteVideo, error, connect, disconnect }
}
