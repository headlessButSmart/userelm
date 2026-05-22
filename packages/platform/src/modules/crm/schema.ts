export const CRM_KEYS = {
  contacts: 'contacts',
  companies: 'companies',
  deals: 'deals',
  activities: 'activities',
  notes: 'notes',
} as const

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'customer' | 'lost'
export type LeadSource = 'website' | 'referral' | 'cold-outreach' | 'event' | 'inbound' | 'other'
export type CompanySize = 'small' | 'medium' | 'large' | 'enterprise'
export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type ActivityType = 'call' | 'email' | 'meeting' | 'note'

export interface ContactRow {
  id: string
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
  tags: string[]
  linkedin: string
  twitter: string
  website: string
  city: string
  country: string
  notes: string
  lastContactedAt: number
  createdAt: number
  updatedAt: number
}

export interface CompanyRow {
  id: string
  name: string
  industry: string
  size: CompanySize
  website: string
  phone: string
  city: string
  country: string
  description: string
  ownerId: string
  createdAt: number
  updatedAt: number
}

export interface DealRow {
  id: string
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
  createdAt: number
  updatedAt: number
}

export interface ActivityRow {
  id: string
  type: ActivityType
  subject: string
  description: string
  contactId: string
  dealId: string
  companyId: string
  date: number
  durationMinutes: number
  actorId: string
  createdAt: number
}

export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'customer', 'lost']
export const LEAD_SOURCES: LeadSource[] = ['website', 'referral', 'cold-outreach', 'event', 'inbound', 'other']
export const COMPANY_SIZES: CompanySize[] = ['small', 'medium', 'large', 'enterprise']
export const DEAL_STAGES: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
export const ACTIVITY_TYPES: ActivityType[] = ['call', 'email', 'meeting', 'note']
