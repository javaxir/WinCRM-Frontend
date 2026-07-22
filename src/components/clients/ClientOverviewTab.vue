<template>
  <div class="space-y-5">
    <!-- KPI strip -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="kpi in kpiCards"
        :key="kpi.key"
        class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="flex items-start justify-between gap-3 px-5 py-4">
          <div class="min-w-0">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ kpi.label }}</p>
            <p class="mt-2 truncate text-xl font-bold tabular-nums" :class="kpi.valueClass">{{ kpi.value }}</p>
            <p v-if="kpi.hint" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ kpi.hint }}</p>
          </div>
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" :class="kpi.iconBg">
            <component :is="kpi.icon" class="h-5 w-5" :class="kpi.iconClass" />
          </div>
        </div>
        <div class="h-1" :class="kpi.accent" />
      </div>
    </div>

    <!-- Debt aging -->
    <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
        <div>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.debtAgingTitle') }}</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.debtAgingHint') }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs font-medium text-gray-500">{{ t('clientDetail.totalDebt') }}</p>
          <p class="mt-1 text-2xl font-bold tabular-nums text-error-600">{{ formatMoney(totalAgingDebt) }}</p>
        </div>
      </div>

      <div class="px-5 py-5 sm:px-6">
        <div v-if="totalAgingDebt > 0" class="mb-5">
          <div class="flex h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
            <div
              v-for="segment in agingSegments"
              :key="segment.key"
              class="h-full transition-all"
              :style="{ width: `${segment.percent}%`, backgroundColor: segment.color }"
              :title="`${t(segment.labelKey)}: ${formatMoney(segment.amount)}`"
            />
          </div>
          <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <span v-for="segment in agingSegments" :key="`legend-${segment.key}`" class="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: segment.color }" />
              {{ t(segment.labelKey) }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="(bucket, index) in debtAging"
            :key="bucket.key"
            class="relative overflow-hidden rounded-xl border px-4 py-4 transition hover:shadow-theme-xs"
            :class="agingBucketClass(index)"
          >
            <div class="absolute inset-x-0 top-0 h-1" :style="{ backgroundColor: AGING_COLORS[index] }" />
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t(bucket.labelKey) }}</p>
            <p class="mt-2 text-lg font-bold tabular-nums text-gray-800 dark:text-white/90">
              {{ formatMoney(bucket.amount) }}
            </p>
            <div class="mt-3 flex items-center justify-between gap-2">
              <span class="text-xs text-gray-500">{{ bucket.orderCount }} {{ t('sms.orders') }}</span>
              <span class="rounded-full px-2 py-0.5 text-xs font-medium tabular-nums" :class="agingPercentClass(index)">
                {{ agingPercent(bucket.amount) }}%
              </span>
            </div>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200/80 dark:bg-white/10">
              <div
                class="h-full rounded-full transition-all"
                :style="{ width: `${agingPercent(bucket.amount)}%`, backgroundColor: AGING_COLORS[index] }"
              />
            </div>
          </div>
        </div>

        <p v-if="totalAgingDebt === 0" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {{ t('clientDetail.noOutstandingDebt') }}
        </p>
      </div>
    </div>

    <!-- Profit + Window -->
    <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.profitTitle') }}</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.profitHint') }}</p>
        </div>
        <div class="grid grid-cols-1 gap-5 p-5 sm:p-6 lg:grid-cols-5">
          <div class="grid grid-cols-2 gap-3 lg:col-span-2">
            <div
              v-for="metric in profitMetrics"
              :key="metric.key"
              class="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]"
            >
              <p class="text-xs text-gray-500">{{ metric.label }}</p>
              <p class="mt-1 text-base font-bold tabular-nums" :class="metric.valueClass">{{ metric.value }}</p>
            </div>
          </div>
          <div class="flex flex-col items-center justify-center lg:col-span-3">
            <VueApexCharts
              v-if="profit.totalRevenue > 0"
              type="donut"
              height="220"
              width="100%"
              :options="profitDonutOptions"
              :series="profitDonutSeries"
            />
            <p v-else class="py-10 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
          </div>
        </div>
      </div>

      <div
        v-if="windowStats.windowItemCount > 0"
        class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-500/10">
              <LayoutGrid class="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.windowStatsTitle') }}</h3>
              <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.windowStatsHint') }}</p>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 p-5 sm:p-6">
          <div
            v-for="metric in windowMetrics"
            :key="metric.key"
            class="rounded-xl border border-gray-100 bg-gradient-to-br from-sky-50/80 to-white px-4 py-4 dark:border-gray-800 dark:from-sky-500/5 dark:to-transparent"
          >
            <p class="text-xs font-medium text-gray-500">{{ metric.label }}</p>
            <p class="mt-2 text-xl font-bold tabular-nums text-gray-800 dark:text-white/90">{{ metric.value }}</p>
          </div>
        </div>
      </div>

      <div
        v-else
        class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-12 text-center dark:border-gray-700 dark:bg-white/[0.02]"
      >
        <LayoutGrid class="h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p class="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">{{ t('clientDetail.windowStatsTitle') }}</p>
        <p class="mt-1 max-w-xs text-xs text-gray-500">{{ t('clientDetail.windowStatsEmpty') }}</p>
      </div>
    </div>

    <!-- Promised payment -->
    <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
        <div class="flex items-start gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl"
            :class="promisedOverdue ? 'bg-error-50 dark:bg-error-500/10' : 'bg-warning-50 dark:bg-warning-500/10'"
          >
            <AlertCircle v-if="promisedOverdue" class="h-5 w-5 text-error-600 dark:text-error-400" />
            <CalendarClock v-else class="h-5 w-5 text-warning-600 dark:text-warning-400" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.promisedPaymentDate') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.promisedPaymentHint') }}</p>
          </div>
        </div>
        <span
          v-if="promisedDateLocal"
          class="rounded-full px-3 py-1 text-xl font-medium"
          :class="promisedOverdue ? 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400' : 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'"
        >
          {{
            promisedOverdue
              ? t('clientDetail.promisedOverdue')
              : promisedDaysUntil != null
                ? t('clientDetail.promisedDays', { count: promisedDaysUntil })
                : t('clientDetail.promisedSet')
          }}
        </span>
        <span v-else class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:bg-white/5">
          {{ t('clientDetail.promisedNotSet') }}
        </span>
      </div>
      <div class="flex flex-wrap items-end gap-3 px-5 py-5 sm:px-6">
        <div class="min-w-[220px] max-w-sm flex-1">
          <DatePicker
            v-model="promisedDateLocal"
            :label="t('clientDetail.promisedPaymentDate')"
            :placeholder="t('clientDetail.promisedPaymentDate')"
            @apply="savePromisedDate"
          />
        </div>
        <button type="button" :class="btnOutline" @click="clearPromisedDate">
          {{ t('common.reset') }}
        </button>
      </div>
    </div>

    <!-- Sellers + Warehouse -->
    <div class="grid grid-cols-1 gap-5 xl:grid-cols-5">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:col-span-3">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
          <div>
            <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.sellersTitle') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.sellersHint') }}</p>
          </div>
          <span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {{ sellerStats.length }} {{ t('clientDetail.sellerCount') }}
          </span>
        </div>
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50/80 dark:border-gray-800 dark:bg-white/[0.02]">
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">#</th>
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('saleOrderItems.seller') }}</th>
                <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('clientDetail.orders') }}</th>
                <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('clientDetail.totalSales') }}</th>
                <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('clientDetail.share') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-if="sellerStats.length === 0">
                <td colspan="5" class="px-5 py-10 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td>
              </tr>
              <tr v-for="(seller, index) in sellerStats" :key="seller.userId" class="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                <td class="px-5 py-3.5 text-sm text-gray-400">{{ index + 1 }}</td>
                <td class="px-5 py-3.5">
                  <router-link
                    :to="`/reports/users/${seller.userId}`"
                    class="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10">
                      {{ sellerInitials(seller.userName) }}
                    </span>
                    {{ seller.userName }}
                  </router-link>
                </td>
                <td class="px-5 py-3.5 text-right text-sm tabular-nums text-gray-600 dark:text-gray-300">{{ seller.orderCount }}</td>
                <td class="px-5 py-3.5 text-right text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ formatMoney(seller.totalAmount) }}</td>
                <td class="px-5 py-3.5 text-right">
                  <span class="inline-flex min-w-[3rem] justify-end rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-600 dark:bg-white/5 dark:text-gray-300">
                    {{ sellerShare(seller.totalAmount) }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] xl:col-span-2">
        <div class="border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
          <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.warehouseTitle') }}</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.warehouseHint') }}</p>
        </div>
        <div v-if="warehouseStats.length" class="p-5 sm:p-6">
          <VueApexCharts type="donut" height="200" :options="warehousePieOptions" :series="warehousePieSeries" />
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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import VueApexCharts from 'vue3-apexcharts'
import DatePicker from '@/components/common/DatePicker.vue'
import {
  AlertCircle,
  CalendarClock,
  LayoutGrid,
  Percent,
  Receipt,
  ShoppingBag,
  Wallet,
} from 'lucide-vue-next'
import type { DebtAgingBucket, ProfitStats, SellerStatRow, WarehouseStatRow, WindowStats } from '@/utils/clientDetailAnalytics'
import { formatAreaM2 } from '@/utils/saleOrderMeta'
import { getClientPromisedPaymentDate, setClientPromisedPaymentDate } from '@/utils/clientLocalMeta'

const AGING_COLORS = ['#22C55E', '#F59E0B', '#F97316', '#EF4444']
const WAREHOUSE_COLORS = ['#465FFF', '#22C55E', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899']

const props = defineProps<{
  clientId: number
  debtAging: DebtAgingBucket[]
  profit: ProfitStats
  windowStats: WindowStats
  sellerStats: SellerStatRow[]
  warehouseStats: WarehouseStatRow[]
  totalDebt: number
  totalSales: number
  ordersCount: number
  averageCheck: number
  daysSinceActivity: number
  promisedPaymentDate?: string | null
}>()

const emit = defineEmits<{ 'promised-updated': [] }>()
const { t } = useI18n()

const btnOutline =
  'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'

const promisedDateLocal = ref(getClientPromisedPaymentDate(props.clientId)?.slice(0, 10) ?? '')

watch(() => props.clientId, () => {
  promisedDateLocal.value = getClientPromisedPaymentDate(props.clientId)?.slice(0, 10) ?? ''
})

watch(
  () => props.promisedPaymentDate,
  (value) => {
    if (value !== undefined) promisedDateLocal.value = value?.slice(0, 10) ?? ''
  },
)

const promisedOverdue = computed(() => {
  if (!promisedDateLocal.value) return false
  return new Date(`${promisedDateLocal.value}T23:59:59`).getTime() < Date.now()
})

const promisedDaysUntil = computed(() => {
  if (!promisedDateLocal.value) return null
  return Math.ceil((new Date(`${promisedDateLocal.value}T23:59:59`).getTime() - Date.now()) / 86_400_000)
})

const totalAgingDebt = computed(() => props.debtAging.reduce((sum, bucket) => sum + bucket.amount, 0))

const agingPercent = (amount: number) =>
  totalAgingDebt.value > 0 ? Math.round((amount / totalAgingDebt.value) * 100) : 0

const agingSegments = computed(() =>
  props.debtAging.map((bucket, index) => ({
    key: bucket.key,
    labelKey: bucket.labelKey,
    amount: bucket.amount,
    percent: agingPercent(bucket.amount),
    color: AGING_COLORS[index],
  })).filter((segment) => segment.amount > 0),
)

const agingBucketClass = (index: number) => {
  const classes = [
    'border-success-200/60 dark:border-success-500/20',
    'border-warning-200/60 dark:border-warning-500/20',
    'border-orange-200/60 dark:border-orange-500/20',
    'border-error-200/60 dark:border-error-500/20',
  ]
  return classes[index] ?? 'border-gray-200 dark:border-gray-700'
}

const agingPercentClass = (index: number) => {
  const classes = [
    'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400',
    'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400',
    'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
    'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400',
  ]
  return classes[index] ?? 'bg-gray-100 text-gray-600'
}

const formatMoney = (v: number) => `${new Intl.NumberFormat('uz-UZ').format(Math.round(v))} so‘m`

const kpiCards = computed(() => [
  {
    key: 'debt',
    label: t('clientDetail.totalDebt'),
    value: formatMoney(props.totalDebt),
    hint: totalAgingDebt.value > 0 ? t('clientDetail.debtAgingTitle') : undefined,
    valueClass: props.totalDebt > 0 ? 'text-error-600' : 'text-gray-800 dark:text-white/90',
    icon: Wallet,
    iconBg: 'bg-error-50 dark:bg-error-500/10',
    iconClass: 'text-error-600 dark:text-error-400',
    accent: 'bg-error-500',
  },
  {
    key: 'margin',
    label: t('clientDetail.marginPercent'),
    value: `${props.profit.marginPercent.toFixed(1)}%`,
    hint: formatMoney(props.profit.totalProfit),
    valueClass: props.profit.marginPercent >= 20 ? 'text-success-600' : 'text-brand-600',
    icon: Percent,
    iconBg: 'bg-success-50 dark:bg-success-500/10',
    iconClass: 'text-success-600 dark:text-success-400',
    accent: 'bg-success-500',
  },
  {
    key: 'orders',
    label: t('clientDetail.orders'),
    value: String(props.ordersCount),
    hint: props.daysSinceActivity > 0 ? t('clientDetail.daysAgoCount', { count: props.daysSinceActivity }) : t('clientDetail.lastActivity'),
    valueClass: 'text-gray-800 dark:text-white/90',
    icon: ShoppingBag,
    iconBg: 'bg-brand-50 dark:bg-brand-500/10',
    iconClass: 'text-brand-600 dark:text-brand-400',
    accent: 'bg-brand-500',
  },
  {
    key: 'avgCheck',
    label: t('clientDetail.averageCheck'),
    value: formatMoney(props.averageCheck),
    hint: formatMoney(props.totalSales),
    valueClass: 'text-gray-800 dark:text-white/90',
    icon: Receipt,
    iconBg: 'bg-warning-50 dark:bg-warning-500/10',
    iconClass: 'text-warning-600 dark:text-warning-400',
    accent: 'bg-warning-500',
  },
])

const profitMetrics = computed(() => [
  { key: 'revenue', label: t('clientDetail.totalSales'), value: formatMoney(props.profit.totalRevenue), valueClass: 'text-brand-600' },
  { key: 'cost', label: t('clientDetail.totalCost'), value: formatMoney(props.profit.totalCost), valueClass: 'text-gray-800 dark:text-white/90' },
  { key: 'profit', label: t('clientDetail.totalProfit'), value: formatMoney(props.profit.totalProfit), valueClass: 'text-success-600' },
  { key: 'margin', label: t('clientDetail.marginPercent'), value: `${props.profit.marginPercent.toFixed(1)}%`, valueClass: 'text-gray-800 dark:text-white/90' },
])

const profitDonutSeries = computed(() => {
  const profit = Math.max(0, props.profit.totalProfit)
  const cost = Math.max(0, props.profit.totalCost)
  return [cost, profit]
})

const profitDonutOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif' },
  colors: ['#94A3B8', '#22C55E'],
  labels: [t('clientDetail.totalCost'), t('clientDetail.totalProfit')],
  legend: { position: 'bottom' as const, fontSize: '12px' },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: '68%' } } },
  tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
}))

const windowMetrics = computed(() => [
  { key: 'area', label: t('clientDetail.windowTotalArea'), value: formatAreaM2(props.windowStats.totalAreaM2) },
  { key: 'avg', label: t('clientDetail.windowAvgArea'), value: formatAreaM2(props.windowStats.avgAreaM2) },
  { key: 'orders', label: t('clientDetail.windowOrderCount'), value: String(props.windowStats.windowOrderCount) },
  { key: 'items', label: t('clientDetail.windowItemCount'), value: String(props.windowStats.windowItemCount) },
])

const totalSellerAmount = computed(() => props.sellerStats.reduce((sum, row) => sum + row.totalAmount, 0))
const sellerShare = (amount: number) =>
  totalSellerAmount.value > 0 ? Math.round((amount / totalSellerAmount.value) * 100) : 0

const totalWarehouseAmount = computed(() => props.warehouseStats.reduce((sum, row) => sum + row.totalAmount, 0))
const warehouseShare = (amount: number) =>
  totalWarehouseAmount.value > 0 ? Math.round((amount / totalWarehouseAmount.value) * 100) : 0

const sellerInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'

const warehousePieSeries = computed(() => props.warehouseStats.map((row) => row.totalAmount))
const warehousePieOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif' },
  colors: WAREHOUSE_COLORS,
  labels: props.warehouseStats.map((row) => row.warehouseName),
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: '65%' } } },
  tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
}))

const savePromisedDate = () => {
  setClientPromisedPaymentDate(props.clientId, promisedDateLocal.value || null)
  emit('promised-updated')
}

const clearPromisedDate = () => {
  promisedDateLocal.value = ''
  setClientPromisedPaymentDate(props.clientId, null)
  emit('promised-updated')
}
</script>
