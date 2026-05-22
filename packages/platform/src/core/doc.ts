import * as Y from 'yjs'
import { initWorkspace } from './workspace'
import { MODULES } from './modules'

/**
 * Initializes a fresh Y.Doc: sets up the workspace metadata + member entry,
 * then asks every registered module to ensure its empty root maps exist.
 */
export function initializeDoc(
  doc: Y.Doc,
  workspaceName: string,
  ownerUserId: string,
  ownerDisplayName: string,
) {
  doc.transact(() => {
    initWorkspace(doc, workspaceName, ownerUserId, ownerDisplayName)
    for (const m of MODULES) m.initRoots(doc)
  })
}
