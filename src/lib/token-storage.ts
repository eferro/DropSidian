const DB_NAME = 'dropsidian'
const DB_VERSION = 1
const STORE_NAME = 'tokens'
const TOKEN_KEY = 'refresh_token'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export async function storeRefreshToken(refreshToken: string): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(refreshToken, TOKEN_KEY)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getRefreshToken(): Promise<string | null> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(TOKEN_KEY)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result ?? null)
  })
}

export async function clearRefreshToken(): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(TOKEN_KEY)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

