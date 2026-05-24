'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  LifeBuoy,
  Pencil,
  Trash2,
  Send,
  Lock,
  MessageSquare,
} from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import { getRoomMembers } from '@/lib/roomMembers'
import {
  getTicket,
  getTicketComments,
  updateTicket,
  setTicketStatus,
  deleteTicket,
  addTicketComment,
  deleteTicketComment,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  type TicketStatus,
  type TicketPriority,
  type TicketRow,
} from '@p2p-crm/platform'
import { TicketDialog } from '../TicketDialog'
import { TopBar } from '@/components/crm/TopBar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

const PRIORITY_DOT: Record<TicketPriority, string> = {
  low: 'bg-gray-400',
  medium: 'bg-yellow-400',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  billing: 'Billing',
  technical: 'Technical',
  bug: 'Bug',
  feature_request: 'Feature Request',
}

export default function TicketDetailPage() {
  const { roomId, ticketId } = useParams<{ roomId: string; ticketId: string }>()
  const { doc, identity } = useRoom()
  const router = useRouter()
  useYMapDeep(doc.getMap('supportTickets'))
  useYMapDeep(doc.getMap('ticketComments'))

  const ticket = getTicket(doc, ticketId)
  const comments = getTicketComments(doc, ticketId)
  const members = getRoomMembers(roomId)

  const [editing, setEditing] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)

  if (!ticket) {
    return (
      <>
        <TopBar title="Ticket not found" />
        <div className="flex-1 p-6">
          <EmptyState
            icon={LifeBuoy}
            title="Ticket not found"
            description="This ticket may have been deleted."
            action={
              <Button asChild>
                <Link href={`/r/${roomId}/tickets`}>
                  <ArrowLeft className="h-4 w-4" /> Back to tickets
                </Link>
              </Button>
            }
          />
        </div>
      </>
    )
  }

  function handleDelete() {
    if (confirm(`Delete ticket #${ticket!.number} "${ticket!.title}"?`)) {
      deleteTicket(doc, ticketId)
      router.push(`/r/${roomId}/tickets`)
    }
  }

  function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim()) return
    addTicketComment(doc, {
      ticketId,
      authorUserId: identity.userId,
      authorName: identity.displayName,
      body: commentBody.trim(),
      isInternal,
    })
    setCommentBody('')
    setIsInternal(false)
  }

  return (
    <>
      <TopBar title={`#${ticket.number} ${ticket.title}`} />
      <div className="flex-1 overflow-auto p-4 sm:p-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link
            href={`/r/${roomId}/tickets`}
            className="flex items-center gap-1 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Tickets
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">#{ticket.number}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main column */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold">{ticket.title}</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[ticket.status])}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[ticket.priority])} />
                    {PRIORITY_LABELS[ticket.priority]} priority
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[--color-destructive] hover:text-[--color-destructive]"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Description */}
            {ticket.description && (
              <div className="rounded-lg border bg-card p-4 text-sm whitespace-pre-wrap">
                {ticket.description}
              </div>
            )}

            {/* Comments */}
            <div>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments
                {comments.length > 0 && (
                  <span className="text-muted-foreground font-normal">({comments.length})</span>
                )}
              </h2>

              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground mb-3">No comments yet.</p>
              )}

              <div className="space-y-3">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      'rounded-lg border p-3.5 text-sm',
                      c.isInternal && 'border-yellow-200 bg-yellow-50',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.authorName || 'Unknown'}</span>
                        {c.isInternal && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-yellow-700 bg-yellow-100 rounded-full px-1.5 py-0.5">
                            <Lock className="h-2.5 w-2.5" /> Internal
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                        {c.authorUserId === identity.userId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-[--color-destructive]"
                            onClick={() => deleteTicketComment(doc, c.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap">{c.body}</p>
                  </div>
                ))}
              </div>

              {/* Add comment */}
              <form onSubmit={submitComment} className="mt-4 space-y-2">
                <Textarea
                  placeholder="Add a comment…"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-[--color-primary]"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                    />
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    Internal note
                  </label>
                  <Button type="submit" size="sm" disabled={!commentBody.trim()}>
                    <Send className="h-3.5 w-3.5" /> Post
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-64 lg:flex-shrink-0 space-y-4">
            <div className="rounded-lg border bg-card p-4 space-y-4 text-sm">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Status
                </div>
                <Select
                  value={ticket.status}
                  onValueChange={(v) => setTicketStatus(doc, ticketId, v as TicketStatus)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Submitter
                </div>
                <div className="font-medium truncate">{ticket.submitterEmail || '—'}</div>
                {ticket.submitterName && (
                  <div className="text-muted-foreground text-xs mt-0.5">{ticket.submitterName}</div>
                )}
              </div>

              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Assignee
                </div>
                <Select
                  value={ticket.assigneeEmail || '__none__'}
                  onValueChange={(v) =>
                    updateTicket(doc, ticketId, { assigneeEmail: v === '__none__' ? '' : v })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.email} value={m.email}>
                        {m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Created
                </div>
                <div className="text-muted-foreground">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
              </div>

              {ticket.resolvedAt > 0 && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Resolved
                  </div>
                  <div className="text-muted-foreground">
                    {new Date(ticket.resolvedAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <TicketDialog
          open
          mode="edit"
          initial={ticket}
          members={members}
          onOpenChange={(o) => { if (!o) setEditing(false) }}
          onSave={(input) => {
            updateTicket(doc, ticketId, input)
            setEditing(false)
          }}
        />
      )}
    </>
  )
}
