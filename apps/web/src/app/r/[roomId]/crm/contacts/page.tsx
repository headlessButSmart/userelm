'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, Search, Users, Mail, Phone, Building2, MoreHorizontal, Trash2 } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getContacts, getCompanies, contactDisplayName,
  createContact, deleteContact,
  LEAD_STATUSES, LEAD_SOURCES,
  type LeadStatus, type LeadSource, type ContactRow,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { ExportImportMenu } from '@/components/io/ExportImportMenu'
import { col } from '@/lib/io/column-schema'
import { useViewMode } from '@/hooks/useViewMode'
import { ViewToggle } from '@/components/ui/ViewToggle'

type ContactInput = Parameters<typeof createContact>[1]

const CONTACT_COLUMNS = [
  col<ContactRow, ContactInput>('firstName', 'First name'),
  col<ContactRow, ContactInput>('lastName', 'Last name'),
  col<ContactRow, ContactInput>('email'),
  col<ContactRow, ContactInput>('phone'),
  col<ContactRow, ContactInput>('mobile'),
  col<ContactRow, ContactInput>('jobTitle', 'Job title'),
  col<ContactRow, ContactInput>('status'),
  col<ContactRow, ContactInput>('source'),
  col<ContactRow, ContactInput>('city'),
  col<ContactRow, ContactInput>('country'),
  col<ContactRow, ContactInput>('linkedin'),
  col<ContactRow, ContactInput>('twitter'),
  col<ContactRow, ContactInput>('website'),
  col<ContactRow, ContactInput>('notes'),
]
import { StatusBadge } from '@/components/crm/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function ContactsPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { doc, identity } = useRoom()
  useYMapDeep(doc.getMap('contacts'))
  useYMapDeep(doc.getMap('companies'))

  const contacts = getContacts(doc)
  const companies = getCompanies(doc)
  const companyMap = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies])

  const [view, setView] = useViewMode('contacts', 'table')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all')
  const [showNew, setShowNew] = useState(false)

  const filtered = useMemo(() => {
    let result = contacts
    if (statusFilter !== 'all') result = result.filter((c) => c.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((c) =>
        contactDisplayName(c).toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.jobTitle.toLowerCase().includes(q) ||
        (companyMap.get(c.companyId)?.name ?? '').toLowerCase().includes(q),
      )
    }
    return result
  }, [contacts, search, statusFilter, companyMap])

  return (
    <>
      <TopBar title="Contacts" />
      <div className="flex-1 p-6 space-y-4 overflow-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts…" className="pl-8" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | 'all')}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{filtered.length} of {contacts.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <ExportImportMenu
              rows={filtered}
              schema={CONTACT_COLUMNS}
              entityName="contacts"
              onImportRow={(input) => createContact(doc, {
                firstName: input.firstName ?? 'Imported',
                ownerId: identity.userId,
                actorId: identity.userId,
                ...input,
              })}
            />
            <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> Add contact</Button>
          </div>
        </div>

        {contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No contacts yet"
            description="Add your first contact to start tracking relationships and deals."
            action={<Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> Add contact</Button>}
          />
        ) : view === 'table' ? (
          <div className="rounded-lg border border-[--color-border] overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-[--color-muted]/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium">Title</th>
                  <th className="px-4 py-2.5 text-left font-medium">Company</th>
                  <th className="px-4 py-2.5 text-left font-medium">Email</th>
                  <th className="px-4 py-2.5 text-left font-medium">Phone</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Updated</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const name = contactDisplayName(c)
                  const company = companyMap.get(c.companyId)
                  return (
                    <tr key={c.id} className="border-t border-[--color-border] hover:bg-[--color-muted]/30">
                      <td className="px-4 py-2.5">
                        <Link href={`/r/${roomId}/crm/contacts/${c.id}`} className="flex items-center gap-2.5 group">
                          <Avatar name={name} size="sm" />
                          <span className="font-medium group-hover:text-[--color-primary] group-hover:underline">{name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.jobTitle || '—'}</td>
                      <td className="px-4 py-2.5">
                        {company ? (
                          <Link href={`/r/${roomId}/crm/companies/${company.id}`} className="text-[--color-primary] hover:underline inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {company.name}
                          </Link>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.email || '—'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.phone || '—'}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(c.updatedAt).toLocaleDateString()}</td>
                      <td className="px-2 py-2.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { if (confirm(`Delete ${name}?`)) deleteContact(doc, c.id) }} className="text-[--color-destructive]">
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((c) => {
              const name = contactDisplayName(c)
              const company = companyMap.get(c.companyId)
              return (
                <div key={c.id} className="rounded-lg border border-[--color-border] bg-card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <Link href={`/r/${roomId}/crm/contacts/${c.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar name={name} size="md" />
                      <div className="min-w-0">
                        <div className="font-semibold truncate hover:text-[--color-primary]">{name}</div>
                        {c.jobTitle && <div className="text-xs text-muted-foreground truncate">{c.jobTitle}</div>}
                      </div>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { if (confirm(`Delete ${name}?`)) deleteContact(doc, c.id) }} className="text-[--color-destructive]">
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    {company && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <Link href={`/r/${roomId}/crm/companies/${company.id}`} className="truncate hover:text-[--color-primary] hover:underline">{company.name}</Link>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <NewContactDialog
        open={showNew}
        onOpenChange={setShowNew}
        companies={companies}
        onSave={(input) => {
          createContact(doc, { ...input, ownerId: identity.userId, actorId: identity.userId })
          setShowNew(false)
        }}
      />
    </>
  )
}

function NewContactDialog({
  open, onOpenChange, companies, onSave,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  companies: { id: string; name: string }[]
  onSave: (input: {
    firstName: string; lastName?: string; email?: string; phone?: string;
    jobTitle?: string; companyId?: string; status?: LeadStatus; source?: LeadSource;
  }) => void
}) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    jobTitle: '', companyId: '', status: 'new' as LeadStatus, source: 'other' as LeadSource,
  })

  function reset() {
    setForm({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', companyId: '', status: 'new', source: 'other' })
  }

  return (
    <Dialog open={open} onOpenChange={(b) => { if (!b) reset(); onOpenChange(b) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New contact</DialogTitle></DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave({
              firstName: form.firstName,
              lastName: form.lastName || undefined,
              email: form.email || undefined,
              phone: form.phone || undefined,
              jobTitle: form.jobTitle || undefined,
              companyId: form.companyId || undefined,
              status: form.status,
              source: form.source,
            })
            reset()
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fn">First name *</Label>
              <Input id="fn" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="ln">Last name</Label>
              <Input id="ln" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="em">Email</Label>
            <Input id="em" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ph">Phone</Label>
              <Input id="ph" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="jt">Job title</Label>
              <Input id="jt" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Company</Label>
            <Select value={form.companyId || '__none__'} onValueChange={(v) => setForm({ ...form, companyId: v === '__none__' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as LeadStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as LeadSource })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace('-', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add contact</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
