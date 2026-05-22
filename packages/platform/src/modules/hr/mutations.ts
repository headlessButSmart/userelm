import * as Y from 'yjs'
import { nanoid } from 'nanoid'
import { HR_KEYS, type EmploymentType, type EmployeeStatus, type LeaveType, type LeaveStatus } from './schema'

// ---------- Employees ----------

export function createEmployee(doc: Y.Doc, input: {
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  role?: string
  department?: string
  employmentType?: EmploymentType
  startDate?: number
  salaryCents?: number
  currency?: string
  status?: EmployeeStatus
  managerId?: string
  city?: string
  country?: string
  notes?: string
  actorId: string
}): string {
  const id = nanoid()
  doc.transact(() => {
    const now = Date.now()
    const m = new Y.Map()
    m.set('id', id)
    m.set('firstName', input.firstName)
    m.set('lastName', input.lastName ?? '')
    m.set('email', input.email ?? '')
    m.set('phone', input.phone ?? '')
    m.set('role', input.role ?? '')
    m.set('department', input.department ?? '')
    m.set('employmentType', input.employmentType ?? 'full-time')
    m.set('startDate', input.startDate ?? now)
    m.set('endDate', 0)
    m.set('salaryCents', input.salaryCents ?? 0)
    m.set('currency', input.currency ?? 'USD')
    m.set('status', input.status ?? 'active')
    m.set('managerId', input.managerId ?? '')
    m.set('city', input.city ?? '')
    m.set('country', input.country ?? '')
    m.set('notes', input.notes ?? '')
    m.set('createdBy', input.actorId)
    m.set('createdAt', now)
    m.set('updatedAt', now)
    doc.getMap(HR_KEYS.employees).set(id, m)
  }, 'user')
  return id
}

export function updateEmployee(doc: Y.Doc, id: string, patch: Partial<{
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  department: string
  employmentType: EmploymentType
  startDate: number
  endDate: number
  salaryCents: number
  currency: string
  status: EmployeeStatus
  managerId: string
  city: string
  country: string
  notes: string
}>) {
  doc.transact(() => {
    const m = doc.getMap(HR_KEYS.employees).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    for (const [k, v] of Object.entries(patch)) if (v !== undefined) m.set(k, v)
    m.set('updatedAt', Date.now())
  }, 'user')
}

export function deleteEmployee(doc: Y.Doc, id: string) {
  doc.transact(() => doc.getMap(HR_KEYS.employees).delete(id), 'user')
}

// ---------- Leave requests ----------

export function createLeaveRequest(doc: Y.Doc, input: {
  employeeId: string
  type: LeaveType
  startDate: number
  endDate: number
  reason?: string
  actorId: string
}): string {
  const id = nanoid()
  doc.transact(() => {
    const now = Date.now()
    const m = new Y.Map()
    m.set('id', id)
    m.set('employeeId', input.employeeId)
    m.set('type', input.type)
    m.set('startDate', input.startDate)
    m.set('endDate', input.endDate)
    m.set('status', 'pending')
    m.set('reason', input.reason ?? '')
    m.set('approverNotes', '')
    m.set('decidedBy', '')
    m.set('decidedAt', 0)
    m.set('createdAt', now)
    m.set('updatedAt', now)
    doc.getMap(HR_KEYS.leaveRequests).set(id, m)
  }, 'user')
  return id
}

export function decideLeaveRequest(doc: Y.Doc, id: string, input: {
  status: 'approved' | 'rejected'
  approverNotes?: string
  actorId: string
}) {
  doc.transact(() => {
    const m = doc.getMap(HR_KEYS.leaveRequests).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    m.set('status', input.status)
    m.set('approverNotes', input.approverNotes ?? '')
    m.set('decidedBy', input.actorId)
    m.set('decidedAt', Date.now())
    m.set('updatedAt', Date.now())

    // If approved and dates cover today, flip employee status to on-leave
    if (input.status === 'approved') {
      const employeeId = m.get('employeeId') as string
      const startDate = (m.get('startDate') as number) ?? 0
      const endDate = (m.get('endDate') as number) ?? 0
      const now = Date.now()
      if (employeeId && startDate <= now && now <= endDate) {
        const emp = doc.getMap(HR_KEYS.employees).get(employeeId) as Y.Map<unknown> | undefined
        if (emp && emp.get('status') === 'active') emp.set('status', 'on-leave')
      }
    }
  }, 'user')
}

export function cancelLeaveRequest(doc: Y.Doc, id: string) {
  doc.transact(() => {
    const m = doc.getMap(HR_KEYS.leaveRequests).get(id) as Y.Map<unknown> | undefined
    if (!m) return
    m.set('status', 'cancelled')
    m.set('updatedAt', Date.now())
  }, 'user')
}

export function deleteLeaveRequest(doc: Y.Doc, id: string) {
  doc.transact(() => doc.getMap(HR_KEYS.leaveRequests).delete(id), 'user')
}
