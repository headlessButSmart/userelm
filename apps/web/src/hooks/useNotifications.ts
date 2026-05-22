'use client'
import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { nanoid } from 'nanoid'
import { getRoomMembers } from '@/lib/roomMembers'

export interface AppNotification {
  id: string
  timestamp: number
  actorName: string
  action: 'created' | 'deleted'
  entityType: string
  entityName: string
  href: string
}

// Describes how to extract display info from each watched Yjs map
interface MapSpec {
  key: string
  entityType: string
  entityLabel: string
  getName: (m: Y.Map<unknown>) => string
  getActorId: (m: Y.Map<unknown>) => string
  hrefSegment: string // relative to /r/[roomId]
}

const MAP_SPECS: MapSpec[] = [
  {
    key: 'contacts',
    entityType: 'contact',
    entityLabel: 'Contact',
    getName: (m) =>
      `${m.get('firstName') ?? ''} ${m.get('lastName') ?? ''}`.trim() ||
      (m.get('email') as string) ||
      'Unknown contact',
    getActorId: (m) => (m.get('ownerId') as string) ?? '',
    hrefSegment: '/crm/contacts',
  },
  {
    key: 'companies',
    entityType: 'company',
    entityLabel: 'Company',
    getName: (m) => (m.get('name') as string) || 'Unknown company',
    getActorId: (m) => (m.get('ownerId') as string) ?? '',
    hrefSegment: '/crm/companies',
  },
  {
    key: 'deals',
    entityType: 'deal',
    entityLabel: 'Deal',
    getName: (m) => (m.get('title') as string) || 'Untitled deal',
    getActorId: (m) => (m.get('ownerId') as string) ?? '',
    hrefSegment: '/crm/deals',
  },
  {
    key: 'supportTickets',
    entityType: 'ticket',
    entityLabel: 'Ticket',
    getName: (m) => (m.get('title') as string) || 'Untitled ticket',
    getActorId: () => '', // tickets have no userId actor field
    hrefSegment: '/tickets',
  },
  {
    key: 'invoices',
    entityType: 'invoice',
    entityLabel: 'Invoice',
    getName: (m) =>
      (m.get('number') as string) ||
      (m.get('customerName') as string) ||
      'Unknown invoice',
    getActorId: (m) => (m.get('createdBy') as string) ?? '',
    hrefSegment: '/finance/invoices',
  },
  {
    key: 'expenses',
    entityType: 'expense',
    entityLabel: 'Expense',
    getName: (m) => (m.get('vendor') as string) || 'Unknown vendor',
    getActorId: (m) => (m.get('submittedBy') as string) ?? '',
    hrefSegment: '/finance/expenses',
  },
  {
    key: 'employees',
    entityType: 'employee',
    entityLabel: 'Employee',
    getName: (m) =>
      `${m.get('firstName') ?? ''} ${m.get('lastName') ?? ''}`.trim() ||
      'Unknown employee',
    getActorId: (m) => (m.get('createdBy') as string) ?? '',
    hrefSegment: '/hr/team',
  },
]

function resolveActorName(actorId: string, roomId: string): string {
  if (!actorId) return 'A teammate'
  const member = getRoomMembers(roomId).find((m) => m.userId === actorId)
  return member?.displayName ?? 'A teammate'
}

export function useNotifications(
  doc: Y.Doc,
  roomId: string,
  myUserId: string,
): AppNotification[] {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  // Capture session start so we only surface changes that arrive after we joined
  const sessionStart = useRef(Date.now())

  useEffect(() => {
    const handlers: Array<{ map: Y.Map<unknown>; fn: Parameters<Y.Map<unknown>['observe']>[0] }> = []

    for (const spec of MAP_SPECS) {
      const map = doc.getMap(spec.key)

      const fn: Parameters<typeof map.observe>[0] = (event, transaction) => {
        // Ignore own changes
        if (transaction.local) return
        if (Date.now() < sessionStart.current) return

        const added: AppNotification[] = []
        const deleted: AppNotification[] = []

        for (const [recordId, change] of event.changes.keys) {
          if (change.action === 'add') {
            const record = map.get(recordId)
            if (!(record instanceof Y.Map)) continue
            const actorId = spec.getActorId(record)
            // Skip own records that are being synced (same userId)
            if (actorId === myUserId) continue
            added.push({
              id: nanoid(),
              timestamp: Date.now(),
              actorName: resolveActorName(actorId, roomId),
              action: 'created',
              entityType: spec.entityType,
              entityName: spec.getName(record),
              href: `/r/${roomId}${spec.hrefSegment}/${recordId}`,
            })
          } else if (change.action === 'delete') {
            deleted.push({
              id: nanoid(),
              timestamp: Date.now(),
              actorName: 'A teammate',
              action: 'deleted',
              entityType: spec.entityType,
              entityName: `a ${spec.entityLabel.toLowerCase()}`,
              href: `/r/${roomId}${spec.hrefSegment}`,
            })
          }
        }

        const incoming = [...added, ...deleted]
        if (incoming.length > 0) {
          setNotifications((prev) => [...incoming, ...prev].slice(0, 100))
        }
      }

      map.observe(fn)
      handlers.push({ map, fn })
    }

    return () => {
      for (const { map, fn } of handlers) {
        map.unobserve(fn)
      }
    }
  }, [doc, roomId, myUserId])

  return notifications
}
