import * as Y from 'yjs'
import { openDB } from 'idb'

const MAX_SNAPSHOTS = 30

export interface Snapshot {
  timestamp: number
  update: Uint8Array
  stats: { contacts: number; deals: number }
}

export async function saveSnapshot(roomId: string, doc: Y.Doc) {
  const db = await openDB(`crm-snapshots-${roomId}`, 1, {
    upgrade(db) {
      db.createObjectStore('snapshots', { keyPath: 'timestamp' })
    },
  })
  const update = Y.encodeStateAsUpdate(doc)
  await db.put('snapshots', {
    timestamp: Date.now(),
    update,
    stats: {
      contacts: doc.getMap('contacts').size,
      deals: doc.getMap('deals').size,
    },
  })
  const all = await db.getAllKeys('snapshots')
  if (all.length > MAX_SNAPSHOTS) {
    const toDelete = (all as number[]).sort().slice(0, all.length - MAX_SNAPSHOTS)
    for (const key of toDelete) await db.delete('snapshots', key)
  }
  db.close()
}

export async function listSnapshots(roomId: string): Promise<Snapshot[]> {
  try {
    const db = await openDB(`crm-snapshots-${roomId}`)
    const all = await db.getAll('snapshots')
    db.close()
    return (all as Snapshot[]).sort((a, b) => b.timestamp - a.timestamp)
  } catch {
    return []
  }
}

export async function restoreSnapshot(roomId: string, timestamp: number): Promise<Uint8Array | null> {
  try {
    const db = await openDB(`crm-snapshots-${roomId}`)
    const snap = await db.get('snapshots', timestamp)
    db.close()
    return snap?.update ?? null
  } catch {
    return null
  }
}
