'use client'
import { FileJson, ChevronDown, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { exportJSON, pickJSONFile } from '@/lib/io/json'

interface Props<TRecord> {
  record: TRecord
  /** Filename stem for the download */
  filenameBase: string
  /**
   * Called when the user picks a JSON file. The argument is the parsed file
   * contents — its shape is whatever the user uploads, so it's intentionally
   * typed loosely. The caller is responsible for narrowing/validating before
   * passing it to a mutation.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onImport: (patch: any) => void
}

export function RecordJsonMenu<TRecord>({ record, filenameBase, onImport }: Props<TRecord>) {
  async function handleImport() {
    const data = await pickJSONFile<unknown>()
    if (!data) return
    if (!confirm('Apply this JSON to the current record? Fields present in the file will overwrite existing values.')) return
    onImport(data)
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <FileJson className="h-3.5 w-3.5" /> JSON <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportJSON(record, filenameBase)}>
          <Download className="h-4 w-4" /> Download as JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleImport}>
          <Upload className="h-4 w-4" /> Apply from JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
