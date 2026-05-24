'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, Search, UserCheck, Mail, Phone, MoreHorizontal, Trash2, Edit2, MapPin } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getEmployees, employeeDisplayName,
  createEmployee, updateEmployee, deleteEmployee,
  EMPLOYMENT_TYPES, EMPLOYEE_STATUSES,
  type EmploymentType, type EmployeeStatus, type EmployeeRow,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { ExportImportMenu } from '@/components/io/ExportImportMenu'
import { col, transforms } from '@/lib/io/column-schema'

type EmployeeInput = Parameters<typeof createEmployee>[1]

const EMPLOYEE_COLUMNS = [
  col<EmployeeRow, EmployeeInput>('firstName', 'First name'),
  col<EmployeeRow, EmployeeInput>('lastName', 'Last name'),
  col<EmployeeRow, EmployeeInput>('email'),
  col<EmployeeRow, EmployeeInput>('phone'),
  col<EmployeeRow, EmployeeInput>('role'),
  col<EmployeeRow, EmployeeInput>('department'),
  col<EmployeeRow, EmployeeInput>('employmentType', 'Employment type'),
  col<EmployeeRow, EmployeeInput>('status'),
  transforms.date<EmployeeRow, EmployeeInput>('startDate', 'Start date'),
  transforms.money<EmployeeRow, EmployeeInput>('salaryCents', 'Salary'),
  col<EmployeeRow, EmployeeInput>('currency'),
  col<EmployeeRow, EmployeeInput>('city'),
  col<EmployeeRow, EmployeeInput>('country'),
  col<EmployeeRow, EmployeeInput>('notes'),
]
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useViewMode } from '@/hooks/useViewMode'
import { ViewToggle } from '@/components/ui/ViewToggle'

type EmployeeFormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  department: string
  employmentType: EmploymentType
  startDate: string
  salary: string
  currency: string
  city: string
  country: string
  notes: string
  status: EmployeeStatus
}

const todayStr = () => new Date().toISOString().slice(0, 10)

const emptyForm: EmployeeFormState = {
  firstName: '', lastName: '', email: '', phone: '',
  role: '', department: '', employmentType: 'full-time',
  startDate: todayStr(), salary: '', currency: 'USD',
  city: '', country: '', notes: '', status: 'active',
}

function statusClasses(status: EmployeeStatus) {
  if (status === 'active') return 'bg-green-100 text-green-700 border-transparent'
  if (status === 'on-leave') return 'bg-yellow-100 text-yellow-800 border-transparent'
  return 'bg-gray-100 text-gray-500 border-transparent'
}

export default function TeamPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { doc, identity } = useRoom()
  useYMapDeep(doc.getMap('employees'))

  const employees = getEmployees(doc)

  const [view, setView] = useViewMode('team', 'grid')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all')
  const [showNew, setShowNew] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = employees
    if (statusFilter !== 'all') result = result.filter((e) => e.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((e) =>
        employeeDisplayName(e).toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q),
      )
    }
    return result
  }, [employees, search, statusFilter])

  const editing = editId ? employees.find((e) => e.id === editId) ?? null : null

  return (
    <>
      <TopBar title="Team" />
      <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search team…" className="pl-8" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EmployeeStatus | 'all')}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {EMPLOYEE_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace('-', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{filtered.length} of {employees.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <ExportImportMenu
              rows={filtered}
              schema={EMPLOYEE_COLUMNS}
              entityName="employees"
              onImportRow={(input) => createEmployee(doc, {
                firstName: input.firstName ?? 'Imported',
                actorId: identity.userId,
                ...input,
              })}
            />
            <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /><span className="hidden sm:inline"> Add employee</span></Button>
          </div>
        </div>

        {employees.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No employees yet"
            description="Add your first team member to start tracking HR."
            action={<Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> Add employee</Button>}
          />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((e) => {
              const name = employeeDisplayName(e)
              return (
                <Card key={e.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Link href={`/r/${roomId}/hr/team/${e.id}`} className="shrink-0">
                        <Avatar name={name} size="md" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/r/${roomId}/hr/team/${e.id}`} className="font-medium hover:text-[--color-primary] hover:underline block truncate">
                          {name}
                        </Link>
                        {e.role && <div className="text-sm text-muted-foreground truncate">{e.role}</div>}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditId(e.id)}>
                            <Edit2 className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { if (confirm(`Delete ${name}?`)) deleteEmployee(doc, e.id) }}
                            className="text-[--color-destructive]"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {e.department && <Badge variant="secondary" className="capitalize">{e.department}</Badge>}
                      <Badge variant="outline" className="capitalize">{e.employmentType.replace('-', ' ')}</Badge>
                      <Badge className={cn('capitalize', statusClasses(e.status))}>{e.status.replace('-', ' ')}</Badge>
                    </div>

                    {(e.email || e.phone) && (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {e.email && (
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <a href={`mailto:${e.email}`} className="truncate hover:text-[--color-primary] hover:underline">{e.email}</a>
                          </div>
                        )}
                        {e.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <a href={`tel:${e.phone}`} className="hover:text-[--color-primary] hover:underline">{e.phone}</a>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-[--color-border] overflow-hidden overflow-x-auto bg-card">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-[--color-muted]/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium">Role</th>
                  <th className="px-4 py-2.5 text-left font-medium">Department</th>
                  <th className="px-4 py-2.5 text-left font-medium">Type</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Email</th>
                  <th className="px-4 py-2.5 text-left font-medium">Location</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const name = employeeDisplayName(e)
                  return (
                    <tr key={e.id} className="border-t border-[--color-border] hover:bg-[--color-muted]/30">
                      <td className="px-4 py-2.5">
                        <Link href={`/r/${roomId}/hr/team/${e.id}`} className="flex items-center gap-2.5 group">
                          <Avatar name={name} size="sm" />
                          <span className="font-medium group-hover:text-[--color-primary] group-hover:underline">{name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{e.role || '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{e.department || '—'}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="capitalize">{e.employmentType.replace('-', ' ')}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge className={cn('capitalize', statusClasses(e.status))}>{e.status.replace('-', ' ')}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {e.email ? (
                          <a href={`mailto:${e.email}`} className="hover:text-[--color-primary] hover:underline truncate block max-w-[180px]">{e.email}</a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {e.city || e.country ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {[e.city, e.country].filter(Boolean).join(', ')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-2 py-2.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditId(e.id)}>
                              <Edit2 className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => { if (confirm(`Delete ${name}?`)) deleteEmployee(doc, e.id) }}
                              className="text-[--color-destructive]"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EmployeeDialog
        open={showNew}
        onOpenChange={setShowNew}
        title="New employee"
        submitLabel="Add employee"
        initial={emptyForm}
        onSave={(input) => {
          createEmployee(doc, {
            firstName: input.firstName,
            lastName: input.lastName || undefined,
            email: input.email || undefined,
            phone: input.phone || undefined,
            role: input.role || undefined,
            department: input.department || undefined,
            employmentType: input.employmentType,
            startDate: input.startDate ? new Date(input.startDate).getTime() : undefined,
            salaryCents: input.salary ? Math.round(parseFloat(input.salary) * 100) : undefined,
            currency: input.currency || undefined,
            status: input.status,
            city: input.city || undefined,
            country: input.country || undefined,
            notes: input.notes || undefined,
            actorId: identity.userId,
          })
          setShowNew(false)
        }}
      />

      <EmployeeDialog
        open={!!editing}
        onOpenChange={(b) => { if (!b) setEditId(null) }}
        title="Edit employee"
        submitLabel="Save"
        initial={editing ? {
          firstName: editing.firstName,
          lastName: editing.lastName,
          email: editing.email,
          phone: editing.phone,
          role: editing.role,
          department: editing.department,
          employmentType: editing.employmentType,
          startDate: editing.startDate ? new Date(editing.startDate).toISOString().slice(0, 10) : todayStr(),
          salary: editing.salaryCents ? (editing.salaryCents / 100).toString() : '',
          currency: editing.currency || 'USD',
          city: editing.city,
          country: editing.country,
          notes: editing.notes,
          status: editing.status,
        } : emptyForm}
        onSave={(input) => {
          if (!editing) return
          updateEmployee(doc, editing.id, {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            role: input.role,
            department: input.department,
            employmentType: input.employmentType,
            startDate: input.startDate ? new Date(input.startDate).getTime() : 0,
            salaryCents: input.salary ? Math.round(parseFloat(input.salary) * 100) : 0,
            currency: input.currency,
            status: input.status,
            city: input.city,
            country: input.country,
            notes: input.notes,
          })
          setEditId(null)
        }}
      />
    </>
  )
}

function EmployeeDialog({
  open, onOpenChange, title, submitLabel, initial, onSave,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  title: string
  submitLabel: string
  initial: EmployeeFormState
  onSave: (input: EmployeeFormState) => void
}) {
  const [form, setForm] = useState<EmployeeFormState>(initial)

  // Reset form when dialog opens with new initial values
  useMemo(() => { if (open) setForm(initial) }, [open, initial])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave(form)
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="emp-fn">First name *</Label>
              <Input id="emp-fn" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="emp-ln">Last name</Label>
              <Input id="emp-ln" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="emp-em">Email</Label>
              <Input id="emp-em" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="emp-ph">Phone</Label>
              <Input id="emp-ph" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="emp-role">Role</Label>
              <Input id="emp-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="emp-dept">Department</Label>
              <Input id="emp-dept" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Employment type</Label>
              <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v as EmploymentType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace('-', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as EmployeeStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace('-', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="emp-start">Start date</Label>
              <Input id="emp-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="emp-salary">Salary ($)</Label>
              <Input id="emp-salary" type="number" min="0" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="emp-cur">Currency</Label>
              <Input id="emp-cur" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="emp-city">City</Label>
              <Input id="emp-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="emp-country">Country</Label>
              <Input id="emp-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="emp-notes">Notes</Label>
            <Textarea id="emp-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
