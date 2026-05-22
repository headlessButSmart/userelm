import * as Y from 'yjs'
import { HR_KEYS, type EmployeeRow, type LeaveRequestRow } from './schema'

function readMap<T>(m: Y.Map<unknown>, mapper: (v: Y.Map<unknown>) => T): T[] {
  const rows: T[] = []
  m.forEach((v) => { if (v instanceof Y.Map) rows.push(mapper(v)) })
  return rows
}

function readEmployee(m: Y.Map<unknown>): EmployeeRow {
  return {
    id: (m.get('id') as string) ?? '',
    firstName: (m.get('firstName') as string) ?? '',
    lastName: (m.get('lastName') as string) ?? '',
    email: (m.get('email') as string) ?? '',
    phone: (m.get('phone') as string) ?? '',
    role: (m.get('role') as string) ?? '',
    department: (m.get('department') as string) ?? '',
    employmentType: ((m.get('employmentType') as EmployeeRow['employmentType']) ?? 'full-time'),
    startDate: (m.get('startDate') as number) ?? 0,
    endDate: (m.get('endDate') as number) ?? 0,
    salaryCents: (m.get('salaryCents') as number) ?? 0,
    currency: (m.get('currency') as string) ?? 'USD',
    status: ((m.get('status') as EmployeeRow['status']) ?? 'active'),
    managerId: (m.get('managerId') as string) ?? '',
    city: (m.get('city') as string) ?? '',
    country: (m.get('country') as string) ?? '',
    notes: (m.get('notes') as string) ?? '',
    createdBy: (m.get('createdBy') as string) ?? '',
    createdAt: (m.get('createdAt') as number) ?? 0,
    updatedAt: (m.get('updatedAt') as number) ?? 0,
  }
}

function readLeave(m: Y.Map<unknown>): LeaveRequestRow {
  return {
    id: (m.get('id') as string) ?? '',
    employeeId: (m.get('employeeId') as string) ?? '',
    type: ((m.get('type') as LeaveRequestRow['type']) ?? 'vacation'),
    startDate: (m.get('startDate') as number) ?? 0,
    endDate: (m.get('endDate') as number) ?? 0,
    status: ((m.get('status') as LeaveRequestRow['status']) ?? 'pending'),
    reason: (m.get('reason') as string) ?? '',
    approverNotes: (m.get('approverNotes') as string) ?? '',
    decidedBy: (m.get('decidedBy') as string) ?? '',
    decidedAt: (m.get('decidedAt') as number) ?? 0,
    createdAt: (m.get('createdAt') as number) ?? 0,
    updatedAt: (m.get('updatedAt') as number) ?? 0,
  }
}

export function getEmployees(doc: Y.Doc): EmployeeRow[] {
  return readMap(doc.getMap(HR_KEYS.employees), readEmployee).sort((a, b) =>
    (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName),
  )
}
export function getEmployee(doc: Y.Doc, id: string): EmployeeRow | null {
  const m = doc.getMap(HR_KEYS.employees).get(id) as Y.Map<unknown> | undefined
  return m ? readEmployee(m) : null
}

export function getLeaveRequests(doc: Y.Doc): LeaveRequestRow[] {
  return readMap(doc.getMap(HR_KEYS.leaveRequests), readLeave).sort((a, b) => b.startDate - a.startDate)
}
export function getLeaveRequestsByEmployee(doc: Y.Doc, employeeId: string): LeaveRequestRow[] {
  return getLeaveRequests(doc).filter((r) => r.employeeId === employeeId)
}

export function employeeDisplayName(e: EmployeeRow): string {
  const name = `${e.firstName} ${e.lastName}`.trim()
  return name || e.email || 'Unnamed'
}
