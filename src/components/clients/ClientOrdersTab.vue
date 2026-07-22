<template>
  <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
      <div>
        <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('clientDetail.tabOrders') }}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.ordersHint') }}</p>
      </div>
      <div class="flex flex-wrap items-end gap-2">
        <DateRangePicker
          v-model:start-date="filterStart"
          v-model:end-date="filterEnd"
          :label="t('saleOrderItemsFilter.period')"
          @apply="applyFilter"
        />
        <select v-model="filterStatus" :class="inputClass">
          <option value="">{{ t('common.all') }}</option>
          <option v-for="status in statuses" :key="status" :value="status">{{ saleOrderStatusLabel(status) }}</option>
        </select>
        <ActionIconButton action="reset" @click="resetFilter" />
      </div>
    </div>

    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <SortableTh label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
            <SortableTh :label="t('clientDetail.transactionDate')" sortable :active="sortKey === 'orderDate'" :direction="sortKey === 'orderDate' ? sortDir : null" @sort="toggleSort('orderDate')" />
            <SortableTh :label="t('saleOrderItems.warehouse')" sortable :active="sortKey === 'warehouseName'" :direction="sortKey === 'warehouseName' ? sortDir : null" @sort="toggleSort('warehouseName')" />
            <SortableTh :label="t('saleOrderItems.seller')" sortable :active="sortKey === 'userFullName'" :direction="sortKey === 'userFullName' ? sortDir : null" @sort="toggleSort('userFullName')" />
            <SortableTh :label="t('clientDetail.transactionAmount')" sortable align="right" :active="sortKey === 'totalSum'" :direction="sortKey === 'totalSum' ? sortDir : null" @sort="toggleSort('totalSum')" />
            <SortableTh :label="t('saleOrderItems.paid')" sortable align="right" :active="sortKey === 'paidSum'" :direction="sortKey === 'paidSum' ? sortDir : null" @sort="toggleSort('paidSum')" />
            <SortableTh :label="t('saleOrderItems.orderDebt')" sortable align="right" :active="sortKey === 'debtSum'" :direction="sortKey === 'debtSum' ? sortDir : null" @sort="toggleSort('debtSum')" />
            <SortableTh :label="t('common.status')" sortable :active="sortKey === 'orderStatus'" :direction="sortKey === 'orderStatus' ? sortDir : null" @sort="toggleSort('orderStatus')" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="displayOrders.length === 0">
            <td colspan="8" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td>
          </tr>
          <tr v-for="order in displayOrders" :key="order.id">
            <td class="px-5 py-4 text-sm">
              <router-link :to="`/sale-orders/${order.id}/items`" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                #{{ order.id }}
              </router-link>
            </td>
            <td class="px-5 py-4 text-sm text-gray-500">{{ formatDateTime(order.orderDate) }}</td>
            <td class="px-5 py-4 text-sm text-gray-500">{{ order.warehouseName }}</td>
            <td class="px-5 py-4 text-sm">
              <router-link
                v-if="order.userId"
                :to="`/reports/users/${order.userId}`"
                class="text-brand-600 hover:underline dark:text-brand-400"
              >
                {{ order.userFullName || '—' }}
              </router-link>
              <span v-else>{{ order.userFullName || '—' }}</span>
            </td>
            <td class="px-5 py-4 text-right text-sm font-semibold text-brand-600">{{ formatMoney(order.totalSum) }}</td>
            <td class="px-5 py-4 text-right text-sm text-success-600">{{ formatMoney(order.paidSum) }}</td>
            <td class="px-5 py-4 text-right text-sm" :class="order.debtSum > 0 ? 'text-error-600' : 'text-gray-500'">{{ formatMoney(order.debtSum) }}</td>
            <td class="px-5 py-4 text-sm"><span :class="saleOrderStatusClass(order.orderStatus)">{{ saleOrderStatusLabel(order.orderStatus) }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import { useTableSort } from '@/composables/useTableControls'
import type { SaleOrderResponse, SaleOrderStatus } from '@/services/saleOrders'
import { SALE_ORDER_STATUSES, saleOrderStatusClass, saleOrderStatusLabel } from '@/utils/saleOrderStatus'

const props = defineProps<{ orders: SaleOrderResponse[] }>()
const { t } = useI18n()

const filterStart = ref('')
const filterEnd = ref('')
const appliedStart = ref('')
const appliedEnd = ref('')
const filterStatus = ref('')
const statuses = SALE_ORDER_STATUSES
const inputClass = 'h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const formatMoney = (v: number) => `${new Intl.NumberFormat('uz-UZ').format(Math.round(v))} so‘m`
const formatDateTime = (v: string) => new Date(v).toLocaleString('uz-UZ')

const filteredOrders = computed(() => {
  let result = [...props.orders]
  if (appliedStart.value) {
    const start = new Date(appliedStart.value)
    start.setHours(0, 0, 0, 0)
    result = result.filter((order) => new Date(order.orderDate) >= start)
  }
  if (appliedEnd.value) {
    const end = new Date(appliedEnd.value)
    end.setHours(23, 59, 59, 999)
    result = result.filter((order) => new Date(order.orderDate) <= end)
  }
  if (filterStatus.value) {
    result = result.filter((order) => order.orderStatus === filterStatus.value)
  }
  return result
})

const { sortKey, sortDir, toggleSort, applySort } = useTableSort<SaleOrderResponse>((row, key) => {
  if (key === 'orderDate') return row.orderDate
  return row[key as keyof SaleOrderResponse]
})

const displayOrders = computed(() => applySort(filteredOrders.value))

const applyFilter = () => {
  appliedStart.value = filterStart.value
  appliedEnd.value = filterEnd.value
}

const resetFilter = () => {
  filterStart.value = ''
  filterEnd.value = ''
  appliedStart.value = ''
  appliedEnd.value = ''
  filterStatus.value = ''
}
</script>
