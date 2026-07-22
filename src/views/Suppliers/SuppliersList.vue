<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="space-y-5 sm:space-y-6">
      <div
        class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">Yetkazib beruvchilar</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Yetkazib beruvchilarni boshqarish, filtrlash va sahifalash
            </p>
          </div>
          <div class="flex items-center gap-3">
            <TableColumnToggle
              :columns="TABLE_COLUMNS"
              :visible="visible"
              @toggle="toggleColumn"
            />
            <ActionIconButton action="refresh" @click="loadSuppliers" />
            <ActionIconButton action="create" :title="t('actions.newSupplier')" @click="openCreate" />
          </div>
        </div>

        <div v-if="errorMessage" class="px-6 pb-4">
          <div
            class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {{ errorMessage }}
          </div>
        </div>

        <div
          class="flex flex-wrap items-end gap-4 px-6 pb-4 pt-4 border-t border-gray-100 dark:border-gray-800"
        >
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Nomi</label>
            <input v-model="filters.name" type="text" :class="filterInputClass" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">INN</label>
            <input v-model="filters.inn" type="text" :class="filterInputClass" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Telefon</label>
            <input v-model="filters.phone" type="text" :class="filterInputClass" />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Holati</label>
            <select v-model="filters.status" :class="filterInputClass">
              <option value="">Barchasi</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DISABLED">DISABLED</option>
              <option value="DELETED">DELETED</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Sahifada</label>
            <select v-model.number="pageSize" :class="filterInputClass">
              <option :value="10">10 ta</option>
              <option :value="20">20 ta</option>
              <option :value="50">50 ta</option>
            </select>
          </div>
          <ActionIconButton action="filter" @click="applyFilters" />
          <ActionIconButton action="reset" @click="resetFilters" />
        </div>

        <div
          class="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm text-gray-500 border-t border-gray-100 dark:border-gray-800 dark:text-gray-400"
        >
          <span>
            Jami:
            <strong class="text-gray-700 dark:text-gray-300">{{ totalElements }}</strong> ta
          </span>
          <div v-if="totalPages > 0" class="flex items-center gap-2">
            <span>Sahifa:</span>
            <select v-model.number="currentPage" :class="[filterInputClass, '!w-20']">
              <option v-for="p in totalPages" :key="p" :value="p">{{ p }}</option>
            </select>
            <span>/ {{ totalPages }}</span>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh
                    v-if="isVisible('id')"
                    label="ID"
                    sortable
                    :active="sortKey === 'id'"
                    :direction="sortKey === 'id' ? sortDir : null"
                    @sort="toggleSort('id')"
                  />
                  <SortableTh
                    v-if="isVisible('name')"
                    label="Nomi"
                    sortable
                    :active="sortKey === 'name'"
                    :direction="sortKey === 'name' ? sortDir : null"
                    @sort="toggleSort('name')"
                  />
                  <SortableTh
                    v-if="isVisible('inn')"
                    label="INN"
                    sortable
                    :active="sortKey === 'inn'"
                    :direction="sortKey === 'inn' ? sortDir : null"
                    @sort="toggleSort('inn')"
                  />
                  <SortableTh
                    v-if="isVisible('phone')"
                    label="Telefon"
                    sortable
                    :active="sortKey === 'phone'"
                    :direction="sortKey === 'phone' ? sortDir : null"
                    @sort="toggleSort('phone')"
                  />
                  <SortableTh
                    v-if="isVisible('additionalPhone')"
                    label="Qo‘shimcha tel."
                    sortable
                    :active="sortKey === 'additionalPhone'"
                    :direction="sortKey === 'additionalPhone' ? sortDir : null"
                    @sort="toggleSort('additionalPhone')"
                  />
                  <SortableTh
                    v-if="isVisible('address')"
                    label="Manzil"
                    sortable
                    :active="sortKey === 'address'"
                    :direction="sortKey === 'address' ? sortDir : null"
                    @sort="toggleSort('address')"
                  />
                  <SortableTh
                    v-if="isVisible('status')"
                    label="Holati"
                    sortable
                    :active="sortKey === 'status'"
                    :direction="sortKey === 'status' ? sortDir : null"
                    @sort="toggleSort('status')"
                  />
                  <SortableTh
                    v-if="isVisible('createdAt')"
                    label="Yaratilgan sana"
                    sortable
                    :active="sortKey === 'createdAt'"
                    :direction="sortKey === 'createdAt' ? sortDir : null"
                    @sort="toggleSort('createdAt')"
                  />
                  <SortableTh :label="t('common.actions')" align="right" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading">
                  <td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    Yuklanmoqda...
                  </td>
                </tr>
                <tr v-else-if="displaySuppliers.length === 0">
                  <td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    Yetkazib beruvchilar topilmadi
                  </td>
                </tr>
                <tr
                  v-for="supplier in displaySuppliers"
                  :key="supplier.id"
                  class="border-t border-gray-100 dark:border-gray-800"
                >
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ supplier.id }}</span>
                  </td>
                  <td v-if="isVisible('name')" class="px-5 py-4 sm:px-6">
                    <router-link
                      :to="`/suppliers/${supplier.id}`"
                      class="font-medium text-brand-600 text-theme-sm hover:underline dark:text-brand-400"
                    >
                      {{ supplier.name }}
                    </router-link>
                  </td>
                  <td v-if="isVisible('inn')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ supplier.inn || '—' }}</span>
                  </td>
                  <td v-if="isVisible('phone')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ supplier.phone }}</span>
                  </td>
                  <td v-if="isVisible('additionalPhone')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ supplier.additionalPhone || '—' }}</span>
                  </td>
                  <td v-if="isVisible('address')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ supplier.address || '—' }}</span>
                  </td>
                  <td v-if="isVisible('status')" class="px-5 py-4 sm:px-6">
                    <span :class="statusClass(supplier.status)">{{ supplier.status }}</span>
                  </td>
                  <td v-if="isVisible('createdAt')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">
                      {{ formatDate(supplier.createdAt) }}
                    </span>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        v-if="supplier.status === 'ACTIVE'"
                        @click="toggleStatus(supplier, 'DISABLED')"
                        class="rounded-lg px-3 py-1.5 text-theme-xs font-medium text-warning-600 hover:bg-warning-50 dark:text-warning-400 dark:hover:bg-warning-500/10"
                      >
                        Nofaollashtirish
                      </button>
                      <button
                        v-else-if="supplier.status === 'DISABLED'"
                        @click="toggleStatus(supplier, 'ACTIVE')"
                        class="rounded-lg px-3 py-1.5 text-theme-xs font-medium text-success-600 hover:bg-success-50 dark:text-success-400 dark:hover:bg-success-500/10"
                      >
                        Faollashtirish
                      </button>
                      <ActionIconButton action="edit" size="sm" @click="openEdit(supplier)" />
                      <ActionIconButton action="delete" size="sm" @click="confirmDelete(supplier)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          v-if="totalPages > 1"
          class="flex flex-wrap items-center justify-center gap-4 px-6 py-4 border-t border-gray-100 dark:border-gray-800"
        >
          <button
            type="button"
            :disabled="currentPage <= 1"
            @click="currentPage--"
            :class="[filterBtnClass, 'disabled:opacity-50']"
          >
            ← Oldingi
          </button>
          <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Sahifa:</span>
            <select v-model.number="currentPage" :class="[filterInputClass, '!w-20']">
              <option v-for="p in totalPages" :key="p" :value="p">{{ p }}</option>
            </select>
            <span>/ {{ totalPages }}</span>
          </div>
          <button
            type="button"
            :disabled="currentPage >= totalPages"
            @click="currentPage++"
            :class="[filterBtnClass, 'disabled:opacity-50']"
          >
            Keyingi →
          </button>
        </div>
      </div>
    </div>

    <Modal v-if="showFormModal" @close="closeForm">
      <template #body>
        <div class="relative w-full max-w-2xl p-6 bg-white rounded-3xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            {{ editingSupplier ? 'Yetkazib beruvchini tahrirlash' : 'Yangi yetkazib beruvchi' }}
          </h4>
          <div
            v-if="formError"
            class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {{ formError }}
          </div>
          <form @submit.prevent="submitForm" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Nomi<span class="text-error-500">*</span>
              </label>
              <input v-model="form.name" type="text" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">INN</label>
              <input v-model="form.inn" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Telefon<span class="text-error-500">*</span>
              </label>
              <input v-model="form.phone" type="text" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Qo‘shimcha telefon</label>
              <input v-model="form.additionalPhone" type="text" :class="inputClass" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Manzil</label>
              <input v-model="form.address" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Bank nomi</label>
              <input v-model="form.bankName" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">MFO</label>
              <input v-model="form.mfo" type="text" :class="inputClass" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Hisob raqami</label>
              <input v-model="form.accountNumber" type="text" :class="inputClass" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Izoh</label>
              <textarea v-model="form.description" rows="3" :class="inputClass" />
            </div>
            <div class="flex justify-end gap-3 pt-2 sm:col-span-2">
              <button
                type="button"
                @click="closeForm"
                class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70"
              >
                {{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>

    <Modal v-if="showDeleteModal" @close="showDeleteModal = false">
      <template #body>
        <div class="relative w-full max-w-md p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Yetkazib beruvchini o‘chirish
          </h4>
          <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
            <span class="font-medium text-gray-700 dark:text-gray-300">{{ supplierToDelete?.name }}</span>
            ni o‘chirmoqchimisiz?
          </p>
          <div class="flex justify-end gap-3">
            <button
              @click="showDeleteModal = false"
              class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Bekor qilish
            </button>
            <button
              @click="doDelete"
              :disabled="deleting"
              class="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
            >
              {{ deleting ? 'O‘chirilmoqda...' : 'O‘chirish' }}
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import Modal from '@/components/ui/Modal.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import {
  useTableSort,
  useColumnVisibility,
  type TableColumnDef,
} from '@/composables/useTableControls'
import {
  fetchSuppliersPage,
  filterSuppliersPage,
  createSupplier,
  updateSupplier,
  changeSupplierStatus,
  deleteSupplier,
  type SupplierResponse,
  type SupplierDTO,
  type SupplierFilterDTO,
} from '@/services/suppliers'
import type { Status } from '@/services/roles'

const { t } = useI18n()

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Nomi', sortable: true },
  { key: 'inn', label: 'INN', sortable: true },
  { key: 'phone', label: 'Telefon', sortable: true },
  { key: 'additionalPhone', label: 'Qo‘shimcha tel.', sortable: true },
  { key: 'address', label: 'Manzil', sortable: true },
  { key: 'status', label: 'Holati', sortable: true },
  { key: 'createdAt', label: 'Yaratilgan sana', sortable: true },
]

const filterInputClass =
  'h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const filterBtnClass =
  'h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'

const inputClass =
  'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const currentPageTitle = ref('Yetkazib beruvchilar')
const suppliers = ref<SupplierResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const totalElements = ref(0)
const totalPages = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const filterActive = ref(false)

const filters = ref({
  name: '',
  inn: '',
  phone: '',
  status: '' as '' | Status,
})

const appliedFilters = ref<SupplierFilterDTO>({})

const { visible, toggleColumn, isVisible } = useColumnVisibility(
  TABLE_COLUMNS,
  'suppliers-table-cols',
)
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<SupplierResponse>(
  (row, key) => row[key as keyof SupplierResponse],
)

const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)
const displaySuppliers = computed(() => applySort(suppliers.value))

const emptyForm = (): SupplierDTO => ({
  name: '',
  inn: '',
  phone: '',
  additionalPhone: '',
  address: '',
  bankName: '',
  mfo: '',
  accountNumber: '',
  description: '',
})

const showFormModal = ref(false)
const editingSupplier = ref<SupplierResponse | null>(null)
const form = ref<SupplierDTO>(emptyForm())
const formError = ref('')
const saving = ref(false)

const showDeleteModal = ref(false)
const supplierToDelete = ref<SupplierResponse | null>(null)
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
  if (isNaN(d.getTime())) return value
  return d.toLocaleString()
}

const buildAppliedFilters = (): SupplierFilterDTO => {
  const result: SupplierFilterDTO = {}
  if (filters.value.name.trim()) result.name = filters.value.name.trim()
  if (filters.value.inn.trim()) result.inn = filters.value.inn.trim()
  if (filters.value.phone.trim()) result.phone = filters.value.phone.trim()
  if (filters.value.status) result.status = filters.value.status
  return result
}

const hasFilterValues = (f: SupplierFilterDTO) => Object.keys(f).length > 0

const loadSuppliers = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const params = { page: currentPage.value - 1, size: pageSize.value }
    const page = filterActive.value && hasFilterValues(appliedFilters.value)
      ? await filterSuppliersPage(appliedFilters.value, params)
      : await fetchSuppliersPage(params)

    suppliers.value = page.content
    totalElements.value = page.totalElements
    totalPages.value = Math.max(page.totalPages, 1)
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Yetkazib beruvchilarni yuklashda xatolik'
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  appliedFilters.value = buildAppliedFilters()
  filterActive.value = hasFilterValues(appliedFilters.value)
  currentPage.value = 1
  loadSuppliers()
}

const resetFilters = () => {
  filters.value = { name: '', inn: '', phone: '', status: '' }
  appliedFilters.value = {}
  filterActive.value = false
  currentPage.value = 1
  loadSuppliers()
}

const openCreate = () => {
  editingSupplier.value = null
  form.value = emptyForm()
  formError.value = ''
  showFormModal.value = true
}

const supplierToForm = (supplier: SupplierResponse): SupplierDTO => ({
  name: supplier.name,
  inn: supplier.inn || '',
  phone: supplier.phone,
  additionalPhone: supplier.additionalPhone || '',
  address: supplier.address || '',
  bankName: supplier.bankName || '',
  mfo: supplier.mfo || '',
  accountNumber: supplier.accountNumber || '',
  description: supplier.description || '',
})

const cleanPayload = (data: SupplierDTO): SupplierDTO => {
  const payload: SupplierDTO = {
    name: data.name.trim(),
    phone: data.phone.trim(),
  }
  const optional = ['inn', 'additionalPhone', 'address', 'bankName', 'mfo', 'accountNumber', 'description'] as const
  optional.forEach((key) => {
    const value = data[key]?.trim()
    if (value) payload[key] = value
  })
  return payload
}

const openEdit = (supplier: SupplierResponse) => {
  editingSupplier.value = supplier
  form.value = supplierToForm(supplier)
  formError.value = ''
  showFormModal.value = true
}

const closeForm = () => {
  showFormModal.value = false
}

const submitForm = async () => {
  formError.value = ''
  saving.value = true
  try {
    const payload = cleanPayload(form.value)
    if (editingSupplier.value) {
      await updateSupplier(editingSupplier.value.id, payload)
    } else {
      await createSupplier(payload)
    }
    showFormModal.value = false
    await loadSuppliers()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    saving.value = false
  }
}

const toggleStatus = async (supplier: SupplierResponse, status: Status) => {
  try {
    await changeSupplierStatus(supplier.id, status)
    await loadSuppliers()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Holatni o‘zgartirishda xatolik'
  }
}

const confirmDelete = (supplier: SupplierResponse) => {
  supplierToDelete.value = supplier
  showDeleteModal.value = true
}

const doDelete = async () => {
  if (!supplierToDelete.value) return
  deleting.value = true
  try {
    await deleteSupplier(supplierToDelete.value.id)
    showDeleteModal.value = false
    await loadSuppliers()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'O‘chirishda xatolik'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

watch([currentPage, pageSize], () => {
  loadSuppliers()
})

onMounted(loadSuppliers)
</script>
