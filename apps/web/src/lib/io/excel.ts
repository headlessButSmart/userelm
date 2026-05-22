'use client'
import * as XLSX from 'xlsx'
import type { ColumnSchema } from './column-schema'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * Export a list of rows to an Excel file. Headers come from the schema.
 */
export function exportRowsToExcel<TRow, TInput>(opts: {
  rows: TRow[]
  schema: ColumnSchema<TRow, TInput>[]
  filenameBase: string
  sheetName?: string
}) {
  const headers = opts.schema.map((c) => c.header)
  const data = opts.rows.map((row) => {
    const o: Record<string, unknown> = {}
    for (const c of opts.schema) o[c.header] = c.get(row)
    return o
  })
  const worksheet = XLSX.utils.json_to_sheet(data, { header: headers })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, opts.sheetName ?? 'Sheet1')
  const out = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const date = new Date().toISOString().slice(0, 10)
  downloadBlob(blob, `${slugify(opts.filenameBase)}-${date}.xlsx`)
}

/**
 * Generate a template Excel file with headers only (no rows). Useful so users
 * can fill it in and import.
 */
export function exportEmptyTemplate<TRow, TInput>(opts: {
  schema: ColumnSchema<TRow, TInput>[]
  filenameBase: string
}) {
  exportRowsToExcel<TRow, TInput>({ rows: [], schema: opts.schema, filenameBase: `${opts.filenameBase}-template` })
}

/**
 * Parse an Excel/CSV file into partial input objects according to the schema.
 * Returns { ok: true, rows } or { ok: false, error }.
 */
export async function parseExcelFile<TRow, TInput>(
  file: File,
  schema: ColumnSchema<TRow, TInput>[],
): Promise<{ ok: true; rows: Partial<TInput>[] } | { ok: false; error: string }> {
  try {
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array', cellDates: true })
    const sheetName = wb.SheetNames[0]
    if (!sheetName) return { ok: false, error: 'No sheets in workbook' }
    const sheet = wb.Sheets[sheetName]!
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: true })

    const headerByField = new Map<string, string>()
    for (const c of schema) headerByField.set(c.field, c.header)

    const rows: Partial<TInput>[] = []
    for (const row of json) {
      const out: Record<string, unknown> = {}
      for (const c of schema) {
        const cell = row[c.header]
        if (cell === undefined || cell === '') continue
        out[c.field] = c.parse ? c.parse(cell) : cell
      }
      rows.push(out as Partial<TInput>)
    }
    return { ok: true, rows }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
