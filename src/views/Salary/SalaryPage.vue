<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('salary.title') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('salary.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-3">
            <ActionIconButton action="refresh" @click="refreshActiveTab" />
            <button
              v-if="activeTab === 'configs'"
              type="button"
              :class="btnPrimary"
              @click="openConfigForm"
            >
              {{ t('salary.newConfig') }}
            </button>
            <button
              v-if="activeTab === 'ledger'"
              type="button"
              :class="btnPrimary"
              :disabled="!selectedUserId"
              @click="openAdjustmentForm"
            >
              {{ t('salary.newAdjustment') }}
            </button>
          </div>
        </div>

        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {{ errorMessage }}
          </div>
        </div>
        <div v-if="successMessage" class="px-6 pb-4">
          <div class="rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
            {{ successMessage }}
          </div>
        </div>

        <div class="border-t border-gray-100 px-6 pt-4 dark:border-gray-800">
          <div class="inline-flex flex-wrap gap-1 rounded-2xl border border-gray-200 bg-gray-100 p-1.5 dark:border-gray-800 dark:bg-gray-900">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              class="rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap"
              :class="activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Shared user / period filters for slip & ledger -->
        <div
          v-if="activeTab !== 'configs'"
          class="flex flex-wrap items-end gap-4 px-6 py-4"
        >
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('salary.employee') }}</label>
            <select v-model.number="selectedUserId" :class="inputClass" @change="onUserOrPeriodChange">
              <option :value="0" disabled>{{ t('salary.selectEmployee') }}</option>
              <option v-for="u in users" :key="u.id" :value="u.id">#{{ u.id }} · {{ u.fullName }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('salary.year') }}</label>
            <input v-model.number="periodYear" type="number" min="2020" max="2100" :class="inputClass" @change="onUserOrPeriodChange" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('salary.month') }}</label>
            <select v-model.number="periodMonth" :class="inputClass" @change="onUserOrPeriodChange">
              <option v-for="m in 12" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <ActionIconButton action="filter" @click="onUserOrPeriodChange" />
        </div>

        <!-- CONFIGS TAB -->
        <div v-show="activeTab === 'configs'" class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">ID</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">{{ t('salary.employee') }}</th>
                  <th class="px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6">{{ t('salary.baseSalary') }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">{{ t('salary.commission') }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">{{ t('salary.effectiveFrom') }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">{{ t('salary.effectiveTo') }}</th>
                  <th class="px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="configsLoading">
                  <td colspan="7" class="px-5 py-8 text-center text-gray-500">{{ t('common.loading') }}</td>
                </tr>
                <tr v-else-if="configs.length === 0">
                  <td colspan="7" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td>
                </tr>
                <tr v-for="row in configs" :key="row.id" class="border-t border-gray-100 dark:border-gray-800">
                  <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ row.id }}</td>
                  <td class="px-5 py-4 sm:px-6">
                    <p class="text-theme-sm font-medium text-gray-800 dark:text-white/90">{{ row.userFullName || '—' }}</p>
                    <p class="text-xs text-gray-500">ID: {{ row.userId }}</p>
                  </td>
                  <td class="px-5 py-4 text-right text-theme-sm font-medium text-gray-800 dark:text-white/90 sm:px-6">
                    {{ formatMoney(row.baseSalary) }}
                  </td>
                  <td class="px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90 sm:px-6">
                    {{ formatCommission(row.commissionType, row.commissionValue) }}
                  </td>
                  <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ row.effectiveFrom || '—' }}</td>
                  <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">
                    {{ row.effectiveTo || t('salary.currentConfig') }}
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex justify-end">
                      <ActionIconButton
                        action="delete"
                        size="sm"
                        :disabled="deletingConfigId === row.id"
                        @click="confirmDeleteConfig(row)"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- PAYSLIP TAB -->
        <div v-show="activeTab === 'slip'" class="border-t border-gray-100 px-6 py-5 dark:border-gray-800">
          <div v-if="slipLoading" class="py-8 text-center text-gray-500">{{ t('common.loading') }}</div>
          <div v-else-if="!selectedUserId" class="py-8 text-center text-gray-500">{{ t('salary.selectEmployee') }}</div>
          <div v-else-if="!slip" class="py-8 text-center text-gray-500">{{ t('common.notFound') }}</div>
          <template v-else>
            <div class="mb-4">
              <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                {{ slip.userFullName || userName(slip.userId) }}
              </h4>
              <p class="text-sm text-gray-500">{{ slip.periodMonth }}/{{ slip.periodYear }}</p>
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div v-for="item in slipCards" :key="item.label" class="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
                <div class="px-4 py-4">
                  <p class="text-xs font-medium text-gray-500">{{ item.label }}</p>
                  <p class="mt-2 text-xl font-bold" :style="{ color: item.color }">{{ formatMoney(item.value) }}</p>
                </div>
                <div class="h-1.5" :style="{ backgroundColor: item.color }" />
              </div>
            </div>
          </template>
        </div>

        <!-- LEDGER TAB -->
        <div v-show="activeTab === 'ledger'" class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">ID</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">{{ t('salary.entryType') }}</th>
                  <th class="px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6">{{ t('salary.amount') }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">{{ t('salary.period') }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">{{ t('salary.order') }}</th>
                  <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 sm:px-6">{{ t('salary.comment') }}</th>
                  <th class="px-5 py-3 text-right text-xs font-medium text-gray-500 sm:px-6">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="ledgerLoading">
                  <td colspan="7" class="px-5 py-8 text-center text-gray-500">{{ t('common.loading') }}</td>
                </tr>
                <tr v-else-if="!selectedUserId">
                  <td colspan="7" class="px-5 py-8 text-center text-gray-500">{{ t('salary.selectEmployee') }}</td>
                </tr>
                <tr v-else-if="transactions.length === 0">
                  <td colspan="7" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td>
                </tr>
                <tr v-for="tx in transactions" :key="tx.id" class="border-t border-gray-100 dark:border-gray-800">
                  <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ tx.id }}</td>
                  <td class="px-5 py-4 sm:px-6">
                    <span class="rounded-full px-2 py-0.5 text-theme-xs font-medium" :class="entryTypeClass(tx.entryType)">
                      {{ t(`salary.entryTypes.${tx.entryType}`) }}
                    </span>
                  </td>
                  <td class="px-5 py-4 text-right text-theme-sm font-medium text-gray-800 dark:text-white/90 sm:px-6">
                    {{ formatMoney(tx.amount) }}
                  </td>
                  <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ tx.periodMonth }}/{{ tx.periodYear }}</td>
                  <td class="px-5 py-4 text-theme-sm sm:px-6">
                    <router-link
                      v-if="tx.saleOrderId"
                      :to="`/sale-orders/${tx.saleOrderId}/items`"
                      class="text-brand-600 hover:underline dark:text-brand-400"
                    >
                      #{{ tx.saleOrderId }}
                    </router-link>
                    <span v-else class="text-gray-500">—</span>
                  </td>
                  <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ tx.comment || '—' }}</td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex justify-end">
                      <ActionIconButton
                        v-if="isManualEntry(tx.entryType)"
                        action="delete"
                        size="sm"
                        :disabled="deletingTxId === tx.id"
                        @click="deleteTx(tx)"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Config modal -->
    <Modal v-if="showConfigModal" @close="showConfigModal = false">
      <template #body>
        <div class="relative w-full max-w-lg rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('salary.newConfig') }}</h4>
          <div v-if="formError" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:text-red-400">
            {{ formError }}
          </div>
          <form class="space-y-4" @submit.prevent="submitConfig">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('salary.employee') }}<span class="text-error-500">*</span>
              </label>
              <select v-model.number="configForm.userId" required :class="inputClass">
                <option :value="0" disabled>Tanlang</option>
                <option v-for="u in users" :key="u.id" :value="u.id">#{{ u.id }} · {{ u.fullName }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('salary.baseSalary') }}<span class="text-error-500">*</span>
              </label>
              <input v-model.number="configForm.baseSalary" type="number" min="0" step="1" required :class="inputClass" />
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('salary.commissionType') }}<span class="text-error-500">*</span>
                </label>
                <select v-model="configForm.commissionType" required :class="inputClass">
                  <option value="PERCENT">{{ t('salary.commissionPercent') }}</option>
                  <option value="FIXED">{{ t('salary.commissionFixed') }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('salary.commissionValue') }}<span class="text-error-500">*</span>
                </label>
                <input v-model.number="configForm.commissionValue" type="number" min="0" step="0.01" required :class="inputClass" />
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('salary.effectiveFrom') }}<span class="text-error-500">*</span>
              </label>
              <input v-model="configForm.effectiveFrom" type="date" required :class="inputClass" />
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" :class="btnOutline" @click="showConfigModal = false">{{ t('common.cancel') }}</button>
              <button type="submit" :disabled="savingConfig" :class="btnPrimary">
                {{ savingConfig ? t('common.saving') : t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>

    <!-- Adjustment modal -->
    <Modal v-if="showAdjustmentModal" @close="showAdjustmentModal = false">
      <template #body>
        <div class="relative w-full max-w-lg rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('salary.newAdjustment') }}</h4>
          <div v-if="formError" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:text-red-400">
            {{ formError }}
          </div>
          <form class="space-y-4" @submit.prevent="submitAdjustment">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('salary.entryType') }}<span class="text-error-500">*</span>
              </label>
              <select v-model="adjustmentForm.entryType" required :class="inputClass">
                <option value="BONUS">{{ t('salary.entryTypes.BONUS') }}</option>
                <option value="DEDUCTION">{{ t('salary.entryTypes.DEDUCTION') }}</option>
                <option value="ADVANCE">{{ t('salary.entryTypes.ADVANCE') }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('salary.amount') }}<span class="text-error-500">*</span>
              </label>
              <input v-model.number="adjustmentForm.amount" type="number" min="0.01" step="1" required :class="inputClass" />
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('salary.year') }}</label>
                <input v-model.number="adjustmentForm.periodYear" type="number" min="2020" :class="inputClass" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('salary.month') }}</label>
                <select v-model.number="adjustmentForm.periodMonth" :class="inputClass">
                  <option v-for="m in 12" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('salary.comment') }}</label>
              <textarea v-model="adjustmentForm.comment" rows="2" :class="inputClass" />
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" :class="btnOutline" @click="showAdjustmentModal = false">{{ t('common.cancel') }}</button>
              <button type="submit" :disabled="savingAdjustment" :class="btnPrimary">
                {{ savingAdjustment ? t('common.saving') : t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import Modal from '@/components/ui/Modal.vue'
import { fetchAllUsers, type UserResponse } from '@/services/users'
import {
  fetchSalaryConfigs,
  createSalaryConfig,
  deleteSalaryConfig,
  fetchSalarySlip,
  fetchSalaryTransactionsByPeriod,
  createSalaryAdjustment,
  deleteSalaryTransaction,
  type SalaryConfigResponse,
  type SalarySlipResponse,
  type SalaryTransactionResponse,
  type CommissionType,
  type SalaryEntryType,
} from '@/services/salary'

type TabId = 'configs' | 'slip' | 'ledger'

const { t } = useI18n()

const inputClass =
  'h-11 min-w-[160px] w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'
const btnOutline =
  'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'

const now = new Date()
const currentPageTitle = computed(() => t('salary.title'))
const activeTab = ref<TabId>('configs')
const tabs = computed(() => [
  { id: 'configs' as const, label: t('salary.tabConfigs') },
  { id: 'slip' as const, label: t('salary.tabSlip') },
  { id: 'ledger' as const, label: t('salary.tabLedger') },
])

const users = ref<UserResponse[]>([])
const selectedUserId = ref(0)
const periodYear = ref(now.getFullYear())
const periodMonth = ref(now.getMonth() + 1)

const configs = ref<SalaryConfigResponse[]>([])
const configsLoading = ref(false)
const slip = ref<SalarySlipResponse | null>(null)
const slipLoading = ref(false)
const transactions = ref<SalaryTransactionResponse[]>([])
const ledgerLoading = ref(false)

const errorMessage = ref('')
const successMessage = ref('')
const formError = ref('')

const showConfigModal = ref(false)
const savingConfig = ref(false)
const deletingConfigId = ref<number | null>(null)
const configForm = ref({
  userId: 0,
  baseSalary: 0,
  commissionType: 'PERCENT' as CommissionType,
  commissionValue: 0,
  effectiveFrom: '',
})

const showAdjustmentModal = ref(false)
const savingAdjustment = ref(false)
const deletingTxId = ref<number | null>(null)
const adjustmentForm = ref({
  entryType: 'BONUS' as 'BONUS' | 'DEDUCTION' | 'ADVANCE',
  amount: 0,
  periodYear: now.getFullYear(),
  periodMonth: now.getMonth() + 1,
  comment: '',
})

const formatMoney = (v: number) => `${new Intl.NumberFormat('uz-UZ').format(Math.round(v || 0))} so‘m`
const formatCommission = (type: CommissionType, value: number) =>
  type === 'PERCENT' ? `${value}%` : formatMoney(value)
const userName = (id: number) => users.value.find((u) => u.id === id)?.fullName || `#${id}`
const isManualEntry = (type: SalaryEntryType) =>
  type === 'BONUS' || type === 'DEDUCTION' || type === 'ADVANCE'

const entryTypeClass = (type: SalaryEntryType) => {
  const map: Record<SalaryEntryType, string> = {
    COMMISSION: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    COMMISSION_REVERSAL: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
    BONUS: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
    DEDUCTION: 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
    ADVANCE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }
  return map[type]
}

const slipCards = computed(() => {
  if (!slip.value) return []
  return [
    { label: t('salary.baseSalary'), value: slip.value.baseSalary, color: '#465FFF' },
    { label: t('salary.totalCommission'), value: slip.value.totalCommission, color: '#22C55E' },
    { label: t('salary.totalBonus'), value: slip.value.totalBonus, color: '#06B6D4' },
    { label: t('salary.totalDeduction'), value: slip.value.totalDeduction, color: '#EF4444' },
    { label: t('salary.totalAdvance'), value: slip.value.totalAdvance, color: '#F59E0B' },
    { label: t('salary.totalCommissionReversal'), value: slip.value.totalCommissionReversal, color: '#8B5CF6' },
    { label: t('salary.netSalary'), value: slip.value.netSalary, color: '#111827' },
  ]
})

const loadUsers = async () => {
  users.value = (await fetchAllUsers()).filter((u) => u.status === 'ACTIVE')
}

const loadConfigs = async () => {
  configsLoading.value = true
  errorMessage.value = ''
  try {
    configs.value = (await fetchSalaryConfigs()).filter((c) => c.status === 'ACTIVE')
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
    configs.value = []
  } finally {
    configsLoading.value = false
  }
}

const loadSlip = async () => {
  if (!selectedUserId.value) {
    slip.value = null
    return
  }
  slipLoading.value = true
  errorMessage.value = ''
  try {
    slip.value = await fetchSalarySlip(selectedUserId.value, periodYear.value, periodMonth.value)
  } catch (e) {
    slip.value = null
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    slipLoading.value = false
  }
}

const loadLedger = async () => {
  if (!selectedUserId.value) {
    transactions.value = []
    return
  }
  ledgerLoading.value = true
  errorMessage.value = ''
  try {
    transactions.value = (
      await fetchSalaryTransactionsByPeriod(
        selectedUserId.value,
        periodYear.value,
        periodMonth.value,
      )
    ).filter((tx) => tx.status === 'ACTIVE')
  } catch (e) {
    transactions.value = []
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    ledgerLoading.value = false
  }
}

const onUserOrPeriodChange = () => {
  if (activeTab.value === 'slip') loadSlip()
  if (activeTab.value === 'ledger') loadLedger()
}

const refreshActiveTab = () => {
  successMessage.value = ''
  if (activeTab.value === 'configs') loadConfigs()
  else if (activeTab.value === 'slip') loadSlip()
  else loadLedger()
}

watch(activeTab, (tab) => {
  successMessage.value = ''
  errorMessage.value = ''
  if (tab === 'configs') loadConfigs()
  else if (tab === 'slip') loadSlip()
  else loadLedger()
})

const openConfigForm = () => {
  const p = (n: number) => String(n).padStart(2, '0')
  configForm.value = {
    userId: selectedUserId.value || 0,
    baseSalary: 0,
    commissionType: 'PERCENT',
    commissionValue: 0,
    effectiveFrom: `${now.getFullYear()}-${p(now.getMonth() + 1)}-01`,
  }
  formError.value = ''
  showConfigModal.value = true
}

const submitConfig = async () => {
  formError.value = ''
  if (!configForm.value.userId || !configForm.value.effectiveFrom) {
    formError.value = t('salary.configRequired')
    return
  }
  savingConfig.value = true
  try {
    await createSalaryConfig({
      userId: configForm.value.userId,
      baseSalary: Number(configForm.value.baseSalary) || 0,
      commissionType: configForm.value.commissionType,
      commissionValue: Number(configForm.value.commissionValue) || 0,
      effectiveFrom: configForm.value.effectiveFrom,
    })
    showConfigModal.value = false
    successMessage.value = t('salary.configSaved')
    await loadConfigs()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    savingConfig.value = false
  }
}

const confirmDeleteConfig = async (row: SalaryConfigResponse) => {
  deletingConfigId.value = row.id
  errorMessage.value = ''
  try {
    await deleteSalaryConfig(row.id)
    successMessage.value = t('salary.configDeleted')
    await loadConfigs()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    deletingConfigId.value = null
  }
}

const openAdjustmentForm = () => {
  adjustmentForm.value = {
    entryType: 'BONUS',
    amount: 0,
    periodYear: periodYear.value,
    periodMonth: periodMonth.value,
    comment: '',
  }
  formError.value = ''
  showAdjustmentModal.value = true
}

const submitAdjustment = async () => {
  formError.value = ''
  if (!selectedUserId.value || adjustmentForm.value.amount <= 0) {
    formError.value = t('salary.adjustmentRequired')
    return
  }
  savingAdjustment.value = true
  try {
    await createSalaryAdjustment({
      userId: selectedUserId.value,
      entryType: adjustmentForm.value.entryType,
      amount: Number(adjustmentForm.value.amount),
      periodYear: adjustmentForm.value.periodYear,
      periodMonth: adjustmentForm.value.periodMonth,
      comment: adjustmentForm.value.comment.trim() || undefined,
    })
    showAdjustmentModal.value = false
    successMessage.value = t('salary.adjustmentSaved')
    await loadLedger()
    if (activeTab.value === 'slip') await loadSlip()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    savingAdjustment.value = false
  }
}

const deleteTx = async (tx: SalaryTransactionResponse) => {
  deletingTxId.value = tx.id
  errorMessage.value = ''
  try {
    await deleteSalaryTransaction(tx.id)
    successMessage.value = t('salary.adjustmentDeleted')
    await loadLedger()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    deletingTxId.value = null
  }
}

onMounted(async () => {
  try {
    await loadUsers()
  } catch {
    users.value = []
  }
  await loadConfigs()
})
</script>
