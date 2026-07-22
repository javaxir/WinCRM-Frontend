<template>
  <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
      <div>
        <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('supplierDetail.tabPositions') }}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('supplierDetail.positionsHint') }}</p>
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('common.search') }}</label>
        <input v-model="search" type="search" :placeholder="t('supplierDetail.searchPositions')" :class="inputClass" />
      </div>
    </div>

    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <SortableTh :label="t('supplierDetail.productName')" sortable :active="sortKey === 'goodsName'" :direction="sortKey === 'goodsName' ? sortDir : null" @sort="toggleSort('goodsName')" />
            <SortableTh :label="t('supplierDetail.orderId')" sortable :active="sortKey === 'warehouseOrderId'" :direction="sortKey === 'warehouseOrderId' ? sortDir : null" @sort="toggleSort('warehouseOrderId')" />
            <SortableTh :label="t('supplierDetail.warehouse')" sortable :active="sortKey === 'warehouseName'" :direction="sortKey === 'warehouseName' ? sortDir : null" @sort="toggleSort('warehouseName')" />
            <SortableTh :label="t('dashboard.quantity')" sortable align="right" :active="sortKey === 'count'" :direction="sortKey === 'count' ? sortDir : null" @sort="toggleSort('count')" />
            <SortableTh :label="t('goodsDetail.priceCost')" sortable align="right" :active="sortKey === 'priceCost'" :direction="sortKey === 'priceCost' ? sortDir : null" @sort="toggleSort('priceCost')" />
            <SortableTh :label="t('goodsDetail.priceSelling')" sortable align="right" :active="sortKey === 'priceSelling'" :direction="sortKey === 'priceSelling' ? sortDir : null" @sort="toggleSort('priceSelling')" />
            <SortableTh :label="t('supplierDetail.arrivalDate')" sortable :active="sortKey === 'arrivalDate'" :direction="sortKey === 'arrivalDate' ? sortDir : null" @sort="toggleSort('arrivalDate')" />
            <SortableTh :label="t('goodsDetail.createdBy')" sortable :active="sortKey === 'createdUsername'" :direction="sortKey === 'createdUsername' ? sortDir : null" @sort="toggleSort('createdUsername')" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="displayItems.length === 0">
            <td colspan="8" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td>
          </tr>
          <tr v-for="item in displayItems" :key="item.id">
            <td class="px-5 py-4 text-theme-sm sm:px-6">
              <router-link :to="`/goods/${item.goodsId}/stock`" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                {{ item.goodsName }}
              </router-link>
            </td>
            <td class="px-5 py-4 text-theme-sm sm:px-6">
              <router-link :to="`/warehouse-orders/${item.warehouseOrderId}/items`" class="text-brand-600 hover:underline dark:text-brand-400">
                #{{ item.warehouseOrderId }}
              </router-link>
            </td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ item.warehouseName }}</td>
            <td class="px-5 py-4 text-right text-theme-sm tabular-nums text-gray-800 sm:px-6 dark:text-white/90">{{ formatCount(item.count) }}</td>
            <td class="px-5 py-4 text-right text-theme-sm tabular-nums text-gray-500 sm:px-6">{{ formatMoney(item.priceCost) }}</td>
            <td class="px-5 py-4 text-right text-theme-sm tabular-nums text-gray-500 sm:px-6">{{ formatMoney(item.priceSelling) }}</td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6 whitespace-nowrap">{{ formatDate(item.arrivalDate) }}</td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ item.createdUsername || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SortableTh from '@/components/common/SortableTh.vue'
import { useTableSort } from '@/composables/useTableControls'
import type { WarehouseOrderItemResponse } from '@/services/warehouseOrderItems'

const props = defineProps<{ items: WarehouseOrderItemResponse[] }>()
const { t } = useI18n()

const search = ref('')
const inputClass =
  'h-11 min-w-[220px] rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const formatMoney = (v: number) => `${new Intl.NumberFormat('uz-UZ').format(Math.round(v))} so‘m`
const formatCount = (v: number) => new Intl.NumberFormat('uz-UZ').format(v)
const formatDate = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('uz-UZ')
}

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.items
  return props.items.filter(
    (item) =>
      item.goodsName.toLowerCase().includes(q) ||
      item.warehouseName.toLowerCase().includes(q) ||
      String(item.warehouseOrderId).includes(q) ||
      (item.createdUsername?.toLowerCase().includes(q) ?? false),
  )
})

const { sortKey, sortDir, toggleSort, applySort } = useTableSort<WarehouseOrderItemResponse>((row, key) => {
  if (key === 'arrivalDate') return row.arrivalDate
  return row[key as keyof WarehouseOrderItemResponse]
})

const displayItems = computed(() => applySort(filteredItems.value))
</script>
