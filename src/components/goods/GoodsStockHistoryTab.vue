<template>
  <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="flex flex-wrap items-end gap-4 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
      <div>
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('goodsDetail.warehouse') }}
        </label>
        <select v-model.number="filterWarehouseId" :class="inputClass">
          <option :value="0">{{ t('common.all') }}</option>
          <option v-for="row in warehouseOptions" :key="row.warehouseId" :value="row.warehouseId">
            {{ row.warehouseName }}
          </option>
        </select>
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">
          {{ t('goodsDetail.movementType') }}
        </label>
        <select v-model="filterMovement" :class="inputClass">
          <option value="">{{ t('common.all') }}</option>
          <option value="IN">{{ t('goodsDetail.movementIn') }}</option>
          <option value="OUT">{{ t('goodsDetail.movementOut') }}</option>
        </select>
      </div>
    </div>

    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <SortableTh label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
            <SortableTh :label="t('goodsDetail.warehouse')" sortable :active="sortKey === 'warehouseName'" :direction="sortKey === 'warehouseName' ? sortDir : null" @sort="toggleSort('warehouseName')" />
            <SortableTh :label="t('goodsDetail.movementType')" sortable :active="sortKey === 'stockStatus'" :direction="sortKey === 'stockStatus' ? sortDir : null" @sort="toggleSort('stockStatus')" />
            <SortableTh :label="t('goodsDetail.quantity')" sortable align="right" :active="sortKey === 'count'" :direction="sortKey === 'count' ? sortDir : null" @sort="toggleSort('count')" />
            <SortableTh :label="t('goodsDetail.balanceAfter')" sortable align="right" :active="sortKey === 'balanceAfter'" :direction="sortKey === 'balanceAfter' ? sortDir : null" @sort="toggleSort('balanceAfter')" />
            <SortableTh :label="t('goodsDetail.comment')" sortable :active="sortKey === 'comment'" :direction="sortKey === 'comment' ? sortDir : null" @sort="toggleSort('comment')" />
            <SortableTh :label="t('goodsDetail.date')" sortable :active="sortKey === 'createdAt'" :direction="sortKey === 'createdAt' ? sortDir : null" @sort="toggleSort('createdAt')" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="displayHistories.length === 0">
            <td colspan="7" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td>
          </tr>
          <tr v-for="item in displayHistories" :key="item.id">
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ item.id }}</td>
            <td class="px-5 py-4 text-theme-sm font-medium text-gray-800 sm:px-6 dark:text-white/90">{{ item.warehouseName }}</td>
            <td class="px-5 py-4 sm:px-6">
              <span :class="movementClass(item.stockStatus)">
                {{ item.stockStatus === 'IN' ? t('goodsDetail.movementIn') : t('goodsDetail.movementOut') }}
              </span>
            </td>
            <td class="px-5 py-4 text-right text-theme-sm font-medium tabular-nums text-gray-800 sm:px-6 dark:text-white/90">
              {{ item.stockStatus === 'IN' ? '+' : '−' }}{{ formatCount(item.count) }}
            </td>
            <td class="px-5 py-4 text-right text-theme-sm tabular-nums text-gray-500 sm:px-6">{{ formatCount(item.balanceAfter) }}</td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6 max-w-xs truncate">{{ item.comment || '—' }}</td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6 whitespace-nowrap">{{ formatDateTime(item.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      class="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-6 py-3 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400"
    >
      <span>
        {{ t('common.total') }}:
        <strong class="text-gray-700 dark:text-gray-300">{{ displayHistories.length }}</strong>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SortableTh from '@/components/common/SortableTh.vue'
import { useTableSort } from '@/composables/useTableControls'
import type { StockHistoryResponse } from '@/services/stockHistories'
import type { GoodsStockRow } from '@/utils/goodsStockAnalytics'

const props = defineProps<{
  histories: StockHistoryResponse[]
  rows: GoodsStockRow[]
}>()

const { t } = useI18n()

const inputClass =
  'h-10 min-w-[180px] rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const filterWarehouseId = ref(0)
const filterMovement = ref('')

const formatCount = (v: number) => new Intl.NumberFormat('uz-UZ').format(v)
const formatDateTime = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString()
}

const warehouseOptions = computed(() =>
  [...props.rows].sort((a, b) => a.warehouseName.localeCompare(b.warehouseName)),
)

const filteredHistories = computed(() => {
  let result = [...props.histories]
  if (filterWarehouseId.value > 0) {
    result = result.filter((item) => item.warehouseId === filterWarehouseId.value)
  }
  if (filterMovement.value) {
    result = result.filter((item) => item.stockStatus === filterMovement.value)
  }
  return result
})

const { sortKey, sortDir, toggleSort, applySort } = useTableSort<StockHistoryResponse>(
  (row, key) => row[key as keyof StockHistoryResponse],
)
const displayHistories = computed(() => applySort(filteredHistories.value))

const movementClass = (status: string) => {
  if (status === 'IN') {
    return 'rounded-full bg-success-50 px-2 py-0.5 text-theme-xs font-medium text-success-700 dark:bg-success-500/15 dark:text-success-400'
  }
  return 'rounded-full bg-orange-50 px-2 py-0.5 text-theme-xs font-medium text-orange-700 dark:bg-orange-500/15 dark:text-orange-400'
}
</script>
