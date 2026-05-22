'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  onClose: () => void
  onSave: (input: { name: string; email?: string; phone?: string; company?: string; title?: string }) => void
}

export function NewContactPanel({ onClose, onSave }: Props) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', title: '' })

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }))
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card rounded-lg border border-[--color-border] shadow-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">New contact</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave({ ...form, email: form.email || undefined, phone: form.phone || undefined, company: form.company || undefined, title: form.title || undefined })
          }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor="cn-name">Name *</Label>
            <Input id="cn-name" value={form.name} onChange={set('name')} required />
          </div>
          {(['email', 'phone', 'company', 'title'] as const).map((f) => (
            <div key={f} className="flex flex-col gap-1">
              <Label htmlFor={`cn-${f}`} className="capitalize">{f}</Label>
              <Input id={`cn-${f}`} value={form[f]} onChange={set(f)} type={f === 'email' ? 'email' : 'text'} />
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
