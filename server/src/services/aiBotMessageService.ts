import OpenAI from 'openai'
import { AI_BOTS, BOT_NAMES } from '../config/aiBots.js'
import { debugLog } from '../lib/debug.js'

export interface BotChatMessage {
  id: string
  senderId: string
  senderRole: 'ai-bot'
  senderName: string
  text: string
  sentAt: string
  isAiBot: true
}

interface GptBotMessage {
  botName: string
  message: string
}

interface GptResponse {
  messages: GptBotMessage[]
}

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env['OPENAI_API_KEY']
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
    client = new OpenAI({ apiKey })
  }
  return client
}

const COOLDOWN_MS = 10_000

const lastSentAt = new Map<string, number>()

/**
 * Generate 0–3 bot chat messages in response to a transcript.
 * Returns an empty array if the transcript is unclear, if the room is
 * still within the cooldown window, or if OpenAI returns nothing usable.
 */
export async function generateBotMessages(
  transcript: string,
  roomName: string,
  streamerName: string,
): Promise<BotChatMessage[]> {
  debugLog(`generateBotMessages: transcript="${transcript}"  room=${roomName}  streamer=${streamerName}`)

  if (!transcript.trim()) {
    debugLog('generateBotMessages: skipped — empty transcript')
    return []
  }

  const now = Date.now()
  const last = lastSentAt.get(roomName) ?? 0
  const remaining = COOLDOWN_MS - (now - last)
  if (remaining > 0) {
    debugLog(`generateBotMessages: skipped — cooldown active (${remaining}ms remaining)`)
    return []
  }

  debugLog('generateBotMessages: calling OpenAI GPT…')
  const openai = getClient()

  const personaList = AI_BOTS.map(b => `- ${b.name}: ${b.personality}`).join('\n')

  const systemPrompt = `
You are a live-stream chat simulator. Given a transcript of what a streamer just said, generate realistic short chat messages from fake bot viewers.

Bot personas:
${personaList}

Rules:
- Return valid JSON only. Shape: { "messages": [{ "botName": "...", "message": "..." }] }
- Use only these bot names: ${BOT_NAMES.join(', ')}
- Generate 0–3 messages. Use 0 if the transcript is unclear, boring, or unsafe.
- Each message must be 3–15 words.
- Messages must relate to what the streamer said.
- No two messages should be identical.
- No sexual content.
- No hateful content.
- No threats or harassment.
- No slurs or personal attacks.
- Do not claim the bots are real humans.
- Do not mention OpenAI or AI.
- If the transcript is unsafe or unclear, return { "messages": [] }.
`.trim()

  const userPrompt = `Streamer "${streamerName}" just said: "${transcript}"\n\nGenerate chat responses.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.9,
    max_tokens: 256,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content ?? ''
  debugLog(`generateBotMessages: raw model response → ${raw}`)

  let parsed: GptResponse
  try {
    parsed = JSON.parse(raw) as GptResponse
  } catch {
    debugLog('generateBotMessages: failed to parse model response as JSON')
    return []
  }

  const items = Array.isArray(parsed.messages) ? parsed.messages : []
  const valid = items
    .filter(
      (m): m is GptBotMessage =>
        typeof m.botName === 'string' &&
        typeof m.message === 'string' &&
        BOT_NAMES.includes(m.botName) &&
        m.message.trim().length > 0,
    )
    .slice(0, 3)

  debugLog(`generateBotMessages: parsed ${items.length} item(s), ${valid.length} valid after filtering`)

  if (valid.length === 0) return []

  lastSentAt.set(roomName, now)

  const sentAt = new Date().toISOString()
  const result = valid.map(item => ({
    id: `bot-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    senderId: `bot-${item.botName}`,
    senderRole: 'ai-bot' as const,
    senderName: item.botName,
    text: item.message.trim(),
    sentAt,
    isAiBot: true as const,
  }))

  debugLog('generateBotMessages: generated messages →', result.map(m => `${m.senderName}: "${m.text}"`))
  return result
}
