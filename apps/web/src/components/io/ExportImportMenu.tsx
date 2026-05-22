'use client'
import { useState } from 'react'
import { Download, Upload, FileSpreadsheet, FileJson, FileDown, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { exportRowsToExcel, exportEmptyTemplate, parseExcelFile } from '@/lib/io/excel'
import { exportJSON, pickJSONFile, pickFile } from '@/lib/io/json'
import type { ColumnSchema } from '@/lib/io/column-schema'

interface Props<TRow, TInput> {
  /** Records currently shown (used for "export visible") */
  rows: TRow[]
  /** Spreadsheet column schema */
  schema: ColumnSchema<TRow, TInput>[]
  /** Human name for the entity type, used in filenames + dialog text */
  entityName: string   // e.g. "contacts"
  /** Called once per row from an imported Excel/JSON file */
  onImportRow: (input: Partial<TInput>) => void
}

export function ExportImportMenu<TRow, TInput>({
  rows, schema, entityName, onImportRow,
}: Props<TRow, TInput>) {
  const [busy, setBusy] = useState(false)

  async function importExcel() {
    const file = await pickFile('.xlsx,.xls,.csv')
    if (!file) return
    setBusy(true)
    try {
      const result = await parseExcelFile<TRow, TInput>(file, schema)
      if (!result.ok) {
        alert(`Import failed: ${result.error}`)
        return
      }
      if (!confirm(`Import ${result.rows.length} ${entityName} from this file?`)) return
      for (const row of result.rows) onImportRow(row)
    } finally {
      setBusy(false)
    }
  }

  async function importJSON() {
    const data = await pickJSONFile<Partial<TInput> | Partial<TInput>[]>()
    if (!data) return
    const rows = Array.isArray(data) ? data : [data]
    if (!confirm(`Import ${rows.length} ${entityName} from JSON?`)) return
    for (const row of rows) onImportRow(row)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={busy}>
          <FileDown className="h-3.5 w-3.5" /> Import / Export <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => exportRowsToExcel({ rows, schema, filenameBase: entityName })}>
          <FileSpreadsheet className="h-4 w-4" /> Export to Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportJSON(rows, entityName)}>
          <FileJson className="h-4 w-4" /> Export to JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={importExcel}>
          <Upload className="h-4 w-4" /> Import from Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={importJSON}>
          <Upload className="h-4 w-4" /> Import from JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => exportEmptyTemplate({ schema, filenameBase: entityName })}>
          <Download className="h-4 w-4" /> Download blank template
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
