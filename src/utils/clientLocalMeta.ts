const META_KEY = 'clientLocalMeta'

export interface ClientNote {
  id: string
  clientId: number
  text: string
  dueDate?: string | null
  createdAt: string
  author?: string | null
}

interface ClientStoreEntry {
  promisedPaymentDate?: string | null
  notes?: ClientNote[]
}

function loadStore(): Record<string, ClientStoreEntry> {
  try {
    const raw = localStorage.getItem(META_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStore(store: Record<string, ClientStoreEntry>) {
  localStorage.setItem(META_KEY, JSON.stringify(store))
}

function clientKey(clientId: number) {
  return String(clientId)
}

export function getClientPromisedPaymentDate(clientId: number): string | null {
  return loadStore()[clientKey(clientId)]?.promisedPaymentDate ?? null
}

export function setClientPromisedPaymentDate(clientId: number, date: string | null) {
  const store = loadStore()
  const key = clientKey(clientId)
  store[key] = { ...store[key], promisedPaymentDate: date }
  saveStore(store)
}

export function getClientNotes(clientId: number): ClientNote[] {
  return loadStore()[clientKey(clientId)]?.notes ?? []
}

export function addClientNote(
  clientId: number,
  note: Omit<ClientNote, 'id' | 'clientId' | 'createdAt'>,
) {
  const store = loadStore()
  const key = clientKey(clientId)
  const notes = store[key]?.notes ?? []
  const entry: ClientNote = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    clientId,
    createdAt: new Date().toISOString(),
    ...note,
  }
  store[key] = { ...store[key], notes: [entry, ...notes].slice(0, 100) }
  saveStore(store)
  return entry
}

export function deleteClientNote(clientId: number, noteId: string) {
  const store = loadStore()
  const key = clientKey(clientId)
  const notes = (store[key]?.notes ?? []).filter((note) => note.id !== noteId)
  store[key] = { ...store[key], notes }
  saveStore(store)
}
