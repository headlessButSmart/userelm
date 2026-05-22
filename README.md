# Userelm — Free Peer-to-Peer Team Workspace

**[userelm.com](https://userelm.com)** · *user elm · user realm*

A fully local-first, end-to-end encrypted workspace that runs entirely in the browser. No cloud lock-in, no per-seat fees, no data leaving your devices unless you choose to share it. **Free forever.**

Built with [Yjs](https://yjs.dev) (CRDTs) for conflict-free real-time collaboration and WebRTC for direct peer-to-peer sync between team members.

---

## Modules

| Module | Description |
|---|---|
| **CRM** | Contacts, companies, deals pipeline, and activity log |
| **Finance** | Invoices and expense tracking |
| **HR** | Team directory, employee profiles, leave management |
| **Boards** | Kanban boards with drag-and-drop cards, priorities, and assignees |
| **Support** | Customer support ticketing with comments, internal notes, and assignment |

---

## Architecture

```
apps/
  web/          Next.js 15 frontend (App Router) — deployed on Firebase App Hosting
packages/
  platform/     Shared data layer — schemas, queries, mutations (Yjs)
  shared/       Shared utility types
```

### How data works

- All workspace data lives in a **Yjs document** — a CRDT-based data structure that merges concurrent edits automatically and without conflicts.
- The document is persisted locally in **IndexedDB** via `y-indexeddb`, so the app works fully offline.
- When online, changes sync directly peer-to-peer over **WebRTC** (via `y-webrtc`), encrypted with a shared room key derived from the invite URL.
- WebRTC signaling is handled by the **public `wss://signaling.yjs.dev` server** — it relays handshakes only and never sees your encrypted data.
- Room metadata (name, invite secret hash, owner email) is stored in **Firebase Firestore** and only accessed by the Next.js API routes.

### Local-first guarantees

| Property | How it's achieved |
|---|---|
| Works offline | IndexedDB persistence — full read/write without a server |
| No workspace data on server | All content is in the browser; Firestore only holds room metadata |
| Conflict-free sync | Yjs CRDTs — last-write-wins per field, with intent preservation |
| E2E encryption | WebRTC data channels encrypted with the shared room secret |
| No account needed | Identity is a random ID generated once per browser (`localStorage`) |

---

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install

```bash
pnpm install
```

### Environment variables

Create `apps/web/.env.local`:

```env
# Firebase Admin SDK (for Firestore room management)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# JWT signing secret (any random string, min 32 chars)
JWT_SECRET=your-random-secret-here

# Optional: TURN server credentials for NAT traversal
# TURN_URLS=turn:your-turn-server.com:3478
# TURN_USERNAME=username
# TURN_CREDENTIAL=password
```

> **Note:** In development, Firestore rate limiting is bypassed so you can create rooms freely without hitting limits.

### Development

```bash
pnpm dev
```

The app runs at `http://localhost:3000`. Signaling is handled automatically by `wss://signaling.yjs.dev`.

### Create a workspace

1. Open `http://localhost:3000`
2. Click **Create workspace** — you'll get a shareable invite link with the room key in the URL fragment (never sent to any server)
3. Share the link with teammates — they click it and join directly via WebRTC

---

## Deployment (Firebase App Hosting)

This project is configured for [Firebase App Hosting](https://firebase.google.com/docs/app-hosting), which provides native Next.js SSR support.

### First-time setup

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Log in: `firebase login`
3. Initialize App Hosting: `firebase apphosting:backends:create`

### Set environment secrets

```bash
firebase apphosting:secrets:set FIREBASE_PROJECT_ID
firebase apphosting:secrets:set FIREBASE_CLIENT_EMAIL
firebase apphosting:secrets:set FIREBASE_PRIVATE_KEY
firebase apphosting:secrets:set JWT_SECRET
```

### Deploy

```bash
firebase apphosting:backends:deploy
```

Firebase App Hosting auto-detects Next.js and handles SSR, API routes, and static assets without any additional configuration.

### Firestore setup

Create a Firestore database in your Firebase project and add these collections (they are created automatically on first use):

| Collection | Purpose |
|---|---|
| `rooms` | Workspace metadata (name, hashed secret, owner, status) |
| `rate-limit-buckets` | IP/email rate limiting for room creation |
| `abuse-reports` | Abuse reports submitted via the settings page |

Recommended Firestore security rules (API routes use the Admin SDK, so client-side access should be blocked):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Invite & room model

Each workspace is identified by a **room ID** and protected by a **shared secret** embedded in the invite URL fragment (`#room=<id>&key=<secret>`). The secret:

- Is never sent to any server (it's in the URL hash, not the query string)
- Is used as the y-webrtc encryption password so only people with the link can read the traffic
- Is stored in `localStorage` so returning members don't need to re-enter it
- Is bcrypt-hashed before storage in Firestore (the plaintext is never persisted server-side)

---

## Card assignment & member emails

When joining a room, members can optionally enter their email address. This is stored locally in `localStorage` under the key `room-members:<roomId>` and shared with peers via Yjs awareness. These emails power:

- **Kanban card assignment** — assign cards to known members
- **Support ticket assignment** — route tickets to team members

Email addresses are never sent to any server.

---

## UI features

### Real-time notifications
The sidebar bell icon shows updates from teammates since your current session started — new contacts, companies, deals, tickets, invoices, expenses, and employees created or deleted by others. Clicking a notification navigates directly to the affected record.

### Record counts
Each navigation item displays a live count of records in that section, updated in real-time as teammates add or remove items.

### Table / card view toggle
All record list pages support switching between a **table view** and a **card grid view** using the toggle in the toolbar. Your preference is remembered per section in `localStorage`.

| Section | Default view |
|---|---|
| Contacts | Table |
| Companies | Grid |
| Tickets | Table |
| Team | Grid |
| Invoices | Table |
| Expenses | Table |

---

## Module data model

Each module owns a set of named Yjs Maps (defined in `packages/platform/src/modules/<module>/schema.ts`). Modules export:

- `schema.ts` — TypeScript interfaces and enum constants
- `queries.ts` — pure read functions (Yjs Map → typed rows)
- `mutations.ts` — transactional write functions
- `module.ts` — sidebar registration (title, icon, nav links)

Adding a new module means implementing these four files and registering the module in `packages/platform/src/core/modules.ts`.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Data sync | Yjs, y-webrtc, y-indexeddb |
| Signaling | `wss://signaling.yjs.dev` (public Yjs server) |
| Room metadata | Firebase Firestore (Admin SDK) |
| Hosting | Firebase App Hosting |
| Monorepo | pnpm workspaces |

---

## Rate limits

Room creation is rate-limited per IP (10/hour) and per email (10/day) in production. Rate limit state is stored in Firestore and resets automatically. In development mode (`NODE_ENV=development`) all rate limits are bypassed.

---

## License

MIT
