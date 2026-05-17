# Chaturbrah

A live streaming app with real-time video, low-latency playback, and chat. Built with React, LiveKit, and Express.

**Full project history, architecture, and version scope** (V1–V3 + follow-ups): see **[PROJECT.md](./PROJECT.md)**.

## Stack

- **Frontend** — React + TypeScript + Vite + Tailwind CSS
- **Backend** — Node.js + Express + TypeScript
- **Realtime** — [LiveKit Cloud](https://livekit.io)
- **Deploy** — Vercel (frontend) + Render (backend)

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero + **Live now** directory |
| `/broadcast` | Broadcaster page — camera preview, go live, controls, chat |
| `/watch/:username` | Viewer page for that streamer — player, quality, latency, chat |
| `/watch` | Redirects to `/` (use directory or a direct watch link) |

## Prerequisites

- Node.js 20.19+ or 22.12+
- A [LiveKit Cloud](https://cloud.livekit.io) account (free, no credit card)

## Local Setup

### 1. Clone and install

```bash
# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Configure the server

Create or edit `server/.env`:

```env
PORT=4000
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-project.livekit.cloud
CLIENT_URL=http://localhost:5173
ROOM_NAME=chaturbrah-main

# AI Chatters (optional — feature is disabled when AI_CHATTERS_ENABLED is not "true")
OPENAI_API_KEY=sk-...
AI_CHATTERS_ENABLED=true
```

Get your API key and secret from the [LiveKit Cloud dashboard](https://cloud.livekit.io) under **Settings → Keys**.

### 3. Configure the client

Create or edit `client/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

### 4. Run both services

In one terminal:

```bash
cd server && npm run dev
```

In a second terminal:

```bash
cd client && npm run dev
```

The app will be at [http://localhost:5173](http://localhost:5173).

## Development

```bash
# Server — TypeScript watch mode
cd server && npm run dev

# Client — Vite dev server with HMR
cd client && npm run dev

# Server — type check only
cd server && npx tsc --noEmit

# Client — type check + build
cd client && npm run build
```

## Debugging AI Chatters locally

The client always logs three events to the browser console — no env vars needed:

```
[AI Chatters] Started
[AI Chatters] Heard: "hey everyone, welcome to my stream"
[AI Chatters] Stopped
```

"Heard" is whatever Whisper transcribed from the last audio chunk. If you talk and no "Heard" line appears, either the silence gate filtered it (nothing above the RMS threshold) or the transcript was too short / a known silence phrase.

For deeper server-side inspection add this to `server/.env`:

```env
AI_CHATTERS_DEBUG=true
```

Server logs (prefixed `[AI_CHATTERS_DEBUG]`) will then show:
- Incoming request fields (roomName, streamerName, audio size, mimeType)
- Raw Whisper transcript and any filter reason (too short, silence phrase, empty)
- GPT prompt, raw model response, and final message count

## Architecture

```
browser
  └── GET /streams, POST /streams/start, DELETE /streams/:user, POST /streams/:user/heartbeat
  └── POST /token (role=broadcaster|viewer|preview, roomName=streamer username)
        └── server (Express) → LiveKit SDK → JWT
  └── WebRTC connection → LiveKit Cloud (per-streamer room)
        ├── broadcaster: publishes video + audio + data
        ├── viewer: subscribes + data (chat, announces, ping/pong)
        └── preview: subscribe-only thumbnail bot (no data, not counted as viewer)

Chat uses LiveKit data messages (no separate WebSocket server).
Latency is measured via broadcaster→viewer ping/pong data messages.
```

## AI Chatters

When enabled, the broadcaster can activate fake bot chatters that react to what they say out loud.

```
Broadcaster mic (MediaRecorder, ~8s chunks)
  └── POST /ai-chatters/respond  { audio, roomName, streamerName }
        └── OpenAI Whisper → transcript
        └── OpenAI GPT → 0–3 bot messages (BufferingBrad, CringeGoblin42, ModMom, PixelGremlin, TotallyRealViewer)
  └── Broadcaster client publishes messages as type: "chat" over LiveKit DataChannel
        └── All viewers receive via existing useChatMessages DataReceived handler
```

Bot messages render like normal viewer messages with a subtle `AI` badge. The OpenAI API key is never exposed to the browser. Set `AI_CHATTERS_ENABLED=true` in `server/.env` to activate the feature.

## Deployment

### Render (server)

1. Create a new **Web Service** pointing to `server/`
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Set all env vars from `server/.env` in Render's dashboard

### Vercel (client)

1. Create a new project pointing to `client/`
2. Framework preset: **Vite**
3. Set `VITE_API_BASE_URL` to your Render service URL

## Notes

- **Rooms** are per streamer username; `ROOM_NAME` in `.env` is only a **fallback** when the client omits `roomName`.
- **No real auth** — local username in `localStorage` (see `PROJECT.md`).
- Chat is ephemeral — not persisted server-side.
- **One registered live stream per username** on the API registry; LiveKit still enforces “don’t steal publish” per room via the in-app guard.
