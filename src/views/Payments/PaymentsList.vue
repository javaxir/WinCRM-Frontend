<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">To‘lovlar</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Mijozlar bo‘yicha to‘lovlarni boshqarish</p>
          </div>
          <div class="flex items-center gap-3">
            <TableColumnToggle :columns="TABLE_COLUMNS" :visible="visible" @toggle="toggleColumn" />
            <ActionIconButton action="refresh" @click="loadAll" />
            <ActionIconButton action="create" :title="t('actions.newPayment')" @click="openCreate" />
          </div>
        </div>
        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
        </div>
        <div class="flex flex-wrap items-end gap-4 px-6 pb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('payments.client') }}</label>
            <select v-model.number="filterClientId" :class="inputClass">
              <option :value="0">{{ t('common.all') }}</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.fullName }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('payments.paymentType') }}</label>
            <select v-model.number="filterPaymentTypeId" :class="inputClass">
              <option :value="0">{{ t('common.all') }}</option>
              <option v-for="pt in paymentTypes" :key="pt.id" :value="pt.id">{{ pt.name }}</option>
            </select>
          </div>
          <DateRangePicker
            v-model:start-date="filterStart"
            v-model:end-date="filterEnd"
            :label="t('payments.period')"
            @apply="applyFilter"
          />
          <ActionIconButton action="filter" @click="applyFilter" />
          <ActionIconButton action="reset" @click="resetFilter" />
        </div>

        <div class="border-t border-gray-100 px-6 py-5 dark:border-gray-800">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <span class="h-3 w-3 shrink-0 rounded-full" :style="{ backgroundColor: GRAND_TOTAL_COLOR }" />
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('payments.grandTotal') }}</p>
                </div>
                <p class="mt-2 text-xl font-bold" :style="{ color: GRAND_TOTAL_COLOR }">{{ formatAmountNumber(paymentsGrandTotal) }}</p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">so‘m · {{ filteredPayments.length }} {{ t('payments.count') }}</p>
              </div>
              <div class="h-1.5" :style="{ backgroundColor: GRAND_TOTAL_COLOR }" />
            </div>

            <div
              v-for="(summary, index) in paymentTypeSummaries"
              :key="summary.paymentTypeId"
              class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <span class="h-3 w-3 shrink-0 rounded-full" :style="{ backgroundColor: getSummaryColor(summary.name, index) }" />
                  <p class="truncate text-xs font-medium text-gray-500 dark:text-gray-400">{{ summary.name }}</p>
                </div>
                <p class="mt-2 text-xl font-bold" :style="{ color: getSummaryColor(summary.name, index) }">{{ formatAmountNumber(summary.total) }}</p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">so‘m · {{ summary.count }} {{ t('payments.count') }}</p>
              </div>
              <div class="h-1.5" :style="{ backgroundColor: getSummaryColor(summary.name, index) }" />
            </div>
          </div>
        </div>
        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh v-if="isVisible('id')" label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
                  <SortableTh v-if="isVisible('clientFullName')" label="Mijoz" sortable :active="sortKey === 'clientFullName'" :direction="sortKey === 'clientFullName' ? sortDir : null" @sort="toggleSort('clientFullName')" />
                  <SortableTh v-if="isVisible('userFullName')" :label="t('payments.user')" sortable :active="sortKey === 'userFullName'" :direction="sortKey === 'userFullName' ? sortDir : null" @sort="toggleSort('userFullName')" />
                  <SortableTh v-if="isVisible('paymentTypeName')" label="To‘lov turi" sortable :active="sortKey === 'paymentTypeName'" :direction="sortKey === 'paymentTypeName' ? sortDir : null" @sort="toggleSort('paymentTypeName')" />
                  <SortableTh v-if="isVisible('paymentAmount')" label="Summa" sortable :active="sortKey === 'paymentAmount'" :direction="sortKey === 'paymentAmount' ? sortDir : null" @sort="toggleSort('paymentAmount')" />
                  <SortableTh v-if="isVisible('paymentDate')" label="To‘lov sanasi" sortable :active="sortKey === 'paymentDate'" :direction="sortKey === 'paymentDate' ? sortDir : null" @sort="toggleSort('paymentDate')" />
                  <SortableTh v-if="isVisible('comment')" label="Izoh" sortable :active="sortKey === 'comment'" :direction="sortKey === 'comment' ? sortDir : null" @sort="toggleSort('comment')" />
                  <SortableTh :label="t('common.actions')" align="right" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading"><td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
                <tr v-else-if="displayPayments.length === 0"><td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">To‘lovlar topilmadi</td></tr>
                <tr v-for="payment in displayPayments" :key="payment.id" class="border-t border-gray-100 dark:border-gray-800">
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ payment.id }}</span></td>
                  <td v-if="isVisible('clientFullName')" class="px-5 py-4 sm:px-6">
                    <router-link
                      v-if="payment.clientId"
                      :to="`/clients/${payment.clientId}`"
                      class="font-medium text-brand-600 text-theme-sm hover:underline dark:text-brand-400"
                    >
                      {{ payment.clientFullName || '—' }}
                    </router-link>
                    <span v-else class="text-gray-500 text-theme-sm">—</span>
                  </td>
                  <td v-if="isVisible('userFullName')" class="px-5 py-4 sm:px-6">
                    <div class="min-w-0">
                      <p class="text-gray-800 text-theme-sm dark:text-white/90">{{ payment.userFullName || '—' }}</p>
                      <p v-if="payment.userId" class="mt-0.5 text-xs text-gray-500">ID: {{ payment.userId }}</p>
                    </div>
                  </td>
                  <td v-if="isVisible('paymentTypeName')" class="px-5 py-4 sm:px-6"><span class="text-gray-800 text-theme-sm dark:text-white/90">{{ payment.paymentTypeName }}</span></td>
                  <td v-if="isVisible('paymentAmount')" class="px-5 py-4 sm:px-6"><span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ formatMoney(payment.paymentAmount) }}</span></td>
                  <td v-if="isVisible('paymentDate')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatDate(payment.paymentDate) }}</span></td>
                  <td v-if="isVisible('comment')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ payment.comment || '—' }}</span></td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex items-center justify-end gap-2">
                      <ActionIconButton action="edit" size="sm" @click="openEdit(payment)" />
                      <ActionIconButton action="delete" size="sm" @click="confirmDelete(payment)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <Modal v-if="showFormModal" @close="closeForm">
      <template #body>
        <div class="relative w-full max-w-lg p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ editing ? 'To‘lovni tahrirlash' : 'Yangi to‘lov' }}</h4>
          <div v-if="formError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ formError }}</div>
          <form @submit.prevent="submitForm" class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Mijoz<span class="text-error-500">*</span></label>
              <select v-model.number="form.clientId" required :class="inputClass">
                <option :value="0" disabled>Tanlang</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.fullName }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Foydalanuvchi (sotuvchi)<span class="text-error-500">*</span></label>
              <select v-model.number="form.userId" required :class="inputClass">
                <option :value="0" disabled>Tanlang</option>
                <option v-for="u in users" :key="u.id" :value="u.id">#{{ u.id }} · {{ u.fullName }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">To‘lov turi<span class="text-error-500">*</span></label>
              <select v-model.number="form.paymentTypeId" required :class="inputClass">
                <option :value="0" disabled>Tanlang</option>
                <option v-for="t in paymentTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Summa<span class="text-error-500">*</span></label>
              <input v-model.number="form.paymentAmount" type="number" step="1" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">To‘lov sanasi<span class="text-error-500">*</span></label>
              <input v-model="form.paymentDateLocal" type="datetime-local" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Izoh</label>
              <textarea v-model="form.comment" rows="2" :class="inputClass" />
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" @click="closeForm" :class="btnOutline">Bekor qilish</button>
              <button type="submit" :disabled="saving" :class="btnPrimary">{{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}</button>
            </div>
          </form>
        </div>
      </template>
    </Modal>

    <Modal v-if="showDeleteModal" @close="showDeleteModal = false">
      <template #body>
        <div class="relative w-full max-w-md p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">O‘chirish</h4>
          <p class="mb-6 text-sm text-gray-500">#{{ itemToDelete?.id }} to‘lovni o‘chirmoqchimisiz?</p>
          <div class="flex justify-end gap-3">
            <button @click="showDeleteModal = false" :class="btnOutline">Bekor qilish</button>
            <button @click="doDelete" :disabled="deleting" class="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70">{{ deleting ? 'O‘chirilmoqda...' : 'O‘chirish' }}</button>
          </div>
        </div>
      </template>
    </Modal>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import Modal from '@/components/ui/Modal.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import { useTableSort, useColumnVisibility, type TableColumnDef } from '@/composables/useTableControls'
import {
  fetchAllPayments,
  fetchPaymentsByClient,
  fetchPaymentsByPaymentType,
  createPayment,
  updatePayment,
  deletePayment,
  type PaymentResponse,
} from '@/services/payments'
import { fetchAllPaymentTypes, type PaymentTypeResponse } from '@/services/paymentTypes'
import { fetchAllClients, type ClientResponse } from '@/services/clients'
import { fetchAllUsers, type UserResponse } from '@/services/users'
import { getThisMonthRange } from '@/utils/dateRange'

const { t } = useI18n()

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'clientFullName', label: 'Mijoz', sortable: true },
  { key: 'userFullName', label: 'Foydalanuvchi', sortable: true },
  { key: 'paymentTypeName', label: 'To‘lov turi', sortable: true },
  { key: 'paymentAmount', label: 'Summa', sortable: true },
  { key: 'paymentDate', label: 'To‘lov sanasi', sortable: true },
  { key: 'comment', label: 'Izoh', sortable: true },
]

const inputClass = 'h-11 min-w-[180px] w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'
const GRAND_TOTAL_COLOR = '#465FFF'
const PAYMENT_SUMMARY_COLORS = ['#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#7592FF', '#9CB9FF']

const currentPageTitle = ref('To‘lovlar')
const monthRange = getThisMonthRange()
const payments = ref<PaymentResponse[]>([])
const paymentTypes = ref<PaymentTypeResponse[]>([])
const clients = ref<ClientResponse[]>([])
const users = ref<UserResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const filterClientId = ref(0)
const filterPaymentTypeId = ref(0)
const filterStart = ref(monthRange.startDate)
const filterEnd = ref(monthRange.endDate)
const appliedStart = ref(monthRange.startDate)
const appliedEnd = ref(monthRange.endDate)

const usersById = computed(() => {
  const map = new Map<number, UserResponse>()
  for (const user of users.value) map.set(user.id, user)
  return map
})

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'payments-cols-v3')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<PaymentResponse>((row, key) => {
  if (key === 'userFullName') return row.userFullName || usersById.value.get(row.userId ?? 0)?.fullName || ''
  return row[key as keyof PaymentResponse]
})
const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)

const filteredPayments = computed(() => {
  let result = payments.value.filter((payment) => payment.status === 'ACTIVE')

  if (appliedStart.value) {
    const start = new Date(`${appliedStart.value}T00:00:00`)
    result = result.filter((payment) => new Date(payment.paymentDate) >= start)
  }
  if (appliedEnd.value) {
    const end = new Date(`${appliedEnd.value}T23:59:59`)
    result = result.filter((payment) => new Date(payment.paymentDate) <= end)
  }
  if (filterClientId.value > 0) {
    result = result.filter((payment) => payment.clientId === filterClientId.value)
  }
  if (filterPaymentTypeId.value > 0) {
    result = result.filter((payment) => payment.paymentTypeId === filterPaymentTypeId.value)
  }

  return result
})

const displayPayments = computed(() => applySort(filteredPayments.value))

const paymentTypeSummaries = computed(() => {
  const map = new Map<number, { paymentTypeId: number; name: string; total: number; count: number }>()

  for (const type of paymentTypes.value) {
    map.set(type.id, { paymentTypeId: type.id, name: type.name, total: 0, count: 0 })
  }

  for (const payment of filteredPayments.value) {
    const current = map.get(payment.paymentTypeId) ?? {
      paymentTypeId: payment.paymentTypeId,
      name: payment.paymentTypeName,
      total: 0,
      count: 0,
    }
    current.total += payment.paymentAmount
    current.count += 1
    map.set(payment.paymentTypeId, current)
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total)
})

const paymentsGrandTotal = computed(() =>
  paymentTypeSummaries.value.reduce((sum, item) => sum + item.total, 0),
)

const showFormModal = ref(false)
const editing = ref<PaymentResponse | null>(null)
const form = ref({ clientId: 0, userId: 0, paymentTypeId: 0, paymentAmount: 0, paymentDateLocal: '', comment: '' })
const formError = ref('')
const saving = ref(false)
const showDeleteModal = ref(false)
const itemToDelete = ref<PaymentResponse | null>(null)
const deleting = ref(false)

const toLocalInput = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

const fromLocalInput = (val: string) => (val ? new Date(val).toISOString() : '')
const formatDate = (v?: string) => { if (!v) return '—'; const d = new Date(v); return isNaN(d.getTime()) ? v : d.toLocaleString() }
const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'
const formatAmountNumber = (v: number) => new Intl.NumberFormat('uz-UZ').format(v)
const getSummaryColor = (name: string, index: number) => {
  const key = name.trim().toLowerCase()
  const colorByName: Record<string, string> = {
    naqd: '#22C55E',
    click: '#465FFF',
    payme: '#8B5CF6',
    plastik: '#F59E0B',
    bank: '#06B6D4',
    karta: '#EF4444',
  }
  return colorByName[key] ?? PAYMENT_SUMMARY_COLORS[index % PAYMENT_SUMMARY_COLORS.length]
}

const loadRefs = async () => {
  const [types, clientList, userList] = await Promise.all([
    fetchAllPaymentTypes(),
    fetchAllClients(),
    fetchAllUsers(),
  ])
  paymentTypes.value = types.filter((t) => t.status === 'ACTIVE')
  clients.value = clientList.filter((c) => c.status === 'ACTIVE')
  users.value = userList.filter((u) => u.status === 'ACTIVE')
}

const loadPayments = async () => {
  if (filterClientId.value > 0) return fetchPaymentsByClient(filterClientId.value)
  if (filterPaymentTypeId.value > 0) return fetchPaymentsByPaymentType(filterPaymentTypeId.value)
  return fetchAllPayments()
}

const applyFilter = async () => {
  if (filterStart.value && filterEnd.value && filterStart.value > filterEnd.value) {
    errorMessage.value = t('saleOrderItemsFilter.invalidDateRange')
    return
  }
  appliedStart.value = filterStart.value
  appliedEnd.value = filterEnd.value
  await loadAll()
}

const resetFilter = async () => {
  const range = getThisMonthRange()
  filterClientId.value = 0
  filterPaymentTypeId.value = 0
  filterStart.value = range.startDate
  filterEnd.value = range.endDate
  appliedStart.value = range.startDate
  appliedEnd.value = range.endDate
  errorMessage.value = ''
  await loadAll()
}

const loadAll = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    await loadRefs()
    payments.value = await loadPayments()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Yuklashda xatolik'
  } finally {
    loading.value = false
  }
}

const openCreate = async () => {
  editing.value = null
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  form.value = {
    clientId: 0,
    userId: 0,
    paymentTypeId: 0,
    paymentAmount: 0,
    paymentDateLocal: `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:${p(now.getMinutes())}`,
    comment: '',
  }
  formError.value = ''
  if (!clients.value.length) await loadRefs()
  showFormModal.value = true
}

const openEdit = async (payment: PaymentResponse) => {
  editing.value = payment
  form.value = {
    clientId: payment.clientId,
    userId: payment.userId || 0,
    paymentTypeId: payment.paymentTypeId,
    paymentAmount: payment.paymentAmount,
    paymentDateLocal: toLocalInput(payment.paymentDate),
    comment: payment.comment || '',
  }
  formError.value = ''
  if (!clients.value.length || !users.value.length) await loadRefs()
  showFormModal.value = true
}

const closeForm = () => { showFormModal.value = false }

const submitForm = async () => {
  formError.value = ''
  if (!form.value.clientId || !form.value.userId || !form.value.paymentTypeId || !form.value.paymentDateLocal) {
    formError.value = 'Mijoz, foydalanuvchi, to‘lov turi va sana majburiy'
    return
  }
  if (form.value.paymentAmount <= 0) {
    formError.value = 'Summa 0 dan katta bo‘lishi kerak'
    return
  }
  saving.value = true
  try {
    const payload = {
      clientId: form.value.clientId,
      userId: form.value.userId,
      paymentTypeId: form.value.paymentTypeId,
      paymentAmount: form.value.paymentAmount,
      paymentDate: fromLocalInput(form.value.paymentDateLocal),
      comment: form.value.comment.trim() || undefined,
    }
    if (editing.value) await updatePayment(editing.value.id, payload)
    else await createPayment(payload)
    showFormModal.value = false
    await loadAll()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (payment: PaymentResponse) => { itemToDelete.value = payment; showDeleteModal.value = true }

const doDelete = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await deletePayment(itemToDelete.value.id)
    showDeleteModal.value = false
    await loadAll()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'O‘chirishda xatolik'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

onMounted(loadAll)
</script>
