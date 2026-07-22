<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="space-y-5 sm:space-y-6">
      <div
        class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">Mijozlar</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Mijozlarni boshqarish (yaratish, tahrirlash, o‘chirish)
            </p>
          </div>
          <div class="flex items-center gap-3">
            <TableColumnToggle
              :columns="TABLE_COLUMNS"
              :visible="visible"
              @toggle="toggleColumn"
            />
            <ActionIconButton action="refresh" @click="loadClients" />
            <ActionIconButton action="create" :title="t('actions.newClient')" @click="openCreate" />
          </div>
        </div>

        <div v-if="errorMessage" class="px-6 pb-4">
          <div
            class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {{ errorMessage }}
          </div>
        </div>

        <div class="px-6 pb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div class="flex flex-wrap items-end gap-4">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('clients.groupFilter') }}</label>
              <select
                v-model.number="selectedGroupId"
                class="h-11 min-w-[200px] rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option :value="0">{{ t('common.all') }}</option>
                <option v-for="group in clientGroups" :key="group.id" :value="group.id">{{ group.name }}</option>
              </select>
            </div>
            <div class="flex-1 min-w-[240px]">
              <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('common.search') }}</label>
              <input
                v-model="search"
                type="text"
                :placeholder="t('clients.searchPlaceholder')"
                class="h-11 w-full max-w-md rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
            <label class="mb-1.5 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input v-model="debtorsOnly" type="checkbox" class="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
              {{ t('clients.debtorsOnly') }}
            </label>
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
                    v-if="isVisible('fullName')"
                    label="F.I.O"
                    sortable
                    :active="sortKey === 'fullName'"
                    :direction="sortKey === 'fullName' ? sortDir : null"
                    @sort="toggleSort('fullName')"
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
                    v-if="isVisible('clientGroupName')"
                    :label="t('clients.group')"
                    sortable
                    :active="sortKey === 'clientGroupName'"
                    :direction="sortKey === 'clientGroupName' ? sortDir : null"
                    @sort="toggleSort('clientGroupName')"
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
                    v-if="isVisible('bankName')"
                    label="Bank"
                    sortable
                    :active="sortKey === 'bankName'"
                    :direction="sortKey === 'bankName' ? sortDir : null"
                    @sort="toggleSort('bankName')"
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
                    v-if="isVisible('totalDebt')"
                    :label="t('clients.totalDebt')"
                    sortable
                    :active="sortKey === 'totalDebt'"
                    :direction="sortKey === 'totalDebt' ? sortDir : null"
                    @sort="toggleSort('totalDebt')"
                  />
                  <SortableTh
                    v-if="isVisible('createdUsername')"
                    label="Yaratgan"
                    sortable
                    :active="sortKey === 'createdUsername'"
                    :direction="sortKey === 'createdUsername' ? sortDir : null"
                    @sort="toggleSort('createdUsername')"
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
                <tr v-else-if="displayClients.length === 0">
                  <td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    Mijozlar topilmadi
                  </td>
                </tr>
                <tr
                  v-for="client in displayClients"
                  :key="client.id"
                  class="border-t border-gray-100 dark:border-gray-800"
                >
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ client.id }}</span>
                  </td>
                  <td v-if="isVisible('fullName')" class="px-5 py-4 sm:px-6">
                    <router-link
                      :to="`/clients/${client.id}`"
                      class="font-medium text-brand-600 text-theme-sm hover:underline dark:text-brand-400"
                    >
                      {{ client.fullName }}
                    </router-link>
                  </td>
                  <td v-if="isVisible('inn')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ client.inn || '—' }}</span>
                  </td>
                  <td v-if="isVisible('phone')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ client.phone }}</span>
                  </td>
                  <td v-if="isVisible('additionalPhone')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ client.additionalPhone || '—' }}</span>
                  </td>
                  <td v-if="isVisible('clientGroupName')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ client.clientGroupName || '—' }}</span>
                  </td>
                  <td v-if="isVisible('address')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ client.address }}</span>
                  </td>
                  <td v-if="isVisible('bankName')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ client.bankName || '—' }}</span>
                  </td>
                  <td v-if="isVisible('status')" class="px-5 py-4 sm:px-6">
                    <span :class="statusClass(client.status)">{{ client.status }}</span>
                  </td>
                  <td v-if="isVisible('totalDebt')" class="px-5 py-4 sm:px-6">
                    <span
                      class="text-theme-sm"
                      :class="(balancesMap[client.id] ?? 0) > 0 ? 'font-medium text-error-600' : 'text-gray-500 dark:text-gray-400'"
                    >
                      {{ formatDebt(client.id) }}
                    </span>
                  </td>
                  <td v-if="isVisible('createdUsername')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">
                      {{ client.createdUsername || '—' }}
                    </span>
                  </td>
                  <td v-if="isVisible('createdAt')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">
                      {{ formatDate(client.createdAt) }}
                    </span>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex items-center justify-end gap-1">
                      <ActionIconButton action="edit" size="sm" @click="openEdit(client)" />
                      <ActionIconButton action="delete" size="sm" @click="confirmDelete(client)" />
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
        <div class="relative w-full max-w-2xl p-6 bg-white rounded-3xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            {{ editingClient ? 'Mijozni tahrirlash' : 'Yangi mijoz' }}
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
                F.I.O<span class="text-error-500">*</span>
              </label>
              <input v-model="form.fullName" type="text" required :class="inputClass" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('clients.group') }}<span class="text-error-500">*</span>
              </label>
              <select v-model.number="form.clientGroupId" required :class="inputClass">
                <option :value="0" disabled>{{ t('clients.selectGroup') }}</option>
                <option v-for="group in activeClientGroups" :key="group.id" :value="group.id">{{ group.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">INN</label>
              <input v-model="form.inn" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Telefon<span class="text-error-500">*</span>
              </label>
              <input
                :value="form.phone"
                type="tel"
                required
                placeholder="+998 __ ___ __ __"
                :class="inputClass"
                @input="onPhoneInput"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Qo‘shimcha telefon</label>
              <input v-model="form.additionalPhone" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Bank nomi</label>
              <input v-model="form.bankName" type="text" :class="inputClass" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Manzil<span class="text-error-500">*</span>
              </label>
              <input v-model="form.address" type="text" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">MFO</label>
              <input v-model="form.mfo" type="text" :class="inputClass" />
            </div>
            <div>
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
            Mijozni o‘chirish
          </h4>
          <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
            <span class="font-medium text-gray-700 dark:text-gray-300">{{ clientToDelete?.fullName }}</span>
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
import { ref, computed, onMounted, watch } from 'vue'
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
  fetchAllClients,
  createClient,
  updateClient,
  deleteClient,
  type ClientResponse,
  type ClientDTO,
} from '@/services/clients'
import { fetchAllClientBalances } from '@/services/clientBalances'
import { fetchAllClientGroups, type ClientGroupResponse } from '@/services/clientGroups'
import type { Status } from '@/services/roles'
import { formatPhoneInput, phoneFromStorage, phoneToStorage, isPhoneComplete } from '@/utils/phone'

const { t } = useI18n()

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'fullName', label: 'F.I.O', sortable: true },
  { key: 'inn', label: 'INN', sortable: true },
  { key: 'phone', label: 'Telefon', sortable: true },
  { key: 'additionalPhone', label: 'Qo‘shimcha tel.', sortable: true },
  { key: 'clientGroupName', label: 'Guruh', sortable: true },
  { key: 'address', label: 'Manzil', sortable: true },
  { key: 'bankName', label: 'Bank', sortable: true },
  { key: 'status', label: 'Holati', sortable: true },
  { key: 'totalDebt', label: 'Qarz', sortable: true },
  { key: 'createdUsername', label: 'Yaratgan', sortable: true },
  { key: 'createdAt', label: 'Yaratilgan sana', sortable: true },
]

const inputClass =
  'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const currentPageTitle = ref('Mijozlar')
const clients = ref<ClientResponse[]>([])
const clientGroups = ref<ClientGroupResponse[]>([])
const balancesMap = ref<Record<number, number>>({})
const selectedGroupId = ref(0)
const loading = ref(false)
const errorMessage = ref('')
const search = ref('')
const debtorsOnly = ref(false)

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'clients-table-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<ClientResponse>(
  (row, key) => {
    if (key === 'totalDebt') return balancesMap.value[row.id] ?? -1
    return row[key as keyof ClientResponse]
  },
)

const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)

const activeClientGroups = computed(() =>
  clientGroups.value.filter((group) => group.status === 'ACTIVE'),
)

const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'
const formatDebt = (clientId: number) => {
  if (!(clientId in balancesMap.value)) return '—'
  return formatMoney(balancesMap.value[clientId])
}

const displayClients = computed(() => {
  const q = search.value.trim().toLowerCase()
  let result = clients.value
  if (selectedGroupId.value > 0) {
    result = result.filter((c) => c.clientGroupId === selectedGroupId.value)
  }
  if (debtorsOnly.value) {
    result = result.filter((c) => (balancesMap.value[c.id] ?? 0) > 0)
  }
  if (q) {
    result = result.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.inn || '').toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.additionalPhone || '').toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q),
    )
  }
  return applySort(result)
})

const emptyForm = (): ClientDTO => ({
  fullName: '',
  phone: '+998 ',
  address: '',
  clientGroupId: 0,
  inn: '',
  additionalPhone: '',
  bankName: '',
  mfo: '',
  accountNumber: '',
  description: '',
})

const showFormModal = ref(false)
const editingClient = ref<ClientResponse | null>(null)
const form = ref<ClientDTO>(emptyForm())
const formError = ref('')
const saving = ref(false)

const showDeleteModal = ref(false)
const clientToDelete = ref<ClientResponse | null>(null)
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

const loadClientGroups = async () => {
  try {
    clientGroups.value = await fetchAllClientGroups()
  } catch {
    clientGroups.value = []
  }
}

const loadClients = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [clientsData, balances] = await Promise.all([
      fetchAllClients(selectedGroupId.value > 0 ? selectedGroupId.value : undefined),
      fetchAllClientBalances().catch(() => []),
    ])
    clients.value = clientsData
    const map: Record<number, number> = {}
    for (const balance of balances) {
      map[balance.clientId] = balance.totalDebt
    }
    balancesMap.value = map
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Mijozlarni yuklashda xatolik'
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editingClient.value = null
  form.value = emptyForm()
  if (selectedGroupId.value > 0) {
    form.value.clientGroupId = selectedGroupId.value
  }
  formError.value = ''
  showFormModal.value = true
}

const onPhoneInput = (event: Event) => {
  form.value.phone = formatPhoneInput((event.target as HTMLInputElement).value)
}

const clientToForm = (client: ClientResponse): ClientDTO => ({
  fullName: client.fullName,
  phone: phoneFromStorage(client.phone),
  address: client.address,
  clientGroupId: client.clientGroupId || 0,
  inn: client.inn || '',
  additionalPhone: client.additionalPhone || '',
  bankName: client.bankName || '',
  mfo: client.mfo || '',
  accountNumber: client.accountNumber || '',
  description: client.description || '',
})

const cleanPayload = (data: ClientDTO): ClientDTO => {
  const payload: ClientDTO = {
    fullName: data.fullName.trim(),
    phone: phoneToStorage(data.phone),
    address: data.address.trim(),
    clientGroupId: data.clientGroupId,
  }
  const optional = ['inn', 'additionalPhone', 'bankName', 'mfo', 'accountNumber', 'description'] as const
  optional.forEach((key) => {
    const value = data[key]?.trim()
    if (value) payload[key] = value
  })
  return payload
}

const openEdit = (client: ClientResponse) => {
  editingClient.value = client
  form.value = clientToForm(client)
  formError.value = ''
  showFormModal.value = true
}

const closeForm = () => {
  showFormModal.value = false
}

const submitForm = async () => {
  formError.value = ''
  if (!form.value.clientGroupId) {
    formError.value = t('clients.groupRequired')
    return
  }
  if (!isPhoneComplete(form.value.phone)) {
    formError.value = 'Telefon raqamini to‘liq kiriting (+998 XX XXX XX XX)'
    return
  }
  saving.value = true
  try {
    const payload = cleanPayload(form.value)
    if (editingClient.value) {
      await updateClient(editingClient.value.id, payload)
    } else {
      await createClient(payload)
    }
    showFormModal.value = false
    await loadClients()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (client: ClientResponse) => {
  clientToDelete.value = client
  showDeleteModal.value = true
}

const doDelete = async () => {
  if (!clientToDelete.value) return
  deleting.value = true
  try {
    await deleteClient(clientToDelete.value.id)
    showDeleteModal.value = false
    await loadClients()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'O‘chirishda xatolik'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await loadClientGroups()
  await loadClients()
})

watch(selectedGroupId, loadClients)
</script>
