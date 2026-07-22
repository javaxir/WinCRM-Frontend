<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('saleOrderItemsFilter.title') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('saleOrderItemsFilter.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-3">
            <TableColumnToggle :columns="TABLE_COLUMNS" :visible="visible" @toggle="toggleColumn" />
            <ActionIconButton action="refresh" @click="loadItems" />
          </div>
        </div>
        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
        </div>
        <div class="flex flex-wrap items-end gap-4 px-6 pb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('saleOrderItemsFilter.goodsType') }}</label>
            <select v-model="filterType" :class="inputClass">
              <option v-for="opt in GOODS_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <DateRangePicker
            v-model:start-date="filterStartDate"
            v-model:end-date="filterEndDate"
            :label="t('saleOrderItemsFilter.period')"
            @apply="loadItems"
          />
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="opt in PERIOD_OPTIONS"
              :key="opt.value"
              type="button"
              @click="applyPeriod(opt.value)"
              :class="periodBtnClass(opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
          <ActionIconButton action="filter" @click="loadItems" />
          <ActionIconButton action="reset" @click="resetFilter" />
        </div>
        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh v-if="isVisible('id')" label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
                  <SortableTh v-if="isVisible('goodsName')" label="Mahsulot" sortable :active="sortKey === 'goodsName'" :direction="sortKey === 'goodsName' ? sortDir : null" @sort="toggleSort('goodsName')" />
                  <SortableTh v-if="isVisible('clientFullName')" label="Mijoz" sortable :active="sortKey === 'clientFullName'" :direction="sortKey === 'clientFullName' ? sortDir : null" @sort="toggleSort('clientFullName')" />
                  <SortableTh v-if="isVisible('warehouseName')" label="Ombor" sortable :active="sortKey === 'warehouseName'" :direction="sortKey === 'warehouseName' ? sortDir : null" @sort="toggleSort('warehouseName')" />
                  <SortableTh v-if="isVisible('count')" label="Miqdor" sortable :active="sortKey === 'count'" :direction="sortKey === 'count' ? sortDir : null" @sort="toggleSort('count')" />
                  <SortableTh v-if="isVisible('priceSelling')" label="Sotuv narxi" sortable :active="sortKey === 'priceSelling'" :direction="sortKey === 'priceSelling' ? sortDir : null" @sort="toggleSort('priceSelling')" />
                  <SortableTh v-if="isVisible('arrivalDate')" label="Sana" sortable :active="sortKey === 'arrivalDate'" :direction="sortKey === 'arrivalDate' ? sortDir : null" @sort="toggleSort('arrivalDate')" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading"><td :colspan="colCount" class="px-5 py-8 text-center text-gray-500">{{ t('common.loading') }}</td></tr>
                <tr v-else-if="displayItems.length === 0"><td :colspan="colCount" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td></tr>
                <tr v-for="item in displayItems" :key="item.id" class="border-t border-gray-100 dark:border-gray-800">
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.id }}</span></td>
                  <td v-if="isVisible('goodsName')" class="px-5 py-4 sm:px-6"><span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ item.goodsName }}</span></td>
                  <td v-if="isVisible('clientFullName')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.clientFullName }}</span></td>
                  <td v-if="isVisible('warehouseName')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.warehouseName }}</span></td>
                  <td v-if="isVisible('count')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.count }}</span></td>
                  <td v-if="isVisible('priceSelling')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatMoney(item.priceSelling) }}</span></td>
                  <td v-if="isVisible('arrivalDate')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatDate(item.arrivalDate) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
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
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import { useTableSort, useColumnVisibility, type TableColumnDef } from '@/composables/useTableControls'
import {
  fetchSaleOrderItemsFilter,
  getFilterDateRange,
  type SaleOrderItemResponse,
  type FilterPeriod,
} from '@/services/saleOrderItems'
import type { GoodsType } from '@/services/goods'

const { t } = useI18n()

const GOODS_TYPE_OPTIONS: { value: GoodsType; label: string }[] = [
  { value: 'PRODUCT', label: 'Mahsulot' },
  { value: 'SERVICE', label: 'Xizmat' },
  { value: 'WINDOW', label: 'Oyna' },
]

const PERIOD_OPTIONS: { value: FilterPeriod; label: string }[] = [
  { value: 'DAILY', label: 'Kunlik' },
  { value: 'WEEKLY', label: 'Haftalik' },
  { value: 'MONTHLY', label: 'Oylik' },
]

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'goodsName', label: 'Mahsulot', sortable: true },
  { key: 'clientFullName', label: 'Mijoz', sortable: true },
  { key: 'warehouseName', label: 'Ombor', sortable: true },
  { key: 'count', label: 'Miqdor', sortable: true },
  { key: 'priceSelling', label: 'Sotuv narxi', sortable: true },
  { key: 'arrivalDate', label: 'Sana', sortable: true },
]

const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const currentPageTitle = ref('Sotuv hisoboti')
const items = ref<SaleOrderItemResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const filterType = ref<GoodsType>('PRODUCT')
const activePeriod = ref<FilterPeriod>('DAILY')

const todayRange = getFilterDateRange('DAILY')
const filterStartDate = ref(todayRange.startDate)
const filterEndDate = ref(todayRange.endDate)

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'sale-order-items-filter-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<SaleOrderItemResponse>((row, key) => row[key as keyof SaleOrderItemResponse])
const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)
const displayItems = computed(() => applySort(items.value))

const periodBtnClass = (period: FilterPeriod) => [
  'rounded-lg px-3 py-2 text-theme-sm font-medium transition',
  activePeriod.value === period
    ? 'bg-brand-500 text-white shadow-theme-xs'
    : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
]

const formatDate = (value?: string) => {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? value : d.toLocaleString()
}
const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'

const applyPeriod = (period: FilterPeriod) => {
  activePeriod.value = period
  const range = getFilterDateRange(period)
  filterStartDate.value = range.startDate
  filterEndDate.value = range.endDate
  loadItems()
}

const resetFilter = () => {
  filterType.value = 'PRODUCT'
  activePeriod.value = 'DAILY'
  const range = getFilterDateRange('DAILY')
  filterStartDate.value = range.startDate
  filterEndDate.value = range.endDate
  loadItems()
}

const loadItems = async () => {
  if (!filterStartDate.value || !filterEndDate.value) {
    errorMessage.value = t('saleOrderItemsFilter.dateRequired')
    return
  }
  if (filterStartDate.value > filterEndDate.value) {
    errorMessage.value = t('saleOrderItemsFilter.invalidDateRange')
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    items.value = await fetchSaleOrderItemsFilter(
      filterType.value,
      filterStartDate.value,
      filterEndDate.value,
    )
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    loading.value = false
  }
}

onMounted(loadItems)
</script>
