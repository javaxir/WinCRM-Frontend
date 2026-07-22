import type { AuditLog } from '@/services/audit'
import { PERMISSION_MENU_GROUPS } from '@/utils/permissionGroups'

export type AuditGroupKey =
  | 'all'
  | 'sales'
  | 'finance'
  | 'expenses'
  | 'warehouse'
  | 'goods'
  | 'clients'
  | 'suppliers'
  | 'sms'
  | 'users'
  | 'auth'
  | 'settings'
  | 'other'

export const AUDIT_TAB_ORDER: AuditGroupKey[] = [
  'all',
  'sales',
  'finance',
  'expenses',
  'warehouse',
  'goods',
  'clients',
  'suppliers',
  'sms',
  'users',
  'auth',
  'settings',
  'other',
]

const ENTITY_TO_GROUP = new Map<string, Exclude<AuditGroupKey, 'all' | 'other'>>()

for (const group of PERMISSION_MENU_GROUPS) {
  for (const entityKey of group.entityKeys) {
    ENTITY_TO_GROUP.set(entityKey, group.key as Exclude<AuditGroupKey, 'all' | 'other'>)
  }
}

function normalizeEntity(entity: string) {
  return entity.trim().toUpperCase().replace(/[\s-]+/g, '_')
}

export function resolveAuditGroupKey(entity: string | undefined | null): Exclude<AuditGroupKey, 'all'> {
  const normalized = normalizeEntity(entity || '')
  if (!normalized) return 'other'

  if (/AUTH|LOGIN|LOGOUT|SESSION|TOKEN/.test(normalized)) return 'auth'

  const direct = ENTITY_TO_GROUP.get(normalized)
  if (direct) return direct

  for (const [entityKey, groupKey] of ENTITY_TO_GROUP.entries()) {
    if (normalized.includes(entityKey) || entityKey.includes(normalized)) return groupKey
  }

  if (normalized.includes('SALE') && normalized.includes('ORDER')) return 'sales'
  if (normalized.includes('PAYMENT')) return 'finance'
  if (normalized.includes('EXPENSE')) return 'expenses'
  if (normalized.includes('WAREHOUSE') || normalized.includes('STOCK')) return 'warehouse'
  if (normalized.includes('GOODS') || normalized.includes('UNIT')) return 'goods'
  if (normalized.includes('CLIENT')) return 'clients'
  if (normalized.includes('SUPPLIER')) return 'suppliers'
  if (normalized.includes('DEBT') || normalized.includes('SMS') || normalized.includes('NOTIFICATION')) return 'sms'
  if (normalized.includes('USER')) return 'users'
  if (normalized.includes('ROLE') || normalized.includes('PERMISSION') || normalized.includes('COMPANY') || normalized.includes('BOT') || normalized.includes('AUDIT') || normalized.includes('ESKIZ')) {
    return 'settings'
  }

  return 'other'
}

export type AuditActionCategory = 'create' | 'update' | 'delete' | 'auth' | 'other'

export function resolveAuditActionCategory(action: string | undefined | null): AuditActionCategory {
  const value = action?.toUpperCase() ?? ''
  if (value.includes('CREATE') || value.includes('INSERT')) return 'create'
  if (value.includes('UPDATE') || value.includes('EDIT')) return 'update'
  if (value.includes('DELETE') || value.includes('REMOVE')) return 'delete'
  if (value.includes('LOGIN') || value.includes('LOGOUT') || value.includes('AUTH')) return 'auth'
  return 'other'
}

export function groupAuditLogsByModule(logs: AuditLog[]) {
  const counts = Object.fromEntries(AUDIT_TAB_ORDER.map((key) => [key, 0])) as Record<AuditGroupKey, number>
  for (const log of logs) {
    const key = resolveAuditGroupKey(log.entity)
    counts[key] += 1
    counts.all += 1
  }
  return counts
}

export function filterAuditLogsByTab(logs: AuditLog[], tab: AuditGroupKey) {
  if (tab === 'all') return logs
  return logs.filter((log) => resolveAuditGroupKey(log.entity) === tab)
}

export function resolveAuditEntityKey(entity: string | undefined | null) {
  const normalized = normalizeEntity(entity || '')
  if (!normalized) return null

  const keys = [...ENTITY_TO_GROUP.keys()].sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (normalized === key || normalized.includes(key)) return key
  }
  return normalized
}
