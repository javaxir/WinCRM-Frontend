<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">Xarajatlar</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Tashkilot xarajatlarini boshqarish</p>
          </div>
          <div class="flex items-center gap-3">
            <TableColumnToggle :columns="TABLE_COLUMNS" :visible="visible" @toggle="toggleColumn" />
            <ActionIconButton action="refresh" @click="loadAll" />
            <ActionIconButton action="create" :title="t('actions.newExpense')" @click="openCreate" />
          </div>
        </div>
        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
        </div>
        <div class="flex flex-wrap items-end gap-4 px-6 pb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">Kategoriya</label>
            <select v-model.number="filterCategoryId" :class="inputClass">
              <option :value="0">Barchasi</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <DateRangePicker
            v-model:start-date="filterStart"
            v-model:end-date="filterEnd"
            label="Davr"
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
                  <SortableTh v-if="isVisible('categoryName')" label="Kategoriya" sortable :active="sortKey === 'categoryName'" :direction="sortKey === 'categoryName' ? sortDir : null" @sort="toggleSort('categoryName')" />
                  <SortableTh v-if="isVisible('amount')" label="Summa" sortable :active="sortKey === 'amount'" :direction="sortKey === 'amount' ? sortDir : null" @sort="toggleSort('amount')" />
                  <SortableTh v-if="isVisible('expenseDate')" label="Sana" sortable :active="sortKey === 'expenseDate'" :direction="sortKey === 'expenseDate' ? sortDir : null" @sort="toggleSort('expenseDate')" />
                  <SortableTh v-if="isVisible('description')" label="Tavsif" sortable :active="sortKey === 'description'" :direction="sortKey === 'description' ? sortDir : null" @sort="toggleSort('description')" />
                  <SortableTh v-if="isVisible('status')" label="Holati" sortable :active="sortKey === 'status'" :direction="sortKey === 'status' ? sortDir : null" @sort="toggleSort('status')" />
                  <SortableTh :label="t('common.actions')" align="right" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading"><td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
                <tr v-else-if="displayItems.length === 0"><td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">Xarajatlar topilmadi</td></tr>
                <tr v-for="item in displayItems" :key="item.id" class="border-t border-gray-100 dark:border-gray-800">
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.id }}</span></td>
                  <td v-if="isVisible('categoryName')" class="px-5 py-4 sm:px-6"><span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ item.categoryName }}</span></td>
                  <td v-if="isVisible('amount')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatMoney(item.amount) }}</span></td>
                  <td v-if="isVisible('expenseDate')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatDate(item.expenseDate) }}</span></td>
                  <td v-if="isVisible('description')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.description || '—' }}</span></td>
                  <td v-if="isVisible('status')" class="px-5 py-4 sm:px-6"><span :class="statusClass(item.status)">{{ item.status }}</span></td>
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
          <div v-if="useDateRange" class="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
            <button
              type="button"
              :disabled="page <= 0 || loading"
              :class="btnOutline"
              class="disabled:opacity-50"
              @click="prevPage"
            >
              Oldingi
            </button>
            <span class="text-sm text-gray-500">Sahifa: {{ page + 1 }}</span>
            <button
              type="button"
              :disabled="!hasNextPage || loading"
              :class="btnOutline"
              class="disabled:opacity-50"
              @click="nextPage"
            >
              Keyingi
            </button>
          </div>
        </div>
      </div>
    </div>

    <Modal v-if="showFormModal" @close="closeForm">
      <template #body>
        <div class="relative w-full max-w-lg p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ editing ? 'Xarajatni tahrirlash' : 'Yangi xarajat' }}</h4>
          <div v-if="formError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ formError }}</div>
          <form @submit.prevent="submitForm" class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Kategoriya<span class="text-error-500">*</span></label>
              <select v-model.number="form.categoryId" required :class="inputClass">
                <option :value="0" disabled>Tanlang</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Summa<span class="text-error-500">*</span></label>
              <input v-model.number="form.amount" type="number" step="1" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Sana<span class="text-error-500">*</span></label>
              <input v-model="form.expenseDate" type="date" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Tavsif</label>
              <textarea v-model="form.description" rows="2" :class="inputClass" />
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
          <p class="mb-6 text-sm text-gray-500">#{{ itemToDelete?.id }} xarajatni o‘chirmoqchimisiz?</p>
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
  fetchAllExpenses,
  fetchExpensesByCategory,
  fetchExpensesByDateRangePaginated,
  createExpense,
  updateExpense,
  deleteExpense,
  type ExpenseResponse,
} from '@/services/expenses'
import { fetchAllExpenseCategories, type ExpenseCategoryResponse } from '@/services/expenseCategories'
import type { Status } from '@/services/roles'

const { t } = useI18n()

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'categoryName', label: 'Kategoriya', sortable: true },
  { key: 'amount', label: 'Summa', sortable: true },
  { key: 'expenseDate', label: 'Sana', sortable: true },
  { key: 'description', label: 'Tavsif', sortable: true },
  { key: 'status', label: 'Holati', sortable: true },
]

const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'

const currentPageTitle = ref('Xarajatlar')
const items = ref<ExpenseResponse[]>([])
const categories = ref<ExpenseCategoryResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const filterCategoryId = ref(0)
const filterStart = ref('')
const filterEnd = ref('')
const page = ref(0)
const pageSize = 50
const hasNextPage = ref(false)

const useDateRange = computed(() => Boolean(filterStart.value && filterEnd.value))

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'expenses-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<ExpenseResponse>((row, key) => row[key as keyof ExpenseResponse])
const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)
const displayItems = computed(() => {
  let rows = items.value
  if (useDateRange.value && filterCategoryId.value > 0) {
    rows = rows.filter((item) => item.categoryId === filterCategoryId.value)
  }
  return applySort(rows)
})

const showFormModal = ref(false)
const editing = ref<ExpenseResponse | null>(null)
const form = ref({ categoryId: 0, amount: 0, expenseDate: '', description: '' })
const formError = ref('')
const saving = ref(false)
const showDeleteModal = ref(false)
const itemToDelete = ref<ExpenseResponse | null>(null)
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
  return isNaN(d.getTime()) ? value : d.toLocaleDateString()
}
const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'

const loadRefs = async () => {
  categories.value = (await fetchAllExpenseCategories()).filter((c) => c.status === 'ACTIVE')
}

const loadItems = async () => {
  if (useDateRange.value) {
    const rows = await fetchExpensesByDateRangePaginated(
      filterStart.value,
      filterEnd.value,
      page.value,
      pageSize,
    )
    hasNextPage.value = rows.length >= pageSize
    return rows
  }
  hasNextPage.value = false
  if (filterCategoryId.value > 0) return fetchExpensesByCategory(filterCategoryId.value)
  return fetchAllExpenses()
}

const loadAll = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    await loadRefs()
    items.value = await loadItems()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Yuklashda xatolik'
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  page.value = 0
  loadAll()
}
const resetFilter = () => {
  filterCategoryId.value = 0
  filterStart.value = ''
  filterEnd.value = ''
  page.value = 0
  loadAll()
}

const prevPage = () => {
  if (page.value <= 0) return
  page.value -= 1
  loadAll()
}

const nextPage = () => {
  if (!hasNextPage.value) return
  page.value += 1
  loadAll()
}

const todayDate = () => new Date().toISOString().slice(0, 10)

const openCreate = async () => {
  editing.value = null
  form.value = { categoryId: 0, amount: 0, expenseDate: todayDate(), description: '' }
  formError.value = ''
  if (!categories.value.length) await loadRefs()
  showFormModal.value = true
}

const openEdit = async (item: ExpenseResponse) => {
  editing.value = item
  form.value = {
    categoryId: item.categoryId,
    amount: item.amount,
    expenseDate: item.expenseDate.slice(0, 10),
    description: item.description || '',
  }
  formError.value = ''
  if (!categories.value.length) await loadRefs()
  showFormModal.value = true
}

const closeForm = () => { showFormModal.value = false }

const submitForm = async () => {
  formError.value = ''
  if (!form.value.categoryId) {
    formError.value = 'Kategoriyani tanlang'
    return
  }
  saving.value = true
  try {
    const payload = {
      categoryId: form.value.categoryId,
      amount: form.value.amount,
      expenseDate: form.value.expenseDate,
      description: form.value.description.trim() || undefined,
    }
    if (editing.value) await updateExpense(editing.value.id, payload)
    else await createExpense(payload)
    showFormModal.value = false
    await loadAll()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (item: ExpenseResponse) => { itemToDelete.value = item; showDeleteModal.value = true }

const doDelete = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await deleteExpense(itemToDelete.value.id)
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
