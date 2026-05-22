import type { ModuleDefinition } from './module'
import { crmModule } from '../modules/crm/module'
import { financeModule } from '../modules/finance/module'
import { hrModule } from '../modules/hr/module'
import { kanbanModule } from '../modules/kanban/module'
import { ticketsModule } from '../modules/tickets/module'
import { chatModule } from '../modules/chat/module'

/**
 * Order in this array drives the order in which modules appear in the sidebar
 * and (loosely) on the landing page.
 *
 * Modules with empty `nav` arrays (like chat) still participate in initializeDoc
 * but don't render in the sidebar — they typically have their own surface
 * (e.g. floating launcher, global panel).
 */
export const MODULES: readonly ModuleDefinition[] = [
  crmModule,
  financeModule,
  hrModule,
  kanbanModule,
  ticketsModule,
  chatModule,
]

export function findModule(id: string): ModuleDefinition | undefined {
  return MODULES.find((m) => m.id === id)
}
