import * as Y from 'yjs'
import type { ModuleDefinition } from '../../core/module'
import { CRM_KEYS } from './schema'

export const crmModule: ModuleDefinition = {
  id: 'crm',
  title: 'CRM',
  description: 'Contacts, companies, sales pipeline, and activity tracking.',
  iconName: 'Users',
  accent: 'oklch(60% 0.18 250)',
  rootKeys: [CRM_KEYS.contacts, CRM_KEYS.companies, CRM_KEYS.deals, CRM_KEYS.activities, CRM_KEYS.notes],
  initRoots(doc: Y.Doc) {
    doc.getMap(CRM_KEYS.contacts)
    doc.getMap(CRM_KEYS.companies)
    doc.getMap(CRM_KEYS.deals)
    doc.getMap(CRM_KEYS.activities)
    doc.getMap(CRM_KEYS.notes)
  },
  nav: [
    { href: '/crm/contacts',   label: 'Contacts',   iconName: 'Users' },
    { href: '/crm/companies',  label: 'Companies',  iconName: 'Building2' },
    { href: '/crm/deals',      label: 'Deals',      iconName: 'Briefcase' },
    { href: '/crm/activities', label: 'Activities', iconName: 'Activity' },
  ],
}
