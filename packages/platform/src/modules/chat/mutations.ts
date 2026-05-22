import * as Y from 'yjs'
import { nanoid } from 'nanoid'
import { CHAT_KEYS } from './schema'

export function sendMessage(doc: Y.Doc, input: {
  body: string
  authorId: string
  authorName: string
  replyTo?: string
}): string {
  const id = nanoid()
  doc.transact(() => {
    const now = Date.now()
    const m = new Y.Map()
    m.set('id', id)
    m.set('body', input.body)
    m.set('authorId', input.authorId)
    m.set('authorName', input.authorName)
    m.set('replyTo', input.replyTo ?? '')
    m.set('reactions', {})
    m.set('editedAt', 0)
    m.set('createdAt', now)
    doc.getMap(CHAT_KEYS.messages).set(id, m)
  }, 'user')
  return id
}

export function editMessage(doc: Y.Doc, id: string, body: string) {
  doc.transact(() => {
    const m = doc.getMap(CHAT_KEYS.messages).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    m.set('body', body)
    m.set('editedAt', Date.now())
  }, 'user')
}

export function deleteMessage(doc: Y.Doc, id: string) {
  doc.transact(() => doc.getMap(CHAT_KEYS.messages).delete(id), 'user')
}

export function toggleReaction(doc: Y.Doc, messageId: string, emoji: string, userId: string) {
  doc.transact(() => {
    const m = doc.getMap(CHAT_KEYS.messages).get(messageId) as Y.Map<unknown> | undefined
    if (!m) return
    const reactions = { ...((m.get('reactions') as Record<string, string[]>) ?? {}) }
    const list = reactions[emoji] ?? []
    if (list.includes(userId)) {
      reactions[emoji] = list.filter((u) => u !== userId)
      if (reactions[emoji]!.length === 0) delete reactions[emoji]
    } else {
      reactions[emoji] = [...list, userId]
    }
    m.set('reactions', reactions)
  }, 'user')
}
