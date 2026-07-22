<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">Ombor buyurtmalari</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Yetkazib beruvchi va ombor bo‘yicha kirim buyurtmalari</p>
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
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Yetkazib beruvchi</label>
            <select v-model.number="filterSupplierId" :class="inputClass">
              <option :value="0">Barchasi</option>
              <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Ombor</label>
            <select v-model.number="filterWarehouseId" :class="inputClass">
              <option :value="0">Barchasi</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
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
                  <SortableTh v-if="isVisible('id')" label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
                  <SortableTh v-if="isVisible('supplierName')" label="Yetkazib beruvchi" sortable :active="sortKey === 'supplierName'" :direction="sortKey === 'supplierName' ? sortDir : null" @sort="toggleSort('supplierName')" />
                  <SortableTh v-if="isVisible('warehouseName')" label="Ombor" sortable :active="sortKey === 'warehouseName'" :direction="sortKey === 'warehouseName' ? sortDir : null" @sort="toggleSort('warehouseName')" />
                  <SortableTh v-if="isVisible('arrivalDate')" label="Kelish sanasi" sortable :active="sortKey === 'arrivalDate'" :direction="sortKey === 'arrivalDate' ? sortDir : null" @sort="toggleSort('arrivalDate')" />
                  <SortableTh v-if="isVisible('totalSum')" label="Jami summa" sortable :active="sortKey === 'totalSum'" :direction="sortKey === 'totalSum' ? sortDir : null" @sort="toggleSort('totalSum')" />
                  <SortableTh v-if="isVisible('status')" label="Holati" sortable :active="sortKey === 'status'" :direction="sortKey === 'status' ? sortDir : null" @sort="toggleSort('status')" />
                  <SortableTh :label="t('common.actions')" align="right" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading"><td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
                <tr v-else-if="displayOrders.length === 0"><td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">Buyurtmalar topilmadi</td></tr>
                <tr v-for="order in displayOrders" :key="order.id" class="border-t border-gray-100 dark:border-gray-800">
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ order.id }}</span></td>
                  <td v-if="isVisible('supplierName')" class="px-5 py-4 sm:px-6"><span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ order.supplierName }}</span></td>
                  <td v-if="isVisible('warehouseName')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ order.warehouseName }}</span></td>
                  <td v-if="isVisible('arrivalDate')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatDate(order.arrivalDate) }}</span></td>
                  <td v-if="isVisible('totalSum')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatMoney(order.totalSum) }}</span></td>
                  <td v-if="isVisible('status')" class="px-5 py-4 sm:px-6"><span :class="statusClass(order.status)">{{ order.status }}</span></td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        v-if="order.status === 'ACTIVE'"
                        type="button"
                        class="rounded-lg bg-success-500 px-3 py-1.5 text-theme-xs font-medium text-white hover:bg-success-600 disabled:opacity-70"
                        :disabled="transferringId === order.id"
                        @click="transferToStock(order)"
                      >
                        {{ transferringId === order.id ? t('common.saving') : t('warehouseOrders.transferToStock') }}
                      </button>
                      <router-link :to="`/warehouse-orders/${order.id}/items`" class="rounded-lg px-3 py-1.5 text-theme-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">Pozitsiyalar</router-link>
                      <ActionIconButton action="edit" size="sm" @click="openEdit(order)" />
                      <ActionIconButton action="delete" size="sm" @click="confirmDelete(order)" />
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
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ editing ? 'Buyurtmani tahrirlash' : 'Yangi buyurtma' }}</h4>
          <div v-if="formError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ formError }}</div>
          <form @submit.prevent="submitForm" class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Yetkazib beruvchi<span class="text-error-500">*</span></label>
              <select v-model.number="form.supplierId" required :class="inputClass">
                <option :value="0" disabled>Tanlang</option>
                <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
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
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Kelish sanasi<span class="text-error-500">*</span></label>
              <input v-model="form.arrivalDateLocal" type="datetime-local" required :class="inputClass" />
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
          <h4 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Buyurtmani o‘chirish</h4>
          <p class="mb-6 text-sm text-gray-500">#{{ itemToDelete?.id }} buyurtmani o‘chirmoqchimisiz?</p>
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
import { useTableSort, useColumnVisibility, type TableColumnDef } from '@/composables/useTableControls'
import {
  fetchAllWarehouseOrders,
  fetchWarehouseOrdersBySupplier,
  fetchWarehouseOrdersByWarehouse,
  createWarehouseOrder,
  updateWarehouseOrder,
  deleteWarehouseOrder,
  transferWarehouseOrderToStock,
  type WarehouseOrderResponse,
} from '@/services/warehouseOrders'
import { fetchSuppliersPage } from '@/services/suppliers'
import { fetchAllWarehouses } from '@/services/warehouses'
import type { Status } from '@/services/roles'
import type { SupplierResponse } from '@/services/suppliers'
import type { WarehouseResponse } from '@/services/warehouses'

const { t } = useI18n()

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'supplierName', label: 'Yetkazib beruvchi', sortable: true },
  { key: 'warehouseName', label: 'Ombor', sortable: true },
  { key: 'arrivalDate', label: 'Kelish sanasi', sortable: true },
  { key: 'totalSum', label: 'Jami summa', sortable: true },
  { key: 'status', label: 'Holati', sortable: true },
]
const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'

const currentPageTitle = ref('Ombor buyurtmalari')
const orders = ref<WarehouseOrderResponse[]>([])
const suppliers = ref<SupplierResponse[]>([])
const warehouses = ref<WarehouseResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const filterSupplierId = ref(0)
const filterWarehouseId = ref(0)

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'warehouse-orders-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<WarehouseOrderResponse>((row, key) => row[key as keyof WarehouseOrderResponse])
const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)
const displayOrders = computed(() => applySort(orders.value))

const showFormModal = ref(false)
const editing = ref<WarehouseOrderResponse | null>(null)
const form = ref({ supplierId: 0, warehouseId: 0, arrivalDateLocal: '', comment: '' })
const formError = ref('')
const saving = ref(false)
const showDeleteModal = ref(false)
const itemToDelete = ref<WarehouseOrderResponse | null>(null)
const deleting = ref(false)
const transferringId = ref<number | null>(null)

const transferToStock = async (order: WarehouseOrderResponse) => {
  if (!confirm(t('warehouseOrders.transferConfirm', { id: order.id }))) return
  transferringId.value = order.id
  errorMessage.value = ''
  try {
    await transferWarehouseOrderToStock(order.id)
    await loadAll()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    transferringId.value = null
  }
}

const toLocalInput = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
const fromLocalInput = (val: string) => (val ? new Date(val).toISOString() : '')
const statusClass = (status: Status) => ['rounded-full px-2 py-0.5 text-theme-xs font-medium', {
  'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500': status === 'ACTIVE',
  'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400': status === 'DISABLED',
  'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500': status === 'DELETED',
}]
const formatDate = (v?: string) => { if (!v) return '—'; const d = new Date(v); return isNaN(d.getTime()) ? v : d.toLocaleString() }
const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'

const loadRefs = async () => {
  const [supPage, wh] = await Promise.all([
    fetchSuppliersPage({ page: 0, size: 200 }),
    fetchAllWarehouses(),
  ])
  suppliers.value = supPage.content.filter((s) => s.status === 'ACTIVE')
  warehouses.value = wh.filter((w) => w.status === 'ACTIVE')
}

const loadOrders = async () => {
  if (filterSupplierId.value > 0) return fetchWarehouseOrdersBySupplier(filterSupplierId.value)
  if (filterWarehouseId.value > 0) return fetchWarehouseOrdersByWarehouse(filterWarehouseId.value)
  return fetchAllWarehouseOrders()
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
const resetFilter = () => { filterSupplierId.value = 0; filterWarehouseId.value = 0; loadAll() }

const openCreate = async () => {
  editing.value = null
  form.value = { supplierId: 0, warehouseId: 0, arrivalDateLocal: '', comment: '' }
  formError.value = ''
  if (!suppliers.value.length) await loadRefs()
  showFormModal.value = true
}

const openEdit = async (order: WarehouseOrderResponse) => {
  editing.value = order
  form.value = {
    supplierId: order.supplierId,
    warehouseId: order.warehouseId,
    arrivalDateLocal: toLocalInput(order.arrivalDate),
    comment: order.comment || '',
  }
  formError.value = ''
  if (!suppliers.value.length) await loadRefs()
  showFormModal.value = true
}

const closeForm = () => { showFormModal.value = false }

const submitForm = async () => {
  formError.value = ''
  if (!form.value.supplierId || !form.value.warehouseId || !form.value.arrivalDateLocal) {
    formError.value = 'Barcha majburiy maydonlarni to‘ldiring'
    return
  }
  saving.value = true
  try {
    const payload = {
      supplierId: form.value.supplierId,
      warehouseId: form.value.warehouseId,
      arrivalDate: fromLocalInput(form.value.arrivalDateLocal),
      comment: form.value.comment.trim() || undefined,
    }
    if (editing.value) await updateWarehouseOrder(editing.value.id, payload)
    else await createWarehouseOrder(payload)
    showFormModal.value = false
    await loadAll()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (order: WarehouseOrderResponse) => { itemToDelete.value = order; showDeleteModal.value = true }
const doDelete = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await deleteWarehouseOrder(itemToDelete.value.id)
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
