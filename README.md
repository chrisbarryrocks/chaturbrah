# Chaturbrah

A live streaming app with real-time video, low-latency playback, and chat. Built with React, LiveKit, and Express.

## Stack

- **Frontend** — React + TypeScript + Vite + Tailwind CSS
- **Backend** — Node.js + Express + TypeScript
- **Realtime** — [LiveKit Cloud](https://livekit.io)
- **Deploy** — Vercel (frontend) + Render (backend)

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/broadcast` | Broadcaster page — camera preview, go live, controls, chat |
| `/watch` | Viewer page — live player, connection quality, latency, chat |

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

## Architecture

```
browser
  └── POST /token (role=broadcaster|viewer)
        └── server (Express) → LiveKit SDK → JWT
  └── WebRTC connection → LiveKit Cloud
        ├── broadcaster: publishes video + audio + data
        └── viewer: subscribes to tracks + data

Chat uses LiveKit data messages (no separate WebSocket server).
Latency is measured via broadcaster→viewer ping/pong data messages.
```

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

- v1 uses a single fixed room (`chaturbrah-main`) — no accounts, no auth
- Chat is ephemeral — messages are client-side only and not persisted
- Only one broadcaster at a time is supported in v1
