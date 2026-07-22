<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="t('salesDashboard.title')" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('salesDashboard.title') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('salesDashboard.subtitle') }}</p>
          </div>
          <ActionIconButton action="refresh" @click="loadData" />
        </div>

        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
        </div>

        <div class="flex flex-wrap items-end gap-4 border-t border-gray-100 px-6 pb-5 pt-4 dark:border-gray-800">
          <DateRangePicker
            v-model:start-date="filterStart"
            v-model:end-date="filterEnd"
            :label="t('salesDashboard.period')"
            @apply="applyFilter"
          />
          <ActionIconButton action="filter" @click="applyFilter" />
          <ActionIconButton action="reset" @click="resetFilter" />
        </div>
      </div>

      <div v-if="loading" class="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03]">
        {{ t('common.loading') }}
      </div>

      <template v-else>
        <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="border-b border-gray-100 px-6 py-5 dark:border-gray-800 sm:px-8 sm:py-6">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('salesDashboard.statusBreakdown') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('salesDashboard.statusHeroHint') }}</p>
          </div>

          <div class="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3 xl:grid-cols-6">
            <div
              v-for="item in statusSummaries"
              :key="item.status"
              class="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-white/[0.03]"
            >
              <div class="px-5 py-5">
                <span :class="saleOrderStatusClass(item.status)">{{ saleOrderStatusLabel(item.status) }}</span>
                <p class="mt-4 text-3xl font-bold text-gray-800 dark:text-white/90">{{ item.orderCount }}</p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('salesDashboard.orderCount') }}</p>
                <p class="mt-4 text-base font-semibold" :style="{ color: saleOrderStatusColor(item.status) }">
                  {{ formatMoney(item.totalAmount) }}
                </p>
                <div class="mt-4 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                  <div
                    class="h-full rounded-full transition-all"
                    :style="{ width: `${item.sharePercent}%`, backgroundColor: saleOrderStatusColor(item.status) }"
                  />
                </div>
                <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">{{ item.sharePercent }}% {{ t('salesDashboard.share') }}</p>
              </div>
              <div class="h-1.5" :style="{ backgroundColor: saleOrderStatusColor(item.status) }" />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-6 border-t border-gray-100 px-6 py-6 dark:border-gray-800 sm:px-8 xl:grid-cols-5">
            <div class="xl:col-span-3">
              <h4 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('salesDashboard.statusAmountChart') }}</h4>
              <VueApexCharts
                v-if="statusChartItems.length"
                type="bar"
                height="380"
                :options="statusBarOptions"
                :series="statusBarSeries"
              />
              <p v-else class="py-20 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
            </div>
            <div class="xl:col-span-2">
              <h4 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('salesDashboard.statusChart') }}</h4>
              <VueApexCharts
                v-if="statusChartItems.length"
                type="donut"
                height="380"
                :options="statusDonutOptions"
                :series="statusDonutSeries"
              />
              <p v-else class="py-20 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="metric in kpiMetrics"
            :key="metric.key"
            class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div class="px-5 py-4">
              <div class="flex items-center gap-2">
                <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: metric.color }" />
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ metric.label }}</p>
              </div>
              <p class="mt-2 text-2xl font-bold" :style="{ color: metric.color }">{{ metric.value }}</p>
              <p v-if="metric.hint" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ metric.hint }}</p>
            </div>
            <div class="h-1" :style="{ backgroundColor: metric.color }" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-5">
          <div class="rounded-2xl border border-gray-200 bg-white px-5 py-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            <div class="mb-1">
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('salesDashboard.salesTrend') }}</h4>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('salesDashboard.salesTrendHint') }}</p>
            </div>
            <VueApexCharts
              v-if="hasTimelineData"
              type="area"
              height="320"
              :options="salesTrendOptions"
              :series="salesTrendSeries"
            />
            <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="border-b border-gray-100 px-6 py-5 dark:border-gray-800 sm:px-8 sm:py-6">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('salesDashboard.userOrdersTitle') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('salesDashboard.userOrdersHint') }}</p>
          </div>

          <div class="grid grid-cols-12 gap-6 border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
            <div class="col-span-12 lg:col-span-7">
              <div class="mb-1">
                <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('salesDashboard.sellersChart') }}</h4>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('salesDashboard.sellersChartHint') }}</p>
              </div>
              <VueApexCharts
                v-if="userSummaries.length"
                type="line"
                height="360"
                :options="sellersLineOptions"
                :series="sellersLineSeries"
              />
              <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
            </div>

            <div class="col-span-12 lg:col-span-5">
              <div class="mb-1">
                <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('salesDashboard.userOrdersCountChart') }}</h4>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('salesDashboard.userOrdersCountChartHint') }}</p>
              </div>
              <VueApexCharts
                v-if="userSummaries.length"
                type="pie"
                height="360"
                :options="userOrdersPieOptions"
                :series="userOrdersPieSeries"
              />
              <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
            </div>
          </div>

          <div>
            <div class="max-w-full overflow-x-auto custom-scrollbar">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/5">
                    <th class="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('salesDashboard.seller') }}</th>
                    <th class="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('salesDashboard.orderCount') }}</th>
                    <th class="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('salesDashboard.soldAmount') }}</th>
                    <th class="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('salesDashboard.debtAmount') }}</th>
                    <th class="min-w-[140px] px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('salesDashboard.share') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr v-if="userSummaries.length === 0">
                    <td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td>
                  </tr>
                  <tr v-for="(seller, index) in userSummaries" :key="seller.key">
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-2">
                        <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: getUserColor(index) }" />
                        <span class="text-sm font-medium text-gray-800 dark:text-white/90">{{ seller.userName }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-4 text-right text-sm font-semibold text-gray-800 dark:text-white/90">{{ seller.orderCount }}</td>
                    <td class="px-5 py-4 text-right text-sm font-semibold text-brand-600 dark:text-brand-400">{{ formatMoney(seller.totalAmount) }}</td>
                    <td class="px-5 py-4 text-right text-sm font-semibold" :class="seller.debtAmount > 0 ? 'text-error-600 dark:text-error-400' : 'text-gray-500 dark:text-gray-400'">
                      {{ formatMoney(seller.debtAmount) }}
                    </td>
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                          <div class="h-full rounded-full" :style="{ width: `${seller.sharePercent}%`, backgroundColor: getUserColor(index) }" />
                        </div>
                        <span class="w-10 shrink-0 text-right text-xs text-gray-500 dark:text-gray-400">{{ seller.sharePercent }}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="userSummaries.length">
                  <tr class="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/5">
                    <td class="px-5 py-3 text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('salesDashboard.sellersTotal') }}</td>
                    <td class="px-5 py-3 text-right text-sm font-semibold text-gray-800 dark:text-white/90">{{ grandTotalCount }}</td>
                    <td class="px-5 py-3 text-right text-sm font-semibold text-brand-600 dark:text-brand-400">{{ formatMoney(sellersTotalAmount) }}</td>
                    <td class="px-5 py-3 text-right text-sm font-semibold text-error-600 dark:text-error-400">{{ formatMoney(sellersTotalDebt) }}</td>
                    <td class="px-5 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import VueApexCharts from 'vue3-apexcharts'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import { fetchSaleOrdersByDateRange, type SaleOrderResponse } from '@/services/saleOrders'
import {
  SALE_ORDER_STATUSES,
  saleOrderStatusLabel,
  saleOrderStatusColor,
  saleOrderStatusClass,
} from '@/utils/saleOrderStatus'
import { formatIsoDate, getThisMonthRange } from '@/utils/dateRange'

const { t } = useI18n()

const monthRange = getThisMonthRange()

const loading = ref(false)
const errorMessage = ref('')
const orders = ref<SaleOrderResponse[]>([])
const filterStart = ref(monthRange.startDate)
const filterEnd = ref(monthRange.endDate)
const appliedStart = ref(monthRange.startDate)
const appliedEnd = ref(monthRange.endDate)

const grandTotalCount = computed(() => orders.value.length)
const grandTotalAmount = computed(() => orders.value.reduce((sum, order) => sum + order.totalSum, 0))
const grandTotalDebt = computed(() => orders.value.reduce((sum, order) => sum + order.debtSum, 0))
const completedCount = computed(() => orders.value.filter((order) => order.orderStatus === 'COMPLETED').length)
const completedAmount = computed(() =>
  orders.value
    .filter((order) => order.orderStatus === 'COMPLETED')
    .reduce((sum, order) => sum + order.totalSum, 0),
)

const formatMoney = (value: number) => `${new Intl.NumberFormat('uz-UZ').format(value)} so‘m`
const formatCompactMoney = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(Math.round(value))
}

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })

const USER_CHART_COLORS = ['#465FFF', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#7592FF']

const getUserColor = (index: number) => USER_CHART_COLORS[index % USER_CHART_COLORS.length]

const kpiMetrics = computed(() => [
  {
    key: 'sales',
    label: t('salesDashboard.grandTotal'),
    value: formatCompactMoney(grandTotalAmount.value) + ' so‘m',
    hint: `${grandTotalCount.value} ${t('salesDashboard.orders')}`,
    color: '#465FFF',
  },
  {
    key: 'debt',
    label: t('salesDashboard.totalDebt'),
    value: formatCompactMoney(grandTotalDebt.value) + ' so‘m',
    hint: t('salesDashboard.totalDebtHint'),
    color: '#EF4444',
  },
  {
    key: 'completed',
    label: t('salesDashboard.completedAmount'),
    value: formatCompactMoney(completedAmount.value) + ' so‘m',
    hint: `${completedCount.value} ${t('salesDashboard.orders')}`,
    color: '#16A34A',
  },
  {
    key: 'orders',
    label: t('salesDashboard.activeOrders'),
    value: String(grandTotalCount.value - completedCount.value),
    hint: t('salesDashboard.activeOrdersHint'),
    color: '#F59E0B',
  },
])

const statusSummaries = computed(() =>
  SALE_ORDER_STATUSES.map((status) => {
    const matched = orders.value.filter((order) => order.orderStatus === status)
    const totalAmount = matched.reduce((sum, order) => sum + order.totalSum, 0)
    const sharePercent = grandTotalAmount.value > 0
      ? Math.round((totalAmount / grandTotalAmount.value) * 100)
      : 0
    return {
      status,
      orderCount: matched.length,
      totalAmount,
      sharePercent,
    }
  }),
)

const statusChartItems = computed(() =>
  statusSummaries.value.filter((item) => item.orderCount > 0),
)

interface UserSummary {
  key: string
  userName: string
  totalAmount: number
  debtAmount: number
  orderCount: number
  sharePercent: number
}

const userSummaries = computed<UserSummary[]>(() => {
  const map = new Map<string, UserSummary>()

  for (const order of orders.value) {
    const key = order.userId ? String(order.userId) : 'unassigned'
    const current = map.get(key) ?? {
      key,
      userName: order.userFullName || t('salesDashboard.unassignedSeller'),
      totalAmount: 0,
      debtAmount: 0,
      orderCount: 0,
      sharePercent: 0,
    }
    current.totalAmount += order.totalSum
    current.debtAmount += order.debtSum
    current.orderCount += 1
    map.set(key, current)
  }

  const items = Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount)
  const total = grandTotalAmount.value
  return items.map((item) => ({
    ...item,
    sharePercent: total > 0 ? Math.round((item.totalAmount / total) * 100) : 0,
  }))
})

const sellersTotalAmount = computed(() => userSummaries.value.reduce((sum, item) => sum + item.totalAmount, 0))
const sellersTotalDebt = computed(() => userSummaries.value.reduce((sum, item) => sum + item.debtAmount, 0))

const timelineData = computed(() => {
  const labels: string[] = []
  const salesData: number[] = []
  const debtData: number[] = []
  const dayKeys: string[] = []

  const start = new Date(`${appliedStart.value}T00:00:00`)
  const end = new Date(`${appliedEnd.value}T00:00:00`)

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const key = formatIsoDate(cursor)
    dayKeys.push(key)
    labels.push(formatDayLabel(cursor))
    salesData.push(0)
    debtData.push(0)
  }

  for (const order of orders.value) {
    const key = formatIsoDate(new Date(order.orderDate))
    const index = dayKeys.indexOf(key)
    if (index >= 0) {
      salesData[index] += order.totalSum
      debtData[index] += order.debtSum
    }
  }

  return { labels, salesData, debtData }
})

const hasTimelineData = computed(() => timelineData.value.labels.length > 0)

const salesTrendSeries = computed(() => [
  { name: t('salesDashboard.soldAmount'), data: timelineData.value.salesData },
  { name: t('salesDashboard.debtAmount'), data: timelineData.value.debtData },
])

const baseChartOptions = {
  chart: {
    fontFamily: 'Outfit, sans-serif',
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  grid: {
    borderColor: '#374151',
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
  },
  dataLabels: { enabled: false },
  tooltip: {
    theme: 'dark' as const,
    y: { formatter: (val: number) => formatMoney(val) },
  },
}

const salesTrendOptions = computed(() => ({
  ...baseChartOptions,
  chart: { ...baseChartOptions.chart, type: 'area' as const },
  colors: ['#465FFF', '#EF4444'],
  stroke: { curve: 'smooth' as const, width: [3, 2] },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.35,
      opacityTo: 0.02,
      stops: [0, 90, 100],
    },
  },
  xaxis: {
    categories: timelineData.value.labels,
    labels: {
      style: { fontSize: '11px', colors: '#9CA3AF' },
      rotate: -45,
      rotateAlways: timelineData.value.labels.length > 10,
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: { fontSize: '11px', colors: '#9CA3AF' },
      formatter: (val: number) => formatCompactMoney(val),
    },
  },
  legend: {
    position: 'top' as const,
    horizontalAlign: 'right' as const,
    fontSize: '12px',
    labels: { colors: '#9CA3AF' },
  },
}))

const statusDonutSeries = computed(() => statusChartItems.value.map((item) => item.totalAmount))

const statusBarSeries = computed(() => [
  { name: t('salesDashboard.amount'), data: statusSummaries.value.map((item) => item.totalAmount) },
])

const statusBarOptions = computed(() => ({
  ...baseChartOptions,
  chart: { ...baseChartOptions.chart, type: 'bar' as const },
  colors: statusSummaries.value.map((item) => saleOrderStatusColor(item.status)),
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 6,
      borderRadiusApplication: 'end' as const,
      barHeight: '62%',
      distributed: true,
    },
  },
  xaxis: {
    categories: statusSummaries.value.map((item) => saleOrderStatusLabel(item.status)),
    labels: {
      style: { fontSize: '12px', colors: '#9CA3AF' },
      formatter: (val: number) => formatCompactMoney(val),
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: { fontSize: '12px', colors: '#D1D5DB', fontWeight: 500 },
    },
  },
  legend: { show: false },
  grid: {
    ...baseChartOptions.grid,
    padding: { left: 8, right: 16 },
  },
}))

const statusDonutOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', type: 'donut' as const },
  colors: statusChartItems.value.map((item) => saleOrderStatusColor(item.status)),
  labels: statusChartItems.value.map((item) => saleOrderStatusLabel(item.status)),
  legend: {
    position: 'bottom' as const,
    fontSize: '12px',
    labels: { colors: '#9CA3AF' },
  },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          total: {
            show: true,
            label: t('salesDashboard.grandTotal'),
            formatter: () => formatCompactMoney(grandTotalAmount.value),
          },
        },
      },
    },
  },
  tooltip: {
    theme: 'dark',
    y: { formatter: (val: number) => formatMoney(val) },
  },
}))

const sellersLineSeries = computed(() => [
  { name: t('salesDashboard.soldAmount'), data: userSummaries.value.map((item) => item.totalAmount) },
  { name: t('salesDashboard.debtAmount'), data: userSummaries.value.map((item) => item.debtAmount) },
])

const sellersLineOptions = computed(() => ({
  ...baseChartOptions,
  chart: { ...baseChartOptions.chart, type: 'line' as const },
  colors: ['#465FFF', '#EF4444'],
  stroke: { curve: 'smooth' as const, width: [3, 3] },
  markers: {
    size: 5,
    strokeWidth: 2,
    hover: { size: 7 },
  },
  xaxis: {
    categories: userSummaries.value.map((item) => item.userName),
    labels: {
      style: { fontSize: '11px', colors: '#9CA3AF' },
      rotate: -25,
      trim: true,
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: { fontSize: '11px', colors: '#9CA3AF' },
      formatter: (val: number) => formatCompactMoney(val),
    },
  },
  legend: {
    position: 'top' as const,
    horizontalAlign: 'right' as const,
    fontSize: '12px',
    labels: { colors: '#9CA3AF' },
  },
}))

const userOrdersPieSeries = computed(() => userSummaries.value.map((item) => item.orderCount))

const userOrdersPieOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', type: 'pie' as const },
  colors: userSummaries.value.map((_, index) => getUserColor(index)),
  labels: userSummaries.value.map((item) => item.userName),
  legend: {
    position: 'bottom' as const,
    fontSize: '12px',
    labels: { colors: '#9CA3AF' },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => `${Math.round(val)}%`,
    style: { fontSize: '12px', fontWeight: 600 },
  },
  tooltip: {
    theme: 'dark',
    y: {
      formatter: (val: number, opts: { seriesIndex: number }) => {
        const seller = userSummaries.value[opts.seriesIndex]
        return seller ? `${val} ${t('salesDashboard.orders')} · ${formatMoney(seller.totalAmount)}` : String(val)
      },
    },
  },
}))

const loadData = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    orders.value = await fetchSaleOrdersByDateRange(appliedStart.value, appliedEnd.value)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
    orders.value = []
  } finally {
    loading.value = false
  }
}

const applyFilter = async () => {
  if (filterStart.value && filterEnd.value && filterStart.value > filterEnd.value) {
    errorMessage.value = t('saleOrderItemsFilter.invalidDateRange')
    return
  }
  appliedStart.value = filterStart.value
  appliedEnd.value = filterEnd.value
  await loadData()
}

const resetFilter = async () => {
  const range = getThisMonthRange()
  filterStart.value = range.startDate
  filterEnd.value = range.endDate
  appliedStart.value = range.startDate
  appliedEnd.value = range.endDate
  errorMessage.value = ''
  await loadData()
}

onMounted(loadData)
</script>
