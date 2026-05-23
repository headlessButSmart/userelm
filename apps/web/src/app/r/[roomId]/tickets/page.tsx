'use client'
import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Plus,
  LifeBuoy,
  Search,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import { getRoomMembers } from '@/lib/roomMembers'
import {
  getTickets,
  createTicket,
  deleteTicket,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  type TicketStatus,
  type TicketPriority,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { cn } from '@/lib/utils'
import { useViewMode } from '@/hooks/useViewMode'
import { ViewToggle } from '@/components/ui/ViewToggle'
import { TicketDialog, CATEGORY_LABELS } from './TicketDialog'

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

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: 'bg-gray-400',
  medium: 'bg-yellow-400',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

export default function TicketsPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { doc, identity } = useRoom()
  const router = useRouter()
  useYMapDeep(doc.getMap('supportTickets'))

  const tickets = getTickets(doc)
  const members = getRoomMembers(roomId)

  const [view, setView] = useViewMode('tickets', 'table')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !t.title.toLowerCase().includes(q) &&
          !t.submitterEmail.toLowerCase().includes(q) &&
          !t.submitterName.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [tickets, statusFilter, priorityFilter, search])

  const counts = useMemo(() => {
    const c = { open: 0, in_progress: 0, resolved: 0, closed: 0 }
    tickets.forEach((t) => c[t.status]++)
    return c
  }, [tickets])

  return (
    <>
      <TopBar title="Tickets" />
      <div className="flex-1 p-6 overflow-auto space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {(TICKET_STATUSES).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors hover:bg-muted/50',
                statusFilter === s && 'ring-2 ring-[--color-primary]',
              )}
            >
              <div className="text-2xl font-bold">{counts[s]}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{STATUS_LABELS[s]}</div>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-8"
              placeholder="Search tickets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={priorityFilter}
            onValueChange={(v) => setPriorityFilter(v as TicketPriority | 'all')}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {TICKET_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ViewToggle value={view} onChange={setView} />
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New ticket
          </Button>
        </div>

        {/* Table / Grid */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title={tickets.length === 0 ? 'No tickets yet' : 'No matching tickets'}
            description={
              tickets.length === 0
                ? 'Create a ticket to start tracking customer support requests.'
                : 'Try adjusting your search or filters.'
            }
            action={
              tickets.length === 0 ? (
                <Button onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" /> New ticket
                </Button>
              ) : undefined
            }
          />
        ) : view === 'table' ? (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-16">#</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-28">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-24">Priority</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-28">Category</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Submitter</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Assignee</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-24">Created</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => router.push(`/r/${roomId}/tickets/${t.id}`)}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      #{t.number}
                    </td>
                    <td className="px-4 py-3 font-medium max-w-xs">
                      <span className="line-clamp-1">{t.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[t.status])}>
                        {STATUS_LABELS[t.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full flex-shrink-0', PRIORITY_STYLES[t.priority])} />
                        <span className="capitalize text-xs">{t.priority}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {CATEGORY_LABELS[t.category]}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[140px]">
                      <div className="truncate">{t.submitterEmail || '—'}</div>
                      {t.submitterName && (
                        <div className="text-muted-foreground truncate">{t.submitterName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[120px]">
                      {t.assigneeEmail || <span className="italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/r/${roomId}/tickets/${t.id}`)}
                          >
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-[--color-destructive]"
                            onClick={() => {
                              if (confirm(`Delete ticket #${t.number} "${t.title}"?`))
                                deleteTicket(doc, t.id)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => router.push(`/r/${roomId}/tickets/${t.id}`)}
                className="rounded-lg border border-[--color-border] bg-card p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-mono text-muted-foreground">#{t.number}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={cn('h-2 w-2 rounded-full', PRIORITY_STYLES[t.priority])} />
                    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLES[t.status])}>
                      {STATUS_LABELS[t.status]}
                    </span>
                  </div>
                </div>
                <div className="font-medium text-sm line-clamp-2 mb-3">{t.title}</div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{CATEGORY_LABELS[t.category]}</span>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
                {(t.submitterName || t.submitterEmail) && (
                  <div className="mt-2 text-xs text-muted-foreground truncate">
                    {t.submitterName || t.submitterEmail}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <TicketDialog
          open
          mode="create"
          members={members}
          onOpenChange={(o) => { if (!o) setCreating(false) }}
          onSave={(input) => {
            const id = createTicket(doc, { ...input, actorId: identity.userId })
            setCreating(false)
            router.push(`/r/${roomId}/tickets/${id}`)
          }}
        />
      )}
    </>
  )
}
