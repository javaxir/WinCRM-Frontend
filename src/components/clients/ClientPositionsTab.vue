<template>
  <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
      <div>
        <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('clientDetail.tabPositions') }}</h3>
        <p class="mt-1 text-sm text-gray-500">{{ t('clientDetail.positionsHint') }}</p>
      </div>
      <input v-model="search" type="search" :placeholder="t('clientDetail.searchPositions')" :class="inputClass" class="max-w-xs" />
    </div>
    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">#</th>
            <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('clientDetail.productName') }}</th>
            <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('saleOrderItems.warehouse') }}</th>
            <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('dashboard.quantity') }}</th>
            <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('dashboard.amount') }}</th>
            <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('saleOrderItems.areaM2') }}</th>
            <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('clientDetail.tabOrders') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-if="filteredItems.length === 0">
            <td colspan="7" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td>
          </tr>
          <tr v-for="(item, index) in filteredItems" :key="item.id">
            <td class="px-5 py-3 text-sm text-gray-500">{{ index + 1 }}</td>
            <td class="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{{ item.goodsName }}</td>
            <td class="px-5 py-3 text-sm text-gray-500">{{ item.warehouseName }}</td>
            <td class="px-5 py-3 text-right text-sm dark:text-white/90">{{ item.count }}</td>
            <td class="px-5 py-3 text-right text-sm font-medium text-brand-600">{{ formatMoney(item.priceSelling * item.count) }}</td>
            <td class="px-5 py-3 text-right text-sm text-gray-500">{{ formatArea(item) }}</td>
            <td class="px-5 py-3 text-sm">
              <router-link :to="`/sale-orders/${item.saleOrderId}/items`" class="text-brand-600 hover:underline">#{{ item.saleOrderId }}</router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SaleOrderItemResponse } from '@/services/saleOrderItems'
import { calcWindowAreaM2, formatAreaM2 } from '@/utils/saleOrderMeta'

const props = defineProps<{ items: SaleOrderItemResponse[] }>()
const { t } = useI18n()
const search = ref('')
const inputClass = 'h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const formatMoney = (v: number) => `${new Intl.NumberFormat('uz-UZ').format(Math.round(v))} so‘m`
const formatArea = (item: SaleOrderItemResponse) => {
  const area = calcWindowAreaM2(item.width, item.height)
  return area != null ? formatAreaM2(area * item.count) : '—'
}

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.items
  return props.items.filter((item) => item.goodsName.toLowerCase().includes(q))
})
</script>
