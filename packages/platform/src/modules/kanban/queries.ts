import * as Y from 'yjs'
import { KANBAN_KEYS, type BoardRow, type ColumnRow, type CardRow } from './schema'

function readMap<T>(m: Y.Map<unknown>, mapper: (v: Y.Map<unknown>) => T): T[] {
  const rows: T[] = []
  m.forEach((v) => { if (v instanceof Y.Map) rows.push(mapper(v)) })
  return rows
}

function readBoard(m: Y.Map<unknown>): BoardRow {
  return {
    id: (m.get('id') as string) ?? '',
    name: (m.get('name') as string) ?? '',
    description: (m.get('description') as string) ?? '',
    color: (m.get('color') as string) ?? '',
    createdBy: (m.get('createdBy') as string) ?? '',
    createdAt: (m.get('createdAt') as number) ?? 0,
    updatedAt: (m.get('updatedAt') as number) ?? 0,
  }
}

function readColumn(m: Y.Map<unknown>): ColumnRow {
  return {
    id: (m.get('id') as string) ?? '',
    boardId: (m.get('boardId') as string) ?? '',
    name: (m.get('name') as string) ?? '',
    order: (m.get('order') as number) ?? 0,
    createdAt: (m.get('createdAt') as number) ?? 0,
    updatedAt: (m.get('updatedAt') as number) ?? 0,
  }
}

function readCard(m: Y.Map<unknown>): CardRow {
  return {
    id: (m.get('id') as string) ?? '',
    boardId: (m.get('boardId') as string) ?? '',
    columnId: (m.get('columnId') as string) ?? '',
    title: (m.get('title') as string) ?? '',
    description: (m.get('description') as string) ?? '',
    assigneeIds: (m.get('assigneeIds') as string[]) ?? [],
    labels: (m.get('labels') as string[]) ?? [],
    priority: ((m.get('priority') as CardRow['priority']) ?? 'medium'),
    dueDate: (m.get('dueDate') as number) ?? 0,
    order: (m.get('order') as number) ?? 0,
    createdBy: (m.get('createdBy') as string) ?? '',
    createdAt: (m.get('createdAt') as number) ?? 0,
    updatedAt: (m.get('updatedAt') as number) ?? 0,
  }
}

export function getBoards(doc: Y.Doc): BoardRow[] {
  return readMap(doc.getMap(KANBAN_KEYS.boards), readBoard).sort((a, b) => b.createdAt - a.createdAt)
}
export function getBoard(doc: Y.Doc, id: string): BoardRow | null {
  const m = doc.getMap(KANBAN_KEYS.boards).get(id) as Y.Map<unknown> | undefined
  return m ? readBoard(m) : null
}

export function getColumns(doc: Y.Doc): ColumnRow[] {
  return readMap(doc.getMap(KANBAN_KEYS.columns), readColumn).sort((a, b) => a.order - b.order)
}
export function getColumnsByBoard(doc: Y.Doc, boardId: string): ColumnRow[] {
  return getColumns(doc).filter((c) => c.boardId === boardId)
}

export function getCards(doc: Y.Doc): CardRow[] {
  return readMap(doc.getMap(KANBAN_KEYS.cards), readCard).sort((a, b) => a.order - b.order)
}
export function getCardsByBoard(doc: Y.Doc, boardId: string): CardRow[] {
  return getCards(doc).filter((c) => c.boardId === boardId)
}
export function getCardsByColumn(doc: Y.Doc, columnId: string): CardRow[] {
  return getCards(doc).filter((c) => c.columnId === columnId)
}
