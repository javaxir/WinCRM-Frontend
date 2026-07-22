<template>
  <div class="space-y-5">
    <!-- Low stock alert -->
    <div
      v-if="lowStockRows.length"
      class="rounded-2xl border border-error-200 bg-error-50/80 px-5 py-4 dark:border-error-500/30 dark:bg-error-500/10"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error-100 dark:bg-error-500/20">
            <AlertTriangle class="h-5 w-5 text-error-600 dark:text-error-400" />
          </div>
          <div>
            <h4 class="text-sm font-semibold text-error-800 dark:text-error-300">
              {{ t('goodsDetail.lowStockTitle') }}
            </h4>
            <p class="mt-1 text-sm text-error-700/90 dark:text-error-400/90">
              {{ t('goodsDetail.lowStockHint', { threshold: LOW_STOCK_THRESHOLD }) }}
            </p>
            <ul class="mt-2 space-y-1">
              <li
                v-for="row in lowStockRows"
                :key="row.warehouseId"
                class="text-sm text-error-700 dark:text-error-400"
              >
                <strong>{{ row.warehouseName }}</strong> — {{ formatCount(row.currentStock) }}
                {{ unitLabel }}
              </li>
            </ul>
          </div>
        </div>
        <router-link
          to="/warehouse-orders"
          class="inline-flex items-center gap-2 rounded-lg bg-error-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-700"
        >
          {{ t('goodsDetail.newIncomingOrder') }}
        </router-link>
      </div>
    </div>

    <!-- Mismatch warning -->
    <div
      v-if="mismatchRows.length"
      class="rounded-2xl border border-warning-200 bg-warning-50/80 px-5 py-4 dark:border-warning-500/30 dark:bg-warning-500/10"
    >
      <div class="flex gap-3">
        <AlertCircle class="mt-0.5 h-5 w-5 shrink-0 text-warning-600 dark:text-warning-400" />
        <div>
          <h4 class="text-sm font-semibold text-warning-800 dark:text-warning-300">
            {{ t('goodsDetail.stockMismatchTitle') }}
          </h4>
          <p class="mt-1 text-sm text-warning-700 dark:text-warning-400">
            {{ t('goodsDetail.stockMismatchHint') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Quantity KPIs -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="kpi in quantityKpis"
        :key="kpi.key"
        class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="px-5 py-4">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ kpi.label }}</p>
          <p class="mt-2 text-2xl font-bold tabular-nums" :class="kpi.valueClass">{{ kpi.value }}</p>
          <p v-if="kpi.hint" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ kpi.hint }}</p>
        </div>
        <div class="h-1" :class="kpi.accent" />
      </div>
    </div>

    <!-- Financial KPIs -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div
        v-for="kpi in financialKpis"
        :key="kpi.key"
        class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ kpi.label }}</p>
        <p class="mt-2 text-xl font-bold tabular-nums" :class="kpi.valueClass">{{ kpi.value }}</p>
        <p v-if="kpi.hint" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ kpi.hint }}</p>
      </div>
    </div>

    <!-- Chart + warehouse table -->
    <div class="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:col-span-1">
        <div class="border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">
            {{ t('goodsDetail.warehouseDistribution') }}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ t('goodsDetail.warehouseDistributionHint') }}
          </p>
        </div>
        <div v-if="chartRows.length" class="p-5 sm:p-6">
          <VueApexCharts type="donut" height="220" :options="warehousePieOptions" :series="warehousePieSeries" />
          <ul class="mt-4 space-y-2">
            <li
              v-for="(row, index) in chartRows"
              :key="row.warehouseId"
              class="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.02]"
            >
              <span class="flex min-w-0 items-center gap-2">
                <span
                  class="h-2.5 w-2.5 shrink-0 rounded-full"
                  :style="{ backgroundColor: WAREHOUSE_COLORS[index % WAREHOUSE_COLORS.length] }"
                />
                <span class="truncate text-gray-700 dark:text-gray-300">{{ row.warehouseName }}</span>
              </span>
              <span class="shrink-0 tabular-nums text-gray-500">
                {{ warehouseShare(row.currentStock) }}%
              </span>
            </li>
          </ul>
        </div>
        <p v-else class="px-5 py-14 text-center text-sm text-gray-500 sm:px-6">{{ t('common.notFound') }}</p>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:col-span-2">
        <div class="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <h3 class="text-base font-medium text-gray-800 dark:text-white/90">
            {{ t('goodsDetail.stockByWarehouse') }}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ t('goodsDetail.stockByWarehouseDrillHint') }}
          </p>
        </div>
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">{{ t('goodsDetail.warehouse') }}</th>
                <SortableTh :label="t('goodsDetail.received')" sortable align="right" :active="sortKey === 'received'" :direction="sortKey === 'received' ? sortDir : null" @sort="toggleSort('received')" />
                <SortableTh :label="t('goodsDetail.sold')" sortable align="right" :active="sortKey === 'sold'" :direction="sortKey === 'sold' ? sortDir : null" @sort="toggleSort('sold')" />
                <SortableTh :label="t('goodsDetail.balance')" sortable align="right" :active="sortKey === 'balance'" :direction="sortKey === 'balance' ? sortDir : null" @sort="toggleSort('balance')" />
                <SortableTh :label="t('goodsDetail.currentStock')" sortable align="right" :active="sortKey === 'currentStock'" :direction="sortKey === 'currentStock' ? sortDir : null" @sort="toggleSort('currentStock')" />
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="sortedRows.length === 0">
                <td colspan="5" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td>
              </tr>
              <template v-for="row in sortedRows" :key="row.warehouseId">
                <tr
                  class="cursor-pointer transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02]"
                  @click="toggleDrillDown(row.warehouseId)"
                >
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex items-center gap-2">
                      <ChevronRight
                        class="h-4 w-4 shrink-0 text-gray-400 transition"
                        :class="expandedWarehouseId === row.warehouseId ? 'rotate-90' : ''"
                      />
                      <span class="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {{ row.warehouseName }}
                      </span>
                      <span
                        v-if="row.isLowStock"
                        class="rounded-full bg-error-50 px-2 py-0.5 text-theme-xs font-medium text-error-600 dark:bg-error-500/15 dark:text-error-400"
                      >
                        {{ t('goodsDetail.lowStockBadge') }}
                      </span>
                      <span
                        v-if="row.hasMismatch"
                        class="rounded-full bg-warning-50 px-2 py-0.5 text-theme-xs font-medium text-warning-700 dark:bg-warning-500/15 dark:text-warning-400"
                      >
                        !
                      </span>
                    </div>
                  </td>
                  <td class="px-5 py-4 text-right text-theme-sm text-gray-500 sm:px-6">{{ formatCount(row.received) }}</td>
                  <td class="px-5 py-4 text-right text-theme-sm text-gray-500 sm:px-6">{{ formatCount(row.sold) }}</td>
                  <td class="px-5 py-4 text-right text-theme-sm font-medium text-success-600 sm:px-6">{{ formatCount(row.balance) }}</td>
                  <td class="px-5 py-4 text-right text-theme-sm font-medium text-brand-600 sm:px-6">{{ formatCount(row.currentStock) }}</td>
                </tr>
                <tr v-if="expandedWarehouseId === row.warehouseId">
                  <td colspan="5" class="bg-gray-50/80 px-5 py-4 dark:bg-white/[0.02] sm:px-6">
                    <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                      {{ t('goodsDetail.warehouseHistoryPreview') }} — {{ row.warehouseName }}
                    </p>
                    <div v-if="drillHistories(row.warehouseId).length" class="space-y-2">
                      <div
                        v-for="item in drillHistories(row.warehouseId).slice(0, 8)"
                        :key="item.id"
                        class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900/40"
                      >
                        <div class="flex items-center gap-2">
                          <span :class="movementClass(item.stockStatus)">
                            {{ item.stockStatus === 'IN' ? t('goodsDetail.movementIn') : t('goodsDetail.movementOut') }}
                          </span>
                          <span class="text-sm font-medium tabular-nums text-gray-800 dark:text-white/90">
                            {{ item.stockStatus === 'IN' ? '+' : '−' }}{{ formatCount(item.count) }}
                          </span>
                          <span v-if="item.comment" class="max-w-xs truncate text-xs text-gray-500">{{ item.comment }}</span>
                        </div>
                        <div class="flex items-center gap-3 text-xs text-gray-500">
                          <span>{{ t('goodsDetail.balanceAfter') }}: {{ formatCount(item.balanceAfter) }}</span>
                          <span>{{ formatDateTime(item.createdAt) }}</span>
                        </div>
                      </div>
                    </div>
                    <p v-else class="text-sm text-gray-500">{{ t('common.notFound') }}</p>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Recent stock history preview -->
    <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <div>
          <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('goodsDetail.recentStockHistory') }}</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('goodsDetail.recentStockHistoryHint') }}</p>
        </div>
        <button
          type="button"
          class="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          @click="$emit('go-history')"
        >
          {{ t('goodsDetail.viewAllHistory') }} →
        </button>
      </div>
      <div class="divide-y divide-gray-100 dark:divide-gray-800">
        <div
          v-for="item in recentHistories"
          :key="item.id"
          class="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5"
        >
          <div class="flex items-center gap-3">
            <span :class="movementClass(item.stockStatus)">
              {{ item.stockStatus === 'IN' ? t('goodsDetail.movementIn') : t('goodsDetail.movementOut') }}
            </span>
            <span class="text-sm font-medium text-gray-800 dark:text-white/90">{{ item.warehouseName }}</span>
            <span class="text-sm tabular-nums text-gray-600 dark:text-gray-300">
              {{ item.stockStatus === 'IN' ? '+' : '−' }}{{ formatCount(item.count) }}
            </span>
          </div>
          <div class="flex items-center gap-4 text-xs text-gray-500">
            <span>{{ t('goodsDetail.balanceAfter') }}: {{ formatCount(item.balanceAfter) }}</span>
            <span>{{ formatDateTime(item.createdAt) }}</span>
          </div>
        </div>
        <p v-if="recentHistories.length === 0" class="px-6 py-10 text-center text-sm text-gray-500">
          {{ t('common.notFound') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import VueApexCharts from 'vue3-apexcharts'
import { AlertTriangle, AlertCircle, ChevronRight } from 'lucide-vue-next'
import SortableTh from '@/components/common/SortableTh.vue'
import { useTableSort } from '@/composables/useTableControls'
import {
  LOW_STOCK_THRESHOLD,
  type GoodsStockRow,
  type GoodsStockSummary,
} from '@/utils/goodsStockAnalytics'
import type { StockHistoryResponse } from '@/services/stockHistories'

const WAREHOUSE_COLORS = ['#465FFF', '#22C55E', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899']

const props = defineProps<{
  rows: GoodsStockRow[]
  summary: GoodsStockSummary
  histories: StockHistoryResponse[]
  priceCost: number
  priceSelling: number
  unitLabel: string
}>()

defineEmits<{ 'go-history': [] }>()

const { t } = useI18n()
const expandedWarehouseId = ref<number | null>(null)

const formatCount = (v: number) => new Intl.NumberFormat('uz-UZ').format(v)
const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(v)) + ' so‘m'
const formatDateTime = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString()
}

const { sortKey, sortDir, toggleSort, applySort } = useTableSort<GoodsStockRow>(
  (row, key) => row[key as keyof GoodsStockRow],
)
const sortedRows = computed(() => applySort(props.rows))

const lowStockRows = computed(() =>
  props.rows.filter((row) => row.isLowStock).sort((a, b) => a.currentStock - b.currentStock),
)
const mismatchRows = computed(() => props.rows.filter((row) => row.hasMismatch))
const chartRows = computed(() =>
  [...props.rows].filter((row) => row.currentStock > 0).sort((a, b) => b.currentStock - a.currentStock),
)
const totalChartStock = computed(() => chartRows.value.reduce((sum, row) => sum + row.currentStock, 0))

const recentHistories = computed(() =>
  [...props.histories]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10),
)

const quantityKpis = computed(() => [
  {
    key: 'received',
    label: t('goodsDetail.received'),
    value: formatCount(props.summary.received),
    hint: props.unitLabel,
    valueClass: 'text-brand-600',
    accent: 'bg-brand-500',
  },
  {
    key: 'sold',
    label: t('goodsDetail.sold'),
    value: formatCount(props.summary.sold),
    hint: props.unitLabel,
    valueClass: 'text-orange-500',
    accent: 'bg-orange-500',
  },
  {
    key: 'balance',
    label: t('goodsDetail.balance'),
    value: formatCount(props.summary.balance),
    hint: t('goodsDetail.balanceFormula'),
    valueClass: 'text-success-600',
    accent: 'bg-success-500',
  },
  {
    key: 'current',
    label: t('goodsDetail.currentStock'),
    value: formatCount(props.summary.currentStock),
    hint: props.unitLabel,
    valueClass: 'text-gray-800 dark:text-white/90',
    accent: 'bg-gray-400',
  },
])

const financialKpis = computed(() => {
  const stock = props.summary.currentStock
  const costValue = stock * props.priceCost
  const sellValue = stock * props.priceSelling
  const markup = props.priceCost > 0 ? ((props.priceSelling - props.priceCost) / props.priceCost) * 100 : 0
  return [
    {
      key: 'cost',
      label: t('goodsDetail.inventoryCostValue'),
      value: formatMoney(costValue),
      hint: `${formatCount(stock)} × ${formatMoney(props.priceCost)}`,
      valueClass: 'text-gray-800 dark:text-white/90',
    },
    {
      key: 'sell',
      label: t('goodsDetail.inventorySellValue'),
      value: formatMoney(sellValue),
      hint: `${formatCount(stock)} × ${formatMoney(props.priceSelling)}`,
      valueClass: 'text-brand-600',
    },
    {
      key: 'markup',
      label: t('goodsDetail.markupPercent'),
      value: `${markup.toFixed(1)}%`,
      hint: t('goodsDetail.inventorySellValue'),
      valueClass: markup >= 20 ? 'text-success-600' : 'text-warning-600',
    },
  ]
})

const warehousePieSeries = computed(() => chartRows.value.map((row) => row.currentStock))
const warehousePieOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif' },
  colors: WAREHOUSE_COLORS,
  labels: chartRows.value.map((row) => row.warehouseName),
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: '65%' } } },
  tooltip: {
    y: {
      formatter: (v: number) => `${formatCount(v)} ${props.unitLabel}`,
    },
  },
}))

const warehouseShare = (count: number) =>
  totalChartStock.value > 0 ? Math.round((count / totalChartStock.value) * 100) : 0

const toggleDrillDown = (warehouseId: number) => {
  expandedWarehouseId.value = expandedWarehouseId.value === warehouseId ? null : warehouseId
}

const drillHistories = (warehouseId: number) =>
  [...props.histories]
    .filter((item) => item.warehouseId === warehouseId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

const movementClass = (status: string) => {
  if (status === 'IN') {
    return 'rounded-full bg-success-50 px-2 py-0.5 text-theme-xs font-medium text-success-700 dark:bg-success-500/15 dark:text-success-400'
  }
  return 'rounded-full bg-orange-50 px-2 py-0.5 text-theme-xs font-medium text-orange-700 dark:bg-orange-500/15 dark:text-orange-400'
}
</script>
