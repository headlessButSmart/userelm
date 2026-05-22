import * as Y from 'yjs'
import { FINANCE_KEYS, type InvoiceRow, type ExpenseRow, type FinanceCategoryRow, type InvoiceLineItem } from './schema'

function readMap<T>(m: Y.Map<unknown>, mapper: (v: Y.Map<unknown>) => T): T[] {
  const rows: T[] = []
  m.forEach((v) => { if (v instanceof Y.Map) rows.push(mapper(v)) })
  return rows
}

function readInvoice(m: Y.Map<unknown>): InvoiceRow {
  return {
    id: (m.get('id') as string) ?? '',
    number: (m.get('number') as string) ?? '',
    customerName: (m.get('customerName') as string) ?? '',
    customerCompanyId: (m.get('customerCompanyId') as string) ?? '',
    customerContactId: (m.get('customerContactId') as string) ?? '',
    items: (m.get('items') as InvoiceLineItem[]) ?? [],
    subtotalCents: (m.get('subtotalCents') as number) ?? 0,
    taxPercent: (m.get('taxPercent') as number) ?? 0,
    taxCents: (m.get('taxCents') as number) ?? 0,
    totalCents: (m.get('totalCents') as number) ?? 0,
    currency: (m.get('currency') as string) ?? 'USD',
    status: ((m.get('status') as InvoiceRow['status']) ?? 'draft'),
    issueDate: (m.get('issueDate') as number) ?? 0,
    dueDate: (m.get('dueDate') as number) ?? 0,
    paidAt: (m.get('paidAt') as number) ?? 0,
    notes: (m.get('notes') as string) ?? '',
    createdBy: (m.get('createdBy') as string) ?? '',
    createdAt: (m.get('createdAt') as number) ?? 0,
    updatedAt: (m.get('updatedAt') as number) ?? 0,
  }
}

function readExpense(m: Y.Map<unknown>): ExpenseRow {
  return {
    id: (m.get('id') as string) ?? '',
    vendor: (m.get('vendor') as string) ?? '',
    description: (m.get('description') as string) ?? '',
    amountCents: (m.get('amountCents') as number) ?? 0,
    currency: (m.get('currency') as string) ?? 'USD',
    categoryId: (m.get('categoryId') as string) ?? '',
    date: (m.get('date') as number) ?? 0,
    paymentMethod: (m.get('paymentMethod') as string) ?? 'card',
    status: ((m.get('status') as ExpenseRow['status']) ?? 'pending'),
    receiptNote: (m.get('receiptNote') as string) ?? '',
    submittedBy: (m.get('submittedBy') as string) ?? '',
    createdAt: (m.get('createdAt') as number) ?? 0,
    updatedAt: (m.get('updatedAt') as number) ?? 0,
  }
}

function readCategory(m: Y.Map<unknown>): FinanceCategoryRow {
  return {
    id: (m.get('id') as string) ?? '',
    name: (m.get('name') as string) ?? '',
    type: ((m.get('type') as FinanceCategoryRow['type']) ?? 'expense'),
    color: (m.get('color') as string) ?? '#6b7280',
    createdAt: (m.get('createdAt') as number) ?? 0,
  }
}

export function getInvoices(doc: Y.Doc): InvoiceRow[] {
  return readMap(doc.getMap(FINANCE_KEYS.invoices), readInvoice).sort((a, b) => b.issueDate - a.issueDate)
}
export function getInvoice(doc: Y.Doc, id: string): InvoiceRow | null {
  const m = doc.getMap(FINANCE_KEYS.invoices).get(id) as Y.Map<unknown> | undefined
  return m ? readInvoice(m) : null
}

export function getExpenses(doc: Y.Doc): ExpenseRow[] {
  return readMap(doc.getMap(FINANCE_KEYS.expenses), readExpense).sort((a, b) => b.date - a.date)
}
export function getExpense(doc: Y.Doc, id: string): ExpenseRow | null {
  const m = doc.getMap(FINANCE_KEYS.expenses).get(id) as Y.Map<unknown> | undefined
  return m ? readExpense(m) : null
}

export function getFinanceCategories(doc: Y.Doc): FinanceCategoryRow[] {
  return readMap(doc.getMap(FINANCE_KEYS.financeCategories), readCategory).sort((a, b) => a.name.localeCompare(b.name))
}
