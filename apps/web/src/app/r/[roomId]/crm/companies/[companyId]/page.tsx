'use client'
import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Globe, Phone, MapPin, Building2, Trash2, Edit2, Save, X } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getCompany, getContactsByCompany, getDealsByCompany, getActivitiesByCompany,
  contactDisplayName, updateCompany, deleteCompany,
  COMPANY_SIZES, type CompanySize,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RecordJsonMenu } from '@/components/io/RecordJsonMenu'

export default function CompanyDetailPage({ params }: { params: Promise<{ roomId: string; companyId: string }> }) {
  const { roomId, companyId } = use(params)
  const { doc } = useRoom()
  useYMapDeep(doc.getMap('companies'))
  useYMapDeep(doc.getMap('contacts'))
  useYMapDeep(doc.getMap('deals'))
  useYMapDeep(doc.getMap('activities'))

  const company = getCompany(doc, companyId)
  const contacts = getContactsByCompany(doc, companyId)
  const deals = getDealsByCompany(doc, companyId)
  const activities = getActivitiesByCompany(doc, companyId)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Partial<{
    name: string; industry: string; size: CompanySize; website: string; phone: string;
    city: string; country: string; description: string;
  }>>({})

  if (!company) {
    return (
      <>
        <TopBar title="Company" />
        <div className="flex-1 p-6"><p className="text-muted-foreground">Company not found.</p></div>
      </>
    )
  }

  function startEdit() {
    setDraft({
      name: company!.name, industry: company!.industry, size: company!.size,
      website: company!.website, phone: company!.phone, city: company!.city,
      country: company!.country, description: company!.description,
    })
    setEditing(true)
  }
  function saveEdit() { updateCompany(doc, companyId, draft); setEditing(false) }
  function del() {
    if (confirm(`Delete ${company!.name}?`)) {
      deleteCompany(doc, companyId)
      window.location.href = `/r/${roomId}/crm/companies`
    }
  }

  return (
    <>
      <TopBar title={company.name} />
      <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-auto">
        <Link href={`/r/${roomId}/crm/companies`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to companies
        </Link>

        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-lg bg-[--color-primary-soft] flex items-center justify-center text-[--color-primary] font-bold text-2xl">
            {company.name[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <div className="text-muted-foreground">{company.industry}</div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{company.size}</Badge>
              <Badge variant="outline">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</Badge>
              <Badge variant="outline">{deals.length} deal{deals.length !== 1 ? 's' : ''}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={saveEdit}><Save className="h-4 w-4" /> Save</Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4" /> Cancel</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={startEdit}><Edit2 className="h-4 w-4" /> Edit</Button>
                <RecordJsonMenu
                  record={company}
                  filenameBase={`company-${company.name}`}
                  onImport={(patch) => updateCompany(doc, companyId, patch)}
                />
                <Button size="sm" variant="outline" onClick={del} className="text-[--color-destructive]"><Trash2 className="h-4 w-4" /></Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent>
              {editing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Label>Name</Label><Input value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
                  <div><Label>Industry</Label><Input value={draft.industry ?? ''} onChange={(e) => setDraft({ ...draft, industry: e.target.value })} /></div>
                  <div>
                    <Label>Size</Label>
                    <Select value={draft.size} onValueChange={(v) => setDraft({ ...draft, size: v as CompanySize })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{COMPANY_SIZES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Website</Label><Input value={draft.website ?? ''} onChange={(e) => setDraft({ ...draft, website: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
                  <div><Label>City</Label><Input value={draft.city ?? ''} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></div>
                  <div><Label>Country</Label><Input value={draft.country ?? ''} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Description</Label><Textarea value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  {company.website && <Row icon={Globe} value={company.website} link={company.website} />}
                  {company.phone && <Row icon={Phone} value={company.phone} link={`tel:${company.phone}`} />}
                  {(company.city || company.country) && <Row icon={MapPin} value={[company.city, company.country].filter(Boolean).join(', ')} />}
                  {company.description && (
                    <div className="pt-3">
                      <div className="text-xs text-muted-foreground mb-1">About</div>
                      <p className="text-sm whitespace-pre-wrap">{company.description}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Contacts · {contacts.length}</CardTitle></CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No contacts.</p>
                ) : (
                  <ul className="space-y-2">
                    {contacts.map((c) => (
                      <li key={c.id}>
                        <Link href={`/r/${roomId}/crm/contacts/${c.id}`} className="flex items-center gap-2 p-2 rounded hover:bg-[--color-muted]/50 text-sm">
                          <Avatar name={contactDisplayName(c)} size="xs" />
                          <div className="min-w-0">
                            <div className="truncate">{contactDisplayName(c)}</div>
                            <div className="text-xs text-muted-foreground truncate">{c.jobTitle}</div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Deals · {deals.length}</CardTitle></CardHeader>
              <CardContent>
                {deals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No deals.</p>
                ) : (
                  <ul className="space-y-2">
                    {deals.map((d) => (
                      <li key={d.id} className="text-sm flex items-center justify-between gap-2 p-2 rounded hover:bg-[--color-muted]/50">
                        <span className="truncate">{d.title}</span>
                        <Badge variant="outline" className="capitalize shrink-0">{d.stage}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

function Row({ icon: Icon, value, link }: { icon: any; value: string; link?: string }) {
  const content = link ? (
    <a href={link} target={link.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="text-[--color-primary] hover:underline">{value}</a>
  ) : value
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>{content}</div>
    </div>
  )
}
