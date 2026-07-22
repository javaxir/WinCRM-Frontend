<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('inventoryChecks.title') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('inventoryChecks.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-3">
            <TableColumnToggle :columns="TABLE_COLUMNS" :visible="visible" @toggle="toggleColumn" />
            <ActionIconButton action="refresh" @click="loadAll" />
            <ActionIconButton action="create" :title="t('inventoryChecks.startCheck')" @click="openStart" />
          </div>
        </div>
        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
        </div>
        <div class="flex flex-wrap items-end gap-4 px-6 pb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('inventoryChecks.warehouse') }}</label>
            <select v-model.number="filterWarehouseId" :class="inputClass">
              <option :value="0">{{ t('common.all') }}</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <ActionIconButton action="filter" @click="applyFilter" />
          <ActionIconButton action="reset" @click="resetFilter" />
        </div>
        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh v-if="isVisible('id')" label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
                  <SortableTh v-if="isVisible('warehouseName')" :label="t('inventoryChecks.warehouse')" sortable :active="sortKey === 'warehouseName'" :direction="sortKey === 'warehouseName' ? sortDir : null" @sort="toggleSort('warehouseName')" />
                  <SortableTh v-if="isVisible('checkStatus')" :label="t('inventoryChecks.checkStatus')" sortable :active="sortKey === 'checkStatus'" :direction="sortKey === 'checkStatus' ? sortDir : null" @sort="toggleSort('checkStatus')" />
                  <SortableTh v-if="isVisible('comment')" :label="t('inventoryChecks.comment')" sortable :active="sortKey === 'comment'" :direction="sortKey === 'comment' ? sortDir : null" @sort="toggleSort('comment')" />
                  <SortableTh v-if="isVisible('createdAt')" :label="t('inventoryChecks.createdAt')" sortable :active="sortKey === 'createdAt'" :direction="sortKey === 'createdAt' ? sortDir : null" @sort="toggleSort('createdAt')" />
                  <SortableTh v-if="isVisible('createdUsername')" :label="t('inventoryChecks.createdBy')" sortable :active="sortKey === 'createdUsername'" :direction="sortKey === 'createdUsername' ? sortDir : null" @sort="toggleSort('createdUsername')" />
                  <SortableTh :label="t('common.actions')" align="right" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading">
                  <td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">{{ t('common.loading') }}</td>
                </tr>
                <tr v-else-if="displayItems.length === 0">
                  <td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">{{ t('inventoryChecks.empty') }}</td>
                </tr>
                <tr v-for="item in displayItems" :key="item.id" class="border-t border-gray-100 dark:border-gray-800">
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.id }}</span></td>
                  <td v-if="isVisible('warehouseName')" class="px-5 py-4 sm:px-6"><span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ item.warehouseName }}</span></td>
                  <td v-if="isVisible('checkStatus')" class="px-5 py-4 sm:px-6"><span :class="checkStatusClass(item.checkStatus)">{{ checkStatusLabel(item.checkStatus) }}</span></td>
                  <td v-if="isVisible('comment')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.comment || '—' }}</span></td>
                  <td v-if="isVisible('createdAt')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatDate(item.createdAt) }}</span></td>
                  <td v-if="isVisible('createdUsername')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.createdUsername || '—' }}</span></td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-lg px-3 py-1.5 text-theme-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                        @click="openDetail(item)"
                      >
                        {{ t('inventoryChecks.details') }}
                      </button>
                      <ActionIconButton action="delete" size="sm" @click="confirmDelete(item)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Start new check -->
    <Modal v-if="showStartModal" @close="closeStart">
      <template #body>
        <div class="relative w-full max-w-lg p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('inventoryChecks.startCheck') }}</h4>
          <div v-if="formError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ formError }}</div>
          <form @submit.prevent="submitStart" class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('inventoryChecks.warehouse') }}<span class="text-error-500">*</span>
              </label>
              <select v-model.number="startForm.warehouseId" required :class="inputClass">
                <option :value="0" disabled>{{ t('inventoryChecks.selectWarehouse') }}</option>
                <option v-for="w in activeWarehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('inventoryChecks.comment') }}</label>
              <textarea v-model="startForm.comment" rows="2" :class="inputClass" />
            </div>
            <div class="flex justify-end gap-3">
              <button type="button" @click="closeStart" :class="btnOutline">{{ t('common.cancel') }}</button>
              <button type="submit" :disabled="saving" :class="btnPrimary">
                {{ saving ? t('common.saving') : t('inventoryChecks.start') }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>

    <!-- Detail panel -->
    <Modal v-if="showDetailModal" @close="closeDetail">
      <template #body>
        <div class="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 bg-white rounded-3xl dark:bg-gray-900">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                {{ t('inventoryChecks.detailTitle') }} #{{ detail?.id }}
              </h4>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ detail?.warehouseName }}
                <span v-if="detail" class="ml-2" :class="checkStatusClass(detail.checkStatus)">{{ checkStatusLabel(detail.checkStatus) }}</span>
              </p>
            </div>
            <div v-if="detail?.checkStatus === 'IN_PROGRESS'" class="flex flex-wrap items-center gap-2">
              <button type="button" :disabled="!!actionLoading" :class="btnPrimary" @click="doConfirm">
                {{ actionLoading === 'confirm' ? t('common.saving') : t('inventoryChecks.confirm') }}
              </button>
              <button
                type="button"
                :disabled="!!actionLoading"
                class="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
                @click="doCancel"
              >
                {{ actionLoading === 'cancel' ? t('common.saving') : t('inventoryChecks.cancelCheck') }}
              </button>
            </div>
          </div>

          <div v-if="detailError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ detailError }}</div>
          <div v-if="detailLoading" class="py-10 text-center text-gray-500">{{ t('common.loading') }}</div>
          <div v-else-if="detail" class="border border-gray-100 rounded-xl overflow-hidden dark:border-gray-800">
            <div class="max-w-full overflow-x-auto custom-scrollbar">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.02]">
                    <th class="px-4 py-3 text-left text-theme-xs font-medium text-gray-500">{{ t('inventoryChecks.goodsName') }}</th>
                    <th class="px-4 py-3 text-left text-theme-xs font-medium text-gray-500">{{ t('inventoryChecks.systemCount') }}</th>
                    <th class="px-4 py-3 text-left text-theme-xs font-medium text-gray-500">{{ t('inventoryChecks.actualCount') }}</th>
                    <th class="px-4 py-3 text-left text-theme-xs font-medium text-gray-500">{{ t('inventoryChecks.difference') }}</th>
                    <th class="px-4 py-3 text-left text-theme-xs font-medium text-gray-500">{{ t('inventoryChecks.comment') }}</th>
                    <th v-if="isDetailEditable" class="px-4 py-3 text-right text-theme-xs font-medium text-gray-500">{{ t('common.actions') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-if="!detail.items?.length">
                    <td :colspan="isDetailEditable ? 6 : 5" class="px-4 py-8 text-center text-gray-500">{{ t('inventoryChecks.noItems') }}</td>
                  </tr>
                  <tr v-for="row in detail.items" :key="row.id" class="border-t border-gray-100 dark:border-gray-800">
                    <td class="px-4 py-3"><span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ row.goodsName }}</span></td>
                    <td class="px-4 py-3"><span class="text-gray-500 text-theme-sm">{{ row.systemCount }}</span></td>
                    <td class="px-4 py-3">
                      <template v-if="isDetailEditable && itemEdits[row.id]">
                        <input
                          v-model.number="itemEdits[row.id].actualCount"
                          type="number"
                          step="1"
                          :class="inputClassSm"
                        />
                      </template>
                      <span v-else class="text-gray-500 text-theme-sm">{{ row.actualCount ?? '—' }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <span :class="differenceClass(computedDifference(row))">{{ formatDifference(computedDifference(row)) }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <template v-if="isDetailEditable && itemEdits[row.id]">
                        <input v-model="itemEdits[row.id].comment" type="text" :class="inputClassSm" />
                      </template>
                      <span v-else class="text-gray-500 text-theme-sm">{{ row.comment || '—' }}</span>
                    </td>
                    <td v-if="isDetailEditable" class="px-4 py-3">
                      <div class="flex justify-end">
                        <button
                          type="button"
                          :disabled="savingItemId === row.id"
                          :class="btnPrimarySm"
                          @click="saveItem(row)"
                        >
                          {{ savingItemId === row.id ? t('common.saving') : t('common.save') }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex justify-end mt-5">
            <button type="button" @click="closeDetail" :class="btnOutline">{{ t('common.cancel') }}</button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Delete confirm -->
    <Modal v-if="showDeleteModal" @close="showDeleteModal = false">
      <template #body>
        <div class="relative w-full max-w-md p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('inventoryChecks.deleteTitle') }}</h4>
          <p class="mb-6 text-sm text-gray-500">{{ t('inventoryChecks.deleteConfirm', { id: itemToDelete?.id }) }}</p>
          <div class="flex justify-end gap-3">
            <button @click="showDeleteModal = false" :class="btnOutline">{{ t('common.cancel') }}</button>
            <button
              @click="doDelete"
              :disabled="deleting"
              class="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
            >
              {{ deleting ? t('common.deleting') : t('common.delete') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import Modal from '@/components/ui/Modal.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import { useTableSort, useColumnVisibility, type TableColumnDef } from '@/composables/useTableControls'
import {
  fetchAllInventoryChecks,
  fetchInventoryChecksByWarehouse,
  startInventoryCheck,
  fetchInventoryCheckById,
  updateInventoryCheckItem,
  confirmInventoryCheck,
  cancelInventoryCheck,
  deleteInventoryCheck,
  type InventoryCheckResponse,
  type InventoryCheckItemResponse,
  type InventoryCheckStatus,
} from '@/services/inventoryChecks'
import { fetchAllWarehouses, type WarehouseResponse } from '@/services/warehouses'

const { t } = useI18n()

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'warehouseName', label: 'Ombor', sortable: true },
  { key: 'checkStatus', label: 'Holati', sortable: true },
  { key: 'comment', label: 'Izoh', sortable: true },
  { key: 'createdAt', label: 'Yaratilgan', sortable: true },
  { key: 'createdUsername', label: 'Yaratuvchi', sortable: true },
]

const inputClass =
  'h-11 w-full min-w-[180px] rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const inputClassSm =
  'h-9 w-full min-w-[100px] rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnOutline =
  'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'
const btnPrimarySm =
  'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-1.5 text-theme-xs font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'

const currentPageTitle = computed(() => t('inventoryChecks.title'))
const items = ref<InventoryCheckResponse[]>([])
const warehouses = ref<WarehouseResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const filterWarehouseId = ref(0)

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'inventory-checks-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<InventoryCheckResponse>(
  (row, key) => row[key as keyof InventoryCheckResponse],
)
const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)
const displayItems = computed(() => applySort(items.value))
const activeWarehouses = computed(() => warehouses.value.filter((w) => w.status === 'ACTIVE'))

const showStartModal = ref(false)
const startForm = ref({ warehouseId: 0, comment: '' })
const formError = ref('')
const saving = ref(false)

const showDetailModal = ref(false)
const detail = ref<InventoryCheckResponse | null>(null)
const detailLoading = ref(false)
const detailError = ref('')
const itemEdits = reactive<Record<number, { actualCount: number; comment: string }>>({})
const savingItemId = ref<number | null>(null)
const actionLoading = ref<'confirm' | 'cancel' | null>(null)
const isDetailEditable = computed(() => detail.value?.checkStatus === 'IN_PROGRESS')

const showDeleteModal = ref(false)
const itemToDelete = ref<InventoryCheckResponse | null>(null)
const deleting = ref(false)

const checkStatusLabel = (status: InventoryCheckStatus) => {
  const key = `inventoryChecks.status.${status}`
  const translated = t(key)
  return translated === key ? status : translated
}

const checkStatusClass = (status: InventoryCheckStatus) => [
  'rounded-full px-2 py-0.5 text-theme-xs font-medium',
  {
    'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400': status === 'IN_PROGRESS',
    'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500': status === 'CONFIRMED',
    'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500': status === 'CANCELLED',
  },
]

const formatDate = (value?: string) => {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? value : d.toLocaleString()
}

const computedDifference = (row: InventoryCheckItemResponse) => {
  if (!isDetailEditable.value) return row.difference
  const edit = itemEdits[row.id]
  if (!edit || edit.actualCount === null || edit.actualCount === undefined || Number.isNaN(edit.actualCount)) {
    return row.difference
  }
  return edit.actualCount - row.systemCount
}

const formatDifference = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value > 0 ? `+${value}` : String(value)
}

const differenceClass = (value: number | null | undefined) => [
  'text-theme-sm font-medium',
  {
    'text-success-600 dark:text-success-500': (value ?? 0) > 0,
    'text-error-600 dark:text-error-500': (value ?? 0) < 0,
    'text-gray-500': (value ?? 0) === 0 || value === null || value === undefined,
  },
]

const syncItemEdits = (check: InventoryCheckResponse) => {
  Object.keys(itemEdits).forEach((k) => delete itemEdits[Number(k)])
  for (const row of check.items || []) {
    itemEdits[row.id] = {
      actualCount: row.actualCount ?? row.systemCount,
      comment: row.comment || '',
    }
  }
}

const loadRefs = async () => {
  warehouses.value = await fetchAllWarehouses()
}

const loadItems = async () => {
  if (filterWarehouseId.value > 0) return fetchInventoryChecksByWarehouse(filterWarehouseId.value)
  return fetchAllInventoryChecks()
}

const loadAll = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    await loadRefs()
    items.value = await loadItems()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    loading.value = false
  }
}

const applyFilter = () => loadAll()
const resetFilter = () => {
  filterWarehouseId.value = 0
  loadAll()
}

const openStart = async () => {
  startForm.value = { warehouseId: 0, comment: '' }
  formError.value = ''
  if (!warehouses.value.length) await loadRefs()
  showStartModal.value = true
}

const closeStart = () => {
  showStartModal.value = false
}

const submitStart = async () => {
  formError.value = ''
  if (!startForm.value.warehouseId) {
    formError.value = t('inventoryChecks.warehouseRequired')
    return
  }
  saving.value = true
  try {
    const created = await startInventoryCheck({
      warehouseId: startForm.value.warehouseId,
      comment: startForm.value.comment.trim() || undefined,
    })
    showStartModal.value = false
    await loadAll()
    await openDetailById(created.id)
  } catch (e) {
    formError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    saving.value = false
  }
}

const openDetail = async (item: InventoryCheckResponse) => {
  await openDetailById(item.id)
}

const openDetailById = async (id: number) => {
  showDetailModal.value = true
  detailLoading.value = true
  detailError.value = ''
  detail.value = null
  try {
    const data = await fetchInventoryCheckById(id)
    detail.value = data
    syncItemEdits(data)
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    detailLoading.value = false
  }
}

const closeDetail = () => {
  showDetailModal.value = false
  detail.value = null
  detailError.value = ''
}

const saveItem = async (row: InventoryCheckItemResponse) => {
  if (!detail.value) return
  const edit = itemEdits[row.id]
  if (!edit) return
  if (edit.actualCount === null || edit.actualCount === undefined || Number.isNaN(Number(edit.actualCount))) {
    detailError.value = t('inventoryChecks.actualCountRequired')
    return
  }
  savingItemId.value = row.id
  detailError.value = ''
  try {
    const updated = await updateInventoryCheckItem(detail.value.id, row.id, {
      actualCount: Number(edit.actualCount),
      comment: edit.comment.trim() || undefined,
    })
    const idx = detail.value.items.findIndex((i) => i.id === row.id)
    if (idx >= 0) detail.value.items[idx] = { ...detail.value.items[idx], ...updated }
    itemEdits[row.id] = {
      actualCount: updated.actualCount ?? Number(edit.actualCount),
      comment: updated.comment || '',
    }
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    savingItemId.value = null
  }
}

const doConfirm = async () => {
  if (!detail.value) return
  actionLoading.value = 'confirm'
  detailError.value = ''
  try {
    await confirmInventoryCheck(detail.value.id)
    await openDetailById(detail.value.id)
    await loadAll()
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    actionLoading.value = null
  }
}

const doCancel = async () => {
  if (!detail.value) return
  actionLoading.value = 'cancel'
  detailError.value = ''
  try {
    await cancelInventoryCheck(detail.value.id)
    await openDetailById(detail.value.id)
    await loadAll()
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    actionLoading.value = null
  }
}

const confirmDelete = (item: InventoryCheckResponse) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const doDelete = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await deleteInventoryCheck(itemToDelete.value.id)
    showDeleteModal.value = false
    if (detail.value?.id === itemToDelete.value.id) closeDetail()
    await loadAll()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

onMounted(loadAll)
</script>
