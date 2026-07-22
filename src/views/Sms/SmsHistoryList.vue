<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('sms.historyTitle') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('sms.historySubtitle') }}</p>
          </div>
          <div class="flex items-center gap-3">
            <TableColumnToggle :columns="TABLE_COLUMNS" :visible="visible" @toggle="toggleColumn" />
            <ActionIconButton action="refresh" @click="loadItems" />
          </div>
        </div>

        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
        </div>

        <div class="px-6 pb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <input v-model="search" type="text" :placeholder="t('sms.searchPlaceholder')" :class="inputClass + ' max-w-md'" />
        </div>

        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh v-if="isVisible('id')" label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
                  <SortableTh v-if="isVisible('clientFullName')" :label="t('sms.client')" sortable :active="sortKey === 'clientFullName'" :direction="sortKey === 'clientFullName' ? sortDir : null" @sort="toggleSort('clientFullName')" />
                  <SortableTh v-if="isVisible('phone')" :label="t('clientDetail.smsPhone')" sortable :active="sortKey === 'phone'" :direction="sortKey === 'phone' ? sortDir : null" @sort="toggleSort('phone')" />
                  <SortableTh v-if="isVisible('debtAmount')" :label="t('clientDetail.smsDebt')" sortable :active="sortKey === 'debtAmount'" :direction="sortKey === 'debtAmount' ? sortDir : null" @sort="toggleSort('debtAmount')" align="right" />
                  <SortableTh v-if="isVisible('status')" :label="t('common.status')" sortable :active="sortKey === 'status'" :direction="sortKey === 'status' ? sortDir : null" @sort="toggleSort('status')" />
                  <SortableTh v-if="isVisible('message')" :label="t('sms.message')" />
                  <SortableTh v-if="isVisible('sentAt')" :label="t('clientDetail.smsDate')" sortable :active="sortKey === 'sentAt'" :direction="sortKey === 'sentAt' ? sortDir : null" @sort="toggleSort('sentAt')" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading"><td :colspan="colCount" class="px-5 py-8 text-center text-gray-500">{{ t('common.loading') }}</td></tr>
                <tr v-else-if="displayItems.length === 0"><td :colspan="colCount" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td></tr>
                <tr v-for="item in displayItems" :key="item.id" class="border-t border-gray-100 dark:border-gray-800">
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.id }}</span></td>
                  <td v-if="isVisible('clientFullName')" class="px-5 py-4 sm:px-6">
                    <router-link
                      v-if="item.clientId"
                      :to="`/clients/${item.clientId}`"
                      class="font-medium text-brand-600 text-theme-sm hover:underline dark:text-brand-400"
                    >
                      {{ item.clientFullName || `#${item.clientId}` }}
                    </router-link>
                    <span v-else class="text-gray-500 text-theme-sm">{{ item.clientFullName || '—' }}</span>
                  </td>
                  <td v-if="isVisible('phone')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.phone || '—' }}</span></td>
                  <td v-if="isVisible('debtAmount')" class="px-5 py-4 text-right sm:px-6"><span class="text-gray-500 text-theme-sm">{{ getSmsDebtAmount(item) != null ? formatMoney(getSmsDebtAmount(item)!) : '—' }}</span></td>
                  <td v-if="isVisible('status')" class="px-5 py-4 sm:px-6"><span :class="statusClass(item)">{{ statusLabel(item) }}</span></td>
                  <td v-if="isVisible('message')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ getSmsDisplayMessage(item) }}</span></td>
                  <td v-if="isVisible('sentAt')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatDateTime(item.sentAt || item.createdAt) }}</span></td>
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
  fetchDebtNotificationHistory,
  type DebtNotificationHistoryResponse,
} from '@/services/notifications'
import {
  normalizeSmsStatus,
  isSmsStatusSuccess,
  getSmsDebtAmount,
  getSmsDisplayMessage,
  SMS_STATUS_I18N_KEY,
} from '@/utils/smsNotificationStatus'

const { t } = useI18n()

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'clientFullName', label: 'Mijoz', sortable: true },
  { key: 'phone', label: 'Telefon', sortable: true },
  { key: 'debtAmount', label: 'Qarz', sortable: true },
  { key: 'status', label: 'Holati', sortable: true },
  { key: 'message', label: 'Xabar', sortable: false },
  { key: 'sentAt', label: 'Sana', sortable: true },
]

const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const currentPageTitle = ref('SMS tarixi')
const items = ref<DebtNotificationHistoryResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const search = ref('')

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'sms-history-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<DebtNotificationHistoryResponse>((row, key) => {
  if (key === 'debtAmount') return getSmsDebtAmount(row) ?? 0
  if (key === 'status') return normalizeSmsStatus(row)
  if (key === 'sentAt') return row.sentAt || row.createdAt
  return row[key as keyof DebtNotificationHistoryResponse]
})
const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)

const displayItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  let result = items.value
  if (q) {
    result = result.filter(
      (item) =>
        (item.clientFullName || '').toLowerCase().includes(q) ||
        (item.phone || '').toLowerCase().includes(q) ||
        (item.message || '').toLowerCase().includes(q) ||
        (item.errorMessage || '').toLowerCase().includes(q) ||
        statusLabel(item).toLowerCase().includes(q),
    )
  }
  return applySort(result)
})

const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'
const formatDateTime = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString()
}

const statusLabel = (item: DebtNotificationHistoryResponse) => {
  const key = normalizeSmsStatus(item)
  return t(SMS_STATUS_I18N_KEY[key])
}

const statusClass = (item: DebtNotificationHistoryResponse) => {
  const ok = isSmsStatusSuccess(normalizeSmsStatus(item))
  return [
    'rounded-full px-2 py-0.5 text-theme-xs font-medium',
    ok
      ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
      : 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500',
  ]
}

const loadItems = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    items.value = await fetchDebtNotificationHistory()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    loading.value = false
  }
}

onMounted(loadItems)
</script>
