import { nanoid } from 'nanoid'

const STORAGE_KEY = 'p2p-crm:identity'

export interface Identity {
  userId: string
  displayName: string
  email?: string
}

export function getOrCreateIdentity(defaultName?: string): Identity {
  if (typeof window === 'undefined') throw new Error('client only')
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) return JSON.parse(existing) as Identity
  const identity: Identity = {
    userId: nanoid(),
    displayName: defaultName ?? 'New member',
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity))
  return identity
}

export function updateDisplayName(name: string) {
  const id = getOrCreateIdentity()
  id.displayName = name
  localStorage.setItem(STORAGE_KEY, JSON.stringify(id))
}

export function updateEmail(email: string) {
  const id = getOrCreateIdentity()
  id.email = email
  localStorage.setItem(STORAGE_KEY, JSON.stringify(id))
}
