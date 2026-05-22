'use client'
import * as Y from 'yjs'

export type ImportResult =
  | { ok: true }
  | { ok: false; error: string }
  | {
      ok: false
      requiresConfirmation: true
      current: { contacts: number; deals: number }
      incoming: { contacts: number; deals: number }
    }

export async function importBinary(doc: Y.Doc, file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer()
  const update = new Uint8Array(buffer)

  const currentContacts = doc.getMap('contacts').size
  const currentDeals = doc.getMap('deals').size

  const probe = new Y.Doc()
  try {
    Y.applyUpdate(probe, update)
  } catch {
    return { ok: false, error: 'Invalid backup file' }
  }
  const incomingContacts = probe.getMap('contacts').size
  const incomingDeals = probe.getMap('deals').size

  if (currentContacts > 0 || currentDeals > 0) {
    return {
      ok: false,
      requiresConfirmation: true,
      current: { contacts: currentContacts, deals: currentDeals },
      incoming: { contacts: incomingContacts, deals: incomingDeals },
    }
  }

  Y.applyUpdate(doc, update, 'import')
  return { ok: true }
}
