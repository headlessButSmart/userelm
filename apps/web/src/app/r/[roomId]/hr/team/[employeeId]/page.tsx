'use client'
import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Trash2, Edit2, Save, X, CalendarDays } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getEmployee, getLeaveRequestsByEmployee,
  employeeDisplayName, updateEmployee, deleteEmployee,
  EMPLOYMENT_TYPES, EMPLOYEE_STATUSES,
  type EmploymentType, type EmployeeStatus, type LeaveStatus,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { RecordJsonMenu } from '@/components/io/RecordJsonMenu'

function empStatusClasses(status: EmployeeStatus) {
  if (status === 'active') return 'bg-green-100 text-green-700 border-transparent'
  if (status === 'on-leave') return 'bg-yellow-100 text-yellow-800 border-transparent'
  return 'bg-gray-100 text-gray-500 border-transparent'
}

function leaveStatusClasses(status: LeaveStatus) {
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800 border-transparent'
  if (status === 'approved') return 'bg-green-100 text-green-700 border-transparent'
  if (status === 'rejected') return 'bg-red-100 text-red-700 border-transparent'
  return 'bg-gray-100 text-gray-500 border-transparent'
}

function formatDate(ms: number) {
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString()
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ roomId: string; employeeId: string }> }) {
  const { roomId, employeeId } = use(params)
  const { doc } = useRoom()
  useYMapDeep(doc.getMap('employees'))
  useYMapDeep(doc.getMap('leaveRequests'))

  const employee = getEmployee(doc, employeeId)
  const leaves = getLeaveRequestsByEmployee(doc, employeeId)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Partial<{
    firstName: string; lastName: string; email: string; phone: string;
    role: string; department: string; employmentType: EmploymentType;
    startDate: number; salaryCents: number; currency: string;
    status: EmployeeStatus; city: string; country: string; notes: string;
  }>>({})

  if (!employee) {
    return (
      <>
        <TopBar title="Employee" />
        <div className="flex-1 p-6"><p className="text-muted-foreground">Employee not found.</p></div>
      </>
    )
  }

  const name = employeeDisplayName(employee)

  function startEdit() {
    setDraft({
      firstName: employee!.firstName, lastName: employee!.lastName,
      email: employee!.email, phone: employee!.phone,
      role: employee!.role, department: employee!.department,
      employmentType: employee!.employmentType,
      startDate: employee!.startDate, salaryCents: employee!.salaryCents,
      currency: employee!.currency, status: employee!.status,
      city: employee!.city, country: employee!.country, notes: employee!.notes,
    })
    setEditing(true)
  }
  function saveEdit() {
    updateEmployee(doc, employeeId, draft)
    setEditing(false)
  }
  function del() {
    if (confirm(`Delete ${name}? This cannot be undone.`)) {
      deleteEmployee(doc, employeeId)
      window.location.href = `/r/${roomId}/hr/team`
    }
  }

  const startDateStr = draft.startDate ? new Date(draft.startDate).toISOString().slice(0, 10) : ''
  const salaryStr = draft.salaryCents != null ? (draft.salaryCents / 100).toString() : ''

  return (
    <>
      <TopBar title={name} />
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <Link href={`/r/${roomId}/hr/team`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to team
        </Link>

        <div className="flex items-start gap-4">
          <Avatar name={name} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{name}</h1>
            <div className="text-muted-foreground">
              {employee.role}{employee.role && employee.department ? ' · ' : ''}{employee.department}
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <Badge className={cn('capitalize', empStatusClasses(employee.status))}>{employee.status.replace('-', ' ')}</Badge>
              <Badge variant="outline" className="capitalize">{employee.employmentType.replace('-', ' ')}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={saveEdit}><Save className="h-4 w-4" /> Save</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4" /> Cancel</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={startEdit}><Edit2 className="h-4 w-4" /> Edit</Button>
                <RecordJsonMenu
                  record={employee}
                  filenameBase={`employee-${name}`}
                  onImport={(patch) => updateEmployee(doc, employeeId, patch)}
                />
                <Button size="sm" variant="outline" onClick={del} className="text-[--color-destructive]"><Trash2 className="h-4 w-4" /></Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent>
              {editing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>First name</Label><Input value={draft.firstName ?? ''} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></div>
                  <div><Label>Last name</Label><Input value={draft.lastName ?? ''} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
                  <div><Label>Role</Label><Input value={draft.role ?? ''} onChange={(e) => setDraft({ ...draft, role: e.target.value })} /></div>
                  <div><Label>Department</Label><Input value={draft.department ?? ''} onChange={(e) => setDraft({ ...draft, department: e.target.value })} /></div>
                  <div>
                    <Label>Employment type</Label>
                    <Select value={draft.employmentType} onValueChange={(v) => setDraft({ ...draft, employmentType: v as EmploymentType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace('-', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as EmployeeStatus })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EMPLOYEE_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace('-', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Start date</Label>
                    <Input type="date" value={startDateStr} onChange={(e) => setDraft({ ...draft, startDate: e.target.value ? new Date(e.target.value).getTime() : 0 })} />
                  </div>
                  <div>
                    <Label>Salary ($)</Label>
                    <Input type="number" min="0" step="0.01" value={salaryStr} onChange={(e) => setDraft({ ...draft, salaryCents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : 0 })} />
                  </div>
                  <div><Label>Currency</Label><Input value={draft.currency ?? ''} onChange={(e) => setDraft({ ...draft, currency: e.target.value })} /></div>
                  <div />
                  <div><Label>City</Label><Input value={draft.city ?? ''} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></div>
                  <div><Label>Country</Label><Input value={draft.country ?? ''} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Notes</Label><Textarea value={draft.notes ?? ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <Row icon={Mail} label="Email" value={employee.email} link={employee.email ? `mailto:${employee.email}` : undefined} />
                  <Row icon={Phone} label="Phone" value={employee.phone} link={employee.phone ? `tel:${employee.phone}` : undefined} />
                  <Row icon={CalendarDays} label="Start date" value={employee.startDate ? formatDate(employee.startDate) : ''} />
                  <Row icon={MapPin} label="Location" value={[employee.city, employee.country].filter(Boolean).join(', ')} />
                  {employee.salaryCents > 0 && (
                    <div className="flex items-start gap-3">
                      <span className="h-4 w-4 inline-flex items-center justify-center text-muted-foreground text-xs">$</span>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">Salary</div>
                        <div>{(employee.salaryCents / 100).toLocaleString()} {employee.currency}</div>
                      </div>
                    </div>
                  )}
                  {employee.notes && (
                    <div className="pt-3">
                      <div className="text-xs text-muted-foreground mb-1">Notes</div>
                      <div className="whitespace-pre-wrap text-sm">{employee.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Leave history · {leaves.length}</CardTitle></CardHeader>
            <CardContent>
              {leaves.length === 0 ? (
                <p className="text-sm text-muted-foreground">No leave requests.</p>
              ) : (
                <ul className="space-y-3">
                  {leaves.map((l) => (
                    <li key={l.id} className="text-sm space-y-1 pb-3 border-b border-[--color-border] last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="capitalize">{l.type}</Badge>
                        <Badge className={cn('capitalize', leaveStatusClasses(l.status))}>{l.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(l.startDate)} – {formatDate(l.endDate)}
                      </div>
                      {l.reason && <div className="text-xs text-muted-foreground line-clamp-2">{l.reason}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

function Row({ icon: Icon, label, value, link }: { icon: any; label: string; value: string; link?: string }) {
  if (!value) return null
  const content = link ? (
    <a href={link} className="text-[--color-primary] hover:underline">{value}</a>
  ) : value
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div>{content}</div>
      </div>
    </div>
  )
}
