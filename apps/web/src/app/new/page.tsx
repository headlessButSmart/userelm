'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (widgetId: string) => void
    }
  }
}

export default function NewWorkspacePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string>('')

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!siteKey) return

    const scriptId = 'cf-turnstile-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => renderWidget(siteKey)
      document.head.appendChild(script)
    } else if (window.turnstile) {
      renderWidget(siteKey)
    }
  }, [])

  function renderWidget(siteKey: string) {
    if (!widgetRef.current || !window.turnstile) return
    widgetIdRef.current = window.turnstile.render(widgetRef.current, {
      sitekey: siteKey,
      callback: (token: string) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(''),
      'error-callback': () => setTurnstileToken(''),
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!turnstileToken) {
      setError('Please complete the security check.')
      return
    }
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
          turnstileToken,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create workspace')
      router.push(`/created/${data.roomId}#secret=${data.secret}&url=${encodeURIComponent(data.joinUrl)}`)
    } catch (err) {
      setError((err as Error).message)
      // Reset widget so user can retry
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
        setTurnstileToken('')
      }
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
          <div ref={widgetRef} />
          {error && <p className="text-sm text-[--color-destructive]">{error}</p>}
          <Button type="submit" disabled={loading || !turnstileToken}>
            {loading ? 'Creating…' : 'Create workspace'}
          </Button>
        </form>
      </div>
    </main>
  )
}
