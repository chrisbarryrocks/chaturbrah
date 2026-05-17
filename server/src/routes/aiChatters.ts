import { Router } from 'express'
import type { Request, Response } from 'express'
import multer from 'multer'
import { transcribeAudio } from '../services/transcriptionService.js'
import { generateBotMessages } from '../services/aiBotMessageService.js'
import { debugLog } from '../lib/debug.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post(
  '/ai-chatters/respond',
  upload.single('audio'),
  async (req: Request, res: Response) => {
    if (process.env['AI_CHATTERS_ENABLED'] !== 'true') {
      res.json({ messages: [] })
      return
    }

    const file = req.file
    const { roomName, streamerName } = req.body as {
      roomName?: string
      streamerName?: string
    }

    debugLog('request received', {
      roomName,
      streamerName,
      audioReceived: !!file,
      audioSizeBytes: file?.size ?? 0,
      mimeType: file?.mimetype ?? 'n/a',
    })

    if (!file || !roomName || !streamerName) {
      res.status(400).json({ error: 'audio, roomName, and streamerName are required' })
      return
    }

    try {
      debugLog(`calling transcribeAudio  mimeType=${file.mimetype}  size=${file.size}B`)
      const transcript = await transcribeAudio(file.buffer, file.mimetype || 'audio/webm')
      const transcriptFiltered = !transcript

      debugLog(
        transcriptFiltered
          ? 'transcript filtered — skipping bot generation'
          : `transcript accepted: "${transcript}" — calling generateBotMessages`,
      )

      if (transcriptFiltered) {
        res.json({ messages: [], transcript: '' })
        return
      }

      const messages = await generateBotMessages(transcript, roomName, streamerName)
      debugLog(`generateBotMessages returned ${messages.length} message(s)`)

      res.json({ messages, transcript })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error'
      console.error('[ai-chatters] error:', message)
      res.status(500).json({ error: message })
    }
  },
)

export default router
