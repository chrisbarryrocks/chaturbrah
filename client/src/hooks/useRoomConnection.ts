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
  hasRemoteBroadcaster: boolean
  viewerCount: number
  error: string | null
  connect: () => Promise<Room | null>
  disconnect: () => Promise<void>
}

function checkRemoteBroadcaster(r: Room): boolean {
  return Array.from(r.remoteParticipants.values()).some(p => {
    if (!p.identity.startsWith('broadcaster-')) return false
    return Array.from(p.trackPublications.values()).some(
      pub => pub.kind === 'video' && pub.isSubscribed && pub.track,
    )
  })
}

function countViewers(r: Room, selfIsViewer: boolean): number {
  const remoteViewers = Array.from(r.remoteParticipants.values()).filter(p =>
    p.identity.startsWith('viewer-'),
  ).length
  return remoteViewers + (selfIsViewer ? 1 : 0)
}

export function useRoomConnection(role: 'broadcaster' | 'viewer', roomName?: string): RoomConnectionState {
  const [appState, setAppState] = useState<AppState>('idle')
  const [room, setRoom] = useState<Room | null>(null)
  const [remoteParticipant, setRemoteParticipant] = useState<RemoteParticipant | null>(null)
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)
  const [hasRemoteBroadcaster, setHasRemoteBroadcaster] = useState(false)
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
      const resolvedRoom = roomName ?? 'chaturbrah-main'
      const { token, url } = await fetchToken(role, resolvedRoom)
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
          setHasRemoteBroadcaster(false)
        }
      })

      newRoom.on(RoomEvent.ParticipantConnected, () => {
        const remaining = Array.from(newRoom.remoteParticipants.values())
        setRemoteParticipant(
          remaining.find(p => p.identity.startsWith('broadcaster-')) ?? remaining[0] ?? null,
        )
        setViewerCount(countViewers(newRoom, isViewer))
        setHasRemoteBroadcaster(checkRemoteBroadcaster(newRoom))
      })

      newRoom.on(RoomEvent.ParticipantDisconnected, () => {
        const remaining = Array.from(newRoom.remoteParticipants.values())
        setRemoteParticipant(
          remaining.find(p => p.identity.startsWith('broadcaster-')) ?? remaining[0] ?? null,
        )
        checkRemoteVideo(newRoom)
        setViewerCount(countViewers(newRoom, isViewer))
        setHasRemoteBroadcaster(checkRemoteBroadcaster(newRoom))
      })

      newRoom.on(RoomEvent.TrackSubscribed, (_track: RemoteTrack, pub: RemoteTrackPublication, participant: RemoteParticipant) => {
        if (participant.identity.startsWith('broadcaster-')) {
          setRemoteParticipant(participant)
        }
        if (pub.kind === 'video') {
          setHasRemoteVideo(true)
          setHasRemoteBroadcaster(checkRemoteBroadcaster(newRoom))
        }
      })

      newRoom.on(RoomEvent.TrackUnsubscribed, (_track: RemoteTrack, pub: RemoteTrackPublication) => {
        if (pub.kind === 'video') {
          checkRemoteVideo(newRoom)
          setHasRemoteBroadcaster(checkRemoteBroadcaster(newRoom))
        }
      })

      newRoom.on(RoomEvent.Disconnected, () => {
        setAppState('disconnected')
        setHasRemoteVideo(false)
        setRemoteParticipant(null)
        setViewerCount(0)
        setHasRemoteBroadcaster(false)
      })

      await newRoom.connect(url, token)
      setRoom(newRoom)

      const existing = Array.from(newRoom.remoteParticipants.values())
      setRemoteParticipant(
        existing.find(p => p.identity.startsWith('broadcaster-')) ?? existing[0] ?? null,
      )
      checkRemoteVideo(newRoom)
      setViewerCount(countViewers(newRoom, isViewer))
      setHasRemoteBroadcaster(checkRemoteBroadcaster(newRoom))

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
  }, [appState, role, roomName, checkRemoteVideo, isViewer])

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

  return { appState, room, remoteParticipant, hasRemoteVideo, hasRemoteBroadcaster, viewerCount, error, connect, disconnect }
}
