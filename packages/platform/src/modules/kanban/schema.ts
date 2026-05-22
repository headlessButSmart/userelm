export const KANBAN_KEYS = {
  boards: 'kanbanBoards',
  columns: 'kanbanColumns',
  cards: 'kanbanCards',
} as const

export type CardPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface BoardRow {
  id: string
  name: string
  description: string
  color: string
  createdBy: string
  createdAt: number
  updatedAt: number
}

export interface ColumnRow {
  id: string
  boardId: string
  name: string
  order: number
  createdAt: number
  updatedAt: number
}

export interface CardRow {
  id: string
  boardId: string
  columnId: string
  title: string
  description: string
  assigneeIds: string[]
  labels: string[]
  priority: CardPriority
  dueDate: number
  order: number
  createdBy: string
  createdAt: number
  updatedAt: number
}

export const CARD_PRIORITIES: CardPriority[] = ['low', 'medium', 'high', 'urgent']
export const DEFAULT_BOARD_COLUMNS = ['To do', 'In progress', 'Review', 'Done']
