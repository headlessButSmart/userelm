'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, CalendarDays, Check, X, Trash2 } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getEmployees, getLeaveRequests, employeeDisplayName,
  createLeaveRequest, decideLeaveRequest, deleteLeaveRequest,
  LEAVE_TYPES, type LeaveType, type LeaveStatus, type LeaveRequestRow,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { ExportImportMenu } from '@/components/io/ExportImportMenu'
import { col, transforms } from '@/lib/io/column-schema'

type LeaveInput = Parameters<typeof createLeaveRequest>[1]

const LEAVE_COLUMNS = [
  col<LeaveRequestRow, LeaveInput>('employeeId', 'Employee ID'),
  col<LeaveRequestRow, LeaveInput>('type'),
  transforms.date<LeaveRequestRow, LeaveInput>('startDate', 'Start date'),
  transforms.date<LeaveRequestRow, LeaveInput>('endDate', 'End date'),
  col<LeaveRequestRow, LeaveInput>('reason'),
]
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

type Tab = 'all' | 'pending' | 'approved' | 'rejected'

function leaveStatusClasses(status: LeaveStatus) {
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800 border-transparent'
  if (status === 'approved') return 'bg-green-100 text-green-700 border-transparent'
  if (status === 'rejected') return 'bg-red-100 text-red-700 border-transparent'
  return 'bg-gray-100 text-gray-500 border-transparent'
}

function daysBetween(start: number, end: number) {
  if (!start || !end) return 0
  const ms = end - start
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1)
}

function formatDate(ms: number) {
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString()
}

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function LeavePage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { doc, identity } = useRoom()
  useYMapDeep(doc.getMap('employees'))
  useYMapDeep(doc.getMap('leaveRequests'))

  const employees = getEmployees(doc)
  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees])
  const leaves = getLeaveRequests(doc)

  const [tab, setTab] = useState<Tab>('all')
  const [showNew, setShowNew] = useState(false)

  const counts = useMemo(() => ({
    all: leaves.length,
    pending: leaves.filter((l) => l.status === 'pending').length,
    approved: leaves.filter((l) => l.status === 'approved').length,
    rejected: leaves.filter((l) => l.status === 'rejected').length,
  }), [leaves])

  const filtered = useMemo(() => {
    if (tab === 'all') return leaves
    return leaves.filter((l) => l.status === tab)
  }, [leaves, tab])

  function handleDecide(id: string, status: 'approved' | 'rejected') {
    const notes = prompt(`Optional notes for ${status}:`, '') ?? ''
    decideLeaveRequest(doc, id, { status, approverNotes: notes || undefined, actorId: identity.userId })
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]

  return (
    <>
      <TopBar title="Leave requests" />
      <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-lg border border-[--color-border] bg-card p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  tab === t.key ? 'bg-[--color-primary] text-[--color-primary-foreground]' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label} <span className="ml-1 opacity-70">{counts[t.key]}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ExportImportMenu
              rows={filtered}
              schema={LEAVE_COLUMNS}
              entityName="leave-requests"
              onImportRow={(input) => {
                if (!input.employeeId || !employeeMap.has(input.employeeId)) return
                if (!input.startDate || !input.endDate) return
                createLeaveRequest(doc, {
                  employeeId: input.employeeId,
                  type: input.type ?? 'vacation',
                  startDate: input.startDate,
                  endDate: input.endDate,
                  reason: input.reason,
                  actorId: identity.userId,
                })
              }}
            />
            <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /><span className="hidden sm:inline"> New leave request</span></Button>
          </div>
        </div>

        {leaves.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No leave requests yet"
            description="Create a leave request to start tracking time off."
            action={<Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New leave request</Button>}
          />
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-[--color-border] bg-card p-8 text-center text-muted-foreground text-sm">
            No {tab} requests.
          </div>
        ) : (
          <div className="rounded-lg border border-[--color-border] overflow-hidden overflow-x-auto bg-card">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-[--color-muted]/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Employee</th>
                  <th className="px-4 py-2.5 text-left font-medium">Type</th>
                  <th className="px-4 py-2.5 text-left font-medium">Start</th>
                  <th className="px-4 py-2.5 text-left font-medium">End</th>
                  <th className="px-4 py-2.5 text-left font-medium">Days</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const emp = employeeMap.get(l.employeeId)
                  const empName = emp ? employeeDisplayName(emp) : 'Unknown employee'
                  return (
                    <tr key={l.id} className="border-t border-[--color-border] hover:bg-[--color-muted]/30">
                      <td className="px-4 py-2.5">
                        {emp ? (
                          <Link href={`/r/${roomId}/hr/team/${emp.id}`} className="flex items-center gap-2.5 group">
                            <Avatar name={empName} size="sm" />
                            <span className="font-medium group-hover:text-[--color-primary] group-hover:underline">{empName}</span>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <Avatar name={empName} size="sm" />
                            <span className="text-muted-foreground">{empName}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5"><Badge variant="outline" className="capitalize">{l.type}</Badge></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatDate(l.startDate)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatDate(l.endDate)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{daysBetween(l.startDate, l.endDate)}</td>
                      <td className="px-4 py-2.5">
                        <Badge className={cn('capitalize', leaveStatusClasses(l.status))}>{l.status}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {l.status === 'pending' ? (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleDecide(l.id, 'approved')} className="text-green-700">
                                <Check className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Approve</span>
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDecide(l.id, 'rejected')} className="text-red-700">
                                <X className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Reject</span>
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { if (confirm('Delete this leave request?')) deleteLeaveRequest(doc, l.id) }}
                              className="text-[--color-destructive]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewLeaveDialog
        open={showNew}
        onOpenChange={setShowNew}
        employees={employees}
        onSave={(input) => {
          createLeaveRequest(doc, {
            employeeId: input.employeeId,
            type: input.type,
            startDate: new Date(input.startDate).getTime(),
            endDate: new Date(input.endDate).getTime(),
            reason: input.reason || undefined,
            actorId: identity.userId,
          })
          setShowNew(false)
        }}
      />
    </>
  )
}

function NewLeaveDialog({
  open, onOpenChange, employees, onSave,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  employees: { id: string; firstName: string; lastName: string; email: string }[]
  onSave: (input: { employeeId: string; type: LeaveType; startDate: string; endDate: string; reason: string }) => void
}) {
  const [form, setForm] = useState({
    employeeId: '',
    type: 'vacation' as LeaveType,
    startDate: todayStr(),
    endDate: todayStr(),
    reason: '',
  })

  function reset() {
    setForm({ employeeId: '', type: 'vacation', startDate: todayStr(), endDate: todayStr(), reason: '' })
  }

  const endTooEarly = !!form.startDate && !!form.endDate && new Date(form.endDate) < new Date(form.startDate)

  return (
    <Dialog open={open} onOpenChange={(b) => { if (!b) reset(); onOpenChange(b) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New leave request</DialogTitle></DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!form.employeeId) return
            if (endTooEarly) return
            onSave(form)
            reset()
          }}
          className="space-y-3"
        >
          <div>
            <Label>Employee *</Label>
            <Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v })}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {employeeDisplayName(e as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as LeaveType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="lv-start">Start date *</Label>
              <Input id="lv-start" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="lv-end">End date *</Label>
              <Input id="lv-end" type="date" required min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          {endTooEarly && <p className="text-xs text-[--color-destructive]">End date must be on or after start date.</p>}
          <div>
            <Label htmlFor="lv-reason">Reason</Label>
            <Textarea id="lv-reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!form.employeeId || endTooEarly}>Create request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
