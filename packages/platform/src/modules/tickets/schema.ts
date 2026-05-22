export const TICKET_KEYS = {
  tickets: 'supportTickets',
  comments: 'ticketComments',
} as const

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketCategory = 'general' | 'billing' | 'technical' | 'bug' | 'feature_request'

export interface TicketRow {
  id: string
  number: number
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  submitterEmail: string
  submitterName: string
  assigneeEmail: string
  tags: string[]
  createdAt: number
  updatedAt: number
  resolvedAt: number
}

export interface TicketCommentRow {
  id: string
  ticketId: string
  authorUserId: string
  authorName: string
  body: string
  isInternal: boolean
  createdAt: number
}

export const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']
export const TICKET_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent']
export const TICKET_CATEGORIES: TicketCategory[] = [
  'general',
  'billing',
  'technical',
  'bug',
  'feature_request',
]
