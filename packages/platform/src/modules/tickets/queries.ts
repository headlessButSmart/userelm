import * as Y from 'yjs'
import { TICKET_KEYS, type TicketRow, type TicketCommentRow } from './schema'

function rowToTicket(m: Y.Map<unknown>): TicketRow {
  return {
    id: (m.get('id') as string) ?? '',
    number: (m.get('number') as number) ?? 0,
    title: (m.get('title') as string) ?? '',
    description: (m.get('description') as string) ?? '',
    status: (m.get('status') as TicketRow['status']) ?? 'open',
    priority: (m.get('priority') as TicketRow['priority']) ?? 'medium',
    category: (m.get('category') as TicketRow['category']) ?? 'general',
    submitterEmail: (m.get('submitterEmail') as string) ?? '',
    submitterName: (m.get('submitterName') as string) ?? '',
    assigneeEmail: (m.get('assigneeEmail') as string) ?? '',
    tags: (m.get('tags') as string[]) ?? [],
    createdAt: (m.get('createdAt') as number) ?? 0,
    updatedAt: (m.get('updatedAt') as number) ?? 0,
    resolvedAt: (m.get('resolvedAt') as number) ?? 0,
  }
}

function rowToComment(m: Y.Map<unknown>): TicketCommentRow {
  return {
    id: (m.get('id') as string) ?? '',
    ticketId: (m.get('ticketId') as string) ?? '',
    authorUserId: (m.get('authorUserId') as string) ?? '',
    authorName: (m.get('authorName') as string) ?? '',
    body: (m.get('body') as string) ?? '',
    isInternal: (m.get('isInternal') as boolean) ?? false,
    createdAt: (m.get('createdAt') as number) ?? 0,
  }
}

export function getTickets(doc: Y.Doc): TicketRow[] {
  const rows: TicketRow[] = []
  doc.getMap(TICKET_KEYS.tickets).forEach((v) => {
    if (v instanceof Y.Map) rows.push(rowToTicket(v))
  })
  return rows.sort((a, b) => b.createdAt - a.createdAt)
}

export function getTicket(doc: Y.Doc, id: string): TicketRow | undefined {
  const m = doc.getMap(TICKET_KEYS.tickets).get(id)
  return m instanceof Y.Map ? rowToTicket(m) : undefined
}

export function getTicketComments(doc: Y.Doc, ticketId: string): TicketCommentRow[] {
  const rows: TicketCommentRow[] = []
  doc.getMap(TICKET_KEYS.comments).forEach((v) => {
    if (v instanceof Y.Map && (v.get('ticketId') as string) === ticketId) {
      rows.push(rowToComment(v))
    }
  })
  return rows.sort((a, b) => a.createdAt - b.createdAt)
}

export function nextTicketNumber(doc: Y.Doc): number {
  let max = 0
  doc.getMap(TICKET_KEYS.tickets).forEach((v) => {
    if (v instanceof Y.Map) max = Math.max(max, (v.get('number') as number) ?? 0)
  })
  return max + 1
}
