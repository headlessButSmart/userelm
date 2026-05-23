'use client'
import { useState } from 'react'
import {
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
  type TicketRow,
  type TicketPriority,
  type TicketCategory,
} from '@p2p-crm/platform'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  general: 'General',
  billing: 'Billing',
  technical: 'Technical',
  bug: 'Bug',
  feature_request: 'Feature Request',
}

export function TicketDialog({
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
  initial?: Partial<TicketRow>
  members: { userId: string; displayName: string; email: string }[]
  onSave: (input: {
    title: string
    description: string
    priority: TicketPriority
    category: TicketCategory
    submitterEmail: string
    submitterName: string
    assigneeEmail: string
  }) => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [priority, setPriority] = useState<TicketPriority>(initial?.priority ?? 'medium')
  const [category, setCategory] = useState<TicketCategory>(initial?.category ?? 'general')
  const [submitterEmail, setSubmitterEmail] = useState(initial?.submitterEmail ?? '')
  const [submitterName, setSubmitterName] = useState(initial?.submitterName ?? '')
  const [assigneeEmail, setAssigneeEmail] = useState(initial?.assigneeEmail ?? '')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New ticket' : 'Edit ticket'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim() || !submitterEmail.trim()) return
            onSave({
              title: title.trim(),
              description: description.trim(),
              priority,
              category,
              submitterEmail: submitterEmail.trim(),
              submitterName: submitterName.trim(),
              assigneeEmail,
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
              placeholder="Brief summary of the issue"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Full details…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Submitter email *</Label>
              <Input
                type="email"
                value={submitterEmail}
                onChange={(e) => setSubmitterEmail(e.target.value)}
                required
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <Label>Submitter name</Label>
              <Input
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                placeholder="Customer name"
              />
            </div>
          </div>
          <div>
            <Label>Assignee</Label>
            <Select value={assigneeEmail || '__none__'} onValueChange={(v) => setAssigneeEmail(v === '__none__' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.email} value={m.email}>
                    {m.email}{m.displayName ? ` (${m.displayName})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'create' ? 'Create ticket' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
