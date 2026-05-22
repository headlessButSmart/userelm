import * as Y from 'yjs'
import type { ModuleDefinition } from '../../core/module'
import { KANBAN_KEYS } from './schema'

export const kanbanModule: ModuleDefinition = {
  id: 'kanban',
  title: 'Boards',
  description: 'Kanban-style boards for project and task management.',
  iconName: 'Trello',
  accent: 'oklch(62% 0.16 220)',
  rootKeys: [KANBAN_KEYS.boards, KANBAN_KEYS.columns, KANBAN_KEYS.cards],
  initRoots(doc: Y.Doc) {
    doc.getMap(KANBAN_KEYS.boards)
    doc.getMap(KANBAN_KEYS.columns)
    doc.getMap(KANBAN_KEYS.cards)
  },
  nav: [
    { href: '/kanban', label: 'Boards', iconName: 'Trello' },
  ],
}
