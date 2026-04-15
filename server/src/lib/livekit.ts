import { AccessToken } from 'livekit-server-sdk'

export type TokenRole = 'broadcaster' | 'viewer' | 'preview'

interface TokenConfig {
  apiKey: string
  apiSecret: string
  roomName: string
  identity: string
  role: TokenRole
}

export async function createToken(config: TokenConfig): Promise<string> {
  const { apiKey, apiSecret, roomName, identity, role } = config

  const token = new AccessToken(apiKey, apiSecret, { identity })

  if (role === 'broadcaster') {
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    })
  } else if (role === 'preview') {
    // Subscribe-only, no data publish — invisible to viewer counts
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: false,
      canPublishData: false,
      canSubscribe: true,
    })
  } else {
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: false,
      canPublishData: true,
      canSubscribe: true,
    })
  }

  return await token.toJwt()
}
