'use client'
import { useEffect, useState } from 'react'
import * as Y from 'yjs'

// Maps ModuleNavEntry.href → Yjs root map key
// TICKET_KEYS.tickets = 'supportTickets' (not 'tickets')
const NAV_MAP_KEYS: Record<string, string> = {
  '/crm/contacts':   'contacts',
  '/crm/companies':  'companies',
  '/crm/deals':      'deals',
  '/crm/activities': 'activities',
  '/finance/invoices': 'invoices',
  '/finance/expenses': 'expenses',
  '/hr/team':   'employees',
  '/hr/leave':  'leaveRequests',
  '/tickets':   'supportTickets',
}

function readCounts(doc: Y.Doc): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [href, key] of Object.entries(NAV_MAP_KEYS)) {
    out[href] = doc.getMap(key).size
  }
  return out
}

export function useNavCounts(doc: Y.Doc): Record<string, number> {
  const [counts, setCounts] = useState(() => readCounts(doc))

  useEffect(() => {
    const handler = () => setCounts(readCounts(doc))
    doc.on('update', handler)
    handler()
    return () => { doc.off('update', handler) }
  }, [doc])

  return counts
}
