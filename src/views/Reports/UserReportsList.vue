<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="t('userReports.title')" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('userReports.title') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('userReports.subtitle') }}</p>
          </div>
          <ActionIconButton action="refresh" @click="loadData" />
        </div>

        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {{ errorMessage }}
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-4 border-t border-gray-100 px-6 pb-5 pt-4 dark:border-gray-800">
          <DateRangePicker
            v-model:start-date="filterStart"
            v-model:end-date="filterEnd"
            :label="t('userReports.period')"
            @apply="applyFilter"
          />
          <ActionIconButton action="filter" @click="applyFilter" />
          <ActionIconButton action="reset" @click="resetFilter" />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="metric in summaryMetrics"
          :key="metric.key"
          class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div class="px-5 py-4">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ metric.label }}</p>
            <p class="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{{ metric.value }}</p>
          </div>
          <div class="h-1 bg-brand-500" />
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/5">
                <SortableTh :label="t('userReports.user')" sortable :active="sortKey === 'userName'" :direction="sortKey === 'userName' ? sortDir : null" @sort="toggleSort('userName')" />
                <SortableTh :label="t('userReports.phone')" sortable :active="sortKey === 'phone'" :direction="sortKey === 'phone' ? sortDir : null" @sort="toggleSort('phone')" />
                <SortableTh :label="t('userReports.orderCount')" sortable align="right" :active="sortKey === 'orderCount'" :direction="sortKey === 'orderCount' ? sortDir : null" @sort="toggleSort('orderCount')" />
                <SortableTh :label="t('userReports.totalSales')" sortable align="right" :active="sortKey === 'totalAmount'" :direction="sortKey === 'totalAmount' ? sortDir : null" @sort="toggleSort('totalAmount')" />
                <SortableTh :label="t('userReports.paid')" sortable align="right" :active="sortKey === 'paidAmount'" :direction="sortKey === 'paidAmount' ? sortDir : null" @sort="toggleSort('paidAmount')" />
                <SortableTh :label="t('userReports.debt')" sortable align="right" :active="sortKey === 'debtAmount'" :direction="sortKey === 'debtAmount' ? sortDir : null" @sort="toggleSort('debtAmount')" />
                <th class="px-5 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('common.actions') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-if="loading"><td colspan="7" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.loading') }}</td></tr>
              <tr v-else-if="displayItems.length === 0"><td colspan="7" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td></tr>
              <tr v-for="item in displayItems" :key="item.userId">
                <td class="px-5 py-4">
                  <router-link :to="`/reports/users/${item.userId}`" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                    {{ item.userName }}
                  </router-link>
                </td>
                <td class="px-5 py-4 text-sm text-gray-500">{{ item.phone || '—' }}</td>
                <td class="px-5 py-4 text-right text-sm font-semibold text-gray-800 dark:text-white/90">{{ item.orderCount }}</td>
                <td class="px-5 py-4 text-right text-sm font-semibold text-brand-600 dark:text-brand-400">{{ formatMoney(item.totalAmount) }}</td>
                <td class="px-5 py-4 text-right text-sm text-success-600">{{ formatMoney(item.paidAmount) }}</td>
                <td class="px-5 py-4 text-right text-sm" :class="item.debtAmount > 0 ? 'text-error-600' : 'text-gray-500'">{{ formatMoney(item.debtAmount) }}</td>
                <td class="px-5 py-4 text-right">
                  <router-link :to="`/reports/users/${item.userId}`" class="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                    {{ t('userReports.openReport') }}
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import { useTableSort } from '@/composables/useTableControls'
import { fetchAllUsers } from '@/services/users'
import { fetchSaleOrdersByDateRange } from '@/services/saleOrders'
import { buildUserReportSummaries, type UserReportSummary } from '@/utils/userReport'
import { getThisMonthRange } from '@/utils/dateRange'

const { t } = useI18n()
const monthRange = getThisMonthRange()

const loading = ref(false)
const errorMessage = ref('')
const filterStart = ref(monthRange.startDate)
const filterEnd = ref(monthRange.endDate)
const appliedStart = ref(monthRange.startDate)
const appliedEnd = ref(monthRange.endDate)
const summaries = ref<UserReportSummary[]>([])

const formatMoney = (value: number) => `${new Intl.NumberFormat('uz-UZ').format(value)} so‘m`

const { sortKey, sortDir, toggleSort, applySort } = useTableSort<UserReportSummary>((row, key) => row[key as keyof UserReportSummary])

const displayItems = computed(() => applySort(summaries.value))

const summaryMetrics = computed(() => {
  const totalOrders = summaries.value.reduce((sum, item) => sum + item.orderCount, 0)
  const totalSales = summaries.value.reduce((sum, item) => sum + item.totalAmount, 0)
  const totalDebt = summaries.value.reduce((sum, item) => sum + item.debtAmount, 0)
  const activeUsers = summaries.value.filter((item) => item.orderCount > 0).length
  return [
    { key: 'users', label: t('userReports.activeUsers'), value: String(activeUsers) },
    { key: 'orders', label: t('userReports.orderCount'), value: String(totalOrders) },
    { key: 'sales', label: t('userReports.totalSales'), value: formatMoney(totalSales) },
    { key: 'debt', label: t('userReports.debt'), value: formatMoney(totalDebt) },
  ]
})

const loadData = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [users, orders] = await Promise.all([
      fetchAllUsers(),
      fetchSaleOrdersByDateRange(appliedStart.value, appliedEnd.value),
    ])
    summaries.value = buildUserReportSummaries(users, orders)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
    summaries.value = []
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  appliedStart.value = filterStart.value
  appliedEnd.value = filterEnd.value
  loadData()
}

const resetFilter = () => {
  filterStart.value = monthRange.startDate
  filterEnd.value = monthRange.endDate
  appliedStart.value = monthRange.startDate
  appliedEnd.value = monthRange.endDate
  loadData()
}

onMounted(loadData)
</script>
