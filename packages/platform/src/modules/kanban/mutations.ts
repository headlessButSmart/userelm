import * as Y from 'yjs'
import { nanoid } from 'nanoid'
import { KANBAN_KEYS, type CardPriority, DEFAULT_BOARD_COLUMNS } from './schema'

// ---------- Boards ----------

export function createBoard(doc: Y.Doc, input: {
  name: string
  description?: string
  color?: string
  actorId: string
}): string {
  const id = nanoid()
  doc.transact(() => {
    const now = Date.now()
    const board = new Y.Map()
    board.set('id', id)
    board.set('name', input.name)
    board.set('description', input.description ?? '')
    board.set('color', input.color ?? 'oklch(54% 0.21 286)')
    board.set('createdBy', input.actorId)
    board.set('createdAt', now)
    board.set('updatedAt', now)
    doc.getMap(KANBAN_KEYS.boards).set(id, board)

    // Seed default columns
    const columns = doc.getMap(KANBAN_KEYS.columns)
    DEFAULT_BOARD_COLUMNS.forEach((name, i) => {
      const cid = nanoid()
      const col = new Y.Map()
      col.set('id', cid)
      col.set('boardId', id)
      col.set('name', name)
      col.set('order', i)
      col.set('createdAt', now)
      col.set('updatedAt', now)
      columns.set(cid, col)
    })
  }, 'user')
  return id
}

export function updateBoard(doc: Y.Doc, id: string, patch: Partial<{
  name: string
  description: string
  color: string
}>) {
  doc.transact(() => {
    const m = doc.getMap(KANBAN_KEYS.boards).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) m.set(k, v)
    m.set('updatedAt', Date.now())
  }, 'user')
}

export function deleteBoard(doc: Y.Doc, id: string) {
  doc.transact(() => {
    doc.getMap(KANBAN_KEYS.boards).delete(id)
    // Cascade-delete columns and cards belonging to this board
    const columns = doc.getMap(KANBAN_KEYS.columns)
    const cards = doc.getMap(KANBAN_KEYS.cards)
    const colsToDelete: string[] = []
    columns.forEach((v, k) => {
      if (v instanceof Y.Map && (v.get('boardId') as string) === id) colsToDelete.push(k)
    })
    colsToDelete.forEach((k) => columns.delete(k))
    const cardsToDelete: string[] = []
    cards.forEach((v, k) => {
      if (v instanceof Y.Map && (v.get('boardId') as string) === id) cardsToDelete.push(k)
    })
    cardsToDelete.forEach((k) => cards.delete(k))
  }, 'user')
}

// ---------- Columns ----------

export function createColumn(doc: Y.Doc, input: {
  boardId: string
  name: string
  order?: number
}): string {
  const id = nanoid()
  doc.transact(() => {
    const now = Date.now()
    // Default order = max existing order + 1
    let order = input.order
    if (order === undefined) {
      let max = -1
      doc.getMap(KANBAN_KEYS.columns).forEach((v) => {
        if (v instanceof Y.Map && (v.get('boardId') as string) === input.boardId) {
          max = Math.max(max, (v.get('order') as number) ?? 0)
        }
      })
      order = max + 1
    }
    const col = new Y.Map()
    col.set('id', id)
    col.set('boardId', input.boardId)
    col.set('name', input.name)
    col.set('order', order)
    col.set('createdAt', now)
    col.set('updatedAt', now)
    doc.getMap(KANBAN_KEYS.columns).set(id, col)
  }, 'user')
  return id
}

export function updateColumn(doc: Y.Doc, id: string, patch: Partial<{
  name: string
  order: number
}>) {
  doc.transact(() => {
    const m = doc.getMap(KANBAN_KEYS.columns).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) m.set(k, v)
    m.set('updatedAt', Date.now())
  }, 'user')
}

export function deleteColumn(doc: Y.Doc, id: string) {
  doc.transact(() => {
    doc.getMap(KANBAN_KEYS.columns).delete(id)
    const cards = doc.getMap(KANBAN_KEYS.cards)
    const toDel: string[] = []
    cards.forEach((v, k) => {
      if (v instanceof Y.Map && (v.get('columnId') as string) === id) toDel.push(k)
    })
    toDel.forEach((k) => cards.delete(k))
  }, 'user')
}

// ---------- Cards ----------

export function createCard(doc: Y.Doc, input: {
  boardId: string
  columnId: string
  title: string
  description?: string
  assigneeIds?: string[]
  labels?: string[]
  priority?: CardPriority
  dueDate?: number
  actorId: string
}): string {
  const id = nanoid()
  doc.transact(() => {
    const now = Date.now()
    // Default order = max existing order in column + 1
    let max = -1
    doc.getMap(KANBAN_KEYS.cards).forEach((v) => {
      if (v instanceof Y.Map && (v.get('columnId') as string) === input.columnId) {
        max = Math.max(max, (v.get('order') as number) ?? 0)
      }
    })
    const c = new Y.Map()
    c.set('id', id)
    c.set('boardId', input.boardId)
    c.set('columnId', input.columnId)
    c.set('title', input.title)
    c.set('description', input.description ?? '')
    c.set('assigneeIds', input.assigneeIds ?? [])
    c.set('labels', input.labels ?? [])
    c.set('priority', input.priority ?? 'medium')
    c.set('dueDate', input.dueDate ?? 0)
    c.set('order', max + 1)
    c.set('createdBy', input.actorId)
    c.set('createdAt', now)
    c.set('updatedAt', now)
    doc.getMap(KANBAN_KEYS.cards).set(id, c)
  }, 'user')
  return id
}

export function updateCard(doc: Y.Doc, id: string, patch: Partial<{
  title: string
  description: string
  assigneeIds: string[]
  labels: string[]
  priority: CardPriority
  dueDate: number
}>) {
  doc.transact(() => {
    const m = doc.getMap(KANBAN_KEYS.cards).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) m.set(k, v)
    m.set('updatedAt', Date.now())
  }, 'user')
}

export function moveCard(doc: Y.Doc, cardId: string, targetColumnId: string, targetOrder?: number) {
  doc.transact(() => {
    const m = doc.getMap(KANBAN_KEYS.cards).get(cardId) as Y.Map<unknown> | undefined
    if (!m) return
    m.set('columnId', targetColumnId)
    if (targetOrder !== undefined) m.set('order', targetOrder)
    else {
      // Append to end of target column
      let max = -1
      doc.getMap(KANBAN_KEYS.cards).forEach((v) => {
        if (v instanceof Y.Map && (v.get('columnId') as string) === targetColumnId && v !== m) {
          max = Math.max(max, (v.get('order') as number) ?? 0)
        }
      })
      m.set('order', max + 1)
    }
    m.set('updatedAt', Date.now())
  }, 'user')
}

export function deleteCard(doc: Y.Doc, id: string) {
  doc.transact(() => doc.getMap(KANBAN_KEYS.cards).delete(id), 'user')
}
