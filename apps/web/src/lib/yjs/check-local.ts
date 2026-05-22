import { openDB } from 'idb'

export async function hasLocalData(roomId: string): Promise<boolean> {
  const dbName = `crm-${roomId}`
  try {
    const db = await openDB(dbName)
    if (!db.objectStoreNames.contains('updates')) {
      db.close()
      return false
    }
    const count = await db.transaction('updates').objectStore('updates').count()
    db.close()
    return count > 0
  } catch {
    return false
  }
}
