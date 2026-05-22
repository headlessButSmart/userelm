'use client'
import { useState, useMemo } from 'react'
import { Plus, Activity as ActivityIcon, Phone, Mail, Calendar, FileText, Trash2 } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getActivities, getContacts, getDeals, getCompanies, contactDisplayName,
  logActivity, deleteActivity,
  ACTIVITY_TYPES, type ActivityType, type ActivityRow,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { ExportImportMenu } from '@/components/io/ExportImportMenu'
import { col, transforms } from '@/lib/io/column-schema'

type ActivityInput = Parameters<typeof logActivity>[1]

const ACTIVITY_COLUMNS = [
  col<ActivityRow, ActivityInput>('type'),
  col<ActivityRow, ActivityInput>('subject'),
  col<ActivityRow, ActivityInput>('description'),
  col<ActivityRow, ActivityInput>('contactId', 'Contact ID'),
  col<ActivityRow, ActivityInput>('dealId', 'Deal ID'),
  col<ActivityRow, ActivityInput>('companyId', 'Company ID'),
  transforms.date<ActivityRow, ActivityInput>('date'),
  col<ActivityRow, ActivityInput>('durationMinutes', 'Duration (min)'),
]
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TYPE_META: Record<ActivityType, { icon: any; color: string }> = {
  call:    { icon: Phone,    color: 'bg-blue-100 text-blue-700' },
  email:   { icon: Mail,     color: 'bg-purple-100 text-purple-700' },
  meeting: { icon: Calendar, color: 'bg-green-100 text-green-700' },
  note:    { icon: FileText, color: 'bg-gray-100 text-gray-700' },
}

export default function ActivitiesPage() {
  const { doc, identity } = useRoom()
  useYMapDeep(doc.getMap('activities'))
  useYMapDeep(doc.getMap('contacts'))
  useYMapDeep(doc.getMap('deals'))
  useYMapDeep(doc.getMap('companies'))

  const activities = getActivities(doc)
  const contacts = getContacts(doc)
  const deals = getDeals(doc)
  const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts])
  const dealById = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals])

  const [showNew, setShowNew] = useState(false)

  // Group by day
  const grouped = useMemo(() => {
    const m = new Map<string, typeof activities>()
    for (const a of activities) {
      const d = new Date(a.date).toLocaleDateString()
      if (!m.has(d)) m.set(d, [])
      m.get(d)!.push(a)
    }
    return Array.from(m.entries())
  }, [activities])

  return (
    <>
      <TopBar title="Activities" />
      <div className="flex-1 p-6 space-y-4 overflow-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{activities.length} logged activit{activities.length === 1 ? 'y' : 'ies'}</p>
          <div className="flex items-center gap-2">
            <ExportImportMenu
              rows={activities}
              schema={ACTIVITY_COLUMNS}
              entityName="activities"
              onImportRow={(input) => logActivity(doc, {
                type: input.type ?? 'note',
                subject: input.subject ?? 'Imported',
                actorId: identity.userId,
                ...input,
              })}
            />
            <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> Log activity</Button>
          </div>
        </div>

        {activities.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="No activity yet"
            description="Log calls, emails, meetings, and notes to keep track of every interaction with your contacts."
            action={<Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> Log activity</Button>}
          />
        ) : (
          <div className="space-y-6">
            {grouped.map(([day, items]) => (
              <div key={day}>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{day}</div>
                <div className="relative pl-6 border-l-2 border-[--color-border] space-y-3">
                  {items.map((a) => {
                    const meta = TYPE_META[a.type]
                    const Icon = meta.icon
                    const contact = contactById.get(a.contactId)
                    const deal = dealById.get(a.dealId)
                    return (
                      <div key={a.id} className="relative">
                        <div className={`absolute -left-[33px] top-1.5 h-6 w-6 rounded-full flex items-center justify-center ${meta.color} ring-4 ring-background`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="rounded-lg border border-[--color-border] bg-card p-3 group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="capitalize">{a.type}</Badge>
                                <span className="font-medium">{a.subject}</span>
                              </div>
                              {a.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.description}</p>}
                              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                                <span>{new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {a.durationMinutes > 0 && <span>· {a.durationMinutes} min</span>}
                                {contact && <span>· {contactDisplayName(contact)}</span>}
                                {deal && <span>· {deal.title}</span>}
                              </div>
                            </div>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100"
                              onClick={() => { if (confirm('Delete activity?')) deleteActivity(doc, a.id) }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewActivityDialog
        open={showNew}
        onOpenChange={setShowNew}
        contacts={contacts.map((c) => ({ id: c.id, name: contactDisplayName(c) }))}
        deals={deals.map((d) => ({ id: d.id, title: d.title }))}
        onSave={(input) => {
          logActivity(doc, { ...input, actorId: identity.userId })
          setShowNew(false)
        }}
      />
    </>
  )
}

function NewActivityDialog({
  open, onOpenChange, contacts, deals, onSave,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  contacts: { id: string; name: string }[]
  deals: { id: string; title: string }[]
  onSave: (input: {
    type: ActivityType; subject: string; description?: string;
    contactId?: string; dealId?: string; date?: number; durationMinutes?: number;
  }) => void
}) {
  const [form, setForm] = useState({
    type: 'call' as ActivityType,
    subject: '', description: '',
    contactId: '', dealId: '',
    date: new Date().toISOString().slice(0, 16),
    durationMinutes: '',
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Log activity</DialogTitle></DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave({
              type: form.type,
              subject: form.subject,
              description: form.description || undefined,
              contactId: form.contactId || undefined,
              dealId: form.dealId || undefined,
              date: form.date ? new Date(form.date).getTime() : undefined,
              durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : undefined,
            })
            setForm({ type: 'call', subject: '', description: '', contactId: '', dealId: '', date: new Date().toISOString().slice(0, 16), durationMinutes: '' })
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ActivityType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Duration (min)</Label><Input type="number" min="0" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} /></div>
          </div>
          <div><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></div>
          <div><Label>Notes</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Date</Label><Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contact</Label>
              <Select value={form.contactId || '__none__'} onValueChange={(v) => setForm({ ...form, contactId: v === '__none__' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Deal</Label>
              <Select value={form.dealId || '__none__'} onValueChange={(v) => setForm({ ...form, dealId: v === '__none__' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {deals.map((d) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Log activity</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
