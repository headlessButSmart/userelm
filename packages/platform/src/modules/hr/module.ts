import * as Y from 'yjs'
import type { ModuleDefinition } from '../../core/module'
import { HR_KEYS } from './schema'

export const hrModule: ModuleDefinition = {
  id: 'hr',
  title: 'HR',
  description: 'Employee directory, leave tracking, and team operations.',
  iconName: 'UserCheck',
  accent: 'oklch(60% 0.16 30)',
  rootKeys: [HR_KEYS.employees, HR_KEYS.leaveRequests],
  initRoots(doc: Y.Doc) {
    doc.getMap(HR_KEYS.employees)
    doc.getMap(HR_KEYS.leaveRequests)
  },
  nav: [
    { href: '/hr/team',  label: 'Team',  iconName: 'Users' },
    { href: '/hr/leave', label: 'Leave', iconName: 'CalendarDays' },
  ],
}
