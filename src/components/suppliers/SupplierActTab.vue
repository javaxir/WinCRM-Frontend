<template>
  <div id="supplier-act-print" class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
      <div>
        <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('supplierDetail.tabAct') }}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('supplierDetail.actAllRecords') }}</p>
      </div>
      <div class="flex flex-wrap items-end gap-2 print:hidden">
        <DateRangePicker
          v-model:start-date="filterStart"
          v-model:end-date="filterEnd"
          :label="t('saleOrderItemsFilter.period')"
          @apply="onApply"
        />
        <ActionIconButton action="reset" @click="onReset" />
        <button type="button" :class="btnOutline" @click="$emit('print')">{{ t('supplierDetail.print') }}</button>
        <button type="button" :class="btnOutline" @click="$emit('export-csv')">
          {{ t('supplierDetail.exportCsv') }}
        </button>
      </div>
    </div>

    <div class="hidden px-6 pt-5 print:block">
      <h2 class="text-lg font-semibold text-center text-gray-900">Акт сверки</h2>
      <p class="mt-2 text-sm text-center text-gray-600">
        {{ t('supplierDetail.supplierLabel') }}: <strong>{{ supplierName }}</strong>
      </p>
      <p v-if="appliedStart || appliedEnd" class="mt-1 text-xs text-center text-gray-500">
        Davr: {{ appliedStart || '...' }} — {{ appliedEnd || '...' }}
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 border-b border-gray-100 px-6 py-4 sm:grid-cols-3 dark:border-gray-800">
      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
        <p class="text-xs font-medium text-gray-500">{{ t('supplierDetail.totalPurchases') }}</p>
        <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{{ formatMoney(totals.totalPurchases) }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
        <p class="text-xs font-medium text-gray-500">{{ t('supplierDetail.actPaid') }}</p>
        <p class="mt-1 text-lg font-semibold text-success-600">{{ formatMoney(totals.totalPaid) }}</p>
      </div>
      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
        <p class="text-xs font-medium text-gray-500">{{ t('supplierDetail.actBalance') }}</p>
        <p class="mt-1 text-lg font-semibold" :class="balanceClass(totals.balance)">{{ formatBalance(totals.balance) }}</p>
      </div>
    </div>

    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <SortableTh label="#" />
            <SortableTh :label="t('supplierDetail.actType')" sortable :active="sortKey === 'type'" :direction="sortKey === 'type' ? sortDir : null" @sort="toggleSort('type')" />
            <SortableTh :label="t('supplierDetail.actDate')" sortable :active="sortKey === 'date'" :direction="sortKey === 'date' ? sortDir : null" @sort="toggleSort('date')" />
            <SortableTh :label="t('supplierDetail.actDescription')" sortable :active="sortKey === 'description'" :direction="sortKey === 'description' ? sortDir : null" @sort="toggleSort('description')" />
            <SortableTh :label="t('supplierDetail.debit')" sortable align="right" :active="sortKey === 'debit'" :direction="sortKey === 'debit' ? sortDir : null" @sort="toggleSort('debit')" />
            <SortableTh :label="t('supplierDetail.credit')" sortable align="right" :active="sortKey === 'credit'" :direction="sortKey === 'credit' ? sortDir : null" @sort="toggleSort('credit')" />
            <SortableTh :label="t('supplierDetail.actBalance')" sortable align="right" :active="sortKey === 'balance'" :direction="sortKey === 'balance' ? sortDir : null" @sort="toggleSort('balance')" />
            <SortableTh :label="t('goodsDetail.createdBy')" sortable :active="sortKey === 'createdUsername'" :direction="sortKey === 'createdUsername' ? sortDir : null" @sort="toggleSort('createdUsername')" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="sortedRows.length === 0">
            <td colspan="8" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td>
          </tr>
          <tr v-for="(row, index) in sortedRows" :key="row.id">
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ index + 1 }}</td>
            <td class="px-5 py-4 text-theme-sm sm:px-6">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="row.type === 'order' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400' : 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400'"
              >
                {{ row.type === 'order' ? t('supplierDetail.actOrderType') : t('supplierDetail.actPaymentType') }}
              </span>
            </td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ formatDate(row.date) }}</td>
            <td class="px-5 py-4 text-theme-sm sm:px-6">
              <router-link
                v-if="row.orderId"
                :to="`/warehouse-orders/${row.orderId}/items`"
                class="text-brand-600 hover:underline dark:text-brand-400 print:no-underline print:text-black"
              >
                {{ row.description }}
              </router-link>
              <span v-else>{{ row.description }}</span>
            </td>
            <td class="px-5 py-4 text-right text-theme-sm text-error-600 sm:px-6">{{ row.debit > 0 ? formatMoney(row.debit) : '—' }}</td>
            <td class="px-5 py-4 text-right text-theme-sm text-success-600 sm:px-6">{{ row.credit > 0 ? formatMoney(row.credit) : '—' }}</td>
            <td class="px-5 py-4 text-right text-theme-sm sm:px-6" :class="balanceClass(row.balance ?? 0)">
              {{ row.balance != null ? formatBalance(row.balance) : '—' }}
            </td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ row.createdUsername || '—' }}</td>
          </tr>
        </tbody>
        <tfoot v-if="sortedRows.length > 0">
          <tr class="border-t-2 border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-white/5">
            <td colspan="4" class="px-5 py-4 text-sm font-semibold text-gray-800 sm:px-6 dark:text-white/90">
              {{ t('supplierDetail.actTotalRecords', { count: sortedRows.length }) }}
            </td>
            <td class="px-5 py-4 text-right text-sm font-semibold text-error-600 sm:px-6">{{ formatMoney(totals.totalPurchases) }}</td>
            <td class="px-5 py-4 text-right text-sm font-semibold text-success-600 sm:px-6">{{ formatMoney(totals.totalPaid) }}</td>
            <td class="px-5 py-4 text-right text-sm font-semibold sm:px-6" :class="balanceClass(totals.balance)">{{ formatBalance(totals.balance) }}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="hidden px-6 py-6 print:flex print:justify-between print:text-sm">
      <div>
        <p class="font-medium">{{ t('supplierDetail.supplierLabel') }}:</p>
        <p class="mt-8 w-48 border-t border-gray-400 pt-1">{{ t('supplierDetail.signature') }}</p>
      </div>
      <div class="text-right">
        <p class="font-medium">{{ t('supplierDetail.organization') }}:</p>
        <p class="ml-auto mt-8 w-48 border-t border-gray-400 pt-1">{{ t('supplierDetail.signature') }}</p>
      </div>
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
import type { SupplierActRow } from '@/utils/supplierDetailAnalytics'

const props = defineProps<{
  rows: SupplierActRow[]
  totals: { totalPurchases: number; totalPaid: number; balance: number }
  supplierName: string
  appliedStart: string
  appliedEnd: string
}>()

const emit = defineEmits<{
  apply: [start: string, end: string]
  reset: []
  print: []
  'export-csv': []
}>()

const { t } = useI18n()

const filterStart = ref('')
const filterEnd = ref('')

const btnOutline =
  'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'

const formatMoney = (v: number) => `${new Intl.NumberFormat('uz-UZ').format(Math.round(v))} so‘m`
const formatBalance = (balance: number) => formatMoney(Math.abs(balance))
const formatDate = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('uz-UZ')
}

const balanceClass = (balance: number) => {
  if (balance > 0) return 'text-success-600'
  if (balance < 0) return 'text-error-600'
  return 'text-gray-800 dark:text-white/90'
}

const { sortKey, sortDir, toggleSort, applySort } = useTableSort<SupplierActRow>((row, key) => {
  if (key === 'balance') return row.balance ?? 0
  if (key === 'date') return row.date
  return row[key as keyof SupplierActRow]
})

const sortedRows = computed(() => applySort(props.rows))

const onApply = () => {
  emit('apply', filterStart.value, filterEnd.value)
}

const onReset = () => {
  filterStart.value = ''
  filterEnd.value = ''
  emit('reset')
}
</script>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  #supplier-act-print,
  #supplier-act-print * {
    visibility: visible;
  }
  #supplier-act-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none;
  }
}
</style>
