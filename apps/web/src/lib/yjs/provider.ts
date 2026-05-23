'use client'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { IndexeddbPersistence } from 'y-indexeddb'

export interface RoomConnection {
  doc: Y.Doc
  provider: WebrtcProvider
  persistence: IndexeddbPersistence
  awareness: WebrtcProvider['awareness']
  destroy: () => void
}

export async function connectToRoom(opts: {
  roomId: string
  token: string
  password: string   // shared room secret — same for all members, used to encrypt WebRTC traffic
  signalingUrl: string
  iceServers: RTCIceServer[]
  identity: { userId: string; displayName: string; email?: string }
}): Promise<RoomConnection> {
  const doc = new Y.Doc()

  const persistence = new IndexeddbPersistence(`crm-${opts.roomId}`, doc)
  await persistence.whenSynced

  const provider = new WebrtcProvider(opts.roomId, doc, {
    signaling: [`${opts.signalingUrl}?token=${encodeURIComponent(opts.token)}`],
    password: opts.password,
    peerOpts: {
      config: {
        iceServers: opts.iceServers,
        iceTransportPolicy: 'relay',  // TURN-only: no local network scan, no permission prompt
      },
    },
  })

  provider.awareness.setLocalStateField('user', {
    userId: opts.identity.userId,
    displayName: opts.identity.displayName,
    color: deriveColor(opts.identity.userId),
    email: opts.identity.email,
  })

  return {
    doc,
    provider,
    persistence,
    awareness: provider.awareness,
    destroy: () => {
      provider.destroy()
      persistence.destroy()
      doc.destroy()
    },
  }
}

function deriveColor(userId: string): string {
  const hue = [...userId].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `hsl(${hue}, 70%, 50%)`
}
