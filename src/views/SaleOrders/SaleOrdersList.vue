<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">Sotuv buyurtmalari</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Mijoz va ombor bo‘yicha sotuv buyurtmalari</p>
          </div>
          <div class="flex items-center gap-3">
            <TableColumnToggle :columns="TABLE_COLUMNS" :visible="visible" @toggle="toggleColumn" />
            <ActionIconButton action="refresh" @click="loadAll" />
            <ActionIconButton action="create" :title="t('actions.newOrder')" @click="openCreate" />
          </div>
        </div>
        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
        </div>
        <div class="flex flex-wrap items-end gap-4 px-6 pb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Mijoz</label>
            <select v-model.number="filterClientId" :class="inputClass">
              <option :value="0">Barchasi</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.fullName }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Ombor</label>
            <select v-model.number="filterWarehouseId" :class="inputClass">
              <option :value="0">Barchasi</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Sotuvchi</label>
            <select v-model.number="filterUserId" :class="inputClass">
              <option :value="0">Barchasi</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.fullName }}</option>
            </select>
          </div>
          <DateRangePicker
            v-model:start-date="filterStart"
            v-model:end-date="filterEnd"
            :label="t('saleOrderItemsFilter.period')"
            @apply="applyFilter"
          />
          <ActionIconButton action="filter" @click="applyFilter" />
          <ActionIconButton action="reset" @click="resetFilter" />
        </div>
        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh v-if="isVisible('id')" label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
                  <SortableTh v-if="isVisible('clientFullName')" label="Mijoz" sortable :active="sortKey === 'clientFullName'" :direction="sortKey === 'clientFullName' ? sortDir : null" @sort="toggleSort('clientFullName')" />
                  <SortableTh v-if="isVisible('warehouseName')" label="Ombor" sortable :active="sortKey === 'warehouseName'" :direction="sortKey === 'warehouseName' ? sortDir : null" @sort="toggleSort('warehouseName')" />
                  <SortableTh v-if="isVisible('userFullName')" label="Sotuvchi" sortable :active="sortKey === 'userFullName'" :direction="sortKey === 'userFullName' ? sortDir : null" @sort="toggleSort('userFullName')" />
                  <SortableTh v-if="isVisible('orderDate')" label="Sana" sortable :active="sortKey === 'orderDate'" :direction="sortKey === 'orderDate' ? sortDir : null" @sort="toggleSort('orderDate')" />
                  <SortableTh v-if="isVisible('totalSum')" label="Jami" sortable :active="sortKey === 'totalSum'" :direction="sortKey === 'totalSum' ? sortDir : null" @sort="toggleSort('totalSum')" />
                  <SortableTh v-if="isVisible('paidSum')" label="To‘langan" sortable :active="sortKey === 'paidSum'" :direction="sortKey === 'paidSum' ? sortDir : null" @sort="toggleSort('paidSum')" />
                  <SortableTh v-if="isVisible('debtSum')" label="Qarz" sortable :active="sortKey === 'debtSum'" :direction="sortKey === 'debtSum' ? sortDir : null" @sort="toggleSort('debtSum')" />
                  <SortableTh v-if="isVisible('orderStatus')" label="Buyurtma holati" sortable :active="sortKey === 'orderStatus'" :direction="sortKey === 'orderStatus' ? sortDir : null" @sort="toggleSort('orderStatus')" />
                  <SortableTh :label="t('common.actions')" align="right" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading"><td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
                <tr v-else-if="displayOrders.length === 0"><td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">Buyurtmalar topilmadi</td></tr>
                <tr
                  v-for="order in displayOrders"
                  :key="order.id"
                  class="cursor-pointer border-t border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                  @click="goToOrder(order.id)"
                >
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ order.id }}</span></td>
                  <td v-if="isVisible('clientFullName')" class="px-5 py-4 sm:px-6"><span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ order.clientFullName || '—' }}</span></td>
                  <td v-if="isVisible('warehouseName')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ order.warehouseName }}</span></td>
                  <td v-if="isVisible('userFullName')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ order.userFullName || '—' }}</span></td>
                  <td v-if="isVisible('orderDate')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatDate(order.orderDate) }}</span></td>
                  <td v-if="isVisible('totalSum')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatMoney(order.totalSum) }}</span></td>
                  <td v-if="isVisible('paidSum')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatMoney(order.paidSum) }}</span></td>
                  <td v-if="isVisible('debtSum')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatMoney(order.debtSum) }}</span></td>
                  <td v-if="isVisible('orderStatus')" class="px-5 py-4 sm:px-6"><span :class="saleOrderStatusClass(order.orderStatus)">{{ saleOrderStatusLabel(order.orderStatus) }}</span></td>
                  <td class="px-5 py-4 sm:px-6" @click.stop>
                    <div class="flex items-center justify-end gap-2">
                      <button type="button" :class="btnSmOutline" @click="openDiscount(order)">{{ t('saleOrders.discount') }}</button>
                      <button type="button" :class="btnSmOutline" @click="openHistory(order)">{{ t('saleOrders.history') }}</button>
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
        <div class="relative w-full max-w-xl p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ editing ? 'Buyurtmani tahrirlash' : 'Yangi sotuv buyurtmasi' }}</h4>
          <div v-if="formError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ formError }}</div>
          <form @submit.prevent="submitForm" class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Mijoz</label>
              <select v-model.number="form.clientId" :class="inputClass">
                <option :value="0">Tanlanmagan</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.fullName }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Ombor<span class="text-error-500">*</span></label>
              <select v-model.number="form.warehouseId" required :class="inputClass">
                <option :value="0" disabled>Tanlang</option>
                <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Sotuvchi</label>
              <select v-model.number="form.userId" :class="inputClass">
                <option :value="0">Tanlanmagan</option>
                <option v-for="u in users" :key="u.id" :value="u.id">{{ u.fullName }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Buyurtma sanasi<span class="text-error-500">*</span></label>
              <input v-model="form.orderDateLocal" type="datetime-local" required :class="inputClass" />
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrders.plannedReadyDate') }}</label>
                <input v-model="form.plannedReadyDate" type="date" :class="inputClass" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrders.plannedDeliveryDate') }}</label>
                <input v-model="form.plannedDeliveryDate" type="date" :class="inputClass" />
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Jami summa<span class="text-error-500">*</span></label>
              <input v-model.number="form.totalSum" type="number" min="0" step="1" required :class="inputClass" />
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrders.discountType') }}</label>
                <select v-model="form.discountType" :class="inputClass">
                  <option value="">—</option>
                  <option value="PERCENTAGE">{{ t('saleOrders.discountTypePercentage') }}</option>
                  <option value="FIXED_AMOUNT">{{ t('saleOrders.discountTypeFixed') }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrders.discountValue') }}</label>
                <input v-model.number="form.discountValue" type="number" min="0" step="0.01" :class="inputClass" />
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Izoh</label>
              <textarea v-model="form.comment" rows="2" :class="inputClass" />
            </div>
            <div class="flex justify-end gap-3">
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
          <p class="mb-6 text-sm text-gray-500">#{{ itemToDelete?.id }} buyurtmani o‘chirmoqchimisiz?</p>
          <div class="flex justify-end gap-3">
            <button @click="showDeleteModal = false" :class="btnOutline">Bekor qilish</button>
            <button @click="doDelete" :disabled="deleting" class="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70">{{ deleting ? 'O‘chirilmoqda...' : 'O‘chirish' }}</button>
          </div>
        </div>
      </template>
    </Modal>

    <Modal v-if="showDiscountModal" @close="closeDiscount">
      <template #body>
        <div class="relative w-full max-w-md p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            {{ t('saleOrders.discountTitle') }} #{{ discountOrder?.id }}
          </h4>
          <div v-if="discountError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ discountError }}</div>
          <form @submit.prevent="submitDiscount" class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrders.discountType') }}</label>
              <select v-model="discountForm.discountType" :class="inputClass">
                <option value="PERCENTAGE">{{ t('saleOrders.discountTypePercentage') }}</option>
                <option value="FIXED_AMOUNT">{{ t('saleOrders.discountTypeFixed') }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrders.discountValue') }}</label>
              <input v-model.number="discountForm.discountValue" type="number" min="0" step="0.01" required :class="inputClass" />
            </div>
            <div class="flex justify-end gap-3">
              <button type="button" @click="closeDiscount" :class="btnOutline">Bekor qilish</button>
              <button type="submit" :disabled="discountSaving" :class="btnPrimary">
                {{ discountSaving ? '...' : t('saleOrders.applyDiscount') }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>

    <Modal v-if="showHistoryModal" @close="showHistoryModal = false">
      <template #body>
        <div class="relative w-full max-w-2xl p-6 bg-white rounded-3xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            {{ t('saleOrders.historyTitle') }} #{{ historyOrder?.id }}
          </h4>
          <div class="mb-4 inline-flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-900">
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
              :class="historyTab === 'status' ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white' : 'text-gray-500'"
              @click="historyTab = 'status'"
            >
              {{ t('saleOrders.statusHistory') }}
            </button>
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-sm font-medium transition"
              :class="historyTab === 'discount' ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white' : 'text-gray-500'"
              @click="historyTab = 'discount'"
            >
              {{ t('saleOrders.discountHistory') }}
            </button>
          </div>

          <div v-if="historyLoading" class="py-8 text-center text-sm text-gray-500">Yuklanmoqda...</div>
          <div v-else-if="historyError" class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ historyError }}</div>
          <template v-else>
            <div v-show="historyTab === 'status'" class="max-w-full overflow-x-auto">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">{{ t('saleOrders.fromStatus') }}</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">{{ t('saleOrders.toStatus') }}</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">{{ t('saleOrders.changedBy') }}</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">{{ t('saleOrders.changedAt') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr v-if="statusHistory.length === 0">
                    <td colspan="4" class="px-3 py-6 text-center text-sm text-gray-500">{{ t('saleOrders.noHistory') }}</td>
                  </tr>
                  <tr v-for="row in statusHistory" :key="row.id">
                    <td class="px-3 py-3 text-sm text-gray-500">{{ row.fromStatus ? saleOrderStatusLabel(row.fromStatus) : '—' }}</td>
                    <td class="px-3 py-3 text-sm"><span :class="saleOrderStatusClass(row.toStatus)">{{ saleOrderStatusLabel(row.toStatus) }}</span></td>
                    <td class="px-3 py-3 text-sm text-gray-800 dark:text-white/90">{{ row.changedByUserFullName || '—' }}</td>
                    <td class="px-3 py-3 text-sm text-gray-500">{{ formatDate(row.changedAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-show="historyTab === 'discount'" class="max-w-full overflow-x-auto">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">{{ t('saleOrders.discountType') }}</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">{{ t('saleOrders.discountValue') }}</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">Summa</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">{{ t('saleOrders.changedAt') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr v-if="discountHistory.length === 0">
                    <td colspan="4" class="px-3 py-6 text-center text-sm text-gray-500">{{ t('saleOrders.noHistory') }}</td>
                  </tr>
                  <tr v-for="row in discountHistory" :key="row.id">
                    <td class="px-3 py-3 text-sm text-gray-500">
                      {{ row.discountType === 'PERCENTAGE' ? t('saleOrders.discountTypePercentage') : t('saleOrders.discountTypeFixed') }}
                    </td>
                    <td class="px-3 py-3 text-right text-sm text-gray-800 dark:text-white/90">{{ row.discountValue }}</td>
                    <td class="px-3 py-3 text-right text-sm text-gray-500">{{ formatMoney(row.discountAmount) }}</td>
                    <td class="px-3 py-3 text-sm text-gray-500">{{ formatDate(row.createdAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <div class="mt-4 flex justify-end">
            <button type="button" @click="showHistoryModal = false" :class="btnOutline">Yopish</button>
          </div>
        </div>
      </template>
    </Modal>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import Modal from '@/components/ui/Modal.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import { useTableSort, useColumnVisibility, type TableColumnDef } from '@/composables/useTableControls'
import { getTodayRange, toEndDateTime, toStartDateTime } from '@/utils/dateRange'
import {
  fetchAllSaleOrders,
  fetchSaleOrdersByClient,
  fetchSaleOrdersByWarehouse,
  fetchSaleOrdersByUser,
  fetchSaleOrdersByDateRange,
  createSaleOrder,
  updateSaleOrder,
  changeSaleOrderStatus,
  deleteSaleOrder,
  applySaleOrderDiscount,
  fetchSaleOrderDiscountHistory,
  fetchSaleOrderStatusHistory,
  type SaleOrderResponse,
  type SaleOrderStatus,
  type DiscountType,
  type SaleOrderDiscountHistoryResponse,
  type SaleOrderHistoryResponse,
} from '@/services/saleOrders'
import { fetchAllClients } from '@/services/clients'
import { fetchAllWarehouses } from '@/services/warehouses'
import { fetchAllUsers } from '@/services/users'
import type { ClientResponse } from '@/services/clients'
import type { WarehouseResponse } from '@/services/warehouses'
import type { UserResponse } from '@/services/users'
import { saleOrderStatusLabel, saleOrderStatusClass } from '@/utils/saleOrderStatus'

const { t } = useI18n()
const router = useRouter()

const ORDER_STATUSES: SaleOrderStatus[] = ['NEW', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'COMPLETED', 'CANCELLED']

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'clientFullName', label: 'Mijoz', sortable: true },
  { key: 'warehouseName', label: 'Ombor', sortable: true },
  { key: 'userFullName', label: 'Sotuvchi', sortable: true },
  { key: 'orderDate', label: 'Sana', sortable: true },
  { key: 'totalSum', label: 'Jami', sortable: true },
  { key: 'paidSum', label: 'To‘langan', sortable: true },
  { key: 'debtSum', label: 'Qarz', sortable: true },
  { key: 'orderStatus', label: 'Buyurtma holati', sortable: true },
]
const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnSmOutline = 'inline-flex items-center rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'

const currentPageTitle = ref('Sotuv buyurtmalari')
const orders = ref<SaleOrderResponse[]>([])
const clients = ref<ClientResponse[]>([])
const warehouses = ref<WarehouseResponse[]>([])
const users = ref<UserResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const filterClientId = ref(0)
const filterWarehouseId = ref(0)
const filterUserId = ref(0)

const todayRange = getTodayRange()
const filterStart = ref(todayRange.startDate)
const filterEnd = ref(todayRange.endDate)

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'sale-orders-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<SaleOrderResponse>((row, key) => row[key as keyof SaleOrderResponse])
const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)
const displayOrders = computed(() => applySort(orders.value))

const showFormModal = ref(false)
const editing = ref<SaleOrderResponse | null>(null)
const form = ref({
  clientId: 0,
  warehouseId: 0,
  userId: 0,
  orderDateLocal: '',
  plannedReadyDate: '',
  plannedDeliveryDate: '',
  comment: '',
  totalSum: undefined as number | undefined,
  discountType: '' as '' | DiscountType,
  discountValue: 0,
})
const formError = ref('')
const saving = ref(false)
const showDeleteModal = ref(false)
const itemToDelete = ref<SaleOrderResponse | null>(null)
const deleting = ref(false)

const showDiscountModal = ref(false)
const discountOrder = ref<SaleOrderResponse | null>(null)
const discountForm = ref({ discountType: 'PERCENTAGE' as DiscountType, discountValue: 0 })
const discountError = ref('')
const discountSaving = ref(false)

const showHistoryModal = ref(false)
const historyOrder = ref<SaleOrderResponse | null>(null)
const historyTab = ref<'status' | 'discount'>('status')
const historyLoading = ref(false)
const historyError = ref('')
const statusHistory = ref<SaleOrderHistoryResponse[]>([])
const discountHistory = ref<SaleOrderDiscountHistoryResponse[]>([])

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
const goToOrder = (id: number) => router.push(`/sale-orders/${id}/items`)

const loadRefs = async () => {
  const [cl, wh, us] = await Promise.all([fetchAllClients(), fetchAllWarehouses(), fetchAllUsers()])
  clients.value = cl.filter((c) => c.status === 'ACTIVE')
  warehouses.value = wh.filter((w) => w.status === 'ACTIVE')
  users.value = us.filter((u) => u.status === 'ACTIVE')
}

const loadOrders = async () => {
  if (filterUserId.value > 0) return fetchSaleOrdersByUser(filterUserId.value)
  if (filterStart.value && filterEnd.value) {
    return fetchSaleOrdersByDateRange(toStartDateTime(filterStart.value), toEndDateTime(filterEnd.value))
  }
  if (filterClientId.value > 0) return fetchSaleOrdersByClient(filterClientId.value)
  if (filterWarehouseId.value > 0) return fetchSaleOrdersByWarehouse(filterWarehouseId.value)
  return fetchAllSaleOrders()
}

const loadAll = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    await loadRefs()
    orders.value = await loadOrders()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Yuklashda xatolik'
  } finally {
    loading.value = false
  }
}

const applyFilter = () => loadAll()
const resetFilter = () => {
  filterClientId.value = 0
  filterWarehouseId.value = 0
  filterUserId.value = 0
  const range = getTodayRange()
  filterStart.value = range.startDate
  filterEnd.value = range.endDate
  loadAll()
}

const toDateInput = (iso?: string | null) => {
  if (!iso) return ''
  return iso.slice(0, 10)
}

const toPlannedDateTime = (date: string) => (date ? `${date}T00:00:00` : undefined)

const openCreate = async () => {
  editing.value = null
  form.value = {
    clientId: 0,
    warehouseId: 0,
    userId: 0,
    orderDateLocal: '',
    plannedReadyDate: '',
    plannedDeliveryDate: '',
    comment: '',
    totalSum: 0,
    discountType: '',
    discountValue: 0,
  }
  formError.value = ''
  if (!clients.value.length) await loadRefs()
  showFormModal.value = true
}

const openEdit = async (order: SaleOrderResponse) => {
  editing.value = order
  form.value = {
    clientId: order.clientId || 0,
    warehouseId: order.warehouseId,
    userId: order.userId || 0,
    orderDateLocal: toLocalInput(order.orderDate),
    plannedReadyDate: toDateInput(order.plannedReadyDate),
    plannedDeliveryDate: toDateInput(order.plannedDeliveryDate),
    comment: order.comment || '',
    totalSum: order.totalSum,
    discountType: order.discountType || '',
    discountValue: order.discountValue ?? 0,
  }
  formError.value = ''
  if (!clients.value.length) await loadRefs()
  showFormModal.value = true
}

const closeForm = () => { showFormModal.value = false }

const submitForm = async () => {
  formError.value = ''
  if (!form.value.warehouseId || !form.value.orderDateLocal) {
    formError.value = 'Ombor va sana majburiy'
    return
  }
  saving.value = true
  try {
    const payload = {
      warehouseId: form.value.warehouseId,
      orderDate: fromLocalInput(form.value.orderDateLocal),
      plannedReadyDate: toPlannedDateTime(form.value.plannedReadyDate),
      plannedDeliveryDate: toPlannedDateTime(form.value.plannedDeliveryDate),
      comment: form.value.comment.trim() || undefined,
      clientId: form.value.clientId > 0 ? form.value.clientId : undefined,
      userId: form.value.userId > 0 ? form.value.userId : undefined,
      totalSum: Number(form.value.totalSum ?? 0),
      ...(form.value.discountType && form.value.discountValue > 0
        ? {
            discountType: form.value.discountType,
            discountValue: form.value.discountValue,
          }
        : {}),
    }
    if (editing.value) await updateSaleOrder(editing.value.id, payload)
    else await createSaleOrder(payload)
    showFormModal.value = false
    await loadAll()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    saving.value = false
  }
}

const onStatusChange = async (order: SaleOrderResponse, status: string) => {
  try {
    await changeSaleOrderStatus(order.id, status as SaleOrderStatus)
    await loadAll()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Holatni o‘zgartirishda xatolik'
  }
}

const confirmDelete = (order: SaleOrderResponse) => { itemToDelete.value = order; showDeleteModal.value = true }
const doDelete = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await deleteSaleOrder(itemToDelete.value.id)
    showDeleteModal.value = false
    await loadAll()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'O‘chirishda xatolik'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

const openDiscount = (order: SaleOrderResponse) => {
  discountOrder.value = order
  discountForm.value = { discountType: 'PERCENTAGE', discountValue: 0 }
  discountError.value = ''
  showDiscountModal.value = true
}

const closeDiscount = () => {
  showDiscountModal.value = false
  discountOrder.value = null
}

const submitDiscount = async () => {
  if (!discountOrder.value) return
  discountError.value = ''
  if (!(discountForm.value.discountValue > 0)) {
    discountError.value = 'Qiymat majburiy'
    return
  }
  discountSaving.value = true
  try {
    await applySaleOrderDiscount(discountOrder.value.id, {
      discountType: discountForm.value.discountType,
      discountValue: discountForm.value.discountValue,
    })
    showDiscountModal.value = false
    await loadAll()
  } catch (e) {
    discountError.value = e instanceof Error ? e.message : 'Chegirmani qo‘llashda xatolik'
  } finally {
    discountSaving.value = false
  }
}

const openHistory = async (order: SaleOrderResponse) => {
  historyOrder.value = order
  historyTab.value = 'status'
  historyError.value = ''
  statusHistory.value = []
  discountHistory.value = []
  showHistoryModal.value = true
  historyLoading.value = true
  try {
    const [statusRows, discountRows] = await Promise.all([
      fetchSaleOrderStatusHistory(order.id),
      fetchSaleOrderDiscountHistory(order.id),
    ])
    statusHistory.value = statusRows
    discountHistory.value = discountRows
  } catch (e) {
    historyError.value = e instanceof Error ? e.message : 'Tarixni yuklashda xatolik'
  } finally {
    historyLoading.value = false
  }
}

onMounted(loadAll)
</script>
