'use client'
import { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  INVOICE_STATUSES,
  type InvoiceStatus, type InvoiceLineItem,
} from '@p2p-crm/platform'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export const INVOICE_STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  paid: 'bg-green-100 text-green-700 border-green-200',
  overdue: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200 line-through',
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge variant="outline" className={cn('capitalize border', INVOICE_STATUS_BADGE[status])}>
      {status}
    </Badge>
  )
}

export function fmtMoney(cents: number, currency: string) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 })
}

type FormLineItem = { description: string; quantity: string; unitPrice: string }
export type InvoiceFormState = {
  customerName: string
  customerCompanyId: string
  items: FormLineItem[]
  taxPercent: string
  currency: string
  status: InvoiceStatus
  issueDate: string
  dueDate: string
  notes: string
}

function emptyForm(): InvoiceFormState {
  const today = new Date().toISOString().slice(0, 10)
  return {
    customerName: '',
    customerCompanyId: '',
    items: [{ description: '', quantity: '1', unitPrice: '' }],
    taxPercent: '0',
    currency: 'USD',
    status: 'draft',
    issueDate: today,
    dueDate: '',
    notes: '',
  }
}

export function invoiceToFormState(inv: {
  customerName: string; customerCompanyId: string; items: InvoiceLineItem[]
  taxPercent: number; currency: string; status: InvoiceStatus
  issueDate: number; dueDate: number; notes: string
}): InvoiceFormState {
  return {
    customerName: inv.customerName,
    customerCompanyId: inv.customerCompanyId,
    items: inv.items.length
      ? inv.items.map((i) => ({
          description: i.description,
          quantity: String(i.quantity),
          unitPrice: (i.unitPriceCents / 100).toFixed(2),
        }))
      : [{ description: '', quantity: '1', unitPrice: '' }],
    taxPercent: String(inv.taxPercent ?? 0),
    currency: inv.currency,
    status: inv.status,
    issueDate: inv.issueDate ? new Date(inv.issueDate).toISOString().slice(0, 10) : '',
    dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : '',
    notes: inv.notes,
  }
}

export function InvoiceDialog({
  open, onOpenChange, initial, companies, onSubmit, mode,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  initial?: InvoiceFormState
  companies: { id: string; name: string }[]
  onSubmit: (input: {
    customerName: string
    customerCompanyId?: string
    items: InvoiceLineItem[]
    taxPercent: number
    currency: string
    status: InvoiceStatus
    issueDate: number
    dueDate?: number
    notes: string
  }) => void
  mode: 'create' | 'edit'
}) {
  const [form, setForm] = useState<InvoiceFormState>(initial ?? emptyForm())

  useEffect(() => {
    if (open) setForm(initial ?? emptyForm())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const totals = useMemo(() => {
    const subtotalCents = form.items.reduce((s, i) => {
      const qty = parseFloat(i.quantity || '0')
      const unit = Math.round(parseFloat(i.unitPrice || '0') * 100)
      return s + Math.round(qty * unit)
    }, 0)
    const tax = parseFloat(form.taxPercent || '0')
    const taxCents = Math.round((subtotalCents * tax) / 100)
    const totalCents = subtotalCents + taxCents
    return { subtotalCents, taxCents, totalCents }
  }, [form.items, form.taxPercent])

  function updateItem(idx: number, patch: Partial<FormLineItem>) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }))
  }
  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { description: '', quantity: '1', unitPrice: '' }] }))
  }
  function removeItem(idx: number) {
    setForm((f) => ({ ...f, items: f.items.length === 1 ? f.items : f.items.filter((_, i) => i !== idx) }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const items: InvoiceLineItem[] = form.items
      .filter((i) => i.description.trim() || i.unitPrice)
      .map((i) => ({
        description: i.description,
        quantity: parseFloat(i.quantity || '0') || 0,
        unitPriceCents: Math.round(parseFloat(i.unitPrice || '0') * 100),
      }))
    onSubmit({
      customerName: form.customerName,
      customerCompanyId: form.customerCompanyId || undefined,
      items,
      taxPercent: parseFloat(form.taxPercent || '0') || 0,
      currency: form.currency,
      status: form.status,
      issueDate: form.issueDate ? new Date(form.issueDate).getTime() : Date.now(),
      dueDate: form.dueDate ? new Date(form.dueDate).getTime() : undefined,
      notes: form.notes,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New invoice' : 'Edit invoice'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Customer name *</Label>
              <Input
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Link to CRM company</Label>
              <Select
                value={form.customerCompanyId || '__none__'}
                onValueChange={(v) => setForm({ ...form, customerCompanyId: v === '__none__' ? '' : v })}
              >
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line items</Label>
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-3.5 w-3.5" /> Add line
              </Button>
            </div>
            <div className="space-y-2">
              {form.items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_120px_auto] gap-2 items-center">
                  <Input placeholder="Description" value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
                  <Input type="number" min="0" step="0.01" placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: e.target.value })} />
                  <Input type="number" min="0" step="0.01" placeholder="Unit price" value={it.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: e.target.value })} />
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(idx)} disabled={form.items.length === 1} className="text-[--color-destructive]">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Tax %</Label>
              <Input type="number" min="0" step="0.01" value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: e.target.value })} />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['USD', 'EUR', 'GBP', 'TRY'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as InvoiceStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{INVOICE_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Issue date</Label>
              <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
            </div>
            <div>
              <Label>Due date</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>

          <div className="rounded-md border border-[--color-border] bg-[--color-muted]/30 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmtMoney(totals.subtotalCents, form.currency)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax ({form.taxPercent || 0}%)</span><span>{fmtMoney(totals.taxCents, form.currency)}</span></div>
            <div className="flex justify-between font-semibold pt-1 border-t border-[--color-border]"><span>Total</span><span>{fmtMoney(totals.totalCents, form.currency)}</span></div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{mode === 'create' ? 'Create invoice' : 'Save changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
