'use client'
import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, Edit2, CheckCircle2, Building2 } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getInvoice, getCompanies,
  updateInvoice, deleteInvoice,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  InvoiceDialog,
  InvoiceStatusBadge,
  fmtMoney,
  invoiceToFormState,
} from '../invoice-dialog'
import { RecordJsonMenu } from '@/components/io/RecordJsonMenu'

export default function InvoiceDetailPage({ params }: { params: Promise<{ roomId: string; invoiceId: string }> }) {
  const { roomId, invoiceId } = use(params)
  const { doc } = useRoom()
  useYMapDeep(doc.getMap('invoices'))
  useYMapDeep(doc.getMap('companies'))

  const invoice = getInvoice(doc, invoiceId)
  const companies = getCompanies(doc)
  const company = useMemo(
    () => (invoice?.customerCompanyId ? companies.find((c) => c.id === invoice.customerCompanyId) : undefined),
    [invoice, companies],
  )

  const [editing, setEditing] = useState(false)

  if (!invoice) {
    return (
      <>
        <TopBar title="Invoice" />
        <div className="flex-1 p-6">
          <Link href={`/r/${roomId}/finance/invoices`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to invoices
          </Link>
          <p className="mt-4 text-muted-foreground">Invoice not found.</p>
        </div>
      </>
    )
  }

  function markPaid() {
    updateInvoice(doc, invoiceId, { status: 'paid' })
  }
  function del() {
    if (confirm(`Delete invoice ${invoice!.number}?`)) {
      deleteInvoice(doc, invoiceId)
      window.location.href = `/r/${roomId}/finance/invoices`
    }
  }

  return (
    <>
      <TopBar title={invoice.number} />
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <Link href={`/r/${roomId}/finance/invoices`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to invoices
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{invoice.number}</h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              {company && <Building2 className="h-4 w-4" />}
              <span>{invoice.customerName || company?.name || 'No customer'}</span>
              {company && (
                <Link href={`/r/${roomId}/crm/companies/${company.id}`} className="text-xs text-[--color-primary] hover:underline">
                  (view company)
                </Link>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {invoice.status !== 'paid' && (
              <Button size="sm" variant="outline" onClick={markPaid}>
                <CheckCircle2 className="h-4 w-4" /> Mark as paid
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4" /> Edit
            </Button>
            <RecordJsonMenu
              record={invoice}
              filenameBase={`invoice-${invoice.number}`}
              onImport={(patch) => updateInvoice(doc, invoiceId, patch)}
            />
            <Button size="sm" variant="outline" onClick={del} className="text-[--color-destructive]">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader><CardTitle>Line items</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left py-2 font-medium">Description</th>
                    <th className="text-right py-2 font-medium w-20">Qty</th>
                    <th className="text-right py-2 font-medium w-28">Unit price</th>
                    <th className="text-right py-2 font-medium w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.length === 0 ? (
                    <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No line items.</td></tr>
                  ) : invoice.items.map((it, idx) => (
                    <tr key={idx} className="border-t border-[--color-border]">
                      <td className="py-2">{it.description || <span className="text-muted-foreground">—</span>}</td>
                      <td className="py-2 text-right">{it.quantity}</td>
                      <td className="py-2 text-right">{fmtMoney(it.unitPriceCents, invoice.currency)}</td>
                      <td className="py-2 text-right">
                        {fmtMoney(Math.round(it.quantity * it.unitPriceCents), invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 ml-auto max-w-xs text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{fmtMoney(invoice.subtotalCents, invoice.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({invoice.taxPercent}%)</span>
                  <span>{fmtMoney(invoice.taxCents, invoice.currency)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-1 border-t border-[--color-border]">
                  <span>Total</span>
                  <span>{fmtMoney(invoice.totalCents, invoice.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Issue date</div>
                  <div>{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Due date</div>
                  <div>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</div>
                </div>
                {invoice.paidAt > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground">Paid at</div>
                    <div>{new Date(invoice.paidAt).toLocaleDateString()}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground">Currency</div>
                  <div>{invoice.currency}</div>
                </div>
              </CardContent>
            </Card>

            {invoice.notes && (
              <Card>
                <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <InvoiceDialog
        open={editing}
        onOpenChange={setEditing}
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
        initial={invoiceToFormState(invoice)}
        mode="edit"
        onSubmit={(input) => {
          updateInvoice(doc, invoiceId, {
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
          setEditing(false)
        }}
      />
    </>
  )
}
