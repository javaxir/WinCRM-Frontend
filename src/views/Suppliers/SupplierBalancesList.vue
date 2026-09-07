<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">
              {{ t('supplierBalances.title') }}
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ t('supplierBalances.subtitle') }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <TableColumnToggle :columns="TABLE_COLUMNS" :visible="visible" @toggle="toggleColumn" />
            <ActionIconButton action="refresh" @click="loadAll" />
          </div>
        </div>

        <div v-if="errorMessage" class="px-6 pb-4">
          <div
            class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {{ errorMessage }}
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-4 border-t border-gray-100 px-6 pb-4 pt-4 dark:border-gray-800">
          <div class="min-w-[220px] flex-1">
            <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('common.search') }}</label>
            <input
              v-model="search"
              type="text"
              :placeholder="t('supplierBalances.searchPlaceholder')"
              :class="inputClass"
            />
          </div>
          <label class="mb-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              v-model="debtorsOnly"
              type="checkbox"
              class="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            {{ t('supplierBalances.debtorsOnly') }}
          </label>
          <ActionIconButton action="reset" @click="resetFilters" />
        </div>

        <div class="border-t border-gray-100 px-6 py-5 dark:border-gray-800">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="px-4 py-4">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('supplierBalances.totalPurchase') }}
                </p>
                <p class="mt-2 text-xl font-bold text-brand-600">{{ formatMoney(summary.totalPurchase) }}</p>
              </div>
              <div class="h-1.5 bg-brand-500" />
            </div>
            <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="px-4 py-4">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('supplierBalances.totalPaid') }}
                </p>
                <p class="mt-2 text-xl font-bold text-success-600">{{ formatMoney(summary.totalPaid) }}</p>
              </div>
              <div class="h-1.5 bg-success-500" />
            </div>
            <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="px-4 py-4">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('supplierBalances.totalDebt') }}
                </p>
                <p
                  class="mt-2 text-xl font-bold"
                  :class="summary.totalDebt > 0 ? 'text-error-600' : 'text-gray-800 dark:text-white/90'"
                >
                  {{ formatMoney(summary.totalDebt) }}
                </p>
              </div>
              <div class="h-1.5" :class="summary.totalDebt > 0 ? 'bg-error-500' : 'bg-gray-300'" />
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh
                    v-if="isVisible('supplierId')"
                    label="ID"
                    sortable
                    :active="sortKey === 'supplierId'"
                    :direction="sortKey === 'supplierId' ? sortDir : null"
                    @sort="toggleSort('supplierId')"
                  />
                  <SortableTh
                    v-if="isVisible('supplierName')"
                    :label="t('supplierBalances.supplier')"
                    sortable
                    :active="sortKey === 'supplierName'"
                    :direction="sortKey === 'supplierName' ? sortDir : null"
                    @sort="toggleSort('supplierName')"
                  />
                  <SortableTh
                    v-if="isVisible('totalPurchase')"
                    :label="t('supplierBalances.totalPurchase')"
                    sortable
                    align="right"
                    :active="sortKey === 'totalPurchase'"
                    :direction="sortKey === 'totalPurchase' ? sortDir : null"
                    @sort="toggleSort('totalPurchase')"
                  />
                  <SortableTh
                    v-if="isVisible('totalPaid')"
                    :label="t('supplierBalances.totalPaid')"
                    sortable
                    align="right"
                    :active="sortKey === 'totalPaid'"
                    :direction="sortKey === 'totalPaid' ? sortDir : null"
                    @sort="toggleSort('totalPaid')"
                  />
                  <SortableTh
                    v-if="isVisible('totalDebt')"
                    :label="t('supplierBalances.totalDebt')"
                    sortable
                    align="right"
                    :active="sortKey === 'totalDebt'"
                    :direction="sortKey === 'totalDebt' ? sortDir : null"
                    @sort="toggleSort('totalDebt')"
                  />
                  <SortableTh
                    v-if="isVisible('lastUpdated')"
                    :label="t('supplierBalances.lastUpdated')"
                    sortable
                    :active="sortKey === 'lastUpdated'"
                    :direction="sortKey === 'lastUpdated' ? sortDir : null"
                    @sort="toggleSort('lastUpdated')"
                  />
                  <SortableTh :label="t('common.actions')" align="right" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading">
                  <td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">
                    {{ t('common.loading') }}
                  </td>
                </tr>
                <tr v-else-if="displayBalances.length === 0">
                  <td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">
                    {{ t('common.notFound') }}
                  </td>
                </tr>
                <tr
                  v-for="row in displayBalances"
                  :key="row.id || row.supplierId"
                  class="border-t border-gray-100 dark:border-gray-800"
                >
                  <td v-if="isVisible('supplierId')" class="px-5 py-4 sm:px-6">
                    <span class="text-theme-sm text-gray-500">{{ row.supplierId }}</span>
                  </td>
                  <td v-if="isVisible('supplierName')" class="px-5 py-4 sm:px-6">
                    <router-link
                      :to="`/suppliers/${row.supplierId}`"
                      class="text-theme-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {{ row.supplierName || '—' }}
                    </router-link>
                  </td>
                  <td v-if="isVisible('totalPurchase')" class="px-5 py-4 text-right sm:px-6">
                    <span class="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {{ formatMoney(row.totalPurchase) }}
                    </span>
                  </td>
                  <td v-if="isVisible('totalPaid')" class="px-5 py-4 text-right sm:px-6">
                    <span class="text-theme-sm font-medium text-success-600">
                      {{ formatMoney(row.totalPaid) }}
                    </span>
                  </td>
                  <td v-if="isVisible('totalDebt')" class="px-5 py-4 text-right sm:px-6">
                    <span
                      class="text-theme-sm font-medium"
                      :class="row.totalDebt > 0 ? 'text-error-600' : 'text-gray-500'"
                    >
                      {{ formatMoney(row.totalDebt) }}
                    </span>
                  </td>
                  <td v-if="isVisible('lastUpdated')" class="px-5 py-4 sm:px-6">
                    <span class="text-theme-sm text-gray-500">{{ formatDate(row.lastUpdated) }}</span>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex items-center justify-end">
                      <router-link
                        :to="`/suppliers/${row.supplierId}`"
                        class="rounded-lg px-3 py-1.5 text-theme-xs font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                      >
                        {{ t('supplierBalances.openSupplier') }}
                      </router-link>
                    </div>
                  </td>
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
import { useTableSort, useColumnVisibility, type TableColumnDef } from '@/composables/useTableControls'
import {
  fetchAllSupplierBalances,
  type SupplierBalanceResponse,
} from '@/services/supplierBalances'

const { t } = useI18n()

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'supplierId', label: 'ID', sortable: true },
  { key: 'supplierName', label: 'Yetkazib beruvchi', sortable: true },
  { key: 'totalPurchase', label: 'Xarid', sortable: true },
  { key: 'totalPaid', label: 'To‘lov', sortable: true },
  { key: 'totalDebt', label: 'Qarz', sortable: true },
  { key: 'lastUpdated', label: 'Yangilangan', sortable: true },
]

const inputClass =
  'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const currentPageTitle = computed(() => t('supplierBalances.title'))
const balances = ref<SupplierBalanceResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const search = ref('')
const debtorsOnly = ref(false)

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'supplier-balances-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<SupplierBalanceResponse>(
  (row, key) => row[key as keyof SupplierBalanceResponse],
)
const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)

const filteredBalances = computed(() => {
  const q = search.value.trim().toLowerCase()
  let rows = balances.value.filter((b) => b.status === 'ACTIVE' || !b.status)

  if (debtorsOnly.value) {
    rows = rows.filter((b) => Number(b.totalDebt) > 0)
  }
  if (q) {
    rows = rows.filter(
      (b) =>
        (b.supplierName || '').toLowerCase().includes(q) ||
        String(b.supplierId).includes(q),
    )
  }
  return rows
})

const displayBalances = computed(() => applySort(filteredBalances.value))

const summary = computed(() =>
  filteredBalances.value.reduce(
    (acc, row) => {
      acc.totalPurchase += Number(row.totalPurchase) || 0
      acc.totalPaid += Number(row.totalPaid) || 0
      acc.totalDebt += Number(row.totalDebt) || 0
      return acc
    },
    { totalPurchase: 0, totalPaid: 0, totalDebt: 0 },
  ),
)

const formatMoney = (v: number) => `${new Intl.NumberFormat('uz-UZ').format(Math.round(v || 0))} so‘m`
const formatDate = (v?: string | null) => {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString()
}

const resetFilters = () => {
  search.value = ''
  debtorsOnly.value = false
}

const loadAll = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    balances.value = await fetchAllSupplierBalances()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
    balances.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>
