'use client'
import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Receipt, MoreHorizontal, Trash2, Edit2 } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getExpenses,
  createExpense, updateExpense, deleteExpense,
  EXPENSE_STATUSES, PAYMENT_METHODS,
  type ExpenseStatus, type ExpenseRow,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { ExportImportMenu } from '@/components/io/ExportImportMenu'
import { col, transforms } from '@/lib/io/column-schema'

type ExpenseInput = Parameters<typeof createExpense>[1]

const EXPENSE_COLUMNS = [
  col<ExpenseRow, ExpenseInput>('vendor'),
  col<ExpenseRow, ExpenseInput>('description'),
  transforms.money<ExpenseRow, ExpenseInput>('amountCents', 'Amount'),
  col<ExpenseRow, ExpenseInput>('currency'),
  col<ExpenseRow, ExpenseInput>('categoryId', 'Category ID'),
  transforms.date<ExpenseRow, ExpenseInput>('date'),
  col<ExpenseRow, ExpenseInput>('paymentMethod', 'Payment method'),
  col<ExpenseRow, ExpenseInput>('status'),
  col<ExpenseRow, ExpenseInput>('receiptNote', 'Receipt note'),
]
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useViewMode } from '@/hooks/useViewMode'
import { ViewToggle } from '@/components/ui/ViewToggle'

const EXPENSE_STATUS_BADGE: Record<ExpenseStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-blue-100 text-blue-700 border-blue-200',
  reimbursed: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
}

function ExpenseStatusBadge({ status }: { status: ExpenseStatus }) {
  return (
    <Badge variant="outline" className={cn('capitalize border', EXPENSE_STATUS_BADGE[status])}>
      {status}
    </Badge>
  )
}

function fmtMoney(cents: number, currency: string) {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 })
}

type ExpenseFormState = {
  vendor: string
  description: string
  amount: string
  currency: string
  category: string
  date: string
  paymentMethod: string
  status: ExpenseStatus
  receiptNote: string
}

function emptyExpenseForm(): ExpenseFormState {
  return {
    vendor: '',
    description: '',
    amount: '',
    currency: 'USD',
    category: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'card',
    status: 'pending',
    receiptNote: '',
  }
}

function ExpenseDialog({
  open, onOpenChange, initial, onSubmit, mode,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  initial?: ExpenseFormState
  onSubmit: (input: ExpenseFormState) => void
  mode: 'create' | 'edit'
}) {
  const [form, setForm] = useState<ExpenseFormState>(initial ?? emptyExpenseForm())

  useEffect(() => {
    if (open) setForm(initial ?? emptyExpenseForm())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New expense' : 'Edit expense'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}
          className="space-y-3"
        >
          <div>
            <Label>Vendor *</Label>
            <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} required />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Amount</Label>
              <Input
                type="number" min="0" step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
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
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Travel"
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Payment method</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ExpenseStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Receipt note</Label>
            <Textarea
              value={form.receiptNote}
              onChange={(e) => setForm({ ...form, receiptNote: e.target.value })}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{mode === 'create' ? 'Create expense' : 'Save changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ExpensesPage() {
  useParams<{ roomId: string }>()
  const { doc, identity } = useRoom()
  useYMapDeep(doc.getMap('expenses'))

  const expenses = getExpenses(doc)

  const [view, setView] = useViewMode('expenses', 'table')
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | '__all__'>('__all__')
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  const editingExpense = useMemo(
    () => (editing ? expenses.find((e) => e.id === editing) ?? null : null),
    [editing, expenses],
  )

  const filtered = useMemo(() => {
    if (statusFilter === '__all__') return expenses
    return expenses.filter((e) => e.status === statusFilter)
  }, [expenses, statusFilter])

  function toFormState(exp: typeof expenses[number]): ExpenseFormState {
    return {
      vendor: exp.vendor,
      description: exp.description,
      amount: (exp.amountCents / 100).toFixed(2),
      currency: exp.currency,
      category: exp.categoryId,
      date: exp.date ? new Date(exp.date).toISOString().slice(0, 10) : '',
      paymentMethod: exp.paymentMethod,
      status: exp.status,
      receiptNote: exp.receiptNote,
    }
  }

  function fromFormState(f: ExpenseFormState) {
    return {
      vendor: f.vendor,
      description: f.description,
      amountCents: Math.round(parseFloat(f.amount || '0') * 100),
      currency: f.currency,
      categoryId: f.category,
      date: f.date ? new Date(f.date).getTime() : Date.now(),
      paymentMethod: f.paymentMethod,
      status: f.status,
      receiptNote: f.receiptNote,
    }
  }

  return (
    <>
      <TopBar title="Expenses" />
      <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ExpenseStatus | '__all__')}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                {EXPENSE_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <ExportImportMenu
              rows={filtered}
              schema={EXPENSE_COLUMNS}
              entityName="expenses"
              onImportRow={(input) => createExpense(doc, {
                vendor: input.vendor ?? 'Imported vendor',
                amountCents: input.amountCents ?? 0,
                actorId: identity.userId,
                ...input,
              })}
            />
            <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /><span className="hidden sm:inline"> New expense</span></Button>
          </div>
        </div>

        {expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses yet"
            description="Track business expenses, receipts, and reimbursements in one place."
            action={<Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New expense</Button>}
          />
        ) : view === 'table' ? (
          <div className="rounded-lg border border-[--color-border] bg-card overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-[--color-muted]/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Vendor</th>
                  <th className="text-left px-4 py-2 font-medium">Category</th>
                  <th className="text-right px-4 py-2 font-medium">Amount</th>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-left px-4 py-2 font-medium">Payment</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="w-10 px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exp) => (
                  <tr key={exp.id} className="border-t border-[--color-border] hover:bg-[--color-muted]/30">
                    <td className="px-4 py-2">
                      <div className="font-medium">{exp.vendor}</div>
                      {exp.description && <div className="text-xs text-muted-foreground truncate">{exp.description}</div>}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{exp.categoryId || '—'}</td>
                    <td className="px-4 py-2 text-right font-medium">{fmtMoney(exp.amountCents, exp.currency)}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {exp.date ? new Date(exp.date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-2 capitalize text-muted-foreground">{exp.paymentMethod}</td>
                    <td className="px-4 py-2"><ExpenseStatusBadge status={exp.status} /></td>
                    <td className="px-4 py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(exp.id)}>
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { if (confirm(`Delete expense from ${exp.vendor}?`)) deleteExpense(doc, exp.id) }}
                            className="text-[--color-destructive]"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No expenses match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full py-8 text-center text-muted-foreground">No expenses match this filter.</div>
            ) : filtered.map((exp) => (
              <div key={exp.id} className="rounded-lg border border-[--color-border] bg-card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{exp.vendor}</div>
                    {exp.categoryId && <div className="text-xs text-muted-foreground capitalize">{exp.categoryId}</div>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(exp.id)}>
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => { if (confirm(`Delete expense from ${exp.vendor}?`)) deleteExpense(doc, exp.id) }}
                        className="text-[--color-destructive]"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="text-2xl font-bold mb-3">{fmtMoney(exp.amountCents, exp.currency)}</div>
                <div className="flex items-center justify-between gap-2">
                  <ExpenseStatusBadge status={exp.status} />
                  <div className="text-xs text-muted-foreground text-right">
                    <div className="capitalize">{exp.paymentMethod}</div>
                    {exp.date && <div>{new Date(exp.date).toLocaleDateString()}</div>}
                  </div>
                </div>
                {exp.description && (
                  <div className="mt-2 text-xs text-muted-foreground truncate">{exp.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ExpenseDialog
        open={showNew}
        onOpenChange={setShowNew}
        mode="create"
        onSubmit={(f) => {
          createExpense(doc, { ...fromFormState(f), actorId: identity.userId })
          setShowNew(false)
        }}
      />

      {editingExpense && (
        <ExpenseDialog
          open={!!editing}
          onOpenChange={(b) => { if (!b) setEditing(null) }}
          initial={toFormState(editingExpense)}
          mode="edit"
          onSubmit={(f) => {
            updateExpense(doc, editingExpense.id, fromFormState(f))
            setEditing(null)
          }}
        />
      )}
    </>
  )
}
