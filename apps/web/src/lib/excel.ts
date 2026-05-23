import * as XLSX from 'xlsx'
import * as Y from 'yjs'
import {
  getContacts, getCompanies, getDeals, getActivities,
  createContact, createCompany, createDeal, logActivity,
  getInvoices, getExpenses,
  createEmployee, createLeaveRequest,
  getEmployees, getLeaveRequests,
  getCards, getBoards, getColumns,
  getTickets, createTicket,
} from '@p2p-crm/platform'

// ---- helpers ----

function tsToDate(ms: number): string {
  if (!ms) return ''
  return new Date(ms).toISOString().split('T')[0] ?? ''
}

function centsToAmount(cents: number): number {
  return cents / 100
}

// ---- export ----

export function exportExcel(doc: Y.Doc, workspaceName: string) {
  const wb = XLSX.utils.book_new()

  // CRM - Contacts
  const contacts = getContacts(doc).map((c) => ({
    ID: c.id,
    'First Name': c.firstName,
    'Last Name': c.lastName,
    Email: c.email,
    Phone: c.phone,
    Mobile: c.mobile,
    'Job Title': c.jobTitle,
    'Company ID': c.companyId,
    Status: c.status,
    Source: c.source,
    'Owner ID': c.ownerId,
    Tags: c.tags.join(', '),
    LinkedIn: c.linkedin,
    Twitter: c.twitter,
    Website: c.website,
    City: c.city,
    Country: c.country,
    Notes: c.notes,
    'Last Contacted': tsToDate(c.lastContactedAt),
    'Created At': tsToDate(c.createdAt),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(contacts), 'CRM - Contacts')

  // CRM - Companies
  const companies = getCompanies(doc).map((c) => ({
    ID: c.id,
    Name: c.name,
    Industry: c.industry,
    Size: c.size,
    Website: c.website,
    Phone: c.phone,
    City: c.city,
    Country: c.country,
    Description: c.description,
    'Owner ID': c.ownerId,
    'Created At': tsToDate(c.createdAt),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(companies), 'CRM - Companies')

  // CRM - Deals
  const deals = getDeals(doc).map((d) => ({
    ID: d.id,
    Title: d.title,
    'Contact ID': d.contactId,
    'Company ID': d.companyId,
    Value: d.value,
    Currency: d.currency,
    Stage: d.stage,
    'Probability %': d.probability,
    Source: d.source,
    'Owner ID': d.ownerId,
    'Expected Close': tsToDate(d.expectedCloseDate),
    'Actual Close': tsToDate(d.actualCloseDate),
    'Lost Reason': d.lostReason,
    Description: d.description,
    'Created At': tsToDate(d.createdAt),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(deals), 'CRM - Deals')

  // CRM - Activities
  const activities = getActivities(doc).map((a) => ({
    ID: a.id,
    Type: a.type,
    Subject: a.subject,
    Description: a.description,
    'Contact ID': a.contactId,
    'Deal ID': a.dealId,
    'Company ID': a.companyId,
    Date: tsToDate(a.date),
    'Duration (min)': a.durationMinutes,
    'Actor ID': a.actorId,
    'Created At': tsToDate(a.createdAt),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(activities), 'CRM - Activities')

  // Finance - Invoices
  const invoices = getInvoices(doc).map((inv) => ({
    ID: inv.id,
    Number: inv.number,
    Customer: inv.customerName,
    Subtotal: centsToAmount(inv.subtotalCents),
    'Tax %': inv.taxPercent,
    Tax: centsToAmount(inv.taxCents),
    Total: centsToAmount(inv.totalCents),
    Currency: inv.currency,
    Status: inv.status,
    'Issue Date': tsToDate(inv.issueDate),
    'Due Date': tsToDate(inv.dueDate),
    'Paid At': tsToDate(inv.paidAt),
    Notes: inv.notes,
    'Created At': tsToDate(inv.createdAt),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoices), 'Finance - Invoices')

  // Finance - Expenses
  const expenses = getExpenses(doc).map((e) => ({
    ID: e.id,
    Vendor: e.vendor,
    Description: e.description,
    Amount: centsToAmount(e.amountCents),
    Currency: e.currency,
    'Category ID': e.categoryId,
    Date: tsToDate(e.date),
    'Payment Method': e.paymentMethod,
    Status: e.status,
    'Receipt Note': e.receiptNote,
    'Submitted By': e.submittedBy,
    'Created At': tsToDate(e.createdAt),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses), 'Finance - Expenses')

  // HR - Team
  const employees = getEmployees(doc).map((e) => ({
    ID: e.id,
    'First Name': e.firstName,
    'Last Name': e.lastName,
    Email: e.email,
    Phone: e.phone,
    Role: e.role,
    Department: e.department,
    'Employment Type': e.employmentType,
    'Start Date': tsToDate(e.startDate),
    'End Date': tsToDate(e.endDate),
    Salary: centsToAmount(e.salaryCents),
    Currency: e.currency,
    Status: e.status,
    'Manager ID': e.managerId,
    City: e.city,
    Country: e.country,
    Notes: e.notes,
    'Created At': tsToDate(e.createdAt),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(employees), 'HR - Team')

  // HR - Leave
  const leaves = getLeaveRequests(doc).map((l) => ({
    ID: l.id,
    'Employee ID': l.employeeId,
    Type: l.type,
    'Start Date': tsToDate(l.startDate),
    'End Date': tsToDate(l.endDate),
    Status: l.status,
    Reason: l.reason,
    'Approver Notes': l.approverNotes,
    'Decided By': l.decidedBy,
    'Decided At': tsToDate(l.decidedAt),
    'Created At': tsToDate(l.createdAt),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leaves), 'HR - Leave')

  // Boards - Cards
  const boards = getBoards(doc)
  const columns = getColumns(doc)
  const boardMap = Object.fromEntries(boards.map((b) => [b.id, b.name]))
  const colMap = Object.fromEntries(columns.map((c) => [c.id, c.name]))
  const cards = getCards(doc).map((c) => ({
    ID: c.id,
    Board: boardMap[c.boardId] ?? c.boardId,
    Column: colMap[c.columnId] ?? c.columnId,
    Title: c.title,
    Description: c.description,
    Assignees: c.assigneeIds.join(', '),
    Labels: c.labels.join(', '),
    Priority: c.priority,
    'Due Date': tsToDate(c.dueDate),
    'Created At': tsToDate(c.createdAt),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cards), 'Boards - Cards')

  // Support - Tickets
  const tickets = getTickets(doc).map((t) => ({
    ID: t.id,
    '#': t.number,
    Title: t.title,
    Description: t.description,
    Status: t.status,
    Priority: t.priority,
    Category: t.category,
    'Submitter Email': t.submitterEmail,
    'Submitter Name': t.submitterName,
    'Assignee Email': t.assigneeEmail,
    Tags: t.tags.join(', '),
    'Created At': tsToDate(t.createdAt),
    'Resolved At': tsToDate(t.resolvedAt),
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tickets), 'Support - Tickets')

  const date = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `${workspaceName}-${date}.xlsx`)
}

// ---- import ----

type Row = Record<string, unknown>

function str(v: unknown): string {
  return v == null ? '' : String(v)
}
function num(v: unknown): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}
function dateToTs(v: unknown): number {
  if (!v) return 0
  const d = new Date(str(v))
  return isNaN(d.getTime()) ? 0 : d.getTime()
}
function splitTags(v: unknown): string[] {
  const s = str(v).trim()
  return s ? s.split(',').map((t) => t.trim()).filter(Boolean) : []
}

export async function importExcel(
  doc: Y.Doc,
  file: File,
  actorId: string,
): Promise<{ imported: number; errors: string[] }> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  let imported = 0
  const errors: string[] = []

  function sheet(name: string): Row[] {
    const ws = wb.Sheets[name]
    if (!ws) return []
    return XLSX.utils.sheet_to_json<Row>(ws)
  }

  // CRM - Contacts
  for (const row of sheet('CRM - Contacts')) {
    try {
      createContact(doc, {
        firstName: str(row['First Name']) || 'Unknown',
        lastName: str(row['Last Name']),
        email: str(row['Email']),
        phone: str(row['Phone']),
        mobile: str(row['Mobile']),
        jobTitle: str(row['Job Title']),
        status: (str(row['Status']) as never) || 'new',
        source: (str(row['Source']) as never) || 'other',
        ownerId: actorId,
        tags: splitTags(row['Tags']),
        linkedin: str(row['LinkedIn']),
        twitter: str(row['Twitter']),
        website: str(row['Website']),
        city: str(row['City']),
        country: str(row['Country']),
        notes: str(row['Notes']),
        actorId,
      })
      imported++
    } catch (e) {
      errors.push(`Contact: ${String(e)}`)
    }
  }

  // CRM - Companies
  for (const row of sheet('CRM - Companies')) {
    try {
      createCompany(doc, {
        name: str(row['Name']) || 'Unknown',
        industry: str(row['Industry']),
        size: (str(row['Size']) as never) || 'small',
        website: str(row['Website']),
        phone: str(row['Phone']),
        city: str(row['City']),
        country: str(row['Country']),
        description: str(row['Description']),
        ownerId: actorId,
        actorId,
      })
      imported++
    } catch (e) {
      errors.push(`Company: ${String(e)}`)
    }
  }

  // CRM - Deals
  for (const row of sheet('CRM - Deals')) {
    try {
      createDeal(doc, {
        title: str(row['Title']) || 'Untitled',
        contactId: '',
        companyId: '',
        value: num(row['Value']),
        currency: str(row['Currency']) || 'USD',
        stage: (str(row['Stage']) as never) || 'lead',
        probability: num(row['Probability %']),
        source: (str(row['Source']) as never) || 'other',
        ownerId: actorId,
        expectedCloseDate: dateToTs(row['Expected Close']),
        description: str(row['Description']),
        actorId,
      })
      imported++
    } catch (e) {
      errors.push(`Deal: ${String(e)}`)
    }
  }

  // CRM - Activities
  for (const row of sheet('CRM - Activities')) {
    try {
      logActivity(doc, {
        type: (str(row['Type']) as never) || 'note',
        subject: str(row['Subject']) || '(imported)',
        description: str(row['Description']),
        contactId: '',
        dealId: '',
        companyId: '',
        date: dateToTs(row['Date']) || Date.now(),
        durationMinutes: num(row['Duration (min)']),
        actorId,
      })
      imported++
    } catch (e) {
      errors.push(`Activity: ${String(e)}`)
    }
  }

  // HR - Team
  for (const row of sheet('HR - Team')) {
    try {
      createEmployee(doc, {
        firstName: str(row['First Name']) || 'Unknown',
        lastName: str(row['Last Name']),
        email: str(row['Email']),
        phone: str(row['Phone']),
        role: str(row['Role']),
        department: str(row['Department']),
        employmentType: (str(row['Employment Type']) as never) || 'full-time',
        startDate: dateToTs(row['Start Date']),
        salaryCents: Math.round(num(row['Salary']) * 100),
        currency: str(row['Currency']) || 'USD',
        status: (str(row['Status']) as never) || 'active',
        city: str(row['City']),
        country: str(row['Country']),
        notes: str(row['Notes']),
        actorId,
      })
      imported++
    } catch (e) {
      errors.push(`Employee: ${String(e)}`)
    }
  }

  // Support - Tickets
  for (const row of sheet('Support - Tickets')) {
    try {
      createTicket(doc, {
        title: str(row['Title']) || 'Untitled',
        description: str(row['Description']),
        priority: (str(row['Priority']) as never) || 'medium',
        category: (str(row['Category']) as never) || 'general',
        submitterEmail: str(row['Submitter Email']),
        submitterName: str(row['Submitter Name']),
        assigneeEmail: str(row['Assignee Email']),
        tags: splitTags(row['Tags']),
        actorId,
      })
      imported++
    } catch (e) {
      errors.push(`Ticket: ${String(e)}`)
    }
  }

  return { imported, errors }
}
