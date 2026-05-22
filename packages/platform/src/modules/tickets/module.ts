import * as Y from 'yjs'
import type { ModuleDefinition } from '../../core/module'
import { TICKET_KEYS } from './schema'

export const ticketsModule: ModuleDefinition = {
  id: 'tickets',
  title: 'Support',
  description: 'Customer support ticketing — track, assign, and resolve issues.',
  iconName: 'LifeBuoy',
  accent: 'oklch(65% 0.15 185)',
  rootKeys: [TICKET_KEYS.tickets, TICKET_KEYS.comments],
  initRoots(doc: Y.Doc) {
    doc.getMap(TICKET_KEYS.tickets)
    doc.getMap(TICKET_KEYS.comments)
  },
  nav: [
    { href: '/tickets', label: 'Tickets', iconName: 'LifeBuoy' },
  ],
}
