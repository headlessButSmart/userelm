import * as Y from 'yjs'

export const WORKSPACE_KEY = 'workspace'

export interface MemberShape {
  userId: string
  displayName: string
  color: string
  joinedAt: number
  lastSeenAt: number
}

export const CURRENT_SCHEMA_VERSION = 3

export function generateColor(seed: string): string {
  const hue = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `hsl(${hue}, 65%, 50%)`
}

export function initWorkspace(
  doc: Y.Doc,
  workspaceName: string,
  ownerUserId: string,
  ownerDisplayName: string,
) {
  const workspace = doc.getMap(WORKSPACE_KEY)
  if (workspace.has('createdAt')) return // already initialized

  workspace.set('name', workspaceName)
  workspace.set('createdAt', Date.now())
  workspace.set('schemaVersion', CURRENT_SCHEMA_VERSION)

  const members = new Y.Map()
  workspace.set('members', members)

  const member = new Y.Map()
  member.set('userId', ownerUserId)
  member.set('displayName', ownerDisplayName)
  member.set('color', generateColor(ownerUserId))
  member.set('joinedAt', Date.now())
  member.set('lastSeenAt', Date.now())
  members.set(ownerUserId, member)
}

export function getMembers(doc: Y.Doc): MemberShape[] {
  const m = doc.getMap(WORKSPACE_KEY).get('members') as Y.Map<Y.Map<unknown>> | undefined
  if (!m) return []
  const rows: MemberShape[] = []
  m.forEach((mm) => {
    rows.push({
      userId: (mm.get('userId') as string) ?? '',
      displayName: (mm.get('displayName') as string) ?? '',
      color: (mm.get('color') as string) ?? '#888',
      joinedAt: (mm.get('joinedAt') as number) ?? 0,
      lastSeenAt: (mm.get('lastSeenAt') as number) ?? 0,
    })
  })
  return rows
}

export function getWorkspaceName(doc: Y.Doc): string {
  return (doc.getMap(WORKSPACE_KEY).get('name') as string) ?? 'Workspace'
}
