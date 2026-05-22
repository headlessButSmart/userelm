export const HR_KEYS = {
  employees: 'employees',
  leaveRequests: 'leaveRequests',
} as const

export type EmploymentType = 'full-time' | 'part-time' | 'contractor' | 'intern'
export type EmployeeStatus = 'active' | 'on-leave' | 'terminated'
export type LeaveType = 'vacation' | 'sick' | 'personal' | 'parental' | 'other'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface EmployeeRow {
  id: string
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
  managerId: string         // optional link to another employee id
  city: string
  country: string
  notes: string
  createdBy: string
  createdAt: number
  updatedAt: number
}

export interface LeaveRequestRow {
  id: string
  employeeId: string
  type: LeaveType
  startDate: number
  endDate: number
  status: LeaveStatus
  reason: string
  approverNotes: string
  decidedBy: string
  decidedAt: number
  createdAt: number
  updatedAt: number
}

export const EMPLOYMENT_TYPES: EmploymentType[] = ['full-time', 'part-time', 'contractor', 'intern']
export const EMPLOYEE_STATUSES: EmployeeStatus[] = ['active', 'on-leave', 'terminated']
export const LEAVE_TYPES: LeaveType[] = ['vacation', 'sick', 'personal', 'parental', 'other']
export const LEAVE_STATUSES: LeaveStatus[] = ['pending', 'approved', 'rejected', 'cancelled']
