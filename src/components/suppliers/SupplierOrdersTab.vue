<template>
  <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
      <div>
        <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('supplierDetail.orders') }}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('supplierDetail.ordersHint') }}</p>
      </div>
      <div class="flex flex-wrap items-end gap-2">
        <DateRangePicker
          v-model:start-date="filterStart"
          v-model:end-date="filterEnd"
          :label="t('saleOrderItemsFilter.period')"
          @apply="applyFilter"
        />
        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('common.status') }}</label>
          <select v-model="filterStatus" :class="inputClass">
            <option value="">{{ t('common.all') }}</option>
            <option v-for="status in statuses" :key="status" :value="status">{{ statusLabel(status) }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('common.search') }}</label>
          <input v-model="search" type="search" :placeholder="t('supplierDetail.searchOrders')" :class="inputClass" />
        </div>
        <ActionIconButton action="reset" @click="resetFilter" />
        <ActionIconButton action="refresh" @click="$emit('refresh')" />
      </div>
    </div>

    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <SortableTh label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
            <SortableTh :label="t('supplierDetail.arrivalDate')" sortable :active="sortKey === 'arrivalDate'" :direction="sortKey === 'arrivalDate' ? sortDir : null" @sort="toggleSort('arrivalDate')" />
            <SortableTh :label="t('supplierDetail.warehouse')" sortable :active="sortKey === 'warehouseName'" :direction="sortKey === 'warehouseName' ? sortDir : null" @sort="toggleSort('warehouseName')" />
            <SortableTh :label="t('supplierDetail.total')" sortable align="right" :active="sortKey === 'totalSum'" :direction="sortKey === 'totalSum' ? sortDir : null" @sort="toggleSort('totalSum')" />
            <SortableTh :label="t('common.status')" sortable :active="sortKey === 'status'" :direction="sortKey === 'status' ? sortDir : null" @sort="toggleSort('status')" />
            <SortableTh :label="t('goodsDetail.createdBy')" sortable :active="sortKey === 'createdUsername'" :direction="sortKey === 'createdUsername' ? sortDir : null" @sort="toggleSort('createdUsername')" />
            <SortableTh :label="t('common.actions')" align="right" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="loading">
            <td colspan="7" class="px-5 py-8 text-center text-gray-500">{{ t('common.loading') }}</td>
          </tr>
          <tr v-else-if="displayOrders.length === 0">
            <td colspan="7" class="px-5 py-8 text-center text-gray-500">{{ t('supplierDetail.noOrders') }}</td>
          </tr>
          <tr v-for="order in displayOrders" :key="order.id">
            <td class="px-5 py-4 text-theme-sm sm:px-6">
              <router-link :to="`/warehouse-orders/${order.id}/items`" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                #{{ order.id }}
              </router-link>
            </td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ formatDate(order.arrivalDate) }}</td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ order.warehouseName }}</td>
            <td class="px-5 py-4 text-right text-theme-sm font-medium text-gray-800 sm:px-6 dark:text-white/90">{{ formatMoney(order.totalSum) }}</td>
            <td class="px-5 py-4 text-theme-sm sm:px-6">
              <span :class="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
            </td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ order.createdUsername || '—' }}</td>
            <td class="px-5 py-4 text-right sm:px-6">
              <router-link
                :to="`/warehouse-orders/${order.id}/items`"
                class="rounded-lg px-3 py-1.5 text-theme-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
              >
                {{ t('supplierDetail.viewItems') }}
              </router-link>
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
import type { WarehouseOrderResponse } from '@/services/warehouseOrders'
import type { Status } from '@/services/roles'

const props = withDefaults(
  defineProps<{
    orders: WarehouseOrderResponse[]
    loading?: boolean
  }>(),
  { loading: false },
)

defineEmits<{ refresh: [] }>()

const { t } = useI18n()

const statuses: Status[] = ['ACTIVE', 'DISABLED', 'DELETED']
const filterStart = ref('')
const filterEnd = ref('')
const appliedStart = ref('')
const appliedEnd = ref('')
const filterStatus = ref('')
const search = ref('')

const inputClass =
  'h-11 min-w-[160px] rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const formatMoney = (v: number) => `${new Intl.NumberFormat('uz-UZ').format(Math.round(v))} so‘m`
const formatDate = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('uz-UZ')
}

const statusLabel = (status: Status) => t(`common.statusValues.${status}`)
const statusClass = (status: Status) =>
  [
    'rounded-full px-2 py-0.5 text-theme-xs font-medium',
    status === 'ACTIVE'
      ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400'
      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  ]

const filteredOrders = computed(() => {
  let result = [...props.orders]
  if (appliedStart.value) {
    const start = new Date(appliedStart.value)
    start.setHours(0, 0, 0, 0)
    result = result.filter((order) => new Date(order.arrivalDate) >= start)
  }
  if (appliedEnd.value) {
    const end = new Date(appliedEnd.value)
    end.setHours(23, 59, 59, 999)
    result = result.filter((order) => new Date(order.arrivalDate) <= end)
  }
  if (filterStatus.value) {
    result = result.filter((order) => order.status === filterStatus.value)
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    result = result.filter(
      (order) =>
        String(order.id).includes(q) ||
        order.warehouseName.toLowerCase().includes(q) ||
        (order.createdUsername?.toLowerCase().includes(q) ?? false) ||
        order.status.toLowerCase().includes(q),
    )
  }
  return result
})

const { sortKey, sortDir, toggleSort, applySort } = useTableSort<WarehouseOrderResponse>((row, key) => {
  if (key === 'arrivalDate') return row.arrivalDate
  return row[key as keyof WarehouseOrderResponse]
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
  search.value = ''
}
</script>
