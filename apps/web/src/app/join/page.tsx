'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getOrCreateIdentity, updateDisplayName, updateEmail } from '@/lib/identity'
import { upsertRoomMember } from '@/lib/roomMembers'

export default function JoinPage() {
  const router = useRouter()
  const [roomId, setRoomId] = useState('')
  const [secret, setSecret] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    const rid = params.get('room') ?? ''
    const key = params.get('key') ?? ''
    setRoomId(rid)
    setSecret(key)

    const identity = getOrCreateIdentity()
    setDisplayName(identity.displayName === 'New member' ? '' : identity.displayName)
    if (identity.email) setEmail(identity.email)

    if (rid) {
      fetch(`/api/rooms/${rid}`)
        .then(async (r) => {
          if (!r.ok) throw new Error('server_error')
          return r.json()
        })
        .then((data) => {
          if (!data.exists) setError('Workspace not found')
          else if (data.isSuspended) setError('This workspace has been suspended')
          else setWorkspaceName(data.workspaceName)
        })
        .catch((err) => setError(err?.message === 'server_error' ? 'Could not reach server — check your setup' : 'Could not reach server'))
        .finally(() => setChecking(false))
    } else {
      setChecking(false)
      setError('No room ID in URL')
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const identity = getOrCreateIdentity()
    if (displayName) updateDisplayName(displayName)
    if (email) updateEmail(email)
    try {
      const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, displayName: displayName || identity.displayName, userId: identity.userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to join')
      // Store token and ice servers in sessionStorage for the room page
      sessionStorage.setItem(`room-token:${roomId}`, data.token)
      sessionStorage.setItem(`room-ice:${roomId}`, JSON.stringify(data.iceServers))
      // Persist join URL so settings page can show it for sharing
      const joinUrl = `${window.location.origin}/join#room=${roomId}&key=${secret}`
      localStorage.setItem(`room-joinurl:${roomId}`, joinUrl)
      // Store member email for card assignment reference
      if (email) {
        upsertRoomMember(roomId, {
          userId: identity.userId,
          displayName: displayName || identity.displayName,
          email,
        })
      }
      router.push(`/r/${roomId}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Checking workspace…</div>
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">
            {workspaceName ? `Join ${workspaceName}` : 'Join workspace'}
          </h1>
          {workspaceName && <p className="text-sm text-muted-foreground mt-1">Enter your name to continue</p>}
        </div>

        {error ? (
          <p className="text-sm text-[--color-destructive]">{error}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">Your display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={40}
                placeholder="Alice"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email <span className="text-muted-foreground font-normal">(optional — used for card assignment)</span></Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={120}
                placeholder="alice@example.com"
              />
            </div>
            <Button type="submit" disabled={loading}>{loading ? 'Joining…' : 'Join workspace'}</Button>
          </form>
        )}
      </div>
    </main>
  )
}
