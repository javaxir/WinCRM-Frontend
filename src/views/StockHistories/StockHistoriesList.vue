<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">Ombor harakatlari</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Kirim va chiqim operatsiyalari tarixi</p>
          </div>
          <div class="flex items-center gap-3">
            <TableColumnToggle :columns="TABLE_COLUMNS" :visible="visible" @toggle="toggleColumn" />
            <ActionIconButton action="refresh" @click="loadAll" />
          </div>
        </div>
        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
        </div>
        <div class="flex flex-wrap items-end gap-4 px-6 pb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Ombor</label>
            <select v-model.number="filterWarehouseId" :class="inputClass">
              <option :value="0">Barchasi</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Mahsulot</label>
            <select v-model.number="filterGoodsId" :class="inputClass">
              <option :value="0">Barchasi</option>
              <option v-for="g in goods" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Harakat turi</label>
            <select v-model="filterMovement" :class="inputClass">
              <option value="">Barchasi</option>
              <option value="IN">Kirim (IN)</option>
              <option value="OUT">Chiqim (OUT)</option>
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
                  <SortableTh v-if="isVisible('goodsName')" label="Mahsulot" sortable :active="sortKey === 'goodsName'" :direction="sortKey === 'goodsName' ? sortDir : null" @sort="toggleSort('goodsName')" />
                  <SortableTh v-if="isVisible('warehouseName')" label="Ombor" sortable :active="sortKey === 'warehouseName'" :direction="sortKey === 'warehouseName' ? sortDir : null" @sort="toggleSort('warehouseName')" />
                  <SortableTh v-if="isVisible('stockStatus')" label="Turi" sortable :active="sortKey === 'stockStatus'" :direction="sortKey === 'stockStatus' ? sortDir : null" @sort="toggleSort('stockStatus')" />
                  <SortableTh v-if="isVisible('count')" label="Miqdor" sortable :active="sortKey === 'count'" :direction="sortKey === 'count' ? sortDir : null" @sort="toggleSort('count')" />
                  <SortableTh v-if="isVisible('balanceAfter')" label="Qoldiq" sortable :active="sortKey === 'balanceAfter'" :direction="sortKey === 'balanceAfter' ? sortDir : null" @sort="toggleSort('balanceAfter')" />
                  <SortableTh v-if="isVisible('comment')" label="Izoh" sortable :active="sortKey === 'comment'" :direction="sortKey === 'comment' ? sortDir : null" @sort="toggleSort('comment')" />
                  <SortableTh v-if="isVisible('createdAt')" label="Sana" sortable :active="sortKey === 'createdAt'" :direction="sortKey === 'createdAt' ? sortDir : null" @sort="toggleSort('createdAt')" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading"><td :colspan="colCount" class="px-5 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
                <tr v-else-if="displayHistories.length === 0"><td :colspan="colCount" class="px-5 py-8 text-center text-gray-500">Harakatlar topilmadi</td></tr>
                <tr v-for="item in displayHistories" :key="item.id" class="border-t border-gray-100 dark:border-gray-800">
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.id }}</span></td>
                  <td v-if="isVisible('goodsName')" class="px-5 py-4 sm:px-6"><span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ item.goodsName }}</span></td>
                  <td v-if="isVisible('warehouseName')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.warehouseName }}</span></td>
                  <td v-if="isVisible('stockStatus')" class="px-5 py-4 sm:px-6"><span :class="movementClass(item.stockStatus)">{{ item.stockStatus === 'IN' ? 'Kirim' : 'Chiqim' }}</span></td>
                  <td v-if="isVisible('count')" class="px-5 py-4 sm:px-6"><span class="text-gray-800 text-theme-sm font-medium dark:text-white/90">{{ formatCount(item.count) }}</span></td>
                  <td v-if="isVisible('balanceAfter')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatCount(item.balanceAfter) }}</span></td>
                  <td v-if="isVisible('comment')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm max-w-xs truncate block">{{ item.comment || '—' }}</span></td>
                  <td v-if="isVisible('createdAt')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatDate(item.createdAt) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import { useTableSort, useColumnVisibility, type TableColumnDef } from '@/composables/useTableControls'
import {
  fetchAllStockHistories,
  fetchStockHistoriesByWarehouse,
  fetchStockHistoriesByGoods,
  fetchStockHistoriesByGoodsAndWarehouse,
  type StockHistoryResponse,
  type StockMovementStatus,
} from '@/services/stockHistories'
import { fetchAllWarehouses } from '@/services/warehouses'
import { fetchAllGoods } from '@/services/goods'
import type { WarehouseResponse } from '@/services/warehouses'
import type { GoodsResponse } from '@/services/goods'

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'goodsName', label: 'Mahsulot', sortable: true },
  { key: 'warehouseName', label: 'Ombor', sortable: true },
  { key: 'stockStatus', label: 'Turi', sortable: true },
  { key: 'count', label: 'Miqdor', sortable: true },
  { key: 'balanceAfter', label: 'Qoldiq', sortable: true },
  { key: 'comment', label: 'Izoh', sortable: true },
  { key: 'createdAt', label: 'Sana', sortable: true },
]

const inputClass = 'h-11 min-w-[180px] rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'

const currentPageTitle = ref('Ombor harakatlari')
const histories = ref<StockHistoryResponse[]>([])
const warehouses = ref<WarehouseResponse[]>([])
const goods = ref<GoodsResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const filterWarehouseId = ref(0)
const filterGoodsId = ref(0)
const filterMovement = ref('')

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'stock-histories-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<StockHistoryResponse>((row, key) => row[key as keyof StockHistoryResponse])
const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)
const displayHistories = computed(() => applySort(histories.value))

const formatDate = (v?: string) => { if (!v) return '—'; const d = new Date(v); return isNaN(d.getTime()) ? v : d.toLocaleString() }
const formatCount = (v: number) => new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 2 }).format(v)
const movementClass = (s: StockMovementStatus) => [
  'rounded-full px-2 py-0.5 text-theme-xs font-medium',
  s === 'IN' ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400' : 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
]

const loadRefs = async () => {
  const [wh, g] = await Promise.all([fetchAllWarehouses(), fetchAllGoods()])
  warehouses.value = wh.filter((w) => w.status === 'ACTIVE')
  goods.value = g.filter((item) => item.status === 'ACTIVE')
}

const loadHistories = async () => {
  let data: StockHistoryResponse[]
  if (filterWarehouseId.value > 0 && filterGoodsId.value > 0) {
    data = await fetchStockHistoriesByGoodsAndWarehouse(filterGoodsId.value, filterWarehouseId.value)
  } else if (filterWarehouseId.value > 0) {
    data = await fetchStockHistoriesByWarehouse(filterWarehouseId.value)
  } else if (filterGoodsId.value > 0) {
    data = await fetchStockHistoriesByGoods(filterGoodsId.value)
  } else {
    data = await fetchAllStockHistories()
  }
  if (filterMovement.value) {
    data = data.filter((h) => h.stockStatus === filterMovement.value)
  }
  return data
}

const loadAll = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    await loadRefs()
    histories.value = await loadHistories()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Yuklashda xatolik'
  } finally {
    loading.value = false
  }
}

const applyFilter = () => loadAll()
const resetFilter = () => {
  filterWarehouseId.value = 0
  filterGoodsId.value = 0
  filterMovement.value = ''
  loadAll()
}

onMounted(loadAll)
</script>
