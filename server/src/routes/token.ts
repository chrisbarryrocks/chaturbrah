import { Router } from 'express'
import type { Request, Response } from 'express'
import { createToken } from '../lib/livekit.js'
import type { TokenRole } from '../lib/livekit.js'

const router = Router()

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

router.post('/token', async (req: Request, res: Response) => {
  const { role } = req.body as { role?: string }

  if (role !== 'broadcaster' && role !== 'viewer') {
    res.status(400).json({ error: 'role must be "broadcaster" or "viewer"' })
    return
  }

  const apiKey = process.env['LIVEKIT_API_KEY']
  const apiSecret = process.env['LIVEKIT_API_SECRET']
  const liveKitUrl = process.env['LIVEKIT_URL']
  const roomName = process.env['ROOM_NAME'] ?? 'chaturbrah-main'

  if (!apiKey || !apiSecret || !liveKitUrl) {
    res.status(500).json({ error: 'LiveKit credentials not configured' })
    return
  }

  const identity = `${role}-${Date.now()}`
  const token = await createToken({
    apiKey,
    apiSecret,
    roomName,
    identity,
    role: role as TokenRole,
  })

  res.json({ token, url: liveKitUrl, roomName, identity })
})

export default router
