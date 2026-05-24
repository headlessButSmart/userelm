'use client'
import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Linkedin, Twitter, Globe, MapPin, Building2, Trash2, Edit2, Save, X } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getContact, getCompany, getDealsByContact, getActivitiesByContact,
  contactDisplayName, updateContact, deleteContact,
  LEAD_STATUSES, LEAD_SOURCES,
  type LeadStatus, type LeadSource,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { StatusBadge } from '@/components/crm/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RecordJsonMenu } from '@/components/io/RecordJsonMenu'

export default function ContactDetailPage({ params }: { params: Promise<{ roomId: string; contactId: string }> }) {
  const { roomId, contactId } = use(params)
  const { doc, identity } = useRoom()
  useYMapDeep(doc.getMap('contacts'))
  useYMapDeep(doc.getMap('companies'))
  useYMapDeep(doc.getMap('deals'))
  useYMapDeep(doc.getMap('activities'))

  const contact = getContact(doc, contactId)
  const company = useMemo(() => contact?.companyId ? getCompany(doc, contact.companyId) : null, [doc, contact])
  const deals = getDealsByContact(doc, contactId)
  const activities = getActivitiesByContact(doc, contactId)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Partial<{
    firstName: string; lastName: string; email: string; phone: string; mobile: string;
    jobTitle: string; status: LeadStatus; source: LeadSource;
    linkedin: string; twitter: string; website: string; city: string; country: string; notes: string;
  }>>({})

  if (!contact) {
    return (
      <>
        <TopBar title="Contact" />
        <div className="flex-1 p-6"><p className="text-muted-foreground">Contact not found.</p></div>
      </>
    )
  }

  const name = contactDisplayName(contact)

  function startEdit() {
    setDraft({
      firstName: contact!.firstName, lastName: contact!.lastName,
      email: contact!.email, phone: contact!.phone, mobile: contact!.mobile,
      jobTitle: contact!.jobTitle, status: contact!.status, source: contact!.source,
      linkedin: contact!.linkedin, twitter: contact!.twitter, website: contact!.website,
      city: contact!.city, country: contact!.country, notes: contact!.notes,
    })
    setEditing(true)
  }
  function saveEdit() {
    updateContact(doc, contactId, draft)
    setEditing(false)
  }
  function del() {
    if (confirm(`Delete ${name}? This cannot be undone.`)) {
      deleteContact(doc, contactId)
      window.location.href = `/r/${roomId}/crm/contacts`
    }
  }

  return (
    <>
      <TopBar title={name} />
      <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-auto">
        <Link href={`/r/${roomId}/crm/contacts`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to contacts
        </Link>

        <div className="flex flex-col sm:flex-row items-start gap-4">
          <Avatar name={name} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{name}</h1>
            <div className="text-muted-foreground">
              {contact.jobTitle}{contact.jobTitle && company ? ' at ' : ''}
              {company && (
                <Link href={`/r/${roomId}/crm/companies/${company.id}`} className="text-[--color-primary] hover:underline inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> {company.name}
                </Link>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={contact.status} />
              <Badge variant="outline" className="capitalize">{contact.source.replace('-', ' ')}</Badge>
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
                  record={contact}
                  filenameBase={`contact-${name}`}
                  onImport={(patch) => updateContact(doc, contactId, patch)}
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
                  <div><Label>First name</Label><Input value={draft.firstName ?? ''} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} /></div>
                  <div><Label>Last name</Label><Input value={draft.lastName ?? ''} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} /></div>
                  <div><Label>Email</Label><Input value={draft.email ?? ''} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={draft.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
                  <div><Label>Mobile</Label><Input value={draft.mobile ?? ''} onChange={(e) => setDraft({ ...draft, mobile: e.target.value })} /></div>
                  <div><Label>Job title</Label><Input value={draft.jobTitle ?? ''} onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })} /></div>
                  <div>
                    <Label>Status</Label>
                    <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as LeadStatus })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LEAD_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Source</Label>
                    <Select value={draft.source} onValueChange={(v) => setDraft({ ...draft, source: v as LeadSource })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LEAD_SOURCES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace('-', ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>LinkedIn</Label><Input value={draft.linkedin ?? ''} onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })} /></div>
                  <div><Label>Twitter</Label><Input value={draft.twitter ?? ''} onChange={(e) => setDraft({ ...draft, twitter: e.target.value })} /></div>
                  <div><Label>Website</Label><Input value={draft.website ?? ''} onChange={(e) => setDraft({ ...draft, website: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>City</Label><Input value={draft.city ?? ''} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></div>
                    <div><Label>Country</Label><Input value={draft.country ?? ''} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></div>
                  </div>
                  <div className="col-span-2"><Label>Notes</Label><Textarea value={draft.notes ?? ''} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <Row icon={Mail}     label="Email"    value={contact.email} link={contact.email ? `mailto:${contact.email}` : undefined} />
                  <Row icon={Phone}    label="Phone"    value={contact.phone} link={contact.phone ? `tel:${contact.phone}` : undefined} />
                  <Row icon={Phone}    label="Mobile"   value={contact.mobile} link={contact.mobile ? `tel:${contact.mobile}` : undefined} />
                  <Row icon={Linkedin} label="LinkedIn" value={contact.linkedin} link={contact.linkedin} />
                  <Row icon={Twitter}  label="Twitter"  value={contact.twitter} link={contact.twitter} />
                  <Row icon={Globe}    label="Website"  value={contact.website} link={contact.website} />
                  <Row icon={MapPin}   label="Location" value={[contact.city, contact.country].filter(Boolean).join(', ')} />
                  {contact.notes && (
                    <div className="pt-3">
                      <div className="text-xs text-muted-foreground mb-1">Notes</div>
                      <div className="whitespace-pre-wrap text-sm">{contact.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
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

            <Card>
              <CardHeader><CardTitle>Activity · {activities.length}</CardTitle></CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity logged.</p>
                ) : (
                  <ul className="space-y-2">
                    {activities.slice(0, 5).map((a) => (
                      <li key={a.id} className="text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize shrink-0">{a.type}</Badge>
                          <span className="truncate">{a.subject}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{new Date(a.date).toLocaleDateString()}</div>
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

function Row({ icon: Icon, label, value, link }: { icon: any; label: string; value: string; link?: string }) {
  if (!value) return null
  const content = link ? (
    <a href={link} target={link.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="text-[--color-primary] hover:underline">
      {value}
    </a>
  ) : value
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div>{content}</div>
      </div>
    </div>
  )
}
