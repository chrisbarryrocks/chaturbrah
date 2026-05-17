const PREFIX = '[AI_CHATTERS_DEBUG]'

export function isAiChattersDebug(): boolean {
  return process.env['AI_CHATTERS_DEBUG'] === 'true'
}

export function debugLog(...args: unknown[]): void {
  if (isAiChattersDebug()) {
    console.log(PREFIX, ...args)
  }
}
