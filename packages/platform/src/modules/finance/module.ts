import * as Y from 'yjs'
import type { ModuleDefinition } from '../../core/module'
import { FINANCE_KEYS } from './schema'

export const financeModule: ModuleDefinition = {
  id: 'finance',
  title: 'Finance',
  description: 'Invoices, expenses, and revenue tracking.',
  iconName: 'Wallet',
  accent: 'oklch(64% 0.16 145)',
  rootKeys: [FINANCE_KEYS.invoices, FINANCE_KEYS.expenses, FINANCE_KEYS.financeCategories],
  initRoots(doc: Y.Doc) {
    doc.getMap(FINANCE_KEYS.invoices)
    doc.getMap(FINANCE_KEYS.expenses)
    doc.getMap(FINANCE_KEYS.financeCategories)
  },
  nav: [
    { href: '/finance/invoices', label: 'Invoices', iconName: 'FileText' },
    { href: '/finance/expenses', label: 'Expenses', iconName: 'Receipt' },
  ],
}
