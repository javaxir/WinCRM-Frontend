<template>
  <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
      <div>
        <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('supplierDetail.tabPayments') }}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('supplierDetail.paymentsHint') }}</p>
      </div>
      <div class="flex flex-wrap items-end gap-2">
        <DateRangePicker
          v-model:start-date="filterStart"
          v-model:end-date="filterEnd"
          :label="t('saleOrderItemsFilter.period')"
          @apply="applyFilter"
        />
        <ActionIconButton action="reset" @click="resetFilter" />
        <button type="button" :class="btnPrimary" @click="$emit('add-payment')">
          {{ t('supplierDetail.addPayment') }}
        </button>
        <ActionIconButton action="refresh" @click="$emit('refresh')" />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 border-b border-gray-100 px-6 py-4 sm:grid-cols-2 dark:border-gray-800">
      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
        <p class="text-xs font-medium text-gray-500">{{ t('supplierDetail.paymentsTotal') }}</p>
        <p class="mt-1 text-lg font-semibold text-brand-600">{{ formatMoney(filteredTotal) }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
        <p class="text-xs font-medium text-gray-500">{{ t('supplierDetail.tabPayments') }}</p>
        <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{{ displayPayments.length }} {{ t('sms.orders') }}</p>
      </div>
    </div>

    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <SortableTh label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
            <SortableTh :label="t('supplierDetail.paymentDate')" sortable :active="sortKey === 'paymentDate'" :direction="sortKey === 'paymentDate' ? sortDir : null" @sort="toggleSort('paymentDate')" />
            <SortableTh :label="t('supplierDetail.orderId')" sortable :active="sortKey === 'warehouseOrderId'" :direction="sortKey === 'warehouseOrderId' ? sortDir : null" @sort="toggleSort('warehouseOrderId')" />
            <SortableTh :label="t('supplierDetail.paymentCategory')" sortable :active="sortKey === 'categoryName'" :direction="sortKey === 'categoryName' ? sortDir : null" @sort="toggleSort('categoryName')" />
            <SortableTh :label="t('supplierDetail.paymentAmount')" sortable align="right" :active="sortKey === 'paymentAmount'" :direction="sortKey === 'paymentAmount' ? sortDir : null" @sort="toggleSort('paymentAmount')" />
            <SortableTh :label="t('supplierDetail.comment')" sortable :active="sortKey === 'comment'" :direction="sortKey === 'comment' ? sortDir : null" @sort="toggleSort('comment')" />
            <SortableTh :label="t('common.status')" sortable :active="sortKey === 'status'" :direction="sortKey === 'status' ? sortDir : null" @sort="toggleSort('status')" />
            <SortableTh :label="t('common.actions')" align="right" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="loading">
            <td colspan="8" class="px-5 py-8 text-center text-gray-500">{{ t('common.loading') }}</td>
          </tr>
          <tr v-else-if="displayPayments.length === 0">
            <td colspan="8" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td>
          </tr>
          <tr v-for="payment in displayPayments" :key="payment.id">
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ payment.id }}</td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6 whitespace-nowrap">{{ formatDateTime(payment.paymentDate) }}</td>
            <td class="px-5 py-4 text-theme-sm sm:px-6">
              <router-link
                v-if="payment.warehouseOrderId"
                :to="`/warehouse-orders/${payment.warehouseOrderId}/items`"
                class="text-brand-600 hover:underline dark:text-brand-400"
              >
                #{{ payment.warehouseOrderId }}
              </router-link>
              <span v-else class="text-gray-500">—</span>
            </td>
            <td class="px-5 py-4 text-theme-sm text-gray-800 sm:px-6 dark:text-white/90">{{ payment.categoryName }}</td>
            <td class="px-5 py-4 text-right text-theme-sm font-medium text-success-600 sm:px-6">{{ formatMoney(payment.paymentAmount) }}</td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6 max-w-xs truncate">{{ payment.comment || '—' }}</td>
            <td class="px-5 py-4 text-theme-sm sm:px-6">
              <span :class="statusClass(payment.status)">{{ statusLabel(payment.status) }}</span>
            </td>
            <td class="px-5 py-4 sm:px-6">
              <div class="flex items-center justify-end gap-1">
                <ActionIconButton action="edit" size="sm" @click="$emit('edit-payment', payment)" />
                <ActionIconButton action="delete" size="sm" @click="$emit('delete-payment', payment)" />
              </div>
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
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import { useTableSort } from '@/composables/useTableControls'
import type { SupplierPaymentResponse } from '@/services/supplierPayments'
import type { WarehouseOrderResponse } from '@/services/warehouseOrders'
import type { Status } from '@/services/roles'

const props = withDefaults(
  defineProps<{
    payments: SupplierPaymentResponse[]
    orders: WarehouseOrderResponse[]
    loading?: boolean
  }>(),
  { loading: false },
)

defineEmits<{
  'add-payment': []
  'edit-payment': [payment: SupplierPaymentResponse]
  'delete-payment': [payment: SupplierPaymentResponse]
  refresh: []
}>()

const { t } = useI18n()

const filterStart = ref('')
const filterEnd = ref('')
const appliedStart = ref('')
const appliedEnd = ref('')

const btnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'

const formatMoney = (v: number) => `${new Intl.NumberFormat('uz-UZ').format(Math.round(v))} so‘m`
const formatDateTime = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString('uz-UZ')
}

const statusLabel = (status: Status) => t(`common.statusValues.${status}`)
const statusClass = (status: Status) =>
  [
    'rounded-full px-2 py-0.5 text-theme-xs font-medium',
    status === 'ACTIVE'
      ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400'
      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  ]

const filteredPayments = computed(() => {
  let result = [...props.payments]
  if (appliedStart.value) {
    const start = new Date(appliedStart.value)
    start.setHours(0, 0, 0, 0)
    result = result.filter((payment) => new Date(payment.paymentDate) >= start)
  }
  if (appliedEnd.value) {
    const end = new Date(appliedEnd.value)
    end.setHours(23, 59, 59, 999)
    result = result.filter((payment) => new Date(payment.paymentDate) <= end)
  }
  return result
})

const { sortKey, sortDir, toggleSort, applySort } = useTableSort<SupplierPaymentResponse>(
  (row, key) => row[key as keyof SupplierPaymentResponse],
)

const displayPayments = computed(() => applySort(filteredPayments.value))

const filteredTotal = computed(() =>
  filteredPayments.value.reduce((sum, payment) => sum + payment.paymentAmount, 0),
)

const applyFilter = () => {
  appliedStart.value = filterStart.value
  appliedEnd.value = filterEnd.value
}

const resetFilter = () => {
  filterStart.value = ''
  filterEnd.value = ''
  appliedStart.value = ''
  appliedEnd.value = ''
}
</script>
