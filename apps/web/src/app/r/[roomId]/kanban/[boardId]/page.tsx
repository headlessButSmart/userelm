'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Plus,
  Trello,
  MoreHorizontal,
  Trash2,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  UserCircle2,
} from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import { getRoomMembers, type RoomMember } from '@/lib/roomMembers'
import {
  getBoard,
  getColumnsByBoard,
  getCardsByBoard,
  createColumn,
  updateColumn,
  deleteColumn,
  createCard,
  updateCard,
  moveCard,
  deleteCard,
  CARD_PRIORITIES,
  type CardPriority,
  type CardRow,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const PRIORITY_DOT: Record<CardPriority, string> = {
  low: 'bg-gray-400',
  medium: 'bg-yellow-400',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

export default function KanbanBoardPage() {
  const { roomId, boardId } = useParams<{ roomId: string; boardId: string }>()
  const { doc, identity } = useRoom()
  useYMapDeep(doc.getMap('kanbanBoards'))
  useYMapDeep(doc.getMap('kanbanColumns'))
  useYMapDeep(doc.getMap('kanbanCards'))

  const board = getBoard(doc, boardId)
  const columns = getColumnsByBoard(doc, boardId)
  const cards = getCardsByBoard(doc, boardId)

  const cardsByColumn = useMemo(() => {
    const m = new Map<string, CardRow[]>()
    columns.forEach((c) => m.set(c.id, []))
    cards.forEach((c) => {
      const list = m.get(c.columnId)
      if (list) list.push(c)
    })
    m.forEach((list) => list.sort((a, b) => a.order - b.order))
    return m
  }, [columns, cards])

  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([])
  useEffect(() => { setRoomMembers(getRoomMembers(roomId)) }, [roomId])

  const [dragColumnId, setDragColumnId] = useState<string | null>(null)
  const [editingCard, setEditingCard] = useState<CardRow | null>(null)
  const [creatingInColumnId, setCreatingInColumnId] = useState<string | null>(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')

  if (!board) {
    return (
      <>
        <TopBar title="Kanban" />
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={Trello}
            title="Board not found"
            description="This board may have been deleted."
            action={
              <Button asChild>
                <Link href={`/r/${roomId}/kanban`}>
                  <ArrowLeft className="h-4 w-4" /> Back to boards
                </Link>
              </Button>
            }
          />
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title={board.name} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b border-[--color-border] flex items-center gap-3">
          <Link
            href={`/r/${roomId}/kanban`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Boards
          </Link>
          <span className="text-muted-foreground">/</span>
          <span
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: board.color }}
          />
          <span className="font-medium">{board.name}</span>
          {board.description && (
            <span className="text-sm text-muted-foreground truncate">
              · {board.description}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
          <div className="flex gap-4 h-full items-start">
            {columns.map((col) => {
              const list = cardsByColumn.get(col.id) ?? []
              return (
                <ColumnView
                  key={col.id}
                  column={col}
                  cards={list}
                  isDragOver={dragColumnId === col.id}
                  onDragEnter={() => setDragColumnId(col.id)}
                  onDragLeave={() => setDragColumnId((c) => (c === col.id ? null : c))}
                  onDrop={(cardId) => {
                    setDragColumnId(null)
                    moveCard(doc, cardId, col.id)
                  }}
                  onRename={(name) => updateColumn(doc, col.id, { name })}
                  onDelete={() => {
                    if (
                      confirm(
                        `Delete column "${col.name}"? This will remove all ${list.length} card${list.length !== 1 ? 's' : ''} in it.`,
                      )
                    ) {
                      deleteColumn(doc, col.id)
                    }
                  }}
                  onAddCard={() => setCreatingInColumnId(col.id)}
                  onCardClick={(c) => setEditingCard(c)}
                  onCardDelete={(c) => {
                    if (confirm(`Delete card "${c.title}"?`)) deleteCard(doc, c.id)
                  }}
                />
              )
            })}

            <div className="flex-shrink-0 w-72">
              {addingColumn ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const name = newColumnName.trim()
                    if (!name) return
                    createColumn(doc, { boardId, name })
                    setNewColumnName('')
                    setAddingColumn(false)
                  }}
                  className="rounded-lg border border-[--color-border] bg-card p-2 space-y-2"
                >
                  <Input
                    autoFocus
                    placeholder="Column name"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setAddingColumn(false)
                        setNewColumnName('')
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Add
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAddingColumn(false)
                        setNewColumnName('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setAddingColumn(true)}
                >
                  <Plus className="h-4 w-4" /> Add column
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {creatingInColumnId && (
        <CardDialog
          open
          mode="create"
          members={roomMembers}
          onOpenChange={(o) => {
            if (!o) setCreatingInColumnId(null)
          }}
          onSave={(input) => {
            createCard(doc, {
              boardId,
              columnId: creatingInColumnId,
              title: input.title,
              description: input.description,
              priority: input.priority,
              dueDate: input.dueDate,
              labels: input.labels,
              assigneeIds: input.assigneeIds,
              actorId: identity.userId,
            })
            setCreatingInColumnId(null)
          }}
        />
      )}

      {editingCard && (
        <CardDialog
          open
          mode="edit"
          initial={editingCard}
          members={roomMembers}
          onOpenChange={(o) => {
            if (!o) setEditingCard(null)
          }}
          onSave={(input) => {
            updateCard(doc, editingCard.id, {
              title: input.title,
              description: input.description,
              priority: input.priority,
              dueDate: input.dueDate,
              labels: input.labels,
              assigneeIds: input.assigneeIds,
            })
            setEditingCard(null)
          }}
        />
      )}
    </>
  )
}

function ColumnView({
  column,
  cards,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onRename,
  onDelete,
  onAddCard,
  onCardClick,
  onCardDelete,
}: {
  column: { id: string; name: string }
  cards: CardRow[]
  isDragOver: boolean
  onDragEnter: () => void
  onDragLeave: () => void
  onDrop: (cardId: string) => void
  onRename: (name: string) => void
  onDelete: () => void
  onAddCard: () => void
  onCardClick: (c: CardRow) => void
  onCardDelete: (c: CardRow) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(column.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setName(column.name)
  }, [column.name, editing])

  function commit() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== column.name) onRename(trimmed)
    else setName(column.name)
    setEditing(false)
  }

  return (
    <div className="flex-shrink-0 w-72 flex flex-col max-h-full">
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {editing ? (
            <Input
              ref={inputRef}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commit()
                } else if (e.key === 'Escape') {
                  setName(column.name)
                  setEditing(false)
                }
              }}
              className="h-7 text-sm font-semibold"
            />
          ) : (
            <span
              className="font-semibold text-sm truncate cursor-text"
              onDoubleClick={() => setEditing(true)}
              title="Double-click to rename"
            >
              {column.name}
            </span>
          )}
          <Badge variant="secondary">{cards.length}</Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-[--color-destructive]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          onDragEnter()
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault()
          const cardId = e.dataTransfer.getData('cardId')
          if (cardId) onDrop(cardId)
        }}
        className={cn(
          'flex-1 overflow-y-auto rounded-lg p-1 transition-colors',
          isDragOver && 'bg-[--color-primary-soft]/60',
        )}
      >
        <div className="flex flex-col gap-2 min-h-24">
          {cards.map((c) => (
            <CardItem
              key={c.id}
              card={c}
              onClick={() => onCardClick(c)}
              onDelete={() => onCardDelete(c)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onAddCard}
          className="mt-2 w-full text-left text-xs text-muted-foreground hover:text-foreground hover:bg-[--color-muted]/50 rounded-md px-2 py-1.5 transition-colors flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> Add card
        </button>
      </div>
    </div>
  )
}

function CardItem({
  card,
  onClick,
  onDelete,
}: {
  card: CardRow
  onClick: () => void
  onDelete: () => void
}) {
  const isOverdue =
    card.dueDate > 0 && card.dueDate < Date.now()

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('cardId', card.id)}
      onClick={onClick}
      className="rounded-lg border border-[--color-border] bg-card p-3 cursor-pointer hover:shadow-md transition-shadow text-sm group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={cn('h-2 w-2 rounded-full flex-shrink-0', PRIORITY_DOT[card.priority])}
            title={`Priority: ${card.priority}`}
          />
          <div className="font-medium line-clamp-2 flex-1">{card.title}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="text-[--color-destructive]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {card.description && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {card.description}
        </p>
      )}

      {(card.labels.length > 0 || card.dueDate > 0) && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          {card.labels.map((l) => (
            <Badge key={l} variant="secondary" className="text-[10px] px-1.5 py-0">
              {l}
            </Badge>
          ))}
          {card.dueDate > 0 && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px]',
                isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground',
              )}
            >
              {isOverdue ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
              {new Date(card.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {card.assigneeIds.length > 0 && (
        <div className="mt-2 flex items-center gap-1 flex-wrap">
          {card.assigneeIds.map((email) => (
            <AssigneeChip key={email} email={email} />
          ))}
        </div>
      )}
    </div>
  )
}

function assigneeColor(email: string): string {
  const hue = [...email].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `hsl(${hue}, 55%, 45%)`
}

function AssigneeChip({ email }: { email: string }) {
  const initials = (email.split('@')[0] ?? email).slice(0, 2).toUpperCase()
  return (
    <span
      title={email}
      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold text-white"
      style={{ backgroundColor: assigneeColor(email) }}
    >
      {initials}
    </span>
  )
}

function CardDialog({
  open,
  onOpenChange,
  mode,
  initial,
  members,
  onSave,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  mode: 'create' | 'edit'
  initial?: CardRow
  members: RoomMember[]
  onSave: (input: {
    title: string
    description: string
    priority: CardPriority
    dueDate?: number
    labels: string[]
    assigneeIds: string[]
  }) => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [priority, setPriority] = useState<CardPriority>(initial?.priority ?? 'medium')
  const [dueDateStr, setDueDateStr] = useState(
    initial?.dueDate && initial.dueDate > 0
      ? new Date(initial.dueDate).toISOString().slice(0, 10)
      : '',
  )
  const [labelsStr, setLabelsStr] = useState((initial?.labels ?? []).join(', '))
  const [assigneeIds, setAssigneeIds] = useState<string[]>(initial?.assigneeIds ?? [])

  function toggleAssignee(email: string) {
    setAssigneeIds((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New card' : 'Edit card'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim()) return
            onSave({
              title: title.trim(),
              description: description.trim(),
              priority,
              dueDate: dueDateStr ? new Date(dueDateStr).getTime() : 0,
              labels: labelsStr
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
              assigneeIds,
            })
          }}
          className="space-y-3"
        >
          <div>
            <Label>Title *</Label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as CardPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CARD_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due date</Label>
              <Input
                type="date"
                value={dueDateStr}
                onChange={(e) => setDueDateStr(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Labels</Label>
            <Input
              placeholder="Comma-separated (e.g. bug, frontend)"
              value={labelsStr}
              onChange={(e) => setLabelsStr(e.target.value)}
            />
          </div>
          <div>
            <Label>Assignees</Label>
            {members.length === 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5 border rounded-md px-3 py-2">
                <UserCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                No members yet — join with an email to enable assignment
              </div>
            ) : (
              <div className="mt-1.5 flex flex-col gap-1 max-h-28 overflow-y-auto border rounded-md p-2">
                {members.map((m) => (
                  <label
                    key={m.email}
                    className="flex items-center gap-2.5 px-1 py-0.5 rounded cursor-pointer hover:bg-muted text-sm"
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-[--color-primary]"
                      checked={assigneeIds.includes(m.email)}
                      onChange={() => toggleAssignee(m.email)}
                    />
                    <AssigneeChip email={m.email} />
                    <span className="truncate">{m.email}</span>
                    {m.displayName && (
                      <span className="text-muted-foreground text-xs truncate">({m.displayName})</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create card' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
