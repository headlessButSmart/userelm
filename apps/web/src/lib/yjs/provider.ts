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
  signalingUrl?: string  // omit to use y-webrtc's built-in public signaling servers
  iceServers: RTCIceServer[]
  identity: { userId: string; displayName: string; email?: string }
}): Promise<RoomConnection> {
  const doc = new Y.Doc()

  const persistence = new IndexeddbPersistence(`crm-${opts.roomId}`, doc)
  await persistence.whenSynced

  // Public signaling servers — y-webrtc connects to ALL of them simultaneously,
  // so peers find each other as long as at least one is reachable.
  const defaultSignaling = [
    'wss://signaling.yjs.dev',
    'wss://y-webrtc-eu.fly.dev',
    'wss://y-webrtc-us.fly.dev',
  ]

  const provider = new WebrtcProvider(opts.roomId, doc, {
    signaling: opts.signalingUrl
      ? [`${opts.signalingUrl}?token=${encodeURIComponent(opts.token)}`]
      : defaultSignaling,
    password: opts.password,
    peerOpts: {
      config: {
        iceServers: opts.iceServers,
        iceTransportPolicy: 'relay',
      },
    },
  })

  // DEBUG — remove before shipping
  provider.on('peers', (e: any) => {
    console.debug('[WebRTC] peers', e)
    ;(e.added ?? []).forEach((id: string) => {
      const conn = (provider as any).room?.webrtcConns?.get(id)
      const pc: RTCPeerConnection | undefined = conn?.peer?._pc
      if (pc) {
        pc.addEventListener('iceconnectionstatechange', () =>
          console.debug('[WebRTC] ICE state →', pc.iceConnectionState, 'peer', id)
        )
        pc.addEventListener('icecandidateerror', (ev: RTCPeerConnectionIceErrorEvent) =>
          console.warn('[WebRTC] ICE candidate error', ev.errorCode, ev.errorText, ev.url)
        )
      }
    })
  })
  provider.on('synced', (e: any) => console.debug('[WebRTC] synced', e))

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
