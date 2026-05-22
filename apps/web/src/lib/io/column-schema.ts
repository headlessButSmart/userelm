/**
 * A ColumnSchema describes how to serialize/deserialize one field of a record
 * for spreadsheet I/O. Modules declare these once and re-use across export
 * and import flows.
 */
export interface ColumnSchema<TRow, TInput> {
  /** Spreadsheet header label */
  header: string
  /** Read from a row to produce the cell value (string | number | boolean | Date) */
  get: (row: TRow) => unknown
  /** Parse from a spreadsheet cell value into a partial of the create-input shape */
  parse?: (cell: unknown) => unknown
  /** Field key on the create-input object */
  field: keyof TInput & string
}

/** Convenience: a column where get and field share a name and no parsing is needed */
export function col<TRow, TInput>(
  field: keyof TInput & keyof TRow & string,
  header?: string,
  opts?: Partial<Pick<ColumnSchema<TRow, TInput>, 'get' | 'parse'>>,
): ColumnSchema<TRow, TInput> {
  return {
    header: header ?? humanize(field),
    field,
    get: opts?.get ?? ((row: TRow) => (row as Record<string, unknown>)[field]),
    parse: opts?.parse,
  }
}

function humanize(s: string): string {
  return s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim()
}

/** Helpers for common money/date transforms */
export const transforms = {
  /** Cents → dollars (number) on export; dollars → cents on import */
  money: <T, I>(field: keyof T & keyof I & string, header?: string): ColumnSchema<T, I> => ({
    header: header ?? humanize(field),
    field,
    get: (row) => {
      const v = (row as Record<string, number>)[field]
      return typeof v === 'number' ? v / 100 : 0
    },
    parse: (cell) => {
      const n = parseFloat(String(cell ?? '0'))
      return Math.round((isNaN(n) ? 0 : n) * 100)
    },
  }),
  /** unix ms → ISO date string on export; date string → unix ms on import */
  date: <T, I>(field: keyof T & keyof I & string, header?: string): ColumnSchema<T, I> => ({
    header: header ?? humanize(field),
    field,
    get: (row) => {
      const v = (row as Record<string, number>)[field]
      return typeof v === 'number' && v > 0 ? new Date(v).toISOString().slice(0, 10) : ''
    },
    parse: (cell) => {
      if (!cell) return 0
      if (cell instanceof Date) return cell.getTime()
      const t = new Date(String(cell)).getTime()
      return isNaN(t) ? 0 : t
    },
  }),
}
