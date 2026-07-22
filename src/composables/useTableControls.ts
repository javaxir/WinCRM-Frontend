import { ref, computed, type Ref, type ComputedRef } from 'vue'

export type SortDirection = 'asc' | 'desc'

export interface TableColumnDef {
  key: string
  label: string
  sortable?: boolean
  hideable?: boolean
  defaultVisible?: boolean
}

function compareValues(av: unknown, bv: unknown, dir: number): number {
  if (av == null && bv == null) return 0
  if (av == null) return 1
  if (bv == null) return -1

  if (typeof av === 'number' && typeof bv === 'number') {
    return (av - bv) * dir
  }

  const as = String(av).toLowerCase()
  const bs = String(bv).toLowerCase()
  if (as < bs) return -1 * dir
  if (as > bs) return 1 * dir
  return 0
}

export function sortItems<T>(
  items: T[],
  sortKey: string | null,
  sortDir: SortDirection,
  getValue: (row: T, key: string) => unknown,
): T[] {
  if (!sortKey) return items
  const dir = sortDir === 'asc' ? 1 : -1
  return [...items].sort((a, b) => compareValues(getValue(a, sortKey), getValue(b, sortKey), dir))
}

export function useTableSort<T>(getValue: (row: T, key: string) => unknown) {
  const sortKey = ref<string | null>(null)
  const sortDir = ref<SortDirection>('asc')

  const toggleSort = (key: string) => {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
  }

  const applySort = (items: T[]) => sortItems(items, sortKey.value, sortDir.value, getValue)

  return { sortKey, sortDir, toggleSort, applySort }
}

export function useTableSortRef<T>(
  data: Ref<T[]> | ComputedRef<T[]>,
  getValue: (row: T, key: string) => unknown,
) {
  const sortKey = ref<string | null>(null)
  const sortDir = ref<SortDirection>('asc')

  const toggleSort = (key: string) => {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
  }

  const sortedData = computed(() =>
    sortItems(
      'value' in data ? data.value : (data as Ref<T[]>).value,
      sortKey.value,
      sortDir.value,
      getValue,
    ),
  )

  return { sortKey, sortDir, toggleSort, sortedData }
}

export function useColumnVisibility(columns: TableColumnDef[], storageKey: string) {
  const visible = ref<Record<string, boolean>>(
    Object.fromEntries(columns.map((c) => [c.key, c.defaultVisible !== false])),
  )

  const loadFromStorage = () => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as Record<string, boolean>
      columns.forEach((c) => {
        if (c.hideable !== false && parsed[c.key] !== undefined) {
          visible.value[c.key] = parsed[c.key]
        }
      })
    } catch {
      // ignore
    }
  }

  const saveToStorage = () => {
    localStorage.setItem(storageKey, JSON.stringify(visible.value))
  }

  const toggleColumn = (key: string) => {
    visible.value[key] = !visible.value[key]
    saveToStorage()
  }

  const isVisible = (key: string) => visible.value[key] !== false

  const hideableColumns = computed(() => columns.filter((c) => c.hideable !== false))

  loadFromStorage()

  return { visible, toggleColumn, isVisible, hideableColumns }
}
