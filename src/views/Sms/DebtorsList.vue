<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('sms.debtorsTitle') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('sms.debtorsSubtitle') }}</p>
          </div>
          <div class="flex items-center gap-3">
            <ActionIconButton action="refresh" @click="loadAll" />
            <button
              type="button"
              :disabled="selectedIds.length === 0 || sendingBulk"
              @click="sendSelectedSms"
              class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70"
            >
              {{ sendingBulk ? t('clientDetail.sendingSms') : t('sms.sendSelected', { count: selectedIds.length }) }}
            </button>
          </div>
        </div>

        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
        </div>
        <div v-if="successMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-success-700 border border-success-200 rounded-lg bg-success-50 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">{{ successMessage }}</div>
        </div>

        <div class="flex flex-wrap items-end gap-4 px-6 pb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <DateRangePicker
            v-model:start-date="filterStartDate"
            v-model:end-date="filterEndDate"
            :label="t('saleOrderItemsFilter.period')"
            @apply="applyFilter"
          />
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('sms.salesperson') }}</label>
            <select v-model.number="filterUserId" :class="inputClass">
              <option :value="0">{{ t('common.all') }}</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.fullName }}</option>
            </select>
          </div>
          <ActionIconButton action="filter" @click="applyFilter" />
          <ActionIconButton action="reset" @click="resetFilter" />
        </div>

        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-5 py-3 text-left sm:px-6">
                    <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" class="rounded border-gray-300" />
                  </th>
                  <SortableTh label="ID" sortable :active="sortKey === 'clientId'" :direction="sortKey === 'clientId' ? sortDir : null" @sort="toggleSort('clientId')" />
                  <SortableTh label="Mijoz" sortable :active="sortKey === 'clientFullName'" :direction="sortKey === 'clientFullName' ? sortDir : null" @sort="toggleSort('clientFullName')" />
                  <SortableTh label="Telefon" sortable :active="sortKey === 'phone'" :direction="sortKey === 'phone' ? sortDir : null" @sort="toggleSort('phone')" />
                  <SortableTh label="Qarz" sortable :active="sortKey === 'totalDebt'" :direction="sortKey === 'totalDebt' ? sortDir : null" @sort="toggleSort('totalDebt')" align="right" />
                  <SortableTh :label="t('sms.ordersCount')" sortable :active="sortKey === 'ordersCount'" :direction="sortKey === 'ordersCount' ? sortDir : null" @sort="toggleSort('ordersCount')" />
                  <SortableTh :label="t('common.actions')" align="right" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading"><td colspan="7" class="px-5 py-8 text-center text-gray-500">{{ t('common.loading') }}</td></tr>
                <tr v-else-if="displayDebtors.length === 0"><td colspan="7" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td></tr>
                <template v-for="debtor in displayDebtors" :key="debtor.clientId">
                  <tr class="border-t border-gray-100 dark:border-gray-800">
                    <td class="px-5 py-4 sm:px-6">
                      <input type="checkbox" :checked="isSelected(debtor.clientId)" @change="toggleSelect(debtor.clientId)" class="rounded border-gray-300" />
                    </td>
                    <td class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ debtor.clientId }}</span></td>
                    <td class="px-5 py-4 sm:px-6">
                      <router-link :to="`/clients/${debtor.clientId}`" class="font-medium text-brand-600 text-theme-sm hover:underline dark:text-brand-400">
                        {{ debtor.clientFullName }}
                      </router-link>
                    </td>
                    <td class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ debtor.phone || '—' }}</span></td>
                    <td class="px-5 py-4 text-right sm:px-6"><span class="font-medium text-warning-600 text-theme-sm">{{ formatMoney(debtor.totalDebt) }}</span></td>
                    <td class="px-5 py-4 sm:px-6">
                      <button type="button" @click="toggleExpand(debtor.clientId)" class="text-brand-600 text-theme-sm hover:underline dark:text-brand-400">
                        {{ debtor.orders.length }} {{ t('sms.orders') }}
                        <span>{{ expandedId === debtor.clientId ? '▲' : '▼' }}</span>
                      </button>
                    </td>
                    <td class="px-5 py-4 sm:px-6">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          :disabled="sendingClientId === debtor.clientId"
                          @click="sendSingleSms(debtor.clientId)"
                          class="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-70 dark:border-brand-500/30 dark:text-brand-400"
                        >
                          {{ sendingClientId === debtor.clientId ? t('clientDetail.sendingSms') : t('clientDetail.sendDebtSms') }}
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="expandedId === debtor.clientId">
                    <td colspan="7" class="bg-gray-50 px-5 py-4 dark:bg-white/5 sm:px-6">
                      <table class="min-w-full text-sm">
                        <thead>
                          <tr class="text-left text-xs text-gray-500">
                            <th class="pb-2 pr-4">Buyurtma</th>
                            <th class="pb-2 pr-4">Sana</th>
                            <th class="pb-2 pr-4">Sotuvchi</th>
                            <th class="pb-2 pr-4 text-right">Qarz</th>
                            <th class="pb-2 text-right">{{ t('common.actions') }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="order in debtor.orders" :key="order.saleOrderId" class="border-t border-gray-200/70 dark:border-gray-700">
                            <td class="py-2 pr-4">
                              <router-link :to="`/sale-orders/${order.saleOrderId}/items`" class="text-brand-600 hover:underline dark:text-brand-400">#{{ order.saleOrderId }}</router-link>
                            </td>
                            <td class="py-2 pr-4 text-gray-500">{{ formatDate(order.orderDate) }}</td>
                            <td class="py-2 pr-4 text-gray-500">{{ order.userFullName || '—' }}</td>
                            <td class="py-2 pr-4 text-right text-warning-600">{{ formatMoney(order.debtSum) }}</td>
                            <td class="py-2 text-right">
                              <button
                                type="button"
                                :disabled="sendingOrderId === order.saleOrderId"
                                @click="sendOrderSms(order.saleOrderId)"
                                class="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-white disabled:opacity-70 dark:border-gray-700 dark:text-gray-300"
                              >
                                {{ sendingOrderId === order.saleOrderId ? t('clientDetail.sendingSms') : t('clientDetail.sendOrderSms') }}
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </template>
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
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import { useTableSort } from '@/composables/useTableControls'
import {
  fetchDebtors,
  sendDebtSmsToClient,
  sendDebtSmsToClients,
  sendDebtSmsForOrder,
  type DebtorClientResponse,
} from '@/services/notifications'
import { fetchAllUsers } from '@/services/users'
import type { UserResponse } from '@/services/users'

const { t } = useI18n()

const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const currentPageTitle = ref('Qarzdorlar')
const debtors = ref<DebtorClientResponse[]>([])
const users = ref<UserResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const filterStartDate = ref('')
const filterEndDate = ref('')
const filterUserId = ref(0)
const appliedStartDate = ref('')
const appliedEndDate = ref('')
const appliedUserId = ref(0)
const selectedIds = ref<number[]>([])
const expandedId = ref<number | null>(null)
const sendingBulk = ref(false)
const sendingClientId = ref<number | null>(null)
const sendingOrderId = ref<number | null>(null)

const { sortKey, sortDir, toggleSort, applySort } = useTableSort<DebtorClientResponse>((row, key) => {
  if (key === 'ordersCount') return row.orders.length
  return row[key as keyof DebtorClientResponse]
})
const displayDebtors = computed(() => applySort(debtors.value))

const allSelected = computed(() =>
  displayDebtors.value.length > 0 && displayDebtors.value.every((d) => selectedIds.value.includes(d.clientId)),
)

const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'
const formatDate = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleDateString()
}

const isSelected = (id: number) => selectedIds.value.includes(id)

const toggleSelect = (id: number) => {
  if (isSelected(id)) selectedIds.value = selectedIds.value.filter((x) => x !== id)
  else selectedIds.value = [...selectedIds.value, id]
}

const toggleSelectAll = () => {
  if (allSelected.value) selectedIds.value = []
  else selectedIds.value = displayDebtors.value.map((d) => d.clientId)
}

const toggleExpand = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id
}

const buildFilter = () => ({
  startDate: appliedStartDate.value || undefined,
  endDate: appliedEndDate.value || undefined,
  userId: appliedUserId.value > 0 ? appliedUserId.value : undefined,
})

const loadAll = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    if (!users.value.length) {
      users.value = (await fetchAllUsers()).filter((u) => u.status === 'ACTIVE')
    }
    debtors.value = await fetchDebtors(buildFilter())
    selectedIds.value = selectedIds.value.filter((id) => debtors.value.some((d) => d.clientId === id))
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  appliedStartDate.value = filterStartDate.value
  appliedEndDate.value = filterEndDate.value
  appliedUserId.value = filterUserId.value
  loadAll()
}

const resetFilter = () => {
  filterStartDate.value = ''
  filterEndDate.value = ''
  filterUserId.value = 0
  appliedStartDate.value = ''
  appliedEndDate.value = ''
  appliedUserId.value = 0
  loadAll()
}

const sendSelectedSms = async () => {
  if (!selectedIds.value.length) return
  sendingBulk.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await sendDebtSmsToClients(selectedIds.value)
    successMessage.value = t('sms.bulkSent', { count: selectedIds.value.length })
    selectedIds.value = []
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    sendingBulk.value = false
  }
}

const sendSingleSms = async (clientId: number) => {
  sendingClientId.value = clientId
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await sendDebtSmsToClient(clientId)
    successMessage.value = t('clientDetail.smsSent')
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    sendingClientId.value = null
  }
}

const sendOrderSms = async (saleOrderId: number) => {
  sendingOrderId.value = saleOrderId
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await sendDebtSmsForOrder(saleOrderId)
    successMessage.value = t('clientDetail.smsSent')
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    sendingOrderId.value = null
  }
}

onMounted(loadAll)
</script>
