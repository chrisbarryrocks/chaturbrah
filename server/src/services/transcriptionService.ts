import OpenAI from 'openai'
import { toFile } from 'openai'
import { debugLog } from '../lib/debug.js'

const MIN_WORD_COUNT = 3

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env['OPENAI_API_KEY']
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
    client = new OpenAI({ apiKey })
  }
  return client
}

/**
 * Transcribe an audio buffer using OpenAI Whisper.
 * Returns the transcript text, or an empty string if the audio is too short,
 * silent, or produces a meaningless result.
 */
export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const openai = getClient()

  // Strip codec parameters (e.g. "audio/webm;codecs=opus" → "audio/webm") so
  // OpenAI's format detection isn't confused by the codec suffix.
  const baseMimeType = (mimeType.split(';')[0] ?? mimeType).trim()
  const extension = baseMimeType.includes('ogg') ? 'ogg' : 'webm'
  const filename = `audio.${extension}`

  debugLog(`transcribeAudio: buffer=${buffer.byteLength}B  mimeType=${mimeType}  baseMimeType=${baseMimeType}  filename=${filename}`)
  debugLog('transcribeAudio: calling OpenAI Whisper…')

  const file = await toFile(buffer, filename, { type: baseMimeType })

  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'en',
  })

  const rawText = response.text.trim()
  debugLog(`transcribeAudio: raw transcript → "${rawText}"`)

  if (isMeaningless(rawText)) {
    const reason = !rawText
      ? 'empty string'
      : rawText.split(/\s+/).filter(w => w.length > 0).length < MIN_WORD_COUNT
        ? `too short (${rawText.split(/\s+/).filter(w => w.length > 0).length} word(s), need ${MIN_WORD_COUNT})`
        : 'matched silence/noise phrase'
    debugLog(`transcribeAudio: filtered — ${reason}`)
    return ''
  }

  debugLog(`transcribeAudio: accepted → "${rawText}"`)
  return rawText
}

function isMeaningless(text: string): boolean {
  if (!text) return true
  const words = text.split(/\s+/).filter(w => w.length > 0)
  if (words.length < MIN_WORD_COUNT) return true

  const silencePhrases = [
    'you',
    'thank you',
    'thank you.',
    'thanks for watching',
    '...',
    '[music]',
    '[silence]',
    '[background noise]',
  ]
  if (silencePhrases.includes(text.toLowerCase())) return true

  return false
}
