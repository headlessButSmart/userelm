import * as Y from 'yjs'
import {
  CRM_KEYS,
  type ContactRow, type CompanyRow, type DealRow, type ActivityRow,
} from './schema'

function readMap<T>(m: Y.Map<unknown>, mapper: (v: Y.Map<unknown>) => T): T[] {
  const rows: T[] = []
  m.forEach((v) => { if (v instanceof Y.Map) rows.push(mapper(v)) })
  return rows
}

function readContact(m: Y.Map<unknown>): ContactRow {
  const tags = m.get('tags')
  return {
    id: (m.get('id') as string) ?? '',
    firstName: (m.get('firstName') as string) ?? '',
    lastName: (m.get('lastName') as string) ?? '',
    email: (m.get('email') as string) ?? '',
    phone: (m.get('phone') as string) ?? '',
    mobile: (m.get('mobile') as string) ?? '',
    jobTitle: (m.get('jobTitle') as string) ?? '',
    companyId: (m.get('companyId') as string) ?? '',
    status: ((m.get('status') as ContactRow['status']) ?? 'new'),
    source: ((m.get('source') as ContactRow['source']) ?? 'other'),
    ownerId: (m.get('ownerId') as string) ?? '',
    tags: tags instanceof Y.Array ? tags.toArray() : [],
    linkedin: (m.get('linkedin') as string) ?? '',
    twitter: (m.get('twitter') as string) ?? '',
    website: (m.get('website') as string) ?? '',
    city: (m.get('city') as string) ?? '',
    country: (m.get('country') as string) ?? '',
    notes: (m.get('notes') as string) ?? '',
    lastContactedAt: (m.get('lastContactedAt') as number) ?? 0,
    createdAt: (m.get('createdAt') as number) ?? 0,
    updatedAt: (m.get('updatedAt') as number) ?? 0,
  }
}

function readCompany(m: Y.Map<unknown>): CompanyRow {
  return {
    id: (m.get('id') as string) ?? '',
    name: (m.get('name') as string) ?? '',
    industry: (m.get('industry') as string) ?? '',
    size: ((m.get('size') as CompanyRow['size']) ?? 'small'),
    website: (m.get('website') as string) ?? '',
    phone: (m.get('phone') as string) ?? '',
    city: (m.get('city') as string) ?? '',
    country: (m.get('country') as string) ?? '',
    description: (m.get('description') as string) ?? '',
    ownerId: (m.get('ownerId') as string) ?? '',
    createdAt: (m.get('createdAt') as number) ?? 0,
    updatedAt: (m.get('updatedAt') as number) ?? 0,
  }
}

function readDeal(m: Y.Map<unknown>): DealRow {
  return {
    id: (m.get('id') as string) ?? '',
    title: (m.get('title') as string) ?? '',
    contactId: (m.get('contactId') as string) ?? '',
    companyId: (m.get('companyId') as string) ?? '',
    value: (m.get('value') as number) ?? 0,
    currency: (m.get('currency') as string) ?? 'USD',
    stage: ((m.get('stage') as DealRow['stage']) ?? 'lead'),
    probability: (m.get('probability') as number) ?? 0,
    source: ((m.get('source') as DealRow['source']) ?? 'other'),
    ownerId: (m.get('ownerId') as string) ?? '',
    expectedCloseDate: (m.get('expectedCloseDate') as number) ?? 0,
    actualCloseDate: (m.get('actualCloseDate') as number) ?? 0,
    lostReason: (m.get('lostReason') as string) ?? '',
    description: (m.get('description') as string) ?? '',
    createdAt: (m.get('createdAt') as number) ?? 0,
    updatedAt: (m.get('updatedAt') as number) ?? 0,
  }
}

function readActivity(m: Y.Map<unknown>): ActivityRow {
  return {
    id: (m.get('id') as string) ?? '',
    type: ((m.get('type') as ActivityRow['type']) ?? 'note'),
    subject: (m.get('subject') as string) ?? '',
    description: (m.get('description') as string) ?? '',
    contactId: (m.get('contactId') as string) ?? '',
    dealId: (m.get('dealId') as string) ?? '',
    companyId: (m.get('companyId') as string) ?? '',
    date: (m.get('date') as number) ?? 0,
    durationMinutes: (m.get('durationMinutes') as number) ?? 0,
    actorId: (m.get('actorId') as string) ?? '',
    createdAt: (m.get('createdAt') as number) ?? 0,
  }
}

export function getContacts(doc: Y.Doc): ContactRow[] {
  return readMap(doc.getMap(CRM_KEYS.contacts), readContact).sort((a, b) => b.updatedAt - a.updatedAt)
}
export function getContact(doc: Y.Doc, id: string): ContactRow | null {
  const m = doc.getMap(CRM_KEYS.contacts).get(id) as Y.Map<unknown> | undefined
  return m ? readContact(m) : null
}
export function getContactsByCompany(doc: Y.Doc, companyId: string): ContactRow[] {
  return getContacts(doc).filter((c) => c.companyId === companyId)
}

export function getCompanies(doc: Y.Doc): CompanyRow[] {
  return readMap(doc.getMap(CRM_KEYS.companies), readCompany).sort((a, b) => a.name.localeCompare(b.name))
}
export function getCompany(doc: Y.Doc, id: string): CompanyRow | null {
  const m = doc.getMap(CRM_KEYS.companies).get(id) as Y.Map<unknown> | undefined
  return m ? readCompany(m) : null
}

export function getDeals(doc: Y.Doc): DealRow[] {
  return readMap(doc.getMap(CRM_KEYS.deals), readDeal).sort((a, b) => b.updatedAt - a.updatedAt)
}
export function getDeal(doc: Y.Doc, id: string): DealRow | null {
  const m = doc.getMap(CRM_KEYS.deals).get(id) as Y.Map<unknown> | undefined
  return m ? readDeal(m) : null
}
export function getDealsByContact(doc: Y.Doc, contactId: string): DealRow[] {
  return getDeals(doc).filter((d) => d.contactId === contactId)
}
export function getDealsByCompany(doc: Y.Doc, companyId: string): DealRow[] {
  return getDeals(doc).filter((d) => d.companyId === companyId)
}

export function getActivities(doc: Y.Doc): ActivityRow[] {
  return readMap(doc.getMap(CRM_KEYS.activities), readActivity).sort((a, b) => b.date - a.date)
}
export function getActivitiesByContact(doc: Y.Doc, contactId: string): ActivityRow[] {
  return getActivities(doc).filter((a) => a.contactId === contactId)
}
export function getActivitiesByDeal(doc: Y.Doc, dealId: string): ActivityRow[] {
  return getActivities(doc).filter((a) => a.dealId === dealId)
}
export function getActivitiesByCompany(doc: Y.Doc, companyId: string): ActivityRow[] {
  return getActivities(doc).filter((a) => a.companyId === companyId)
}

export function contactDisplayName(c: ContactRow): string {
  const name = `${c.firstName} ${c.lastName}`.trim()
  return name || c.email || 'Unnamed'
}
