<template>
  <div class="space-y-5">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-start justify-between gap-3 p-5">
          <div class="flex items-start gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5">
              <Calendar class="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ formatShortDate(lastActivityDate) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('supplierDetail.lastActivity') }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-3xl font-bold text-orange-500">{{ daysSinceActivity }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('supplierDetail.daysAgo') }}</p>
          </div>
        </div>
        <div class="h-1.5 bg-orange-500"></div>
      </div>

      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center gap-3 p-5">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5">
            <CalendarClock class="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">
            {{ t('supplierDetail.promisedPayment') }}
            <span class="text-warning-500">{{ t('supplierDetail.promisedDays', { count: promisedPaymentDays }) }}</span>
          </p>
        </div>
        <div class="h-1.5 bg-warning-500"></div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xl font-bold text-gray-800 dark:text-white/90">{{ formatMoney(averageOrder) }}</p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('supplierDetail.averageOrder') }}</p>
          </div>
          <div class="h-16 w-28">
            <VueApexCharts v-if="averageOrderSeries[0].data.length" type="bar" height="64" width="112" :options="miniBarOptions" :series="averageOrderSeries" />
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xl font-bold text-gray-800 dark:text-white/90">{{ ordersCount }} {{ t('sms.orders') }}</p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('supplierDetail.orders') }}</p>
          </div>
          <div class="h-16 w-28">
            <VueApexCharts v-if="ordersSparklineSeries[0].data.length" type="line" height="64" width="112" :options="sparklineOptions" :series="ordersSparklineSeries" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('supplierDetail.purchasesTrend') }}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('supplierDetail.purchasesTrendHint') }}</p>
        <div class="mt-5">
          <VueApexCharts v-if="monthlyStats.labels.length" type="area" height="300" :options="purchasesLineOptions" :series="purchasesLineSeries" />
          <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('supplierDetail.ordersTrend') }}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('supplierDetail.ordersTrendHint') }}</p>
        <div class="mt-5">
          <VueApexCharts v-if="monthlyStats.labels.length" type="line" height="300" :options="ordersLineOptions" :series="ordersLineSeries" />
          <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('supplierDetail.paymentsTrend') }}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('supplierDetail.paymentsTrendHint') }}</p>
        <div class="mt-5">
          <VueApexCharts v-if="monthlyPaymentStats.labels.length" type="line" height="300" :options="paymentsLineOptions" :series="paymentsLineSeries" />
          <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('supplierDetail.financeSummary') }}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('supplierDetail.financeSummaryHint') }}</p>
        <div class="mt-5">
          <VueApexCharts v-if="financeSummary.total > 0" type="bar" height="300" :options="financeBarOptions" :series="financeBarSeries" />
          <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div class="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            <button
              type="button"
              @click="productMode = 'amount'"
              :class="productMode === 'amount' ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'"
              class="rounded-md px-3 py-1.5 text-xs font-medium"
            >
              {{ t('supplierDetail.byAmount') }}
            </button>
            <button
              type="button"
              @click="productMode = 'quantity'"
              :class="productMode === 'quantity' ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'"
              class="rounded-md px-3 py-1.5 text-xs font-medium"
            >
              {{ t('supplierDetail.byQuantity') }}
            </button>
          </div>
          <h4 class="mt-3 text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('supplierDetail.popularProducts') }}</h4>
        </div>
        <div class="grid grid-cols-1 gap-5 p-5 xl:grid-cols-2 sm:p-6">
          <div>
            <VueApexCharts v-if="popularDonutSeries.length" type="donut" height="280" :options="popularDonutOptions" :series="popularDonutSeries" />
            <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
          </div>
          <div>
            <VueApexCharts v-if="popularProducts.length" type="bar" height="280" :options="popularBarOptions" :series="popularBarSeries" />
            <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
          </div>
        </div>
        <div v-if="popularProducts.length" class="border-t border-gray-100 dark:border-gray-800">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-100 dark:border-gray-800">
                <SortableTh :label="t('supplierDetail.productName')" sortable :active="productSortKey === 'name'" :direction="productSortKey === 'name' ? productSortDir : null" @sort="toggleProductSort('name')" />
                <SortableTh :label="productMode === 'amount' ? t('dashboard.amount') : t('dashboard.quantity')" sortable align="right" :active="productSortKey === productMode" :direction="productSortKey === productMode ? productSortDir : null" @sort="toggleProductSort(productMode)" />
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="item in sortedPopularProducts" :key="item.name">
                <td class="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{{ item.name }}</td>
                <td class="px-5 py-3 text-right text-sm text-gray-500">{{ productMode === 'amount' ? formatMoney(item.amount) : formatCount(item.quantity) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('goodsDetail.warehouseDistribution') }}</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('supplierDetail.warehouseHint') }}</p>
        </div>
        <div v-if="warehouseStats.length" class="p-5 sm:p-6">
          <VueApexCharts type="donut" height="280" :options="warehousePieOptions" :series="warehousePieSeries" />
          <ul class="mt-4 space-y-2">
            <li
              v-for="(row, index) in warehouseStats"
              :key="row.warehouseName"
              class="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.02]"
            >
              <span class="flex min-w-0 items-center gap-2">
                <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: WAREHOUSE_COLORS[index % WAREHOUSE_COLORS.length] }" />
                <span class="truncate text-gray-700 dark:text-gray-300">{{ row.warehouseName }}</span>
              </span>
              <span class="shrink-0 tabular-nums text-gray-500">{{ warehouseShare(row.totalAmount) }}%</span>
            </li>
          </ul>
        </div>
        <p v-else class="px-5 py-14 text-center text-sm text-gray-500 sm:px-6">{{ t('common.notFound') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import VueApexCharts from 'vue3-apexcharts'
import { Calendar, CalendarClock } from 'lucide-vue-next'
import SortableTh from '@/components/common/SortableTh.vue'
import { useTableSort } from '@/composables/useTableControls'
import type { SupplierPaymentResponse } from '@/services/supplierPayments'
import type { WarehouseOrderItemResponse } from '@/services/warehouseOrderItems'
import type { WarehouseOrderResponse } from '@/services/warehouseOrders'
import {
  buildPopularProducts,
  summarizeSupplierFinance,
  type SupplierWarehouseStatRow,
} from '@/utils/supplierDetailAnalytics'

const WAREHOUSE_COLORS = ['#465FFF', '#22C55E', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899']

const props = defineProps<{
  orders: WarehouseOrderResponse[]
  payments: SupplierPaymentResponse[]
  orderItems: WarehouseOrderItemResponse[]
  warehouseStats: SupplierWarehouseStatRow[]
}>()

const { t } = useI18n()
const productMode = ref<'amount' | 'quantity'>('amount')
const promisedPaymentDays = 0

type ProductStat = { name: string; amount: number; quantity: number }

const formatMoney = (v: number) => `${new Intl.NumberFormat('uz-UZ').format(Math.round(v))} so‘m`
const formatCount = (v: number) => new Intl.NumberFormat('uz-UZ').format(v)
const formatShortDate = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  if (isNaN(d.getTime())) return v
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`
}

const sortedOrders = computed(() =>
  [...props.orders].sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime()),
)

const lastActivityDate = computed(() => sortedOrders.value[0]?.arrivalDate || '')

const daysSinceActivity = computed(() => {
  if (!lastActivityDate.value) return 0
  const diff = Date.now() - new Date(lastActivityDate.value).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
})

const averageOrder = computed(() => {
  if (!props.orders.length) return 0
  return props.orders.reduce((sum, order) => sum + order.totalSum, 0) / props.orders.length
})

const ordersCount = computed(() => props.orders.length)

const recentOrderTotals = computed(() => sortedOrders.value.slice(0, 6).reverse().map((order) => order.totalSum))
const averageOrderSeries = computed(() => [{ name: 'Summa', data: recentOrderTotals.value }])

const ordersSparklineSeries = computed(() => {
  const monthly = new Map<string, number>()
  for (const order of sortedOrders.value) {
    const d = new Date(order.arrivalDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthly.set(key, (monthly.get(key) || 0) + 1)
  }
  const keys = [...monthly.keys()].sort().slice(-6)
  return [{ name: t('supplierDetail.orders'), data: keys.map((key) => monthly.get(key) || 0) }]
})

const monthLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number)
  const d = new Date(year, month - 1, 1)
  return d.toLocaleDateString('uz-UZ', { month: 'short', year: '2-digit' })
}

const monthlyStats = computed(() => {
  const map = new Map<string, { total: number; count: number }>()
  for (const order of sortedOrders.value) {
    const d = new Date(order.arrivalDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const row = map.get(key) || { total: 0, count: 0 }
    row.total += order.totalSum
    row.count += 1
    map.set(key, row)
  }
  const keys = [...map.keys()].sort()
  return {
    labels: keys.map(monthLabel),
    totals: keys.map((key) => map.get(key)!.total),
    counts: keys.map((key) => map.get(key)!.count),
  }
})

const monthlyPaymentStats = computed(() => {
  const map = new Map<string, number>()
  for (const payment of props.payments) {
    const d = new Date(payment.paymentDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) || 0) + payment.paymentAmount)
  }
  const keys = [...map.keys()].sort()
  return {
    labels: keys.map(monthLabel),
    amounts: keys.map((key) => map.get(key) || 0),
  }
})

const financeSummary = computed(() => {
  const summary = summarizeSupplierFinance(props.orders, props.payments)
  return {
    ...summary,
    total: summary.totalPurchases + summary.totalPaid + summary.totalDebt,
  }
})

const popularProducts = computed(() => buildPopularProducts(props.orderItems).slice(0, 5))

const {
  sortKey: productSortKey,
  sortDir: productSortDir,
  toggleSort: toggleProductSort,
  applySort: applyProductSort,
} = useTableSort<ProductStat>((row, key) => {
  if (key === 'amount' || key === 'quantity') return row[key]
  return row.name
})

const sortedPopularProducts = computed(() => {
  const items = [...popularProducts.value]
  if (!productSortKey.value) {
    return items.sort((a, b) =>
      productMode.value === 'amount' ? b.amount - a.amount : b.quantity - a.quantity,
    )
  }
  return applyProductSort(items)
})

const popularDonutSeries = computed(() =>
  popularProducts.value.map((item) => (productMode.value === 'amount' ? item.amount : item.quantity)),
)

const totalWarehouseAmount = computed(() => props.warehouseStats.reduce((sum, row) => sum + row.totalAmount, 0))
const warehouseShare = (amount: number) =>
  totalWarehouseAmount.value > 0 ? Math.round((amount / totalWarehouseAmount.value) * 100) : 0

const warehousePieSeries = computed(() => props.warehouseStats.map((row) => row.totalAmount))
const warehousePieOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif' },
  colors: WAREHOUSE_COLORS,
  labels: props.warehouseStats.map((row) => row.warehouseName),
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: '72%' } } },
  tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
}))

const baseLineChart = {
  chart: { fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  grid: { strokeDashArray: 4 },
  xaxis: { labels: { style: { fontSize: '12px' } } },
  yaxis: { labels: { style: { fontSize: '12px' } } },
}

const purchasesLineSeries = computed(() => [{ name: t('supplierDetail.totalPurchases'), data: monthlyStats.value.totals }])
const purchasesLineOptions = computed(() => ({
  ...baseLineChart,
  colors: ['#465FFF'],
  fill: { type: 'gradient', gradient: { opacityFrom: 0.45, opacityTo: 0.05 } },
  xaxis: { ...baseLineChart.xaxis, categories: monthlyStats.value.labels },
  tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
}))

const ordersLineSeries = computed(() => [{ name: t('supplierDetail.orders'), data: monthlyStats.value.counts }])
const ordersLineOptions = computed(() => ({
  ...baseLineChart,
  colors: ['#8B5CF6'],
  xaxis: { ...baseLineChart.xaxis, categories: monthlyStats.value.labels },
}))

const paymentsLineSeries = computed(() => [{ name: t('supplierDetail.tabPayments'), data: monthlyPaymentStats.value.amounts }])
const paymentsLineOptions = computed(() => ({
  ...baseLineChart,
  colors: ['#22C55E'],
  xaxis: { ...baseLineChart.xaxis, categories: monthlyPaymentStats.value.labels },
  tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
}))

const financeBarSeries = computed(() => [{
  name: t('supplierDetail.financeSummary'),
  data: [financeSummary.value.totalPurchases, financeSummary.value.totalPaid, financeSummary.value.totalDebt],
}])
const financeBarOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
  colors: ['#465FFF', '#22C55E', '#F59E0B'],
  plotOptions: { bar: { borderRadius: 8, columnWidth: '45%', distributed: true } },
  dataLabels: { enabled: false },
  legend: { show: false },
  xaxis: {
    categories: [t('supplierDetail.totalPurchases'), t('supplierDetail.totalPaid'), t('supplierDetail.totalDebt')],
    labels: { style: { fontSize: '12px' } },
  },
  tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
}))

const popularBarSeries = computed(() => [{
  name: productMode.value === 'amount' ? t('dashboard.amount') : t('dashboard.quantity'),
  data: popularProducts.value.map((item) => (productMode.value === 'amount' ? item.amount : item.quantity)),
}])
const popularBarOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
  colors: ['#465FFF'],
  plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '60%' } },
  dataLabels: { enabled: false },
  xaxis: { categories: popularProducts.value.map((item) => item.name), labels: { style: { fontSize: '11px' } } },
  tooltip: {
    y: {
      formatter: (v: number) => (productMode.value === 'amount' ? formatMoney(v) : formatCount(v)),
    },
  },
}))

const miniBarOptions = {
  chart: { sparkline: { enabled: true }, toolbar: { show: false } },
  colors: ['#22C55E'],
  plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
  tooltip: { enabled: false },
  grid: { show: false },
  xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { show: false },
}

const sparklineOptions = {
  chart: { sparkline: { enabled: true }, toolbar: { show: false } },
  colors: ['#8B5CF6'],
  stroke: { curve: 'smooth', width: 2 },
  tooltip: { enabled: false },
  grid: { show: false },
  xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { show: false },
}

const popularDonutOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif' },
  colors: ['#465FFF', '#7592FF', '#9CB9FF', '#22C55E', '#F59E0B'],
  labels: popularProducts.value.map((item) => item.name),
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: '72%' } } },
}))
</script>
