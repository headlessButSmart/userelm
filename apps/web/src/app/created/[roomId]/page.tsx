'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CreatedPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [secret, setSecret] = useState('')
  const [joinUrl, setJoinUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const params = new URLSearchParams(hash)
    setSecret(params.get('secret') ?? '')
    setJoinUrl(decodeURIComponent(params.get('url') ?? ''))
  }, [])

  function copy() {
    navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-lg flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Workspace created!</h1>

        <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Save this URL now.</strong> We cannot recover it. The secret is not stored on our
          servers. If you lose it, create a new workspace.
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground font-medium">Join URL (share with teammates)</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={joinUrl}
              className="flex-1 rounded-md border border-[--color-border] bg-[--color-muted] px-3 py-1.5 text-xs font-mono"
            />
            <Button variant="outline" size="sm" onClick={copy}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {secret && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground font-medium">Secret key (included in the URL above)</p>
            <code className="rounded-md bg-[--color-muted] px-3 py-2 text-xs font-mono break-all">
              {secret}
            </code>
          </div>
        )}

        <Button asChild>
          <Link href={joinUrl || `/join#room=${roomId}`}>
            I&apos;ve saved it — join my workspace
          </Link>
        </Button>
      </div>
    </main>
  )
}
