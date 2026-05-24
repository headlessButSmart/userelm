'use client'
import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Briefcase, MoreHorizontal, Trash2 } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getDeals, getContacts, getCompanies, contactDisplayName,
  createDeal, updateDealStage, deleteDeal,
  DEAL_STAGES, LEAD_SOURCES,
  type DealStage, type LeadSource, type DealRow,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { ExportImportMenu } from '@/components/io/ExportImportMenu'
import { col, transforms } from '@/lib/io/column-schema'

type DealInput = Parameters<typeof createDeal>[1]

const DEAL_COLUMNS = [
  col<DealRow, DealInput>('title'),
  transforms.money<DealRow, DealInput>('value'),
  col<DealRow, DealInput>('currency'),
  col<DealRow, DealInput>('stage'),
  col<DealRow, DealInput>('probability'),
  col<DealRow, DealInput>('source'),
  col<DealRow, DealInput>('contactId', 'Contact ID'),
  col<DealRow, DealInput>('companyId', 'Company ID'),
  transforms.date<DealRow, DealInput>('expectedCloseDate', 'Expected close date'),
  col<DealRow, DealInput>('description'),
]
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const STAGE_COLORS: Record<DealStage, string> = {
  lead: 'border-l-blue-400',
  qualified: 'border-l-purple-400',
  proposal: 'border-l-yellow-400',
  negotiation: 'border-l-orange-400',
  won: 'border-l-green-500',
  lost: 'border-l-gray-400',
}

export default function DealsPage() {
  useParams<{ roomId: string }>()
  const { doc, identity } = useRoom()
  useYMapDeep(doc.getMap('deals'))
  useYMapDeep(doc.getMap('contacts'))
  useYMapDeep(doc.getMap('companies'))

  const deals = getDeals(doc)
  const contacts = getContacts(doc)
  const companies = getCompanies(doc)
  const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts])

  const byStage = useMemo(() => {
    const m = new Map<DealStage, typeof deals>(DEAL_STAGES.map((s) => [s, []]))
    deals.forEach((d) => m.get(d.stage)?.push(d))
    return m
  }, [deals])

  const [showNew, setShowNew] = useState(false)
  const [dragStage, setDragStage] = useState<DealStage | null>(null)

  function fmt(cents: number, ccy: string) {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: ccy, maximumFractionDigits: 0 })
  }

  return (
    <>
      <TopBar title="Pipeline" />
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{deals.length} total deal{deals.length !== 1 ? 's' : ''}</p>
          <div className="flex items-center gap-2">
            <ExportImportMenu
              rows={deals}
              schema={DEAL_COLUMNS}
              entityName="deals"
              onImportRow={(input) => createDeal(doc, {
                title: input.title ?? 'Imported deal',
                value: input.value ?? 0,
                ownerId: identity.userId,
                actorId: identity.userId,
                ...input,
              })}
            />
            <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /><span className="hidden sm:inline"> New deal</span></Button>
          </div>
        </div>

        {deals.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No deals yet"
            description="Track your sales pipeline by adding deals and dragging them between stages."
            action={<Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New deal</Button>}
          />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {DEAL_STAGES.map((stage) => {
              const list = byStage.get(stage) ?? []
              const total = list.reduce((s, d) => s + d.value, 0)
              return (
                <div
                  key={stage}
                  onDragOver={(e) => { e.preventDefault(); setDragStage(stage) }}
                  onDragLeave={() => setDragStage(null)}
                  onDrop={(e) => {
                    setDragStage(null)
                    const dealId = e.dataTransfer.getData('dealId')
                    if (dealId) updateDealStage(doc, dealId, stage)
                  }}
                  className={`flex-shrink-0 w-72 ${dragStage === stage ? 'bg-[--color-primary-soft]/60' : ''} rounded-lg transition-colors p-1`}
                >
                  <div className="flex items-center justify-between px-2 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize text-sm">{stage}</span>
                      <Badge variant="secondary">{list.length}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{total > 0 ? fmt(total, 'USD') : ''}</span>
                  </div>
                  <div className="flex flex-col gap-2 min-h-24">
                    {list.map((d) => {
                      const contact = contactById.get(d.contactId)
                      return (
                        <div
                          key={d.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('dealId', d.id)}
                          className={`rounded-lg border-l-4 ${STAGE_COLORS[d.stage]} border-y border-r border-[--color-border] bg-card p-3 cursor-grab hover:shadow-md transition-shadow text-sm group`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium flex-1 line-clamp-2">{d.title}</div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { if (confirm(`Delete deal "${d.title}"?`)) deleteDeal(doc, d.id) }} className="text-[--color-destructive]">
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="mt-2 font-bold text-base">{fmt(d.value, d.currency)}</div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{d.probability}%</span>
                            {contact && <span>· {contactDisplayName(contact)}</span>}
                          </div>
                          {d.expectedCloseDate > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Close: {new Date(d.expectedCloseDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <NewDealDialog
        open={showNew}
        onOpenChange={setShowNew}
        contacts={contacts.map((c) => ({ id: c.id, name: contactDisplayName(c) }))}
        companies={companies}
        onSave={(input) => {
          createDeal(doc, { ...input, ownerId: identity.userId, actorId: identity.userId })
          setShowNew(false)
        }}
      />
    </>
  )
}

function NewDealDialog({
  open, onOpenChange, contacts, companies, onSave,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  contacts: { id: string; name: string }[]
  companies: { id: string; name: string }[]
  onSave: (input: {
    title: string; contactId?: string; companyId?: string; value: number;
    currency: string; stage: DealStage; source: LeadSource; expectedCloseDate?: number;
  }) => void
}) {
  const [form, setForm] = useState({
    title: '', contactId: '', companyId: '',
    value: '', currency: 'USD',
    stage: 'lead' as DealStage, source: 'other' as LeadSource,
    expectedCloseDate: '',
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New deal</DialogTitle></DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const valueCents = Math.round(parseFloat(form.value || '0') * 100)
            onSave({
              title: form.title,
              contactId: form.contactId || undefined,
              companyId: form.companyId || undefined,
              value: valueCents,
              currency: form.currency,
              stage: form.stage,
              source: form.source,
              expectedCloseDate: form.expectedCloseDate ? new Date(form.expectedCloseDate).getTime() : undefined,
            })
            setForm({ title: '', contactId: '', companyId: '', value: '', currency: 'USD', stage: 'lead', source: 'other', expectedCloseDate: '' })
          }}
          className="space-y-3"
        >
          <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Value</Label><Input type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
            <div>
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['USD', 'EUR', 'GBP', 'TRY'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
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
              <Label>Company</Label>
              <Select value={form.companyId || '__none__'} onValueChange={(v) => setForm({ ...form, companyId: v === '__none__' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as DealStage })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEAL_STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as LeadSource })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAD_SOURCES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace('-', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Expected close date</Label><Input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} /></div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Create deal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
