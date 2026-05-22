'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, Trello, MoreHorizontal, Trash2 } from 'lucide-react'
import { useRoom } from '@/contexts/RoomContext'
import { useYMapDeep } from '@/lib/yjs/hooks'
import {
  getBoards,
  getColumnsByBoard,
  getCardsByBoard,
  createBoard,
  deleteBoard,
  type BoardRow,
} from '@p2p-crm/platform'
import { TopBar } from '@/components/crm/TopBar'
import { ExportImportMenu } from '@/components/io/ExportImportMenu'
import { col } from '@/lib/io/column-schema'

type BoardInput = Parameters<typeof createBoard>[1]

const BOARD_COLUMNS = [
  col<BoardRow, BoardInput>('name'),
  col<BoardRow, BoardInput>('description'),
  col<BoardRow, BoardInput>('color'),
]
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const PRESET_COLORS: { label: string; value: string }[] = [
  { label: 'Violet', value: 'oklch(54% 0.21 286)' },
  { label: 'Blue', value: 'oklch(60% 0.18 240)' },
  { label: 'Green', value: 'oklch(62% 0.17 150)' },
  { label: 'Orange', value: 'oklch(68% 0.18 50)' },
]

export default function KanbanBoardsPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { doc, identity } = useRoom()
  useYMapDeep(doc.getMap('kanbanBoards'))
  useYMapDeep(doc.getMap('kanbanColumns'))
  useYMapDeep(doc.getMap('kanbanCards'))

  const boards = getBoards(doc)

  const [showNew, setShowNew] = useState(false)

  return (
    <>
      <TopBar title="Kanban" />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {boards.length} board{boards.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <ExportImportMenu
              rows={boards}
              schema={BOARD_COLUMNS}
              entityName="boards"
              onImportRow={(input) => createBoard(doc, {
                name: input.name ?? 'Imported board',
                actorId: identity.userId,
                ...input,
              })}
            />
            <Button onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" /> New board
            </Button>
          </div>
        </div>

        {boards.length === 0 ? (
          <EmptyState
            icon={Trello}
            title="No boards yet"
            description="Create a kanban board to organize tasks into columns and track work in progress."
            action={
              <Button onClick={() => setShowNew(true)}>
                <Plus className="h-4 w-4" /> New board
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.map((b) => {
              const columnCount = getColumnsByBoard(doc, b.id).length
              const cardCount = getCardsByBoard(doc, b.id).length
              return (
                <div
                  key={b.id}
                  className="relative group rounded-lg border border-[--color-border] bg-card hover:shadow-md transition-shadow"
                >
                  <Link
                    href={`/r/${roomId}/kanban/${b.id}`}
                    className="block p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: b.color }}
                      />
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="font-semibold truncate">{b.name}</div>
                        {b.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {b.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{columnCount} column{columnCount !== 1 ? 's' : ''}</span>
                          <span>·</span>
                          <span>{cardCount} card{cardCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm(`Delete board "${b.name}"? This will remove all its columns and cards.`)) {
                              deleteBoard(doc, b.id)
                            }
                          }}
                          className="text-[--color-destructive]"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <NewBoardDialog
        open={showNew}
        onOpenChange={setShowNew}
        onSave={(input) => {
          createBoard(doc, { ...input, actorId: identity.userId })
          setShowNew(false)
        }}
      />
    </>
  )
}

function NewBoardDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  onSave: (input: { name: string; description: string; color: string }) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0]!.value)

  function reset() {
    setName('')
    setDescription('')
    setColor(PRESET_COLORS[0]!.value)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New board</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            onSave({ name: name.trim(), description: description.trim(), color })
            reset()
          }}
          className="space-y-3"
        >
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-1">
              {PRESET_COLORS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setColor(p.value)}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-transform',
                    color === p.value
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105',
                  )}
                  style={{ backgroundColor: p.value }}
                  aria-label={p.label}
                />
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create board</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
