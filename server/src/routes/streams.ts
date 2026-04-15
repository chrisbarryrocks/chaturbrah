import { Router } from 'express'
import type { Request, Response } from 'express'

const router = Router()

const USERNAME_RE = /^[a-zA-Z0-9]{1,30}$/

interface StreamEntry {
  username: string
  roomName: string
  startedAt: number
}

// username → StreamEntry
const liveStreams = new Map<string, StreamEntry>()
// username → (sessionId → lastSeen timestamp)
const viewerSessions = new Map<string, Map<string, number>>()

const SESSION_TTL_MS = 35_000

function activeViewerCount(username: string): number {
  const sessions = viewerSessions.get(username)
  if (!sessions) return 0
  const cutoff = Date.now() - SESSION_TTL_MS
  let count = 0
  for (const lastSeen of sessions.values()) {
    if (lastSeen > cutoff) count++
  }
  return count
}

// GET /streams — list all currently live streams
router.get('/streams', (_req: Request, res: Response) => {
  const result = Array.from(liveStreams.values()).map(entry => ({
    username: entry.username,
    roomName: entry.roomName,
    startedAt: entry.startedAt,
    viewerCount: activeViewerCount(entry.username),
    isLive: true,
  }))
  res.json(result)
})

// GET /streams/:username — single stream info (live or not)
router.get('/streams/:username', (req: Request, res: Response) => {
  const username = req.params['username'] as string
  const entry = liveStreams.get(username)
  if (!entry) {
    res.json({ username, isLive: false, viewerCount: 0 })
    return
  }
  res.json({
    username: entry.username,
    roomName: entry.roomName,
    startedAt: entry.startedAt,
    viewerCount: activeViewerCount(entry.username),
    isLive: true,
  })
})

// POST /streams/start — broadcaster announces going live
router.post('/streams/start', (req: Request, res: Response) => {
  const { username } = req.body as { username?: string }

  if (!username || !USERNAME_RE.test(username)) {
    res.status(400).json({ error: 'Invalid username' })
    return
  }

  if (liveStreams.has(username)) {
    res.status(409).json({ error: `${username} is already live` })
    return
  }

  liveStreams.set(username, {
    username,
    roomName: username,
    startedAt: Date.now(),
  })
  viewerSessions.set(username, new Map())

  res.json({ ok: true })
})

// DELETE /streams/:username — broadcaster ends stream
router.delete('/streams/:username', (req: Request, res: Response) => {
  const username = req.params['username'] as string
  liveStreams.delete(username)
  viewerSessions.delete(username)
  res.json({ ok: true })
})

// POST /streams/:username/heartbeat — viewer keeps session alive
router.post('/streams/:username/heartbeat', (req: Request, res: Response) => {
  const username = req.params['username'] as string
  const { sessionId } = req.body as { sessionId?: string }

  if (!sessionId) {
    res.status(400).json({ error: 'sessionId required' })
    return
  }

  // If stream is not yet registered (viewer joined before broadcaster), silently accept
  if (!viewerSessions.has(username)) {
    viewerSessions.set(username, new Map())
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  viewerSessions.get(username)!.set(sessionId, Date.now())
  res.json({ ok: true })
})

export default router
