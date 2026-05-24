'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, Search, Building2, Globe, MoreHorizontal, Trash2 } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getCompanies, getContactsByCompany,
  createCompany, deleteCompany,
  COMPANY_SIZES, type CompanySize, type CompanyRow,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { ExportImportMenu } from '@/components/io/ExportImportMenu'
import { col } from '@/lib/io/column-schema'
import { useViewMode } from '@/hooks/useViewMode'
import { ViewToggle } from '@/components/ui/ViewToggle'

type CompanyInput = Parameters<typeof createCompany>[1]

const COMPANY_COLUMNS = [
  col<CompanyRow, CompanyInput>('name'),
  col<CompanyRow, CompanyInput>('industry'),
  col<CompanyRow, CompanyInput>('size'),
  col<CompanyRow, CompanyInput>('website'),
  col<CompanyRow, CompanyInput>('phone'),
  col<CompanyRow, CompanyInput>('city'),
  col<CompanyRow, CompanyInput>('country'),
  col<CompanyRow, CompanyInput>('description'),
]
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function CompaniesPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { doc, identity } = useRoom()
  useYMapDeep(doc.getMap('companies'))
  useYMapDeep(doc.getMap('contacts'))

  const companies = getCompanies(doc)
  const [view, setView] = useViewMode('companies', 'grid')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)

  const filtered = useMemo(() => {
    if (!search) return companies
    const q = search.toLowerCase()
    return companies.filter((c) =>
      c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) || c.city.toLowerCase().includes(q),
    )
  }, [companies, search])

  return (
    <>
      <TopBar title="Companies" />
      <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies…" className="pl-8" />
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle value={view} onChange={setView} />
            <ExportImportMenu
              rows={filtered}
              schema={COMPANY_COLUMNS}
              entityName="companies"
              onImportRow={(input) => createCompany(doc, {
                name: input.name ?? 'Imported',
                ownerId: identity.userId,
                actorId: identity.userId,
                ...input,
              })}
            />
            <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /><span className="hidden sm:inline"> Add company</span></Button>
          </div>
        </div>

        {companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No companies yet"
            description="Add companies to group contacts and track deals at the account level."
            action={<Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> Add company</Button>}
          />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => {
              const contactCount = getContactsByCompany(doc, c.id).length
              return (
                <div key={c.id} className="rounded-lg border border-[--color-border] bg-card p-5 hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between mb-3">
                    <Link href={`/r/${roomId}/crm/companies/${c.id}`} className="flex items-center gap-3 group min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-md bg-[--color-primary-soft] flex items-center justify-center text-[--color-primary] font-bold shrink-0">
                        {c.name[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold group-hover:text-[--color-primary] truncate">{c.name}</div>
                        {c.industry && <div className="text-xs text-muted-foreground truncate">{c.industry}</div>}
                      </div>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { if (confirm(`Delete ${c.name}?`)) deleteCompany(doc, c.id) }} className="text-[--color-destructive]">
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <Badge variant="secondary" className="capitalize">{c.size}</Badge>
                    <span className="text-muted-foreground">{contactCount} contact{contactCount !== 1 ? 's' : ''}</span>
                  </div>
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-[--color-primary] hover:underline truncate">
                      <Globe className="h-3 w-3" /> {c.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-[--color-border] overflow-hidden overflow-x-auto bg-card">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-[--color-muted]/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium">Industry</th>
                  <th className="px-4 py-2.5 text-left font-medium">Size</th>
                  <th className="px-4 py-2.5 text-left font-medium">Contacts</th>
                  <th className="px-4 py-2.5 text-left font-medium">Website</th>
                  <th className="px-4 py-2.5 text-left font-medium">City</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const contactCount = getContactsByCompany(doc, c.id).length
                  return (
                    <tr key={c.id} className="border-t border-[--color-border] hover:bg-[--color-muted]/30">
                      <td className="px-4 py-2.5">
                        <Link href={`/r/${roomId}/crm/companies/${c.id}`} className="flex items-center gap-2.5 group">
                          <div className="h-7 w-7 rounded-md bg-[--color-primary-soft] flex items-center justify-center text-[--color-primary] font-bold text-xs shrink-0">
                            {c.name[0]?.toUpperCase() ?? '?'}
                          </div>
                          <span className="font-medium group-hover:text-[--color-primary] group-hover:underline">{c.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.industry || '—'}</td>
                      <td className="px-4 py-2.5"><Badge variant="secondary" className="capitalize">{c.size}</Badge></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{contactCount}</td>
                      <td className="px-4 py-2.5">
                        {c.website ? (
                          <a href={c.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[--color-primary] hover:underline truncate max-w-[160px]">
                            <Globe className="h-3 w-3 shrink-0" /> {c.website.replace(/^https?:\/\//, '')}
                          </a>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{c.city || '—'}</td>
                      <td className="px-2 py-2.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { if (confirm(`Delete ${c.name}?`)) deleteCompany(doc, c.id) }} className="text-[--color-destructive]">
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
        )}
      </div>

      <NewCompanyDialog
        open={showNew}
        onOpenChange={setShowNew}
        onSave={(input) => {
          createCompany(doc, { ...input, ownerId: identity.userId, actorId: identity.userId })
          setShowNew(false)
        }}
      />
    </>
  )
}

function NewCompanyDialog({
  open, onOpenChange, onSave,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  onSave: (input: { name: string; industry?: string; size?: CompanySize; website?: string; city?: string; country?: string }) => void
}) {
  const [form, setForm] = useState({ name: '', industry: '', size: 'small' as CompanySize, website: '', city: '', country: '' })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New company</DialogTitle></DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave({
              name: form.name,
              industry: form.industry || undefined,
              size: form.size,
              website: form.website || undefined,
              city: form.city || undefined,
              country: form.country || undefined,
            })
            setForm({ name: '', industry: '', size: 'small', website: '', city: '', country: '' })
          }}
          className="space-y-3"
        >
          <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Industry</Label><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
            <div>
              <Label>Size</Label>
              <Select value={form.size} onValueChange={(v) => setForm({ ...form, size: v as CompanySize })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COMPANY_SIZES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Website</Label><Input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://…" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add company</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
