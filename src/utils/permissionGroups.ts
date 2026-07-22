import type { PermissionsResponse } from '@/services/roles'

export interface ParsedPermission {
  permission: PermissionsResponse
  entityKey: string
  actionKey: string
}

export interface PermissionEntityGroup {
  entityKey: string
  permissions: ParsedPermission[]
}

export interface PermissionMenuGroup {
  key: string
  labelKey: string
  entityKeys: string[]
  entities: PermissionEntityGroup[]
}

export const PERMISSION_MENU_GROUPS: { key: string; labelKey: string; entityKeys: string[] }[] = [
  {
    key: 'sales',
    labelKey: 'permissionGroups.sales',
    entityKeys: ['SALE_ORDER', 'SALE_ORDER_ITEM', 'DASHBOARD'],
  },
  {
    key: 'finance',
    labelKey: 'permissionGroups.finance',
    entityKeys: ['PAYMENT', 'PAYMENT_TYPE'],
  },
  {
    key: 'expenses',
    labelKey: 'permissionGroups.expenses',
    entityKeys: ['EXPENSE', 'EXPENSE_CATEGORY'],
  },
  {
    key: 'warehouse',
    labelKey: 'permissionGroups.warehouse',
    entityKeys: [
      'WAREHOUSE',
      'WAREHOUSE_ORDER',
      'WAREHOUSE_ORDER_ITEM',
      'STOCK',
      'STOCK_HISTORY',
      'STOCK_HISTORIES',
      'STOCK_TRANSFER',
      'INVENTORY_CHECK',
    ],
  },
  {
    key: 'goods',
    labelKey: 'permissionGroups.goods',
    entityKeys: ['GOODS', 'GOODS_GROUP', 'UNIT_TYPE'],
  },
  {
    key: 'clients',
    labelKey: 'permissionGroups.clients',
    entityKeys: ['CLIENT', 'CLIENT_GROUP', 'CLIENT_BALANCE', 'CLIENT_NOTE'],
  },
  {
    key: 'suppliers',
    labelKey: 'permissionGroups.suppliers',
    entityKeys: ['SUPPLIER', 'SUPPLIER_PAYMENT', 'SUPPLIER_BALANCE'],
  },
  {
    key: 'sms',
    labelKey: 'permissionGroups.sms',
    entityKeys: ['DEBT_NOTIFICATION'],
  },
  {
    key: 'users',
    labelKey: 'permissionGroups.users',
    entityKeys: ['USER'],
  },
  {
    key: 'settings',
    labelKey: 'permissionGroups.settings',
    entityKeys: ['ROLE', 'PERMISSION', 'AUDIT', 'BOT_SETTINGS', 'COMPANY_DETAIL'],
  },
]

const ACTION_ORDER = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'SEND', 'OTHER']

export function parsePermissionName(name: string): { entityKey: string; actionKey: string } {
  const standard = name.match(/^(.+)_(VIEW|EDIT|DELETE|CREATE)$/)
  if (standard) {
    return { entityKey: standard[1], actionKey: standard[2] }
  }

  const debt = name.match(/^(DEBT_NOTIFICATION)_(SEND|VIEW)$/)
  if (debt) {
    return { entityKey: debt[1], actionKey: debt[2] }
  }

  return { entityKey: name, actionKey: 'OTHER' }
}

export function groupPermissions(permissions: PermissionsResponse[]): PermissionMenuGroup[] {
  const parsed = permissions.map((permission) => ({
    permission,
    ...parsePermissionName(permission.name),
  }))

  const byEntity = new Map<string, ParsedPermission[]>()
  for (const item of parsed) {
    const list = byEntity.get(item.entityKey) ?? []
    list.push(item)
    byEntity.set(item.entityKey, list)
  }

  const usedEntities = new Set<string>()
  const groups: PermissionMenuGroup[] = []

  for (const group of PERMISSION_MENU_GROUPS) {
    const entities: PermissionEntityGroup[] = []
    for (const entityKey of group.entityKeys) {
      const entityPermissions = byEntity.get(entityKey)
      if (!entityPermissions?.length) continue
      usedEntities.add(entityKey)
      entities.push({
        entityKey,
        permissions: sortParsedPermissions(entityPermissions),
      })
    }
    if (entities.length) {
      groups.push({ ...group, entities })
    }
  }

  const otherEntities: PermissionEntityGroup[] = []
  for (const [entityKey, entityPermissions] of byEntity.entries()) {
    if (usedEntities.has(entityKey)) continue
    otherEntities.push({
      entityKey,
      permissions: sortParsedPermissions(entityPermissions),
    })
  }

  if (otherEntities.length) {
    const settingsGroup = groups.find((group) => group.key === 'settings')
    if (settingsGroup) {
      settingsGroup.entities.push(...otherEntities)
    } else {
      groups.push({
        key: 'settings',
        labelKey: 'permissionGroups.settings',
        entityKeys: [],
        entities: otherEntities,
      })
    }
  }

  return groups
}

function sortParsedPermissions(items: ParsedPermission[]) {
  return [...items].sort((a, b) => {
    const actionDiff = ACTION_ORDER.indexOf(a.actionKey) - ACTION_ORDER.indexOf(b.actionKey)
    if (actionDiff !== 0) return actionDiff
    return a.permission.name.localeCompare(b.permission.name)
  })
}

export function flattenGroupPermissions(group: PermissionMenuGroup) {
  return group.entities.flatMap((entity) => entity.permissions.map((item) => item.permission))
}
