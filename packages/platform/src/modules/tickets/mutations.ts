import * as Y from 'yjs'
import { nanoid } from 'nanoid'
import {
  TICKET_KEYS,
  type TicketPriority,
  type TicketStatus,
  type TicketCategory,
} from './schema'
import { nextTicketNumber } from './queries'

export function createTicket(
  doc: Y.Doc,
  input: {
    title: string
    description?: string
    priority?: TicketPriority
    category?: TicketCategory
    submitterEmail: string
    submitterName?: string
    assigneeEmail?: string
    tags?: string[]
    actorId: string
  },
): string {
  const id = nanoid()
  doc.transact(() => {
    const now = Date.now()
    const t = new Y.Map()
    t.set('id', id)
    t.set('number', nextTicketNumber(doc))
    t.set('title', input.title)
    t.set('description', input.description ?? '')
    t.set('status', 'open')
    t.set('priority', input.priority ?? 'medium')
    t.set('category', input.category ?? 'general')
    t.set('submitterEmail', input.submitterEmail)
    t.set('submitterName', input.submitterName ?? '')
    t.set('assigneeEmail', input.assigneeEmail ?? '')
    t.set('tags', input.tags ?? [])
    t.set('createdAt', now)
    t.set('updatedAt', now)
    t.set('resolvedAt', 0)
    doc.getMap(TICKET_KEYS.tickets).set(id, t)
  }, 'user')
  return id
}

export function updateTicket(
  doc: Y.Doc,
  id: string,
  patch: Partial<{
    title: string
    description: string
    priority: TicketPriority
    category: TicketCategory
    submitterEmail: string
    submitterName: string
    assigneeEmail: string
    tags: string[]
  }>,
) {
  doc.transact(() => {
    const m = doc.getMap(TICKET_KEYS.tickets).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) m.set(k, v)
    m.set('updatedAt', Date.now())
  }, 'user')
}

export function setTicketStatus(doc: Y.Doc, id: string, status: TicketStatus) {
  doc.transact(() => {
    const m = doc.getMap(TICKET_KEYS.tickets).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    m.set('status', status)
    m.set('updatedAt', Date.now())
    if (status === 'resolved' || status === 'closed') {
      if (!(m.get('resolvedAt') as number)) m.set('resolvedAt', Date.now())
    } else {
      m.set('resolvedAt', 0)
    }
  }, 'user')
}

export function deleteTicket(doc: Y.Doc, id: string) {
  doc.transact(() => {
    doc.getMap(TICKET_KEYS.tickets).delete(id)
    const comments = doc.getMap(TICKET_KEYS.comments)
    const toDel: string[] = []
    comments.forEach((v, k) => {
      if (v instanceof Y.Map && (v.get('ticketId') as string) === id) toDel.push(k)
    })
    toDel.forEach((k) => comments.delete(k))
  }, 'user')
}

export function addTicketComment(
  doc: Y.Doc,
  input: {
    ticketId: string
    authorUserId: string
    authorName: string
    body: string
    isInternal?: boolean
  },
): string {
  const id = nanoid()
  doc.transact(() => {
    const c = new Y.Map()
    c.set('id', id)
    c.set('ticketId', input.ticketId)
    c.set('authorUserId', input.authorUserId)
    c.set('authorName', input.authorName)
    c.set('body', input.body)
    c.set('isInternal', input.isInternal ?? false)
    c.set('createdAt', Date.now())
    doc.getMap(TICKET_KEYS.comments).set(id, c)

    // Bump ticket updatedAt
    const t = doc.getMap(TICKET_KEYS.tickets).get(input.ticketId) as Y.Map<unknown> | undefined
    if (t) t.set('updatedAt', Date.now())
  }, 'user')
  return id
}

export function deleteTicketComment(doc: Y.Doc, id: string) {
  doc.transact(() => doc.getMap(TICKET_KEYS.comments).delete(id), 'user')
}
