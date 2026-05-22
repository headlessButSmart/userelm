'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewWorkspacePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceName: fd.get('workspaceName'),
          ownerEmail: fd.get('ownerEmail'),
          turnstileToken: 'dev-bypass',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create workspace')
      // Pass secret via fragment so it never hits the server
      router.push(`/created/${data.roomId}#secret=${data.secret}&url=${encodeURIComponent(data.joinUrl)}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Create a workspace</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="workspaceName">Workspace name</Label>
            <Input id="workspaceName" name="workspaceName" required maxLength={80} placeholder="Acme CRM" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ownerEmail">Your email</Label>
            <Input id="ownerEmail" name="ownerEmail" type="email" required placeholder="you@example.com" />
          </div>
          {error && <p className="text-sm text-[--color-destructive]">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create workspace'}</Button>
        </form>
      </div>
    </main>
  )
}
