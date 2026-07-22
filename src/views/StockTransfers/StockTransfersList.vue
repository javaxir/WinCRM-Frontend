<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('stockTransfers.title') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('stockTransfers.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-3">
            <TableColumnToggle :columns="TABLE_COLUMNS" :visible="visible" @toggle="toggleColumn" />
            <ActionIconButton action="refresh" @click="loadAll" />
            <ActionIconButton action="create" :title="t('stockTransfers.create')" @click="openCreate" />
          </div>
        </div>
        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
        </div>
        <div class="flex flex-wrap items-end gap-4 px-6 pb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('stockTransfers.warehouse') }}</label>
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
                  <SortableTh v-if="isVisible('goodsName')" :label="t('stockTransfers.goods')" sortable :active="sortKey === 'goodsName'" :direction="sortKey === 'goodsName' ? sortDir : null" @sort="toggleSort('goodsName')" />
                  <SortableTh v-if="isVisible('fromWarehouseName')" :label="t('stockTransfers.fromWarehouse')" sortable :active="sortKey === 'fromWarehouseName'" :direction="sortKey === 'fromWarehouseName' ? sortDir : null" @sort="toggleSort('fromWarehouseName')" />
                  <SortableTh v-if="isVisible('toWarehouseName')" :label="t('stockTransfers.toWarehouse')" sortable :active="sortKey === 'toWarehouseName'" :direction="sortKey === 'toWarehouseName' ? sortDir : null" @sort="toggleSort('toWarehouseName')" />
                  <SortableTh v-if="isVisible('count')" :label="t('stockTransfers.count')" sortable :active="sortKey === 'count'" :direction="sortKey === 'count' ? sortDir : null" @sort="toggleSort('count')" />
                  <SortableTh v-if="isVisible('comment')" :label="t('stockTransfers.comment')" sortable :active="sortKey === 'comment'" :direction="sortKey === 'comment' ? sortDir : null" @sort="toggleSort('comment')" />
                  <SortableTh v-if="isVisible('createdUsername')" :label="t('stockTransfers.createdBy')" sortable :active="sortKey === 'createdUsername'" :direction="sortKey === 'createdUsername' ? sortDir : null" @sort="toggleSort('createdUsername')" />
                  <SortableTh v-if="isVisible('createdAt')" :label="t('stockTransfers.createdAt')" sortable :active="sortKey === 'createdAt'" :direction="sortKey === 'createdAt' ? sortDir : null" @sort="toggleSort('createdAt')" />
                  <SortableTh :label="t('common.actions')" align="right" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading">
                  <td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">{{ t('common.loading') }}</td>
                </tr>
                <tr v-else-if="displayItems.length === 0">
                  <td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">{{ t('stockTransfers.empty') }}</td>
                </tr>
                <tr v-for="item in displayItems" :key="item.id" class="border-t border-gray-100 dark:border-gray-800">
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.id }}</span></td>
                  <td v-if="isVisible('goodsName')" class="px-5 py-4 sm:px-6"><span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ item.goodsName }}</span></td>
                  <td v-if="isVisible('fromWarehouseName')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.fromWarehouseName }}</span></td>
                  <td v-if="isVisible('toWarehouseName')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.toWarehouseName }}</span></td>
                  <td v-if="isVisible('count')" class="px-5 py-4 sm:px-6"><span class="text-gray-800 text-theme-sm font-medium dark:text-white/90">{{ item.count }}</span></td>
                  <td v-if="isVisible('comment')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.comment || '—' }}</span></td>
                  <td v-if="isVisible('createdUsername')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.createdUsername || '—' }}</span></td>
                  <td v-if="isVisible('createdAt')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatDate(item.createdAt) }}</span></td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex items-center justify-end gap-2">
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

    <Modal v-if="showFormModal" @close="closeForm">
      <template #body>
        <div class="relative w-full max-w-lg p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('stockTransfers.create') }}</h4>
          <div v-if="formError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ formError }}</div>
          <form @submit.prevent="submitForm" class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('stockTransfers.goods') }}<span class="text-error-500">*</span>
              </label>
              <select v-model.number="form.goodsId" required :class="inputClass">
                <option :value="0" disabled>{{ t('stockTransfers.selectGoods') }}</option>
                <option v-for="g in activeGoods" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('stockTransfers.fromWarehouse') }}<span class="text-error-500">*</span>
              </label>
              <select v-model.number="form.fromWarehouseId" required :class="inputClass">
                <option :value="0" disabled>{{ t('stockTransfers.selectWarehouse') }}</option>
                <option v-for="w in activeWarehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('stockTransfers.toWarehouse') }}<span class="text-error-500">*</span>
              </label>
              <select v-model.number="form.toWarehouseId" required :class="inputClass">
                <option :value="0" disabled>{{ t('stockTransfers.selectWarehouse') }}</option>
                <option v-for="w in activeWarehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('stockTransfers.count') }}<span class="text-error-500">*</span>
              </label>
              <input v-model.number="form.count" type="number" step="1" min="1" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('stockTransfers.comment') }}</label>
              <textarea v-model="form.comment" rows="2" :class="inputClass" />
            </div>
            <div class="flex justify-end gap-3">
              <button type="button" @click="closeForm" :class="btnOutline">{{ t('common.cancel') }}</button>
              <button type="submit" :disabled="saving" :class="btnPrimary">
                {{ saving ? t('common.saving') : t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>

    <Modal v-if="showDeleteModal" @close="showDeleteModal = false">
      <template #body>
        <div class="relative w-full max-w-md p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('stockTransfers.deleteTitle') }}</h4>
          <p class="mb-6 text-sm text-gray-500">{{ t('stockTransfers.deleteConfirm', { id: itemToDelete?.id }) }}</p>
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import Modal from '@/components/ui/Modal.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import { useTableSort, useColumnVisibility, type TableColumnDef } from '@/composables/useTableControls'
import {
  fetchAllStockTransfers,
  fetchStockTransfersByWarehouse,
  createStockTransfer,
  deleteStockTransfer,
  type StockTransferResponse,
} from '@/services/stockTransfers'
import { fetchAllWarehouses, type WarehouseResponse } from '@/services/warehouses'
import { fetchAllGoods, type GoodsResponse } from '@/services/goods'

const { t } = useI18n()

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'goodsName', label: 'Mahsulot', sortable: true },
  { key: 'fromWarehouseName', label: 'Qayerdan', sortable: true },
  { key: 'toWarehouseName', label: 'Qayerga', sortable: true },
  { key: 'count', label: 'Miqdor', sortable: true },
  { key: 'comment', label: 'Izoh', sortable: true },
  { key: 'createdUsername', label: 'Yaratuvchi', sortable: true },
  { key: 'createdAt', label: 'Yaratilgan', sortable: true },
]

const inputClass =
  'h-11 w-full min-w-[180px] rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnOutline =
  'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'

const currentPageTitle = computed(() => t('stockTransfers.title'))
const items = ref<StockTransferResponse[]>([])
const warehouses = ref<WarehouseResponse[]>([])
const goods = ref<GoodsResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const filterWarehouseId = ref(0)

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'stock-transfers-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<StockTransferResponse>(
  (row, key) => row[key as keyof StockTransferResponse],
)
const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)
const displayItems = computed(() => applySort(items.value))
const activeWarehouses = computed(() => warehouses.value.filter((w) => w.status === 'ACTIVE'))
const activeGoods = computed(() => goods.value.filter((g) => g.status === 'ACTIVE'))

const showFormModal = ref(false)
const form = ref({
  goodsId: 0,
  fromWarehouseId: 0,
  toWarehouseId: 0,
  count: 1,
  comment: '',
})
const formError = ref('')
const saving = ref(false)

const showDeleteModal = ref(false)
const itemToDelete = ref<StockTransferResponse | null>(null)
const deleting = ref(false)

const formatDate = (value?: string) => {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? value : d.toLocaleString()
}

const loadRefs = async () => {
  const [w, g] = await Promise.all([fetchAllWarehouses(), fetchAllGoods()])
  warehouses.value = w
  goods.value = g
}

const loadItems = async () => {
  if (filterWarehouseId.value > 0) return fetchStockTransfersByWarehouse(filterWarehouseId.value)
  return fetchAllStockTransfers()
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

const openCreate = async () => {
  form.value = {
    goodsId: 0,
    fromWarehouseId: 0,
    toWarehouseId: 0,
    count: 1,
    comment: '',
  }
  formError.value = ''
  if (!warehouses.value.length || !goods.value.length) await loadRefs()
  showFormModal.value = true
}

const closeForm = () => {
  showFormModal.value = false
}

const submitForm = async () => {
  formError.value = ''
  if (!form.value.goodsId) {
    formError.value = t('stockTransfers.goodsRequired')
    return
  }
  if (!form.value.fromWarehouseId || !form.value.toWarehouseId) {
    formError.value = t('stockTransfers.warehouseRequired')
    return
  }
  if (form.value.fromWarehouseId === form.value.toWarehouseId) {
    formError.value = t('stockTransfers.sameWarehouse')
    return
  }
  if (!form.value.count || form.value.count <= 0) {
    formError.value = t('stockTransfers.countRequired')
    return
  }
  saving.value = true
  try {
    await createStockTransfer({
      goodsId: form.value.goodsId,
      fromWarehouseId: form.value.fromWarehouseId,
      toWarehouseId: form.value.toWarehouseId,
      count: form.value.count,
      comment: form.value.comment.trim() || undefined,
    })
    showFormModal.value = false
    await loadAll()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (item: StockTransferResponse) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const doDelete = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await deleteStockTransfer(itemToDelete.value.id)
    showDeleteModal.value = false
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
