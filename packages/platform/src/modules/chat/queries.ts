import * as Y from 'yjs'
import { CHAT_KEYS, type MessageRow } from './schema'

function readMessage(m: Y.Map<unknown>): MessageRow {
  return {
    id: (m.get('id') as string) ?? '',
    body: (m.get('body') as string) ?? '',
    authorId: (m.get('authorId') as string) ?? '',
    authorName: (m.get('authorName') as string) ?? '',
    replyTo: (m.get('replyTo') as string) ?? '',
    reactions: (m.get('reactions') as Record<string, string[]>) ?? {},
    editedAt: (m.get('editedAt') as number) ?? 0,
    createdAt: (m.get('createdAt') as number) ?? 0,
  }
}

export function getMessages(doc: Y.Doc): MessageRow[] {
  const rows: MessageRow[] = []
  doc.getMap(CHAT_KEYS.messages).forEach((v) => {
    if (v instanceof Y.Map) rows.push(readMessage(v))
  })
  return rows.sort((a, b) => a.createdAt - b.createdAt) // oldest first
}

export function getMessage(doc: Y.Doc, id: string): MessageRow | null {
  const m = doc.getMap(CHAT_KEYS.messages).get(id) as Y.Map<unknown> | undefined
  return m ? readMessage(m) : null
}

export function getUnreadCount(doc: Y.Doc, lastReadAt: number, ownUserId: string): number {
  let count = 0
  doc.getMap(CHAT_KEYS.messages).forEach((v) => {
    if (!(v instanceof Y.Map)) return
    const createdAt = (v.get('createdAt') as number) ?? 0
    const authorId = (v.get('authorId') as string) ?? ''
    if (createdAt > lastReadAt && authorId !== ownUserId) count++
  })
  return count
}
