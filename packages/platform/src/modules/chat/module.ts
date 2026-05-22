import * as Y from 'yjs'
import type { ModuleDefinition } from '../../core/module'
import { CHAT_KEYS } from './schema'

// Chat is a "background" module — it doesn't appear in the sidebar nav
// (it has its own floating launcher), but it still owns root keys and
// participates in initializeDoc like any other module.
export const chatModule: ModuleDefinition = {
  id: 'chat',
  title: 'Chat',
  description: 'Real-time team chat — messages live in the same P2P doc as your CRM data.',
  iconName: 'MessageCircle',
  accent: 'oklch(70% 0.15 200)',
  rootKeys: [CHAT_KEYS.messages],
  initRoots(doc: Y.Doc) {
    doc.getMap(CHAT_KEYS.messages)
  },
  // Empty nav means the sidebar won't render a section for it
  nav: [],
}
