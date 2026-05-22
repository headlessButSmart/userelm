import * as Y from 'yjs'
import { nanoid } from 'nanoid'
import { FINANCE_KEYS, type InvoiceStatus, type ExpenseStatus, type InvoiceLineItem } from './schema'

function nextInvoiceNumber(doc: Y.Doc): string {
  const invoices = doc.getMap(FINANCE_KEYS.invoices)
  let max = 0
  invoices.forEach((v) => {
    if (v instanceof Y.Map) {
      const n = (v.get('number') as string) ?? ''
      const m = n.match(/(\d+)/)
      if (m && m[1]) max = Math.max(max, parseInt(m[1], 10))
    }
  })
  return `INV-${String(max + 1).padStart(4, '0')}`
}

function recalc(items: InvoiceLineItem[], taxPercent: number) {
  const subtotalCents = items.reduce((s, i) => s + Math.round(i.quantity * i.unitPriceCents), 0)
  const taxCents = Math.round((subtotalCents * taxPercent) / 100)
  const totalCents = subtotalCents + taxCents
  return { subtotalCents, taxCents, totalCents }
}

// ---------- Invoices ----------

export function createInvoice(doc: Y.Doc, input: {
  customerName: string
  customerCompanyId?: string
  customerContactId?: string
  items: InvoiceLineItem[]
  taxPercent?: number
  currency?: string
  status?: InvoiceStatus
  issueDate?: number
  dueDate?: number
  notes?: string
  actorId: string
}): string {
  const id = nanoid()
  doc.transact(() => {
    const now = Date.now()
    const taxPercent = input.taxPercent ?? 0
    const { subtotalCents, taxCents, totalCents } = recalc(input.items, taxPercent)
    const m = new Y.Map()
    m.set('id', id)
    m.set('number', nextInvoiceNumber(doc))
    m.set('customerName', input.customerName)
    m.set('customerCompanyId', input.customerCompanyId ?? '')
    m.set('customerContactId', input.customerContactId ?? '')
    m.set('items', input.items)
    m.set('subtotalCents', subtotalCents)
    m.set('taxPercent', taxPercent)
    m.set('taxCents', taxCents)
    m.set('totalCents', totalCents)
    m.set('currency', input.currency ?? 'USD')
    m.set('status', input.status ?? 'draft')
    m.set('issueDate', input.issueDate ?? now)
    m.set('dueDate', input.dueDate ?? 0)
    m.set('paidAt', 0)
    m.set('notes', input.notes ?? '')
    m.set('createdBy', input.actorId)
    m.set('createdAt', now)
    m.set('updatedAt', now)
    doc.getMap(FINANCE_KEYS.invoices).set(id, m)
  }, 'user')
  return id
}

export function updateInvoice(doc: Y.Doc, id: string, patch: Partial<{
  customerName: string
  customerCompanyId: string
  customerContactId: string
  items: InvoiceLineItem[]
  taxPercent: number
  currency: string
  status: InvoiceStatus
  issueDate: number
  dueDate: number
  notes: string
}>) {
  doc.transact(() => {
    const m = doc.getMap(FINANCE_KEYS.invoices).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) m.set(k, v)
    // Recompute totals if items or tax changed
    if (patch.items !== undefined || patch.taxPercent !== undefined) {
      const items = (m.get('items') as InvoiceLineItem[]) ?? []
      const taxPercent = (m.get('taxPercent') as number) ?? 0
      const r = recalc(items, taxPercent)
      m.set('subtotalCents', r.subtotalCents)
      m.set('taxCents', r.taxCents)
      m.set('totalCents', r.totalCents)
    }
    // Set paidAt if status flipped to paid
    if (patch.status === 'paid' && !m.get('paidAt')) m.set('paidAt', Date.now())
    if (patch.status && patch.status !== 'paid') m.set('paidAt', 0)
    m.set('updatedAt', Date.now())
  }, 'user')
}

export function deleteInvoice(doc: Y.Doc, id: string) {
  doc.transact(() => doc.getMap(FINANCE_KEYS.invoices).delete(id), 'user')
}

// ---------- Expenses ----------

export function createExpense(doc: Y.Doc, input: {
  vendor: string
  description?: string
  amountCents: number
  currency?: string
  categoryId?: string
  date?: number
  paymentMethod?: string
  status?: ExpenseStatus
  receiptNote?: string
  actorId: string
}): string {
  const id = nanoid()
  doc.transact(() => {
    const now = Date.now()
    const m = new Y.Map()
    m.set('id', id)
    m.set('vendor', input.vendor)
    m.set('description', input.description ?? '')
    m.set('amountCents', input.amountCents)
    m.set('currency', input.currency ?? 'USD')
    m.set('categoryId', input.categoryId ?? '')
    m.set('date', input.date ?? now)
    m.set('paymentMethod', input.paymentMethod ?? 'card')
    m.set('status', input.status ?? 'pending')
    m.set('receiptNote', input.receiptNote ?? '')
    m.set('submittedBy', input.actorId)
    m.set('createdAt', now)
    m.set('updatedAt', now)
    doc.getMap(FINANCE_KEYS.expenses).set(id, m)
  }, 'user')
  return id
}

export function updateExpense(doc: Y.Doc, id: string, patch: Partial<{
  vendor: string
  description: string
  amountCents: number
  currency: string
  categoryId: string
  date: number
  paymentMethod: string
  status: ExpenseStatus
  receiptNote: string
}>) {
  doc.transact(() => {
    const m = doc.getMap(FINANCE_KEYS.expenses).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) m.set(k, v)
    m.set('updatedAt', Date.now())
  }, 'user')
}

export function deleteExpense(doc: Y.Doc, id: string) {
  doc.transact(() => doc.getMap(FINANCE_KEYS.expenses).delete(id), 'user')
}

// ---------- Categories ----------

export function createFinanceCategory(doc: Y.Doc, input: {
  name: string
  type: 'expense' | 'income'
  color?: string
}): string {
  const id = nanoid()
  doc.transact(() => {
    const m = new Y.Map()
    m.set('id', id)
    m.set('name', input.name)
    m.set('type', input.type)
    m.set('color', input.color ?? '#6b7280')
    m.set('createdAt', Date.now())
    doc.getMap(FINANCE_KEYS.financeCategories).set(id, m)
  }, 'user')
  return id
}

export function deleteFinanceCategory(doc: Y.Doc, id: string) {
  doc.transact(() => doc.getMap(FINANCE_KEYS.financeCategories).delete(id), 'user')
}
