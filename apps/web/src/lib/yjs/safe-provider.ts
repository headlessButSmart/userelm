'use client'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

interface ProviderOpts {
  signaling: string[]
  password?: string
  peerOpts?: Record<string, unknown>
  onSuspiciousMerge?: (info: {
    before: { contacts: number; deals: number; notes: number }
    after: { contacts: number; deals: number; notes: number }
  }) => void
}

export function createSafeProvider(roomId: string, doc: Y.Doc, opts: ProviderOpts) {
  const preConnectState = {
    contacts: doc.getMap('contacts').size,
    deals: doc.getMap('deals').size,
    notes: doc.getMap('notes').size,
  }

  const provider = new WebrtcProvider(roomId, doc, {
    signaling: opts.signaling,
    password: opts.password,
    peerOpts: opts.peerOpts,
  })

  let initialSyncTimer: ReturnType<typeof setTimeout>
  const onUpdate = () => {
    clearTimeout(initialSyncTimer)
    initialSyncTimer = setTimeout(() => {
      const after = {
        contacts: doc.getMap('contacts').size,
        deals: doc.getMap('deals').size,
        notes: doc.getMap('notes').size,
      }
      const lostMajority =
        (preConnectState.contacts > 5 && after.contacts < preConnectState.contacts * 0.5) ||
        (preConnectState.deals > 5 && after.deals < preConnectState.deals * 0.5)
      if (lostMajority) {
        opts.onSuspiciousMerge?.({ before: preConnectState, after })
      }
    }, 5000)
  }
  doc.on('update', onUpdate)

  return provider
}
