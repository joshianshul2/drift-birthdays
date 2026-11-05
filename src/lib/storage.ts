import { DEFAULT_SETTINGS, type Person, type Settings } from './types'

// People (with photos) live in IndexedDB — localStorage's ~5MB cap would fill
// up after ~100 photos. Settings are tiny and stay in localStorage.

const DB_NAME = 'drift-birthdays'
const STORE = 'people'
const SETTINGS_KEY = 'drift.settings'

let dbPromise: Promise<IDBDatabase> | null = null

function db(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE, { keyPath: 'id' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => {
        dbPromise = null
        reject(req.error)
      }
    })
  }
  return dbPromise
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const tx = d.transaction(STORE, mode)
        const req = fn(tx.objectStore(STORE))
        tx.oncomplete = () => resolve(req.result)
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'))
      }),
  )
}

export const listPeople = () => run<Person[]>('readonly', (s) => s.getAll())
export const savePerson = (p: Person) => run('readwrite', (s) => s.put(p)).then(() => undefined)
export const deletePerson = (id: number) => run('readwrite', (s) => s.delete(id)).then(() => undefined)

/** Notification IDs are person.id * 10 + slot, and Android IDs are 32-bit ints. */
export const MAX_PERSON_ID = 200_000_000

export function nextId(existing: Person[]): number {
  const max = existing.reduce((m, p) => Math.max(m, p.id), 0)
  if (max + 1 > MAX_PERSON_ID) throw new Error('ID space exhausted')
  return max + 1
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch {
    /* non-fatal: settings fall back to defaults */
  }
}

/** Ask the WebView not to evict our data under storage pressure. */
export function requestPersistence(): void {
  navigator.storage?.persist?.().catch(() => {})
}
