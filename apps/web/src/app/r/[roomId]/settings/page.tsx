'use client'
import { useEffect, useRef, useState } from 'react'
import { useRoom } from '@/contexts/RoomContext'
import { exportBinary, exportJSON, exportCSV } from '@/lib/backup/export'
import { exportExcel, importExcel } from '@/lib/excel'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function SettingsPage() {
  const { doc, workspaceName, roomId, identity } = useRoom()
  const [joinUrl, setJoinUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setJoinUrl(localStorage.getItem(`room-joinurl:${roomId}`) ?? '')
  }, [roomId])

  function copy() {
    navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleExportBinary() { exportBinary(doc, workspaceName) }
  function handleExportJSON() {
    const json = exportJSON(doc)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workspaceName}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  function handleExportCSV() { exportCSV(doc, workspaceName) }
  function handleExportExcel() { exportExcel(doc, workspaceName) }

  async function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const result = await importExcel(doc, file, identity?.userId ?? 'unknown')
      setImportResult(result)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleDanger() {
    if (confirm('This will delete all local CRM data for this workspace on this device. Are you sure?')) {
      indexedDB.deleteDatabase(`crm-${roomId}`)
      localStorage.removeItem(`room-joinurl:${roomId}`)
      window.location.href = '/'
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card>
        <CardHeader><CardTitle>Invite teammates</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          {joinUrl ? (
            <>
              <p className="text-sm text-muted-foreground">
                Share this URL with anyone you want to give access to this workspace.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={joinUrl}
                  className="flex-1 rounded-md border border-[--color-border] bg-[--color-muted] px-3 py-1.5 text-xs font-mono min-w-0"
                />
                <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                ⚠️ Anyone with this URL has full read/write access. Treat it like a password.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Join URL not available on this device. Use the URL you originally received when the workspace was created.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Excel export / import</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              Export all workspace data as an Excel workbook — each module on its own sheet.
            </p>
            <div>
              <Button variant="outline" onClick={handleExportExcel}>Export Excel (.xlsx)</Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Import from a previously exported Excel file. New records are created — existing data is not overwritten.
              Supported sheets: CRM Contacts, Companies, Deals, Activities · HR Team · Support Tickets.
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? 'Importing…' : 'Import Excel (.xlsx)'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportExcel}
              />
            </div>
            {importResult && (
              <div className={`text-sm rounded px-3 py-2 ${importResult.errors.length ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
                {importResult.imported} record{importResult.imported !== 1 ? 's' : ''} imported.
                {importResult.errors.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-xs">
                    {importResult.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                    {importResult.errors.length > 5 && <li>…and {importResult.errors.length - 5} more</li>}
                  </ul>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Backups</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Export your workspace data for safekeeping.</p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleExportBinary}>Export binary (.crmbackup)</Button>
            <Button variant="outline" onClick={handleExportJSON}>Export JSON</Button>
            <Button variant="outline" onClick={handleExportCSV}>Export CSV (zip)</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Danger zone</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDanger}>
            Leave workspace on this device
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Clears all local data for this workspace. Cannot be undone without a backup.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
