'use client'
import * as Y from 'yjs'

export async function exportBinary(
  doc: Y.Doc,
  workspaceName: string,
): Promise<{ method: string; filename: string } | null> {
  const update = Y.encodeStateAsUpdate(doc)
  const blob = new Blob([update.buffer as unknown as ArrayBuffer], { type: 'application/octet-stream' })
  const date = new Date().toISOString().split('T')[0]
  const filename = `${slugify(workspaceName)}-${date}.crmbackup`

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'CRM Backup',
            accept: { 'application/octet-stream': ['.crmbackup'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return { method: 'fs-access', filename }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return null
    }
  }

  downloadBlob(blob, filename)
  return { method: 'download', filename }
}

export function exportJSON(doc: Y.Doc): string {
  const data = {
    schemaVersion: doc.getMap('workspace').get('schemaVersion'),
    exportedAt: new Date().toISOString(),
    workspace: doc.getMap('workspace').toJSON(),
    contacts: doc.getMap('contacts').toJSON(),
    deals: doc.getMap('deals').toJSON(),
    notes: doc.getMap('notes').toJSON(),
    activities: doc.getArray('activities').toJSON(),
  }
  return JSON.stringify(data, null, 2)
}

export async function exportCSV(doc: Y.Doc, workspaceName: string) {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()

  const contacts = Array.from((doc.getMap('contacts') as Y.Map<Y.Map<unknown>>).values())
  const contactsCsv =
    'id,name,email,phone,company,title,createdAt\n' +
    contacts
      .map((c) =>
        [
          c.get('id'),
          c.get('name'),
          c.get('email') ?? '',
          c.get('phone') ?? '',
          c.get('company') ?? '',
          c.get('title') ?? '',
          c.get('createdAt'),
        ]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n')

  const deals = Array.from((doc.getMap('deals') as Y.Map<Y.Map<unknown>>).values())
  const dealsCsv =
    'id,contactId,title,value,currency,stage,createdAt\n' +
    deals
      .map((d) =>
        [
          d.get('id'),
          d.get('contactId'),
          d.get('title'),
          d.get('value'),
          d.get('currency'),
          d.get('stage'),
          d.get('createdAt'),
        ]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n')

  zip.file('contacts.csv', contactsCsv)
  zip.file('deals.csv', dealsCsv)

  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, `${slugify(workspaceName)}-${new Date().toISOString().split('T')[0]}.zip`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
