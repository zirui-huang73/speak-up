import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface AppDB extends DBSchema {
  kv: { key: string; value: unknown }
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | undefined

function getDB() {
  dbPromise ??= openDB<AppDB>('speak-up', 1, {
    upgrade(db) {
      db.createObjectStore('kv')
    },
  })
  return dbPromise
}

export async function getValue<T>(key: string): Promise<T | undefined> {
  return (await (await getDB()).get('kv', key)) as T | undefined
}

export async function setValue<T>(key: string, value: T): Promise<void> {
  await (await getDB()).put('kv', value, key)
}

export async function allEntries(): Promise<Record<string, unknown>> {
  const db = await getDB()
  const [keys, values] = await Promise.all([db.getAllKeys('kv'), db.getAll('kv')])
  return Object.fromEntries(keys.map((k, i) => [String(k), values[i]]))
}

export async function replaceAll(data: Record<string, unknown>): Promise<void> {
  const tx = (await getDB()).transaction('kv', 'readwrite')
  await tx.store.clear()
  for (const [key, value] of Object.entries(data)) await tx.store.put(value, key)
  await tx.done
}
