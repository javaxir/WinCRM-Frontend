<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('saleOrderWaste.title') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('saleOrderWaste.subtitle') }}</p>
          </div>
          <ActionIconButton action="refresh" @click="loadAll" />
        </div>

        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {{ errorMessage }}
          </div>
        </div>

        <div class="border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">{{ t('saleOrderWaste.summaryTitle') }}</p>
          <div v-if="summaryLoading" class="py-6 text-center text-sm text-gray-500">{{ t('common.loading') }}</div>
          <div v-else-if="summary.length === 0" class="py-6 text-center text-sm text-gray-500">{{ t('saleOrderWaste.empty') }}</div>
          <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="row in summary"
              :key="row.goodsId"
              class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5"
            >
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ row.goodsName || `#${row.goodsId}` }}</p>
              <p class="mt-1 text-lg font-semibold tabular-nums text-brand-600">{{ formatQty(row.totalQuantity) }}</p>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="px-6 py-4">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ t('saleOrderWaste.listTitle') }}</p>
            <p class="mt-1 text-xs text-gray-400">{{ t('saleOrderWaste.infoOnly') }}</p>
          </div>
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">ID</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">{{ t('saleOrderWaste.saleOrder') }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">{{ t('saleOrderWaste.goods') }}</th>
                  <th class="px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6">{{ t('saleOrderWaste.quantity') }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">{{ t('saleOrderWaste.size') }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">{{ t('saleOrderWaste.comment') }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">{{ t('saleOrderWaste.createdAt') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="listLoading">
                  <td colspan="7" class="px-5 py-8 text-center text-gray-500">{{ t('common.loading') }}</td>
                </tr>
                <tr v-else-if="rows.length === 0">
                  <td colspan="7" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td>
                </tr>
                <tr v-for="row in rows" :key="row.id">
                  <td class="px-5 py-4 text-sm text-gray-500 sm:px-6">#{{ row.id }}</td>
                  <td class="px-5 py-4 sm:px-6">
                    <router-link
                      :to="`/sale-orders/${row.saleOrderId}/items`"
                      class="text-sm font-medium text-brand-600 hover:underline"
                    >
                      #{{ row.saleOrderId }}
                    </router-link>
                  </td>
                  <td class="px-5 py-4 text-sm text-gray-800 dark:text-white/90 sm:px-6">
                    {{ row.goodsName || `#${row.goodsId}` }}
                    <span v-if="row.unitName" class="ml-1 text-xs text-gray-400">({{ row.unitName }})</span>
                  </td>
                  <td class="px-5 py-4 text-right text-sm font-medium tabular-nums text-gray-800 dark:text-white/90 sm:px-6">
                    {{ formatQty(row.quantity) }}
                  </td>
                  <td class="px-5 py-4 text-sm text-gray-500 sm:px-6">{{ formatSize(row) }}</td>
                  <td class="px-5 py-4 text-sm text-gray-500 sm:px-6">{{ row.comment || '—' }}</td>
                  <td class="px-5 py-4 text-sm text-gray-500 sm:px-6">{{ formatDateTime(row.createdAt) }}</td>
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
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import {
  fetchAllSaleOrderWastes,
  fetchSaleOrderWasteSummary,
  type SaleOrderWasteResponse,
  type SaleOrderWasteSummaryResponse,
} from '@/services/saleOrderWastes'

const { t } = useI18n()
const currentPageTitle = computed(() => t('saleOrderWaste.title'))

const summary = ref<SaleOrderWasteSummaryResponse[]>([])
const rows = ref<SaleOrderWasteResponse[]>([])
const summaryLoading = ref(false)
const listLoading = ref(false)
const errorMessage = ref('')

const formatQty = (v: number) => new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 3 }).format(v || 0)
const formatDateTime = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString('uz-UZ')
}
const formatSize = (row: SaleOrderWasteResponse) => {
  if (row.width == null && row.height == null) return '—'
  return `${row.width ?? '—'} × ${row.height ?? '—'}`
}

const loadAll = async () => {
  errorMessage.value = ''
  summaryLoading.value = true
  listLoading.value = true
  try {
    const [summaryRows, listRows] = await Promise.all([
      fetchSaleOrderWasteSummary(),
      fetchAllSaleOrderWastes(0, 200),
    ])
    summary.value = summaryRows
    rows.value = listRows.filter((r) => r.status !== 'DELETED')
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
    summary.value = []
    rows.value = []
  } finally {
    summaryLoading.value = false
    listLoading.value = false
  }
}

onMounted(loadAll)
</script>
