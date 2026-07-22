<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">To‘lov turlari</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Naqd, karta va boshqa to‘lov turlarini boshqarish</p>
          </div>
          <div class="flex items-center gap-3">
            <TableColumnToggle :columns="TABLE_COLUMNS" :visible="visible" @toggle="toggleColumn" />
            <ActionIconButton action="refresh" @click="loadItems" />
            <ActionIconButton action="create" :title="t('actions.newPaymentType')" @click="openCreate" />
          </div>
        </div>
        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
        </div>
        <div class="px-6 pb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <input v-model="search" type="text" placeholder="Qidirish..." :class="inputClass + ' max-w-sm'" />
        </div>
        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh v-if="isVisible('id')" label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
                  <SortableTh v-if="isVisible('name')" label="Nomi" sortable :active="sortKey === 'name'" :direction="sortKey === 'name' ? sortDir : null" @sort="toggleSort('name')" />
                  <SortableTh v-if="isVisible('status')" label="Holati" sortable :active="sortKey === 'status'" :direction="sortKey === 'status' ? sortDir : null" @sort="toggleSort('status')" />
                  <SortableTh v-if="isVisible('createdUsername')" label="Yaratgan" sortable :active="sortKey === 'createdUsername'" :direction="sortKey === 'createdUsername' ? sortDir : null" @sort="toggleSort('createdUsername')" />
                  <SortableTh v-if="isVisible('createdAt')" label="Sana" sortable :active="sortKey === 'createdAt'" :direction="sortKey === 'createdAt' ? sortDir : null" @sort="toggleSort('createdAt')" />
                  <SortableTh :label="t('common.actions')" align="right" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading"><td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
                <tr v-else-if="displayItems.length === 0"><td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">Topilmadi</td></tr>
                <tr v-for="item in displayItems" :key="item.id" class="border-t border-gray-100 dark:border-gray-800">
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.id }}</span></td>
                  <td v-if="isVisible('name')" class="px-5 py-4 sm:px-6"><span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ item.name }}</span></td>
                  <td v-if="isVisible('status')" class="px-5 py-4 sm:px-6"><span :class="statusClass(item.status)">{{ item.status }}</span></td>
                  <td v-if="isVisible('createdUsername')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.createdUsername || '—' }}</span></td>
                  <td v-if="isVisible('createdAt')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatDate(item.createdAt) }}</span></td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex items-center justify-end gap-2">
                      <ActionIconButton action="edit" size="sm" @click="openEdit(item)" />
                      <ActionIconButton action="delete" size="sm" @click="confirmDelete(item)" />
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
        <div class="relative w-full max-w-md p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ editing ? 'Tahrirlash' : 'Yangi to‘lov turi' }}</h4>
          <div v-if="formError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ formError }}</div>
          <form @submit.prevent="submitForm">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Nomi<span class="text-error-500">*</span></label>
            <input v-model="formName" type="text" required :class="inputClass" placeholder="Masalan: Naqd pul" />
            <div class="flex justify-end gap-3 mt-6">
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
          <p class="mb-6 text-sm text-gray-500"><span class="font-medium text-gray-700 dark:text-gray-300">{{ itemToDelete?.name }}</span> ni o‘chirmoqchimisiz?</p>
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
  fetchAllPaymentTypes,
  createPaymentType,
  updatePaymentType,
  deletePaymentType,
  type PaymentTypeResponse,
} from '@/services/paymentTypes'
import type { Status } from '@/services/roles'

const { t } = useI18n()

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Nomi', sortable: true },
  { key: 'status', label: 'Holati', sortable: true },
  { key: 'createdUsername', label: 'Yaratgan', sortable: true },
  { key: 'createdAt', label: 'Sana', sortable: true },
]

const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'

const currentPageTitle = ref('To‘lov turlari')
const items = ref<PaymentTypeResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const search = ref('')

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'payment-types-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<PaymentTypeResponse>((row, key) => row[key as keyof PaymentTypeResponse])
const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)

const displayItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  let result = items.value
  if (q) result = result.filter((i) => i.name.toLowerCase().includes(q))
  return applySort(result)
})

const showFormModal = ref(false)
const editing = ref<PaymentTypeResponse | null>(null)
const formName = ref('')
const formError = ref('')
const saving = ref(false)
const showDeleteModal = ref(false)
const itemToDelete = ref<PaymentTypeResponse | null>(null)
const deleting = ref(false)

const statusClass = (status: Status) => [
  'rounded-full px-2 py-0.5 text-theme-xs font-medium',
  {
    'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500': status === 'ACTIVE',
    'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400': status === 'DISABLED',
    'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500': status === 'DELETED',
  },
]

const formatDate = (value?: string) => {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? value : d.toLocaleString()
}

const loadItems = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    items.value = await fetchAllPaymentTypes()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Yuklashda xatolik'
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editing.value = null
  formName.value = ''
  formError.value = ''
  showFormModal.value = true
}

const openEdit = (item: PaymentTypeResponse) => {
  editing.value = item
  formName.value = item.name
  formError.value = ''
  showFormModal.value = true
}

const closeForm = () => { showFormModal.value = false }

const submitForm = async () => {
  formError.value = ''
  saving.value = true
  try {
    const payload = { name: formName.value.trim() }
    if (editing.value) await updatePaymentType(editing.value.id, payload)
    else await createPaymentType(payload)
    showFormModal.value = false
    await loadItems()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (item: PaymentTypeResponse) => { itemToDelete.value = item; showDeleteModal.value = true }

const doDelete = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await deletePaymentType(itemToDelete.value.id)
    showDeleteModal.value = false
    await loadItems()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'O‘chirishda xatolik'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

onMounted(loadItems)
</script>
