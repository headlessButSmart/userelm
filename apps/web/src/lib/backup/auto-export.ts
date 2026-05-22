'use client'
import * as Y from 'yjs'
import { openDB } from 'idb'

const HANDLE_KEY = 'p2p-crm:auto-backup-handle'

async function getStoredHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB('p2p-crm-handles', 1, {
      upgrade(db) {
        db.createObjectStore('handles')
      },
    })
    const handle = await db.get('handles', HANDLE_KEY)
    db.close()
    return handle ?? null
  } catch {
    return null
  }
}

export async function setupAutoBackup(): Promise<FileSystemDirectoryHandle | null> {
  if (!('showDirectoryPicker' in window)) return null
  const handle = await (window as any).showDirectoryPicker({
    mode: 'readwrite',
    startIn: 'documents',
  })
  const db = await openDB('p2p-crm-handles', 1, {
    upgrade(db) {
      db.createObjectStore('handles')
    },
  })
  await db.put('handles', handle, HANDLE_KEY)
  db.close()
  return handle
}

export async function autoBackup(doc: Y.Doc, workspaceName: string) {
  const handle = await getStoredHandle()
  if (!handle) return

  const perm = await (handle as any).queryPermission({ mode: 'readwrite' })
  if (perm !== 'granted') {
    const req = await (handle as any).requestPermission({ mode: 'readwrite' })
    if (req !== 'granted') return
  }

  const update = Y.encodeStateAsUpdate(doc)
  const blob = new Blob([update.buffer as unknown as ArrayBuffer])
  const date = new Date().toISOString().split('T')[0]
  const time = new Date().toTimeString().split(' ')[0]!.replace(/:/g, '-')
  const filename = `${slugify(workspaceName)}-${date}_${time}.crmbackup`

  const fileHandle = await handle.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(blob)
  await writable.close()
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
