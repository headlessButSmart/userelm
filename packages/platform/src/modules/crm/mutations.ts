import * as Y from 'yjs'
import { nanoid } from 'nanoid'
import {
  CRM_KEYS, type DealStage, type LeadStatus, type LeadSource,
  type CompanySize, type ActivityType,
} from './schema'

// ---------- Contacts ----------

export function createContact(doc: Y.Doc, input: {
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  mobile?: string
  jobTitle?: string
  companyId?: string
  status?: LeadStatus
  source?: LeadSource
  ownerId: string
  tags?: string[]
  linkedin?: string
  twitter?: string
  website?: string
  city?: string
  country?: string
  notes?: string
  actorId: string
}): string {
  const id = nanoid()
  doc.transact(() => {
    const now = Date.now()
    const m = new Y.Map()
    m.set('id', id)
    m.set('firstName', input.firstName)
    m.set('lastName', input.lastName ?? '')
    m.set('email', input.email ?? '')
    m.set('phone', input.phone ?? '')
    m.set('mobile', input.mobile ?? '')
    m.set('jobTitle', input.jobTitle ?? '')
    m.set('companyId', input.companyId ?? '')
    m.set('status', input.status ?? 'new')
    m.set('source', input.source ?? 'other')
    m.set('ownerId', input.ownerId)
    m.set('linkedin', input.linkedin ?? '')
    m.set('twitter', input.twitter ?? '')
    m.set('website', input.website ?? '')
    m.set('city', input.city ?? '')
    m.set('country', input.country ?? '')
    m.set('notes', input.notes ?? '')
    m.set('lastContactedAt', 0)
    m.set('createdAt', now)
    m.set('updatedAt', now)
    const tagsArr = new Y.Array<string>()
    if (input.tags?.length) tagsArr.push(input.tags)
    m.set('tags', tagsArr)
    doc.getMap(CRM_KEYS.contacts).set(id, m)
  }, 'user')
  return id
}

export function updateContact(doc: Y.Doc, id: string, patch: Partial<{
  firstName: string
  lastName: string
  email: string
  phone: string
  mobile: string
  jobTitle: string
  companyId: string
  status: LeadStatus
  source: LeadSource
  ownerId: string
  linkedin: string
  twitter: string
  website: string
  city: string
  country: string
  notes: string
  lastContactedAt: number
}>) {
  doc.transact(() => {
    const m = doc.getMap(CRM_KEYS.contacts).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) m.set(k, v)
    m.set('updatedAt', Date.now())
  }, 'user')
}

export function deleteContact(doc: Y.Doc, id: string) {
  doc.transact(() => doc.getMap(CRM_KEYS.contacts).delete(id), 'user')
}

export function setContactTags(doc: Y.Doc, id: string, tags: string[]) {
  doc.transact(() => {
    const m = doc.getMap(CRM_KEYS.contacts).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    const arr = new Y.Array<string>()
    arr.push(tags)
    m.set('tags', arr)
    m.set('updatedAt', Date.now())
  }, 'user')
}

// ---------- Companies ----------

export function createCompany(doc: Y.Doc, input: {
  name: string
  industry?: string
  size?: CompanySize
  website?: string
  phone?: string
  city?: string
  country?: string
  description?: string
  ownerId: string
  actorId: string
}): string {
  const id = nanoid()
  doc.transact(() => {
    const now = Date.now()
    const m = new Y.Map()
    m.set('id', id)
    m.set('name', input.name)
    m.set('industry', input.industry ?? '')
    m.set('size', input.size ?? 'small')
    m.set('website', input.website ?? '')
    m.set('phone', input.phone ?? '')
    m.set('city', input.city ?? '')
    m.set('country', input.country ?? '')
    m.set('description', input.description ?? '')
    m.set('ownerId', input.ownerId)
    m.set('createdAt', now)
    m.set('updatedAt', now)
    doc.getMap(CRM_KEYS.companies).set(id, m)
  }, 'user')
  return id
}

export function updateCompany(doc: Y.Doc, id: string, patch: Partial<{
  name: string
  industry: string
  size: CompanySize
  website: string
  phone: string
  city: string
  country: string
  description: string
  ownerId: string
}>) {
  doc.transact(() => {
    const m = doc.getMap(CRM_KEYS.companies).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) m.set(k, v)
    m.set('updatedAt', Date.now())
  }, 'user')
}

export function deleteCompany(doc: Y.Doc, id: string) {
  doc.transact(() => doc.getMap(CRM_KEYS.companies).delete(id), 'user')
}

// ---------- Deals ----------

export function createDeal(doc: Y.Doc, input: {
  title: string
  contactId?: string
  companyId?: string
  value: number
  currency?: string
  stage?: DealStage
  probability?: number
  source?: LeadSource
  ownerId: string
  expectedCloseDate?: number
  description?: string
  actorId: string
}): string {
  const id = nanoid()
  doc.transact(() => {
    const now = Date.now()
    const m = new Y.Map()
    m.set('id', id)
    m.set('title', input.title)
    m.set('contactId', input.contactId ?? '')
    m.set('companyId', input.companyId ?? '')
    m.set('value', input.value)
    m.set('currency', input.currency ?? 'USD')
    m.set('stage', input.stage ?? 'lead')
    m.set('probability', input.probability ?? defaultProbabilityForStage(input.stage ?? 'lead'))
    m.set('source', input.source ?? 'other')
    m.set('ownerId', input.ownerId)
    m.set('expectedCloseDate', input.expectedCloseDate ?? 0)
    m.set('actualCloseDate', 0)
    m.set('lostReason', '')
    m.set('description', input.description ?? '')
    m.set('createdAt', now)
    m.set('updatedAt', now)
    doc.getMap(CRM_KEYS.deals).set(id, m)
  }, 'user')
  return id
}

export function updateDeal(doc: Y.Doc, id: string, patch: Partial<{
  title: string
  contactId: string
  companyId: string
  value: number
  currency: string
  stage: DealStage
  probability: number
  source: LeadSource
  ownerId: string
  expectedCloseDate: number
  actualCloseDate: number
  lostReason: string
  description: string
}>) {
  doc.transact(() => {
    const m = doc.getMap(CRM_KEYS.deals).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) m.set(k, v)
    m.set('updatedAt', Date.now())
    if (patch.stage === 'won' || patch.stage === 'lost') {
      if (!m.get('actualCloseDate')) m.set('actualCloseDate', Date.now())
    }
  }, 'user')
}

export function updateDealStage(doc: Y.Doc, dealId: string, stage: DealStage) {
  updateDeal(doc, dealId, { stage, probability: defaultProbabilityForStage(stage) })
}

export function deleteDeal(doc: Y.Doc, id: string) {
  doc.transact(() => doc.getMap(CRM_KEYS.deals).delete(id), 'user')
}

function defaultProbabilityForStage(stage: DealStage): number {
  switch (stage) {
    case 'lead': return 10
    case 'qualified': return 25
    case 'proposal': return 50
    case 'negotiation': return 75
    case 'won': return 100
    case 'lost': return 0
  }
}

// ---------- Activities ----------

export function logActivity(doc: Y.Doc, input: {
  type: ActivityType
  subject: string
  description?: string
  contactId?: string
  dealId?: string
  companyId?: string
  date?: number
  durationMinutes?: number
  actorId: string
}): string {
  const id = nanoid()
  doc.transact(() => {
    const now = Date.now()
    const m = new Y.Map()
    m.set('id', id)
    m.set('type', input.type)
    m.set('subject', input.subject)
    m.set('description', input.description ?? '')
    m.set('contactId', input.contactId ?? '')
    m.set('dealId', input.dealId ?? '')
    m.set('companyId', input.companyId ?? '')
    m.set('date', input.date ?? now)
    m.set('durationMinutes', input.durationMinutes ?? 0)
    m.set('actorId', input.actorId)
    m.set('createdAt', now)
    doc.getMap(CRM_KEYS.activities).set(id, m)

    if (input.contactId) {
      const c = doc.getMap(CRM_KEYS.contacts).get(input.contactId) as Y.Map<unknown> | undefined
      if (c) c.set('lastContactedAt', input.date ?? now)
    }
  }, 'user')
  return id
}

export function deleteActivity(doc: Y.Doc, id: string) {
  doc.transact(() => doc.getMap(CRM_KEYS.activities).delete(id), 'user')
}
