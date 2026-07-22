<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="space-y-5 sm:space-y-6">
      <div
        class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">
              {{ t('routes.auditLogs') }}
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ t('auditLogsPage.subtitle') }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <TableColumnToggle
              :columns="TABLE_COLUMNS"
              :visible="visible"
              @toggle="toggleColumn"
            />
            <ActionIconButton action="refresh" @click="loadLogs" />
          </div>
        </div>

        <div v-if="errorMessage" class="px-6 pb-4">
          <div
            class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {{ errorMessage }}
          </div>
        </div>

        <div class="border-t border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-6">
          <div
            class="inline-flex w-full gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-gray-100 p-1.5 dark:border-gray-800 dark:bg-gray-900 custom-scrollbar"
          >
            <button
              v-for="tab in moduleTabs"
              :key="tab.key"
              type="button"
              @click="activeTab = tab.key"
              :class="[
                'inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white',
              ]"
            >
              {{ tab.label }}
              <span
                class="rounded-full px-2 py-0.5 text-xs tabular-nums"
                :class="
                  activeTab === tab.key
                    ? 'bg-brand-500/10 text-brand-600'
                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                "
              >
                {{ tab.count }}
              </span>
            </button>
          </div>

          <p
            v-if="activeTabHint"
            class="mt-3 text-sm text-gray-500 dark:text-gray-400"
          >
            {{ activeTabHint }}
          </p>
        </div>

        <div
          class="flex flex-wrap items-end gap-4 px-6 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800"
        >
          <DateRangePicker
            v-model:start-date="dateFrom"
            v-model:end-date="dateTo"
            label="Sana oralig‘i"
          />
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Sahifada
            </label>
            <select v-model.number="pageSize" :class="filterInputClass">
              <option :value="50">50 ta</option>
              <option :value="100">100 ta</option>
            </select>
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Qidirish
            </label>
            <input
              v-model="search"
              type="text"
              placeholder="Foydalanuvchi, entity, action..."
              :class="[filterInputClass, 'w-full']"
            />
          </div>
          <ActionIconButton action="reset" @click="resetFilters" />
        </div>

        <div
          class="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm text-gray-500 border-t border-gray-100 dark:border-gray-800 dark:text-gray-400"
        >
          <span>
            Jami:
            <strong class="text-gray-700 dark:text-gray-300">{{ filteredLogs.length }}</strong> ta
            <span v-if="activeTab !== 'all'" class="text-gray-400">
              ({{ activeTabLabel }})
            </span>
          </span>
          <div v-if="totalPages > 0" class="flex items-center gap-2">
            <span>Sahifa:</span>
            <select v-model.number="currentPage" :class="[filterInputClass, '!w-20']">
              <option v-for="p in totalPages" :key="p" :value="p">{{ p }}</option>
            </select>
            <span>/ {{ totalPages }}</span>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh
                    v-if="isVisible('id')"
                    label="ID"
                    sortable
                    :active="sortKey === 'id'"
                    :direction="sortKey === 'id' ? sortDir : null"
                    @sort="toggleSort('id')"
                  />
                  <SortableTh
                    v-if="isVisible('username')"
                    label="Foydalanuvchi"
                    sortable
                    :active="sortKey === 'username'"
                    :direction="sortKey === 'username' ? sortDir : null"
                    @sort="toggleSort('username')"
                  />
                  <SortableTh
                    v-if="isVisible('entity')"
                    label="Entity"
                    sortable
                    :active="sortKey === 'entity'"
                    :direction="sortKey === 'entity' ? sortDir : null"
                    @sort="toggleSort('entity')"
                  />
                  <SortableTh
                    v-if="isVisible('action')"
                    label="Action"
                    sortable
                    :active="sortKey === 'action'"
                    :direction="sortKey === 'action' ? sortDir : null"
                    @sort="toggleSort('action')"
                  />
                  <SortableTh
                    v-if="isVisible('description')"
                    label="Tavsif"
                    sortable
                    :active="sortKey === 'description'"
                    :direction="sortKey === 'description' ? sortDir : null"
                    @sort="toggleSort('description')"
                  />
                  <SortableTh
                    v-if="isVisible('ipAddress')"
                    label="IP"
                    sortable
                    :active="sortKey === 'ipAddress'"
                    :direction="sortKey === 'ipAddress' ? sortDir : null"
                    @sort="toggleSort('ipAddress')"
                  />
                  <SortableTh
                    v-if="isVisible('createdAt')"
                    label="Sana"
                    sortable
                    :active="sortKey === 'createdAt'"
                    :direction="sortKey === 'createdAt' ? sortDir : null"
                    @sort="toggleSort('createdAt')"
                  />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading">
                  <td :colspan="colCount" class="px-5 py-8 text-center text-gray-500">
                    Yuklanmoqda...
                  </td>
                </tr>
                <tr v-else-if="paginatedLogs.length === 0">
                  <td :colspan="colCount" class="px-5 py-8 text-center text-gray-500">
                    Loglar topilmadi
                  </td>
                </tr>
                <tr
                  v-for="log in paginatedLogs"
                  :key="log.id"
                  class="border-t border-gray-100 dark:border-gray-800"
                >
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm">{{ log.id }}</span>
                  </td>
                  <td v-if="isVisible('username')" class="px-5 py-4 sm:px-6">
                    <span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {{ log.username }}
                    </span>
                  </td>
                  <td v-if="isVisible('entity')" class="px-5 py-4 sm:px-6">
                    <span
                      class="rounded-lg bg-gray-100 px-2 py-0.5 text-theme-xs font-medium text-gray-700 dark:bg-white/5 dark:text-gray-300"
                      :title="log.entity"
                    >
                      {{ entityLabel(log.entity) }}
                    </span>
                  </td>
                  <td v-if="isVisible('action')" class="px-5 py-4 sm:px-6">
                    <span
                      :class="[
                        'rounded-full px-2 py-0.5 text-theme-xs font-medium',
                        actionClass(log.action),
                      ]"
                      :title="log.action"
                    >
                      {{ actionLabel(log.action) }}
                    </span>
                  </td>
                  <td v-if="isVisible('description')" class="px-5 py-4 sm:px-6 max-w-xs">
                    <span class="text-gray-500 text-theme-sm line-clamp-2">{{
                      log.description || '—'
                    }}</span>
                  </td>
                  <td v-if="isVisible('ipAddress')" class="px-5 py-4 sm:px-6">
                    <span class="font-mono text-gray-500 text-theme-xs">{{
                      log.ipAddress || '—'
                    }}</span>
                  </td>
                  <td v-if="isVisible('createdAt')" class="px-5 py-4 sm:px-6 whitespace-nowrap">
                    <span class="text-gray-500 text-theme-sm">{{ formatDate(log.createdAt) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          v-if="totalPages > 1"
          class="flex flex-wrap items-center justify-center gap-4 px-6 py-4 border-t border-gray-100 dark:border-gray-800"
        >
          <button
            type="button"
            :disabled="currentPage <= 1"
            @click="currentPage--"
            :class="[filterBtnClass, 'disabled:opacity-50']"
          >
            ← Oldingi
          </button>
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Sahifa:</span>
            <select v-model.number="currentPage" class="table-filter-input !w-20">
              <option v-for="p in totalPages" :key="p" :value="p">{{ p }}</option>
            </select>
            <span>/ {{ totalPages }}</span>
          </div>
          <button
            type="button"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
            class="table-filter-btn disabled:opacity-50"
          >
            Keyingi →
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import {
  useTableSort,
  useColumnVisibility,
  type TableColumnDef,
} from '@/composables/useTableControls'
import { fetchAllAuditLogs, type AuditLog } from '@/services/audit'
import { PERMISSION_MENU_GROUPS } from '@/utils/permissionGroups'
import {
  AUDIT_TAB_ORDER,
  filterAuditLogsByTab,
  groupAuditLogsByModule,
  resolveAuditActionCategory,
  resolveAuditEntityKey,
  type AuditGroupKey,
} from '@/utils/auditLogGroups'

const { t, te } = useI18n()

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'username', label: 'Foydalanuvchi', sortable: true },
  { key: 'entity', label: 'Entity', sortable: true },
  { key: 'action', label: 'Action', sortable: true },
  { key: 'description', label: 'Tavsif', sortable: true },
  { key: 'ipAddress', label: 'IP', sortable: true },
  { key: 'createdAt', label: 'Sana', sortable: true },
]

const AUTH_ENTITY_HINTS = ['AUTH', 'LOGIN', 'LOGOUT', 'SESSION', 'TOKEN']

const filterInputClass =
  'h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const filterBtnClass =
  'h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'

const currentPageTitle = ref('Audit loglar')
const logs = ref<AuditLog[]>([])
const loading = ref(false)
const errorMessage = ref('')
const search = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const pageSize = ref(50)
const currentPage = ref(1)
const activeTab = ref<AuditGroupKey>('all')

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'audit-table-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<AuditLog>(
  (row, key) => row[key as keyof AuditLog],
)

const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)

function entityLabel(entity: string) {
  const key = resolveAuditEntityKey(entity)
  if (!key) return entity || '—'
  const labelKey = `permissionEntities.${key}`
  return te(labelKey) ? t(labelKey) : entity
}

function actionLabel(action: string) {
  const category = resolveAuditActionCategory(action)
  const map = {
    create: 'auditLogsPage.actionCreate',
    update: 'auditLogsPage.actionUpdate',
    delete: 'auditLogsPage.actionDelete',
    auth: 'auditLogsPage.actionAuth',
    other: 'auditLogsPage.actionOther',
  } as const
  const label = t(map[category])
  if (category === 'other') return action || label
  return `${label} (${action})`
}

const tabLabel = (key: AuditGroupKey) => {
  if (key === 'all') return t('auditLogsPage.tabAll')
  if (key === 'auth') return t('auditLogsPage.tabAuth')
  if (key === 'other') return t('auditLogsPage.tabOther')
  const group = PERMISSION_MENU_GROUPS.find((item) => item.key === key)
  return group ? t(group.labelKey) : key
}

const activeTabLabel = computed(() => tabLabel(activeTab.value))

const startOfDay = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

const endOfDay = (dateStr: string) => {
  const d = new Date(dateStr + 'T23:59:59.999')
  return isNaN(d.getTime()) ? null : d
}

const searchedLogs = computed(() => {
  let result = [...logs.value]
  const from = dateFrom.value ? startOfDay(dateFrom.value) : null
  const to = dateTo.value ? endOfDay(dateTo.value) : null

  if (from || to) {
    result = result.filter((log) => {
      const logDate = new Date(log.createdAt)
      if (isNaN(logDate.getTime())) return false
      if (from && logDate < from) return false
      if (to && logDate > to) return false
      return true
    })
  }

  const q = search.value.trim().toLowerCase()
  if (q) {
    result = result.filter(
      (log) =>
        log.username?.toLowerCase().includes(q) ||
        log.entity?.toLowerCase().includes(q) ||
        entityLabel(log.entity).toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        actionLabel(log.action).toLowerCase().includes(q) ||
        log.description?.toLowerCase().includes(q) ||
        log.ipAddress?.toLowerCase().includes(q),
    )
  }

  return result
})

const tabCounts = computed(() => groupAuditLogsByModule(searchedLogs.value))

const moduleTabs = computed(() =>
  AUDIT_TAB_ORDER.map((key) => ({
    key,
    label: tabLabel(key),
    count: tabCounts.value[key],
  })).filter((tab) => tab.key === 'all' || tab.count > 0),
)

const filteredLogs = computed(() => {
  const tabbed = filterAuditLogsByTab(searchedLogs.value, activeTab.value)
  return applySort(tabbed)
})

const activeTabHint = computed(() => {
  if (activeTab.value === 'all') return ''

  if (activeTab.value === 'auth') {
    return `${t('auditLogsPage.tabHint')}: ${AUTH_ENTITY_HINTS.join(', ')}`
  }

  if (activeTab.value === 'other') {
    return `${t('auditLogsPage.tabHint')}: ${t('auditLogsPage.tabOther')}`
  }

  const group = PERMISSION_MENU_GROUPS.find((item) => item.key === activeTab.value)
  if (!group) return ''

  const entities = group.entityKeys
    .map((key) => {
      const labelKey = `permissionEntities.${key}`
      return te(labelKey) ? t(labelKey) : key
    })
    .join(', ')

  return `${t('auditLogsPage.tabHint')}: ${entities}`
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredLogs.value.length / pageSize.value)))

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredLogs.value.slice(start, start + pageSize.value)
})

watch([search, dateFrom, dateTo, pageSize, activeTab], () => {
  currentPage.value = 1
})

watch(totalPages, (total) => {
  if (currentPage.value > total) currentPage.value = total
})

watch(moduleTabs, (tabs) => {
  if (!tabs.some((tab) => tab.key === activeTab.value)) {
    activeTab.value = 'all'
  }
})

const resetFilters = () => {
  search.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  pageSize.value = 50
  currentPage.value = 1
  activeTab.value = 'all'
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? value : d.toLocaleString()
}

const actionClass = (action: string) => {
  const category = resolveAuditActionCategory(action)
  if (category === 'create')
    return 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
  if (category === 'update')
    return 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
  if (category === 'delete')
    return 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500'
  if (category === 'auth')
    return 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400'
  return 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400'
}

const loadLogs = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    logs.value = await fetchAllAuditLogs()
    currentPage.value = 1
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Loglarni yuklashda xatolik'
  } finally {
    loading.value = false
  }
}

onMounted(loadLogs)
</script>
