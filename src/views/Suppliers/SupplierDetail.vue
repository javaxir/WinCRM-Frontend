<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />

    <div class="space-y-5 sm:space-y-6">
      <router-link
        to="/suppliers"
        class="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
      >
        ← {{ t('supplierDetail.backToList') }}
      </router-link>

      <div v-if="errorMessage" class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
        {{ errorMessage }}
      </div>

      <div v-if="loading" class="py-12 text-center text-gray-500">{{ t('common.loading') }}</div>

      <template v-else-if="supplier">
        <SupplierDetailHeader
          :supplier="supplier"
          :finance="finance"
          :last-activity-label="lastActivityLabel"
          @new-order="openOrderForm"
          @add-payment="openPaymentForm()"
          @edit="openSupplierEdit"
          @toggle-status="toggleSupplierStatus"
        />

        <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="border-b border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-6">
            <div class="inline-flex w-full gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-gray-100 p-1.5 dark:border-gray-800 dark:bg-gray-900 custom-scrollbar">
              <button
                v-for="tab in supplierTabs"
                :key="tab.id"
                type="button"
                @click="activeTab = tab.id"
                :class="[
                  'inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white',
                ]"
              >
                {{ tab.label }}
                <span
                  v-if="tab.count != null"
                  class="rounded-full px-2 py-0.5 text-xs tabular-nums"
                  :class="activeTab === tab.id ? 'bg-brand-500/10 text-brand-600' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'"
                >
                  {{ tab.count }}
                </span>
              </button>
            </div>
          </div>

          <div class="px-4 py-5 sm:px-6">
            <SupplierDashboardTab
              v-show="activeTab === 'dashboard'"
              :orders="orders"
              :payments="payments"
              :order-items="orderItems"
              :warehouse-stats="warehouseStats"
            />

            <SupplierOrdersTab
              v-show="activeTab === 'orders'"
              :orders="orders"
              @refresh="reloadOrders"
            />

            <SupplierPositionsTab
              v-show="activeTab === 'positions'"
              :items="orderItems"
            />

            <SupplierActTab
              v-show="activeTab === 'act'"
              :rows="actRows"
              :totals="actTotals"
              :supplier-name="supplier.name"
              :applied-start="actAppliedStart"
              :applied-end="actAppliedEnd"
              @apply="applyActFilter"
              @reset="resetActFilter"
              @print="printAct"
              @export-csv="exportActCsv"
            />

            <SupplierPaymentsTab
              v-show="activeTab === 'payments'"
              :payments="payments"
              :orders="orders"
              :loading="paymentsLoading"
              @add-payment="openPaymentForm()"
              @edit-payment="openPaymentForm"
              @delete-payment="confirmDeletePayment"
              @refresh="loadPayments"
            />

            <SupplierTimelineTab
              v-show="activeTab === 'timeline'"
              :entries="timelineEntries"
            />

            <SupplierAuditTab
              v-show="activeTab === 'audit'"
              :logs="supplierAuditLogs"
            />

            <div v-show="activeTab === 'info'" class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
                <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('supplierDetail.tabInfo') }}</h3>
                <button type="button" @click="openSupplierEdit" :class="btnOutline">
                  <Pencil class="h-4 w-4" />
                  {{ t('supplierDetail.editSupplier') }}
                </button>
              </div>
              <div class="space-y-6 px-6 py-6">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div v-for="field in basicFields" :key="field.label">
                    <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ field.label }}</label>
                    <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-white/5 dark:text-white/90">
                      {{ field.value }}
                    </div>
                  </div>
                </div>
                <div class="border-t border-dashed border-gray-300 pt-6 dark:border-gray-700">
                  <h4 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('supplierDetail.sectionBank') }}</h4>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div v-for="field in bankFields" :key="field.label">
                      <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ field.label }}</label>
                      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-white/5 dark:text-white/90">
                        {{ field.value }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="border-t border-dashed border-gray-300 pt-6 dark:border-gray-700">
                  <h4 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('supplierDetail.sectionOther') }}</h4>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div v-for="field in otherFields" :key="field.label" :class="field.class">
                      <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ field.label }}</label>
                      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-white/5 dark:text-white/90">
                        {{ field.value }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <Teleport to="body">
      <Modal v-if="showPaymentModal" full-screen-backdrop @close="closePaymentForm">
        <template #body>
          <div class="relative z-10 mx-4 w-full max-w-lg rounded-3xl bg-white p-6 dark:bg-gray-900">
            <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              {{ editingPayment ? t('supplierDetail.editPayment') : t('supplierDetail.addPayment') }}
            </h4>
            <p class="mb-4 text-sm text-gray-500">{{ supplier?.name }}</p>
            <div v-if="paymentFormError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ paymentFormError }}</div>
            <form @submit.prevent="submitPaymentForm" class="space-y-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('supplierDetail.paymentType') }}<span class="text-error-500">*</span></label>
                <select v-model.number="paymentForm.paymentTypeId" required :class="inputClass">
                  <option :value="0" disabled>{{ t('supplierDetail.selectPaymentType') }}</option>
                  <option v-for="pt in paymentTypes" :key="pt.id" :value="pt.id">{{ pt.name }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('supplierDetail.paymentAmount') }}<span class="text-error-500">*</span></label>
                <input v-model.number="paymentForm.paymentAmount" type="number" step="1" required :class="inputClass" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('supplierDetail.paymentDate') }}<span class="text-error-500">*</span></label>
                <input v-model="paymentForm.paymentDateLocal" type="datetime-local" required :class="inputClass" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('supplierDetail.comment') }}</label>
                <textarea v-model="paymentForm.comment" rows="2" :class="inputClass" />
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" @click="closePaymentForm" :class="btnOutline">{{ t('common.cancel') }}</button>
                <button type="submit" :disabled="paymentSaving" :class="btnPrimary">{{ paymentSaving ? t('common.saving') : t('common.save') }}</button>
              </div>
            </form>
          </div>
        </template>
      </Modal>

      <Modal v-if="showDeletePaymentModal" full-screen-backdrop @close="showDeletePaymentModal = false">
        <template #body>
          <div class="relative z-10 mx-4 w-full max-w-md rounded-3xl bg-white p-6 dark:bg-gray-900">
            <h4 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('supplierDetail.deletePayment') }}</h4>
            <p class="mb-6 text-sm text-gray-500">{{ t('supplierDetail.deletePaymentConfirm') }}</p>
            <div class="flex justify-end gap-3">
              <button type="button" @click="showDeletePaymentModal = false" :class="btnOutline">{{ t('common.cancel') }}</button>
              <button type="button" :disabled="paymentSaving" @click="doDeletePayment" class="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70">
                {{ t('common.delete') }}
              </button>
            </div>
          </div>
        </template>
      </Modal>

      <Modal v-if="showOrderModal" full-screen-backdrop @close="closeOrderForm">
        <template #body>
          <div class="relative z-10 mx-4 w-full max-w-lg rounded-3xl bg-white p-6 dark:bg-gray-900">
            <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('supplierDetail.newOrder') }}</h4>
            <div v-if="orderFormError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ orderFormError }}</div>
            <form @submit.prevent="submitOrderForm" class="space-y-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('supplierDetail.warehouse') }}<span class="text-error-500">*</span></label>
                <select v-model.number="orderForm.warehouseId" required :class="inputClass">
                  <option :value="0" disabled>{{ t('supplierDetail.selectWarehouse') }}</option>
                  <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('supplierDetail.arrivalDate') }}<span class="text-error-500">*</span></label>
                <input v-model="orderForm.arrivalDateLocal" type="datetime-local" required :class="inputClass" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('supplierDetail.comment') }}</label>
                <textarea v-model="orderForm.comment" rows="2" :class="inputClass" />
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" @click="closeOrderForm" :class="btnOutline">{{ t('common.cancel') }}</button>
                <button type="submit" :disabled="orderSaving" :class="btnPrimary">{{ orderSaving ? t('common.saving') : t('common.save') }}</button>
              </div>
            </form>
          </div>
        </template>
      </Modal>

      <Modal v-if="showSupplierEditModal" full-screen-backdrop @close="closeSupplierEdit">
        <template #body>
          <div class="relative z-10 mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
            <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('supplierDetail.editSupplier') }}</h4>
            <div v-if="supplierFormError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ supplierFormError }}</div>
            <form @submit.prevent="submitSupplierEdit" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('supplierDetail.name') }}<span class="text-error-500">*</span></label>
                <input v-model="supplierForm.name" type="text" required :class="inputClass" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('supplierDetail.phone') }}<span class="text-error-500">*</span></label>
                <input v-model="supplierForm.phone" type="text" required :class="inputClass" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">INN</label>
                <input v-model="supplierForm.inn" type="text" :class="inputClass" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('supplierDetail.additionalPhone') }}</label>
                <input v-model="supplierForm.additionalPhone" type="text" :class="inputClass" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('supplierDetail.bankName') }}</label>
                <input v-model="supplierForm.bankName" type="text" :class="inputClass" />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('supplierDetail.address') }}</label>
                <input v-model="supplierForm.address" type="text" :class="inputClass" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">MFO</label>
                <input v-model="supplierForm.mfo" type="text" :class="inputClass" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('supplierDetail.accountNumber') }}</label>
                <input v-model="supplierForm.accountNumber" type="text" :class="inputClass" />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('supplierDetail.comment') }}</label>
                <textarea v-model="supplierForm.description" rows="3" :class="inputClass" />
              </div>
              <div class="flex justify-end gap-3 pt-2 sm:col-span-2">
                <button type="button" @click="closeSupplierEdit" :class="btnOutline">{{ t('common.cancel') }}</button>
                <button type="submit" :disabled="supplierSaving" :class="btnPrimary">{{ supplierSaving ? t('common.saving') : t('common.save') }}</button>
              </div>
            </form>
          </div>
        </template>
      </Modal>
    </Teleport>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Pencil } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import Modal from '@/components/ui/Modal.vue'
import SupplierDetailHeader from '@/components/suppliers/SupplierDetailHeader.vue'
import SupplierDashboardTab from '@/components/suppliers/SupplierDashboardTab.vue'
import SupplierOrdersTab from '@/components/suppliers/SupplierOrdersTab.vue'
import SupplierPositionsTab from '@/components/suppliers/SupplierPositionsTab.vue'
import SupplierActTab from '@/components/suppliers/SupplierActTab.vue'
import SupplierPaymentsTab from '@/components/suppliers/SupplierPaymentsTab.vue'
import SupplierTimelineTab from '@/components/suppliers/SupplierTimelineTab.vue'
import SupplierAuditTab from '@/components/suppliers/SupplierAuditTab.vue'
import {
  fetchSupplierById,
  updateSupplier,
  changeSupplierStatus,
  type SupplierResponse,
  type SupplierDTO,
} from '@/services/suppliers'
import {
  fetchAllWarehouseOrdersBySupplier,
  createWarehouseOrder,
  type WarehouseOrderResponse,
} from '@/services/warehouseOrders'
import { fetchWarehouseOrderItemsForSupplier, type WarehouseOrderItemResponse } from '@/services/warehouseOrderItems'
import {
  fetchPaymentsBySupplier,
  createSupplierPayment,
  updateSupplierPayment,
  deleteSupplierPayment,
  type SupplierPaymentResponse,
} from '@/services/supplierPayments'
import { fetchAllPaymentTypes, type PaymentTypeResponse } from '@/services/paymentTypes'
import {
  fetchSupplierBalanceBySupplierId,
  type SupplierBalanceResponse,
} from '@/services/supplierBalances'
import { fetchAllWarehouses, type WarehouseResponse } from '@/services/warehouses'
import { fetchAllAuditLogs } from '@/services/audit'
import type { AuditLog } from '@/services/audit'
import type { Status } from '@/services/roles'
import {
  summarizeSupplierFinance,
  buildWarehouseStatsFromOrders,
  buildSupplierActRows,
  buildSupplierTimeline,
  filterSupplierAuditLogs,
} from '@/utils/supplierDetailAnalytics'
import { buildSupplierActCsv, downloadCsv } from '@/utils/supplierDetailExport'

type SupplierTab = 'dashboard' | 'orders' | 'positions' | 'act' | 'payments' | 'timeline' | 'audit' | 'info'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const supplierId = Number(route.params.id)

const supplier = ref<SupplierResponse | null>(null)
const orders = ref<WarehouseOrderResponse[]>([])
const orderItems = ref<WarehouseOrderItemResponse[]>([])
const payments = ref<SupplierPaymentResponse[]>([])
const auditLogs = ref<AuditLog[]>([])
const warehouses = ref<WarehouseResponse[]>([])
const paymentTypes = ref<PaymentTypeResponse[]>([])
const supplierBalance = ref<SupplierBalanceResponse | null>(null)

const loading = ref(true)
const paymentsLoading = ref(false)
const errorMessage = ref('')
const activeTab = ref<SupplierTab>('dashboard')

const actAppliedStart = ref('')
const actAppliedEnd = ref('')

const showPaymentModal = ref(false)
const editingPayment = ref<SupplierPaymentResponse | null>(null)
const paymentForm = ref({
  paymentTypeId: 0,
  paymentAmount: 0,
  paymentDateLocal: '',
  comment: '',
})
const paymentFormError = ref('')
const paymentSaving = ref(false)
const showDeletePaymentModal = ref(false)
const paymentToDelete = ref<SupplierPaymentResponse | null>(null)

const showOrderModal = ref(false)
const orderForm = ref({ warehouseId: 0, arrivalDateLocal: '', comment: '' })
const orderFormError = ref('')
const orderSaving = ref(false)

const showSupplierEditModal = ref(false)
const supplierForm = ref<SupplierDTO>({
  name: '',
  phone: '',
  inn: '',
  additionalPhone: '',
  address: '',
  bankName: '',
  mfo: '',
  accountNumber: '',
  description: '',
})
const supplierFormError = ref('')
const supplierSaving = ref(false)

const inputClass =
  'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'
const btnOutline =
  'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'

const pageTitle = computed(() => supplier.value?.name ?? t('routes.supplierDetail'))

const finance = computed(() => {
  const local = summarizeSupplierFinance(orders.value, payments.value)
  if (supplierBalance.value) {
    return {
      totalPurchases: supplierBalance.value.totalPurchase,
      totalPaid: supplierBalance.value.totalPaid,
      totalDebt: supplierBalance.value.totalDebt,
      ordersCount: local.ordersCount,
    }
  }
  return local
})
const warehouseStats = computed(() => buildWarehouseStatsFromOrders(orders.value))

const supplierTabs = computed(() => [
  { id: 'dashboard' as const, label: t('supplierDetail.tabDashboard'), count: null },
  { id: 'orders' as const, label: t('supplierDetail.tabOrders'), count: orders.value.length || null },
  { id: 'positions' as const, label: t('supplierDetail.tabPositions'), count: orderItems.value.length || null },
  { id: 'act' as const, label: t('supplierDetail.tabAct'), count: null },
  { id: 'payments' as const, label: t('supplierDetail.tabPayments'), count: payments.value.length || null },
  { id: 'timeline' as const, label: t('supplierDetail.tabTimeline'), count: null },
  { id: 'audit' as const, label: t('supplierDetail.tabAudit'), count: supplierAuditLogs.value.length || null },
  { id: 'info' as const, label: t('supplierDetail.tabInfo'), count: null },
])

const sortedOrders = computed(() =>
  [...orders.value].sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime()),
)

const lastActivityLabel = computed(() => {
  const date = sortedOrders.value[0]?.arrivalDate || supplier.value?.updatedAt
  if (!date) return '—'
  const d = new Date(date)
  return isNaN(d.getTime()) ? date : d.toLocaleDateString('uz-UZ')
})

const filteredActOrders = computed(() => {
  let result = [...sortedOrders.value]
  if (actAppliedStart.value) {
    const start = new Date(actAppliedStart.value)
    start.setHours(0, 0, 0, 0)
    result = result.filter((o) => new Date(o.arrivalDate) >= start)
  }
  if (actAppliedEnd.value) {
    const end = new Date(actAppliedEnd.value)
    end.setHours(23, 59, 59, 999)
    result = result.filter((o) => new Date(o.arrivalDate) <= end)
  }
  return result
})

const filteredActPayments = computed(() => {
  let result = [...payments.value]
  if (actAppliedStart.value) {
    const start = new Date(actAppliedStart.value)
    start.setHours(0, 0, 0, 0)
    result = result.filter((p) => new Date(p.paymentDate) >= start)
  }
  if (actAppliedEnd.value) {
    const end = new Date(actAppliedEnd.value)
    end.setHours(23, 59, 59, 999)
    result = result.filter((p) => new Date(p.paymentDate) <= end)
  }
  return result
})

const actRows = computed(() => buildSupplierActRows(filteredActOrders.value, filteredActPayments.value))

const actTotals = computed(() => {
  const totalPurchases = filteredActOrders.value.reduce((sum, o) => sum + o.totalSum, 0)
  const totalPaid = filteredActPayments.value.reduce((sum, p) => sum + p.paymentAmount, 0)
  return { totalPurchases, totalPaid, balance: totalPaid - totalPurchases }
})

const timelineEntries = computed(() => {
  if (!supplier.value) return []
  return buildSupplierTimeline(
    sortedOrders.value,
    payments.value,
    auditLogs.value,
    supplierId,
    supplier.value.name,
  )
})

const supplierAuditLogs = computed(() => {
  if (!supplier.value) return []
  return filterSupplierAuditLogs(auditLogs.value, supplierId, supplier.value.name)
})

const display = (v?: string | null) => v || '—'
const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(v)) + ' so‘m'
const formatDateTime = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString('uz-UZ')
}

const basicFields = computed(() => {
  if (!supplier.value) return []
  const s = supplier.value
  return [
    { label: t('supplierDetail.name'), value: display(s.name) },
    { label: 'INN', value: display(s.inn) },
    { label: t('supplierDetail.phone'), value: display(s.phone) },
    { label: t('supplierDetail.additionalPhone'), value: display(s.additionalPhone) },
    { label: t('supplierDetail.address'), value: display(s.address) },
    { label: t('common.status'), value: t(`common.statusValues.${s.status}`) },
  ]
})

const bankFields = computed(() => {
  if (!supplier.value) return []
  const s = supplier.value
  return [
    { label: t('supplierDetail.bankName'), value: display(s.bankName) },
    { label: 'MFO', value: display(s.mfo) },
    { label: t('supplierDetail.accountNumber'), value: display(s.accountNumber) },
  ]
})

const otherFields = computed(() => {
  if (!supplier.value) return []
  const s = supplier.value
  return [
    { label: t('supplierDetail.comment'), value: display(s.description), class: 'sm:col-span-2' },
    { label: t('supplierDetail.createdAt'), value: formatDateTime(s.createdAt) },
    { label: t('supplierDetail.updatedAt'), value: formatDateTime(s.updatedAt) },
  ]
})

const applyActFilter = (start: string, end: string) => {
  actAppliedStart.value = start
  actAppliedEnd.value = end
}

const resetActFilter = () => {
  actAppliedStart.value = ''
  actAppliedEnd.value = ''
}

const printAct = () => window.print()

const exportActCsv = () => {
  if (!supplier.value) return
  const csv = buildSupplierActCsv(
    supplier.value.name,
    actAppliedStart.value,
    actAppliedEnd.value,
    actRows.value,
    actTotals.value,
  )
  const safeName = supplier.value.name.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')
  downloadCsv(`supplier_akt_${safeName || supplierId}.csv`, csv)
}

const loadPaymentTypes = async () => {
  try {
    paymentTypes.value = (await fetchAllPaymentTypes()).filter((c) => c.status === 'ACTIVE')
  } catch {
    paymentTypes.value = []
  }
}

const loadSupplierBalance = async () => {
  try {
    supplierBalance.value = await fetchSupplierBalanceBySupplierId(supplierId)
  } catch {
    supplierBalance.value = null
  }
}

const loadPayments = async () => {
  paymentsLoading.value = true
  try {
    payments.value = await fetchPaymentsBySupplier(supplierId)
  } catch {
    payments.value = []
  } finally {
    paymentsLoading.value = false
  }
}

const reloadOrders = async () => {
  orders.value = await fetchAllWarehouseOrdersBySupplier(supplierId)
  orderItems.value = await fetchWarehouseOrderItemsForSupplier(supplierId)
}

const fromLocalInput = (val: string) => (val ? new Date(val).toISOString() : '')

const openPaymentForm = (payment?: SupplierPaymentResponse) => {
  editingPayment.value = payment ?? null
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  if (payment) {
    const d = new Date(payment.paymentDate || payment.paidDate)
    paymentForm.value = {
      paymentTypeId: payment.paymentTypeId || payment.categoryId || 0,
      paymentAmount: payment.paymentAmount ?? payment.paidSumm ?? 0,
      paymentDateLocal: isNaN(d.getTime())
        ? ''
        : `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`,
      comment: payment.comment || '',
    }
  } else {
    paymentForm.value = {
      paymentTypeId: 0,
      paymentAmount: 0,
      paymentDateLocal: `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:${p(now.getMinutes())}`,
      comment: '',
    }
  }
  paymentFormError.value = ''
  showPaymentModal.value = true
  if (!paymentTypes.value.length) loadPaymentTypes()
}

const closePaymentForm = () => {
  showPaymentModal.value = false
  editingPayment.value = null
}

const submitPaymentForm = async () => {
  paymentFormError.value = ''
  if (!paymentForm.value.paymentTypeId || !paymentForm.value.paymentDateLocal) {
    paymentFormError.value = t('supplierDetail.paymentValidation')
    return
  }
  if (paymentForm.value.paymentAmount <= 0) {
    paymentFormError.value = t('supplierDetail.amountValidation')
    return
  }
  paymentSaving.value = true
  try {
    const payload = {
      supplierId,
      paymentTypeId: paymentForm.value.paymentTypeId,
      paymentAmount: paymentForm.value.paymentAmount,
      paymentDate: fromLocalInput(paymentForm.value.paymentDateLocal),
      comment: paymentForm.value.comment.trim() || undefined,
    }
    if (editingPayment.value) {
      await updateSupplierPayment(editingPayment.value.id, payload)
    } else {
      await createSupplierPayment(payload)
    }
    closePaymentForm()
    await Promise.all([loadPayments(), loadSupplierBalance()])
  } catch (e) {
    paymentFormError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    paymentSaving.value = false
  }
}

const confirmDeletePayment = (payment: SupplierPaymentResponse) => {
  paymentToDelete.value = payment
  showDeletePaymentModal.value = true
}

const doDeletePayment = async () => {
  if (!paymentToDelete.value) return
  paymentSaving.value = true
  try {
    await deleteSupplierPayment(paymentToDelete.value.id)
    showDeletePaymentModal.value = false
    paymentToDelete.value = null
    await Promise.all([loadPayments(), loadSupplierBalance()])
  } catch (e) {
    paymentFormError.value = e instanceof Error ? e.message : t('common.error')
    showDeletePaymentModal.value = false
  } finally {
    paymentSaving.value = false
  }
}

const loadWarehouses = async () => {
  if (warehouses.value.length) return
  warehouses.value = (await fetchAllWarehouses()).filter((w) => w.status === 'ACTIVE')
}

const openOrderForm = async () => {
  await loadWarehouses()
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  orderForm.value = {
    warehouseId: warehouses.value[0]?.id ?? 0,
    arrivalDateLocal: `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:${p(now.getMinutes())}`,
    comment: '',
  }
  orderFormError.value = ''
  showOrderModal.value = true
}

const closeOrderForm = () => {
  showOrderModal.value = false
}

const submitOrderForm = async () => {
  orderFormError.value = ''
  if (!orderForm.value.warehouseId || !orderForm.value.arrivalDateLocal) {
    orderFormError.value = t('supplierDetail.orderValidation')
    return
  }
  orderSaving.value = true
  try {
    const created = await createWarehouseOrder({
      supplierId,
      warehouseId: orderForm.value.warehouseId,
      arrivalDate: fromLocalInput(orderForm.value.arrivalDateLocal),
      comment: orderForm.value.comment.trim() || undefined,
    })
    showOrderModal.value = false
    await reloadOrders()
    router.push(`/warehouse-orders/${created.id}/items`)
  } catch (e) {
    orderFormError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    orderSaving.value = false
  }
}

const cleanPayload = (data: SupplierDTO): SupplierDTO => {
  const payload: SupplierDTO = { name: data.name.trim(), phone: data.phone.trim() }
  const optional = ['inn', 'additionalPhone', 'address', 'bankName', 'mfo', 'accountNumber', 'description'] as const
  optional.forEach((key) => {
    const value = data[key]?.trim()
    if (value) payload[key] = value
  })
  return payload
}

const openSupplierEdit = () => {
  if (!supplier.value) return
  const s = supplier.value
  supplierForm.value = {
    name: s.name,
    phone: s.phone,
    inn: s.inn || '',
    additionalPhone: s.additionalPhone || '',
    address: s.address || '',
    bankName: s.bankName || '',
    mfo: s.mfo || '',
    accountNumber: s.accountNumber || '',
    description: s.description || '',
  }
  supplierFormError.value = ''
  showSupplierEditModal.value = true
}

const closeSupplierEdit = () => {
  showSupplierEditModal.value = false
}

const submitSupplierEdit = async () => {
  supplierFormError.value = ''
  supplierSaving.value = true
  try {
    await updateSupplier(supplierId, cleanPayload(supplierForm.value))
    supplier.value = await fetchSupplierById(supplierId)
    showSupplierEditModal.value = false
  } catch (e) {
    supplierFormError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    supplierSaving.value = false
  }
}

const toggleSupplierStatus = async () => {
  if (!supplier.value) return
  const next: Status = supplier.value.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
  try {
    await changeSupplierStatus(supplierId, next)
    supplier.value = await fetchSupplierById(supplierId)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  }
}

const loadData = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [supplierData, ordersData, itemsData, auditData] = await Promise.all([
      fetchSupplierById(supplierId),
      fetchAllWarehouseOrdersBySupplier(supplierId),
      fetchWarehouseOrderItemsForSupplier(supplierId),
      fetchAllAuditLogs().catch(() => []),
    ])
    supplier.value = supplierData
    orders.value = ordersData
    orderItems.value = itemsData
    auditLogs.value = auditData
    await Promise.all([loadPayments(), loadPaymentTypes(), loadSupplierBalance()])
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
