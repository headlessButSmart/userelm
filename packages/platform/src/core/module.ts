import * as Y from 'yjs'

/**
 * A Module is a self-contained business domain that lives inside a workspace.
 * Modules own one or more Yjs root keys, and contribute navigation entries
 * and (optionally) dashboard widgets.
 *
 * The platform core knows nothing about specific modules — it just iterates
 * the registry to initialize empty maps and render navigation.
 */
export interface ModuleNavEntry {
  /** Path relative to /r/[roomId], e.g. '/crm/contacts' (must start with /) */
  href: string
  label: string
  /** Lucide icon name (resolved client-side by the sidebar) */
  iconName: string
}

export interface ModuleDefinition {
  /** Unique module id, used as URL segment and key in the registry */
  id: string
  /** Display title shown as the section header in the sidebar */
  title: string
  /** Short description used on the landing page / marketing */
  description: string
  /** Lucide icon name shown next to the section header */
  iconName: string
  /** Accent color (CSS color) used for marketing cards */
  accent: string
  /** Yjs root keys this module owns inside the workspace Y.Doc */
  rootKeys: readonly string[]
  /** Called once during initializeDoc to ensure the empty Y.Maps exist */
  initRoots: (doc: Y.Doc) => void
  /** Sub-navigation entries shown under the module in the sidebar */
  nav: readonly ModuleNavEntry[]
}
