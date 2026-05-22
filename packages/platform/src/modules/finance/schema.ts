export const FINANCE_KEYS = {
  invoices: 'invoices',
  expenses: 'expenses',
  financeCategories: 'financeCategories',
} as const

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type ExpenseStatus = 'pending' | 'approved' | 'reimbursed' | 'rejected'

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPriceCents: number
}

export interface InvoiceRow {
  id: string
  number: string                 // e.g. "INV-0001"
  customerName: string
  customerCompanyId: string      // optional link to CRM company
  customerContactId: string      // optional link to CRM contact
  items: InvoiceLineItem[]
  subtotalCents: number
  taxPercent: number
  taxCents: number
  totalCents: number
  currency: string
  status: InvoiceStatus
  issueDate: number              // unix ms
  dueDate: number
  paidAt: number
  notes: string
  createdBy: string
  createdAt: number
  updatedAt: number
}

export interface ExpenseRow {
  id: string
  vendor: string
  description: string
  amountCents: number
  currency: string
  categoryId: string
  date: number
  paymentMethod: string          // 'card' | 'cash' | 'transfer' | 'other'
  status: ExpenseStatus
  receiptNote: string
  submittedBy: string
  createdAt: number
  updatedAt: number
}

export interface FinanceCategoryRow {
  id: string
  name: string
  type: 'expense' | 'income'
  color: string
  createdAt: number
}

export const INVOICE_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled']
export const EXPENSE_STATUSES: ExpenseStatus[] = ['pending', 'approved', 'reimbursed', 'rejected']
export const PAYMENT_METHODS = ['card', 'cash', 'transfer', 'other'] as const
