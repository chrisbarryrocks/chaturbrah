# Chaturbrah — Full Project Documentation

This document is the **single consolidated reference** for Chaturbrah: product intent, architecture, and everything shipped across **V1**, **V2**, **V3**, and follow-up work. It replaces piecing together separate version writeups.

---

## 1. What Chaturbrah is

**Chaturbrah** is a small, portfolio-quality live streaming web app: real WebRTC video/audio through **LiveKit Cloud**, a light **broadcaster** experience, a polished **viewer** experience, and **real-time chat** over LiveKit **data messages** (no separate chat WebSocket server).

Design goals: dark, modern streaming UI; clear connection / offline / reconnect states; readable latency and quality hints; extendable toward “real product” features later without rewriting the core.

---

## 2. Product scope (how it evolved)

### Always true (non-negotiables for the demo)

- **Real** WebRTC streaming (no fake/simulated video).
- **LiveKit Cloud** for media + data transport.
- **No real auth / accounts** in shipped versions — identity is **local** (V3+) with a path to real accounts later.
- **Chat** is core: send/receive in real time; **not persisted** server-side; no moderation tooling in-app.

### V1 scope (original)

- **One “global” room** for the whole app (`chaturbrah-main` via env), single streamer at a time in practice.
- Broadcaster + unlimited viewers in the same room.
- No follows, VOD, or account system.

### V2 scope (polish, same product shape as V1)

- Visual and UX polish; **viewer** as the hero surface.
- Custom playback controls; later simplified (no settings mega-menu).
- Same single-room model as V1.

### V3 scope (identity + rooms + directory)

- **Alphanumeric username** (1–30 chars), stored in `localStorage`, editable.
- **Room name = streamer username** — each broadcaster has their own LiveKit room.
- **In-memory live registry** on the API server + **homepage directory** of live streams.
- **Watch URL** is streamer-specific: `/watch/:username`.
- Duplicate usernames allowed in theory; **only one “live” registration** per username on the server at a time.

### Post-V3 (incremental)

- Landing layout: **no “Watch Stream” button**; **Live now** moved up; **Start Broadcasting** is the primary CTA; when empty, **CTA sits inside the empty-state card** with copy.
- **Directory thumbnails**: one-shot **JPEG frame** from a short LiveKit **preview** connection (not a permanent embedded player; no periodic refresh).
- **`preview` token role**: subscribe-only, **no data publish**, identity `preview-…` — **excluded from viewer counts** and cannot spam chat.
- **System chat lines**: join / leave (real names only), stream started / ended; fixes for double `DataReceived` handlers, stable display names, and guards against raw identity strings in leave copy.

---

## 3. Tech stack

| Layer | Choice |
|--------|--------|
| Frontend | React 19, TypeScript, **Vite**, **Tailwind CSS v4** (`@tailwindcss/vite`) |
| Routing | React Router 7 |
| Realtime media | **livekit-client** |
| Backend | Node.js, **Express 5**, TypeScript (**ESM**), **tsx** for dev |
| Tokens / server SDK | **livekit-server-sdk** (`AccessToken`, async `toJwt()`) |
| Hosting (intended) | **Vercel** (static SPA + rewrites), **Render** (API + long-lived process) |

---

## 4. Repository layout

```
chaturbrah/
├── client/                 # Vite React app
│   ├── src/
│   │   ├── components/     # AppLayout, buttons, wordmark, UsernameModal, …
│   │   ├── context/        # UserProfileContext (V3)
│   │   ├── features/
│   │   │   ├── broadcast/  # BroadcasterControls, useAiChatters, AiChattersToggle, …
│   │   │   ├── watch/      # ViewerPlayer, controls, overlays, StreamPreviewVideo
│   │   │   └── chat/       # ChatPanel, list, item, composer
│   │   ├── hooks/          # useRoomConnection, useChatMessages, useLiveStreams, …
│   │   ├── lib/            # api.ts (token, streams)
│   │   ├── pages/          # Landing, Broadcast, Watch
│   │   ├── types/
│   │   └── utils/          # chat encode/decode, formatTime
│   ├── vercel.json         # SPA rewrite → index.html
│   └── package.json
├── server/
│   └── src/
│       ├── index.ts        # Express, manual CORS, JSON body
│       ├── config/
│       │   └── aiBots.ts   # Bot persona definitions (AI Chatters)
│       ├── routes/
│       │   ├── token.ts    # POST /token, GET /health
│       │   ├── streams.ts  # live registry + heartbeats (V3)
│       │   └── aiChatters.ts  # POST /ai-chatters/respond (AI Chatters)
│       ├── services/
│       │   ├── transcriptionService.ts  # OpenAI Whisper wrapper
│       │   └── aiBotMessageService.ts   # GPT bot message generator
│       └── lib/
│           └── livekit.ts  # JWT grants per role (broadcaster | viewer | preview)
├── README.md               # Quick start
└── PROJECT.md              # This file
```

---

## 5. Architecture (runtime)

```
Browser (React)
  │
  ├─► GET  /streams              (directory, viewer counts)
  ├─► POST /streams/start        (broadcaster marks live)
  ├─► DELETE /streams/:username  (broadcaster ends; clears sessions)
  ├─► POST /streams/:username/heartbeat  (viewer session ping)
  │
  └─► POST /token { role, roomName }
            └── Express + LiveKit SDK → JWT
            └── WSS connect to LiveKit Cloud
                  ├── Broadcaster: publish A/V + data
                  ├── Viewer: subscribe + data
                  └── Preview: subscribe only, no data (thumbnails)
```

- **Chat + latency pings** use **LiveKit DataChannel** payloads (JSON), not a second WebSocket app.
- **Latency buckets** (low / medium / high) use timestamp **ping/pong** over data messages.

---

## 6. V1 — What shipped (baseline product)

### Routes (V1)

| Path | Purpose |
|------|---------|
| `/` | Landing — wordmark, tagline, links to broadcast / watch |
| `/broadcast` | Preview camera/mic, Go Live, End Stream, status, chat |
| `/watch` | Large player, badges, offline/reconnect/error states, chat |

*(V3+ redirects `/watch` → `/`; canonical watch is `/watch/:username`.)*

### Backend (V1)

- **`GET /health`** — liveness.
- **`POST /token`** — body `{ "role": "broadcaster" | "viewer" }`; returns `{ token, url, roomName, identity }`.
- **Room** from `ROOM_NAME` env (default `chaturbrah-main`).
- **Identities** include a random suffix to reduce multi-tab collisions: `broadcaster-<ts>-<rand>`, `viewer-<ts>-<rand>`.
- **Grants**: broadcaster may publish video/audio + data; viewer may subscribe + data.
- **CORS**: implemented manually in Express (methods include `OPTIONS`, `DELETE` where needed); `Vary: Origin`.

### Frontend (V1)

- **Broadcaster**: `getUserMedia` preview; on Go Live — token, `Room.connect`, publish camera + mic; toggles; End unpublishes / disconnect pattern used with chat-in-room behavior.
- **Viewer**: connect as subscriber; **“Live”** only when **remote video** is actually present; offline / ended / reconnect overlays; `ViewerPlayer` attaches remote video/audio tracks.
- **Chat**: payload shape `{ type: 'chat', message: { id, senderId, senderRole, senderName, text, sentAt } }`; list + composer; timestamps; styling for broadcaster vs viewer vs self (evolved in later versions).
- **Connection UX**: connection badge, quality hint, latency label from `useLatencyIndicator` + `useConnectionStatus`.
- **Branding**: Chaturbrah wordmark, dark surfaces, accent/live colors in CSS variables + Tailwind.

### Ops / tooling (V1)

- **`client/.env.local`**: `VITE_API_BASE_URL`.
- **`server/.env`**: port, LiveKit keys, `CLIENT_URL`, `ROOM_NAME`.
- **Root README**: local run instructions.

---

## 7. V2 — Polish pass (same single-room product)

### Visual / layout

- Deeper surfaces: shadows, gradients, panel borders; broadcast and watch layouts feel more “product” than prototype.
- **Viewer**: custom **control bar** (mute, volume, fullscreen, PiP where supported), auto-hide on inactivity; **no default browser video controls**.
- **Live timer** while actually live.
- Chat panel header / empty state polish; message row readability.

### Removed or simplified (after user feedback)

- Viewer **settings menu** (theater, fit modes, mute-on-join, resolution line, etc.) **removed** in favor of simpler UX.
- Video fit fixed to **`object-contain`** for predictability.
- Chat **collapse/expand** as a small floating control on large breakpoints (Twitch-like), not a heavy settings surface.

---

## 8. Post-V2 fixes & small features (still pre–per-room V3)

Worth recording because they materially affect reliability and UX:

- **Broadcaster “always live” / End Stream** — decoupled **LiveKit connected** from **actually publishing** via `isStreaming` / `isGoingLive` in `BroadcasterControls` + `onStreamingChange` to parent.
- **Viewer “Live” when offline** — gated on **`hasRemoteVideo`**, not merely “connected”.
- **Camera toggle / republish** — self-preview stays in sync after republish; button labels match real track state.
- **Broadcaster chat while not publishing** — stays in room for data when not “live” (reconnect after end as needed).
- **Multi-tab / Strict Mode** — `didConnectRef` on pages to avoid **double `connect()`** in dev (inflated viewer counts, duplicate tokens).
- **Viewer count** — counts **viewers** in room; refined to match expectations when live; only show counts when stream is **actually live** where applicable.
- **Random viewer display names** — e.g. `Viewer 1234` for chat handle before username system.
- **“Someone already broadcasting”** — based on **remote participant with active published video**, not merely “another socket in the room”.
- **Media cleanup on navigate away** — refs to `MediaStream` / tracks so **camera/mic stop** on unmount.
- **Landing CTAs as `<Link>`** — middle-click / new tab works.
- **Vercel SPA** — `client/vercel.json` rewrites to `index.html` for deep links.
- **Favicon / wordmark icon** — `cb.png` sizing next to text.
- **Landing copy** — tagline with highlighted words; footer version string updated over time.

---

## 9. V3 — Local identity, per-streamer rooms, live directory

### Product

- Username: **required** for broadcast flow; stored under **`chaturbrah:username`**; validation **`/^[a-zA-Z0-9]{1,30}$/`**.
- **Room = username** for both broadcast and watch for that streamer.
- **Directory**: cards with username, LIVE badge, viewer count (from server heartbeats), link to `/watch/:username`.
- **Header**: show / edit username (`UsernameModal`).

### Backend (`server/src/routes/streams.ts`)

- In-memory **`liveStreams`**: `username → { username, roomName, startedAt }`.
- In-memory **`viewerSessions`**: `username → sessionId → lastSeen`**; viewer count = sessions with `lastSeen` within **35s** (computed on read).
- **`POST /streams/start`** `{ username }` — register live; conflict if already live.
- **`DELETE /streams/:username`** — end stream + clear sessions.
- **`POST /streams/:username/heartbeat`** `{ sessionId }` — upsert session (viewer tabs).

### Backend (`server/src/routes/token.ts`)

- Accepts **`roomName`** in JSON body; must match same alphanumeric rule when provided; else falls back to `ROOM_NAME` env.

### Frontend

- **`UserProfileProvider`** wraps app (`App.tsx`).
- **`useLiveStreams`** — polls **`GET /streams`** every 10s on landing.
- **`useRoomConnection(role, roomName?)`** — passes `roomName` into `fetchToken`.
- **Routes**: `/`, `/broadcast`, `/watch/:username`, `/watch` → `/`, catch-all → `/`.
- **WatchPage**: `useParams`, heartbeat every **20s** while connected, streamer name in chrome, optional username gate for chat composer.
- **BroadcastPage**: blocking username modal if unset; `startStream` / `endStream` on streaming transitions.

---

## 10. Post-V3 — Landing, thumbnails, preview role, chat system messages

### Landing

- Removed redundant **Watch Stream** button; **Live now** is the entry to streams.
- Reduced vertical gap between hero and directory.
- **Primary purple** “Start Broadcasting” consistent with prior primary styling.
- **Empty state** groups icon + copy + primary CTA in one card.

### Directory thumbnails (`StreamPreviewVideo`)

- Short-lived connection: **`fetchToken('preview', username)`**, `autoSubscribe: false`, **`publication.setSubscribed(true)`** on first video publication, capture one **JPEG** from a hidden `<video>` on `playing`, show as `<img>`, disconnect (with a short delay to reduce churn).
- **One capture per mount** — no interval refresh.

### Preview role (server `livekit.ts`)

- **`preview`**: `canSubscribe: true`, **`canPublishData: false`**, `canPublish: false`.
- Identity prefix **`preview-`** so **`countViewers`** (which only counts `viewer-` remotes + self) **ignores** thumbnail bots.

### Chat system messages (`useChatMessages` + types)

- **`ChatMessage.senderRole`** extended with **`'system'`**.
- **`DataMessagePayload`**: `{ type: 'announce', event: 'join' | 'stream-start' | 'stream-end', displayName }`.
- **Join**: optional `announceJoin` when user has a real stored username.
- **Leave**: on `ParticipantDisconnected` if display name known from join announce; **regex guard** so raw `viewer-…` / `broadcaster-…` identities never print as names.
- **Stream start/end**: driven by broadcaster **`isStreaming`** prop into `ChatPanel` / hook; announces + local system lines.
- **Rendering**: system rows as subtle centered italic text with faint rules.

### Stability fixes (same era)

- **`WatchPage`**: stable **`senderName`** via `useState` initializer (was re-randomizing every render).
- **`useChatMessages`**: single **`DataReceived`** handler; correct LiveKit callback arg order.
- **`StreamPreviewVideo`**: removed dead **`REFRESH_INTERVAL_MS`** (TS6133 in strict builds).

---

## 11. AI Chatters — streamer-controlled bot chatter (V4)

### Feature overview

The broadcaster can enable fake bot chatters that react to what they say out loud. There is a **Start AI Chatters / Stop AI Chatters** toggle on `/broadcast`, active only while the stream is live. When active, audio chunks from the broadcaster mic are sent to the backend every ~8 seconds. The backend transcribes the audio and generates 0–3 bot chat messages. The broadcaster client publishes those messages into the existing LiveKit data-message channel; viewers receive them via the standard `useChatMessages` `DataReceived` handler.

### Data flow

```
Broadcaster mic (MediaRecorder, ~8s chunks)
  └── POST /ai-chatters/respond  { audio: webm blob, roomName, streamerName }
        └── transcriptionService → OpenAI Whisper → transcript text
        └── aiBotMessageService → OpenAI GPT-4o-mini → 0–3 bot messages
  └── BotChatMessage[] returned to broadcaster browser
        └── broadcaster: room.localParticipant.publishData (type: "chat")
              └── All viewers: useChatMessages DataReceived → messages list
        └── broadcaster: botMessages state → ChatPanel externalMessages → local list
```

### Bot personas

| Name | Personality |
|------|-------------|
| BufferingBrad | Confused but supportive; slightly delayed reaction energy |
| CringeGoblin42 | Chaotic gamer goblin, funny but not mean |
| ModMom | Fake responsible adult trying to keep chat on track |
| PixelGremlin | Hyperactive gamer energy, short bursts of pure excitement |
| TotallyRealViewer | Suspiciously generic hype chatter |

### New files

| Path | Purpose |
|------|---------|
| `server/src/config/aiBots.ts` | Bot persona definitions |
| `server/src/services/transcriptionService.ts` | OpenAI Whisper wrapper |
| `server/src/services/aiBotMessageService.ts` | GPT bot message generator with safety prompt |
| `server/src/routes/aiChatters.ts` | `POST /ai-chatters/respond` endpoint (multer multipart) |
| `client/src/features/broadcast/useAiChatters.ts` | MediaRecorder loop, API calls, LiveKit publish |
| `client/src/features/broadcast/AiChattersToggle.tsx` | Start/Stop toggle UI component |

### Modified files (AI Chatters additions)

- `client/src/types/index.ts` — `ChatMessage.senderRole` extended with `'ai-bot'`
- `client/src/lib/api.ts` — `sendAiChatterAudio()` helper
- `client/src/features/broadcast/BroadcasterControls.tsx` — `onAudioStreamReady` prop
- `client/src/features/chat/ChatPanel.tsx` — `externalMessages` prop (sorted merge)
- `client/src/features/chat/ChatMessageItem.tsx` — subtle `AI` badge for `ai-bot` role
- `client/src/pages/BroadcastPage.tsx` — integrates hook + toggle + wires audio stream

### Console logging (client)

Three unconditional logs — no env vars required:

```
[AI Chatters] Started
[AI Chatters] Heard: "what the streamer said"
[AI Chatters] Stopped
```

`Heard` reflects exactly what Whisper transcribed. If nothing appears, the silence gate filtered the window (no speech detected above the RMS threshold) or the transcript was too short / a known silence phrase.

Server-side verbose logging is available under `AI_CHATTERS_DEBUG=true` in `server/.env`.

### Known limitations (V1 approach)

- Audio chunking and transcription runs from the **broadcaster browser**, not from a LiveKit backend agent. This is intentional for V1 simplicity. A V2 approach could use a LiveKit server-side participant to subscribe to the audio track, removing the need for browser MediaRecorder.
- Bot messages appear with a small `AI` badge in all chat panels. They are ephemeral (not persisted) and clearly labeled.
- The per-room cooldown (`AI_CHATTERS_MESSAGE_COOLDOWN_MS`) is tracked in the server's in-memory state and resets on restart.

---

## 12. API reference (current)

### `GET /health`

JSON `{ status, timestamp }`.

### `POST /token`

Body:

```json
{
  "role": "broadcaster" | "viewer" | "preview",
  "roomName": "optionalAlphanumericRoom"
}
```

Response: `{ "token", "url", "roomName", "identity" }`.

### Streams (V3)

| Method | Path | Body | Notes |
|--------|------|------|--------|
| GET | `/streams` | — | List live entries + computed `viewerCount` |
| GET | `/streams/:username` | — | Optional single-row shape (if present in server) |
| POST | `/streams/start` | `{ "username" }` | 409 if already live |
| DELETE | `/streams/:username` | — | Ends stream |
| POST | `/streams/:username/heartbeat` | `{ "sessionId" }` | Keeps viewer session warm |

### `POST /ai-chatters/respond`

Request: `multipart/form-data`

| Field | Type | Notes |
|-------|------|-------|
| `audio` | File | webm audio blob from MediaRecorder |
| `roomName` | string | Streamer's room / username |
| `streamerName` | string | Streamer's display name |

Response:

```json
{
  "messages": [
    {
      "id": "bot-...",
      "senderId": "bot-BufferingBrad",
      "senderRole": "ai-bot",
      "senderName": "BufferingBrad",
      "text": "wait what did he just say lol",
      "sentAt": "2026-05-17T19:00:00.000Z",
      "isAiBot": true
    }
  ],
  "transcript": "what the streamer said"
}
```

`transcript` is always present — empty string `""` when filtered. Returns `{ "messages": [], "transcript": "" }` when `AI_CHATTERS_ENABLED` is not `"true"`, when the transcript is empty, or when the cooldown window has not elapsed.

---

## 13. Environment variables

### `server/.env`

| Variable | Purpose |
|----------|---------|
| `PORT` | API port (default 4000) |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_URL` | Cloud project |
| `CLIENT_URL` | CORS origin(s) / logging |
| `ROOM_NAME` | **Fallback** room when client omits `roomName` (legacy / tooling) |
| `OPENAI_API_KEY` | Required for AI Chatters; feature is disabled if absent |
| `AI_CHATTERS_ENABLED` | Set to `"true"` to enable the `/ai-chatters/respond` endpoint |

### `client/.env.local`

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | e.g. `http://localhost:4000` or Render URL |

No client-side debug env vars are needed. The browser console always logs `[AI Chatters] Started`, `[AI Chatters] Heard: "..."`, and `[AI Chatters] Stopped` unconditionally.

---

## 14. Data message protocol (client ↔ client via LiveKit)

| `type` | Purpose |
|--------|---------|
| `chat` | User chat message (`ChatMessage`) |
| `announce` | Presence / lifecycle: `join`, `stream-start`, `stream-end` |
| `ping` / `pong` | Latency estimation |

Encoding: JSON → `TextEncoder` → `Uint8Array`; `publishData(..., { reliable: true })` for chat and announces.

---

## 15. Notable implementation details

- **Token JWT**: `createToken` is **async** (`await token.toJwt()`).
- **Express 5**: wildcard OPTIONS path uses `/{*path}` style where applicable.
- **`useRoomConnection.connect`**: returns the **`Room`** instance so broadcaster can publish immediately after connect.
- **Remote “another broadcaster” guard**: remote identity prefix **`broadcaster-`** **and** an **active subscribed video** publication.
- **Vercel**: SPA **rewrite** so `/broadcast` and `/watch/...` refresh work.

---

## 16. Intentional limitations & future hooks

- **No auth**, no server-side user database, no VOD, no clips, no follows — by design for the demo.
- **Live registry** is **in-memory** — restarts clear “who’s live”; fine for portfolio / single-node.
- **Username** is **local** — duplicate names possible; “one live per username” is **server registry**, not global identity.
- **Chat** is **ephemeral** — refresh loses history; no moderation pipeline.
- **Thumbnails** are **client-captured frames**, not a dedicated thumbnail CDN or LiveKit Egress pipeline.

Plausible next steps (not implemented here): real accounts, persisted chat, moderation, multiple concurrent rooms with DB-backed directory, server-generated thumbnails via Egress + object storage.

---

## 17. How to use this doc

- **Onboarding**: read §1–5, then run **`README.md`**.
- **"What did we build?"**: §6–11 chronologically.
- **Integration / ops**: §12–13.
- **Client protocol extensions**: §14.

---

*Last consolidated pass: reflects Chaturbrah through V3 + post-V3 landing, thumbnails, preview role, chat system lines, stability/build fixes, and AI Chatters (V4) with simplified client logging and always-present transcript in API response.*
