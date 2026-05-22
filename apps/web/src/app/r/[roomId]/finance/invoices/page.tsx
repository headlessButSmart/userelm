'use client'
import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, FileText, MoreHorizontal, Edit2, Building2, Trash2 } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getInvoices, getCompanies,
  createInvoice, updateInvoice, deleteInvoice,
  INVOICE_STATUSES,
  type InvoiceStatus, type InvoiceRow,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { ExportImportMenu } from '@/components/io/ExportImportMenu'
import { col, transforms } from '@/lib/io/column-schema'

type InvoiceInput = Parameters<typeof createInvoice>[1]

const INVOICE_COLUMNS = [
  col<InvoiceRow, InvoiceInput>('customerName', 'Customer name'),
  col<InvoiceRow, InvoiceInput>('customerCompanyId', 'Customer company ID'),
  col<InvoiceRow, InvoiceInput>('status'),
  {
    // Export-only: createInvoice doesn't accept totalCents directly (computed from items)
    header: 'Total',
    field: '__totalCentsReadOnly__' as keyof InvoiceInput & string,
    get: (row: InvoiceRow) => (typeof row.totalCents === 'number' ? row.totalCents / 100 : 0),
  },
  col<InvoiceRow, InvoiceInput>('currency'),
  transforms.date<InvoiceRow, InvoiceInput>('issueDate', 'Issue date'),
  transforms.date<InvoiceRow, InvoiceInput>('dueDate', 'Due date'),
  col<InvoiceRow, InvoiceInput>('notes'),
]
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { InvoiceDialog, InvoiceStatusBadge, fmtMoney, invoiceToFormState } from './invoice-dialog'
import { useViewMode } from '@/hooks/useViewMode'
import { ViewToggle } from '@/components/ui/ViewToggle'

export default function InvoicesPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const router = useRouter()
  const { doc, identity } = useRoom()
  useYMapDeep(doc.getMap('invoices'))
  useYMapDeep(doc.getMap('companies'))

  const invoices = getInvoices(doc)
  const companies = getCompanies(doc)
  const companyById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies])

  const [view, setView] = useViewMode('invoices', 'table')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | '__all__'>('__all__')
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  const editingInvoice = useMemo(
    () => (editing ? invoices.find((i) => i.id === editing) ?? null : null),
    [editing, invoices],
  )

  const filtered = useMemo(() => {
    if (statusFilter === '__all__') return invoices
    return invoices.filter((i) => i.status === statusFilter)
  }, [invoices, statusFilter])

  return (
    <>
      <TopBar title="Invoices" />
      <div className="flex-1 p-6 space-y-4 overflow-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InvoiceStatus | '__all__')}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                {INVOICE_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <ExportImportMenu
              rows={filtered}
              schema={INVOICE_COLUMNS}
              entityName="invoices"
              onImportRow={(input) => createInvoice(doc, {
                customerName: input.customerName ?? 'Imported customer',
                items: [],
                actorId: identity.userId,
                ...input,
              })}
            />
            <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New invoice</Button>
          </div>
        </div>

        {invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Create your first invoice to start billing customers."
            action={<Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New invoice</Button>}
          />
        ) : view === 'table' ? (
          <div className="rounded-lg border border-[--color-border] bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[--color-muted]/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Number</th>
                  <th className="text-left px-4 py-2 font-medium">Customer</th>
                  <th className="text-left px-4 py-2 font-medium">Issue date</th>
                  <th className="text-left px-4 py-2 font-medium">Due date</th>
                  <th className="text-right px-4 py-2 font-medium">Total</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="w-10 px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => {
                  const linkedCompany = inv.customerCompanyId ? companyById.get(inv.customerCompanyId) : undefined
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => router.push(`/r/${roomId}/finance/invoices/${inv.id}`)}
                      className="border-t border-[--color-border] cursor-pointer hover:bg-[--color-muted]/30"
                    >
                      <td className="px-4 py-2 font-mono text-xs">{inv.number}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          {linkedCompany && <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                          <span className="truncate">{inv.customerName || linkedCompany?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-2 text-right font-medium">{fmtMoney(inv.totalCents, inv.currency)}</td>
                      <td className="px-4 py-2"><InvoiceStatusBadge status={inv.status} /></td>
                      <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditing(inv.id)}>
                              <Edit2 className="h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => { if (confirm(`Delete invoice ${inv.number}?`)) deleteInvoice(doc, inv.id) }}
                              className="text-[--color-destructive]"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No invoices match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full py-8 text-center text-muted-foreground">No invoices match this filter.</div>
            ) : filtered.map((inv) => {
              const linkedCompany = inv.customerCompanyId ? companyById.get(inv.customerCompanyId) : undefined
              return (
                <div
                  key={inv.id}
                  onClick={() => router.push(`/r/${roomId}/finance/invoices/${inv.id}`)}
                  className="rounded-lg border border-[--color-border] bg-card p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="font-mono text-xs text-muted-foreground">{inv.number}</div>
                      <div className="font-semibold truncate mt-0.5">
                        {inv.customerName || linkedCompany?.name || '—'}
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(inv.id)}>
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { if (confirm(`Delete invoice ${inv.number}?`)) deleteInvoice(doc, inv.id) }}
                            className="text-[--color-destructive]"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-3">{fmtMoney(inv.totalCents, inv.currency)}</div>
                  <div className="flex items-center justify-between">
                    <InvoiceStatusBadge status={inv.status} />
                    <span className="text-xs text-muted-foreground">
                      {inv.dueDate ? `Due ${new Date(inv.dueDate).toLocaleDateString()}` : inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <InvoiceDialog
        open={showNew}
        onOpenChange={setShowNew}
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
        mode="create"
        onSubmit={(input) => {
          createInvoice(doc, { ...input, actorId: identity.userId })
          setShowNew(false)
        }}
      />

      {editingInvoice && (
        <InvoiceDialog
          open={!!editing}
          onOpenChange={(b) => { if (!b) setEditing(null) }}
          companies={companies.map((c) => ({ id: c.id, name: c.name }))}
          initial={invoiceToFormState(editingInvoice)}
          mode="edit"
          onSubmit={(input) => {
            updateInvoice(doc, editingInvoice.id, {
              customerName: input.customerName,
              customerCompanyId: input.customerCompanyId ?? '',
              items: input.items,
              taxPercent: input.taxPercent,
              currency: input.currency,
              status: input.status,
              issueDate: input.issueDate,
              dueDate: input.dueDate ?? 0,
              notes: input.notes,
            })
            setEditing(null)
          }}
        />
      )}
    </>
  )
}
