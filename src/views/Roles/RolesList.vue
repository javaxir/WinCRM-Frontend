<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="space-y-5 sm:space-y-6">
      <div
        class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <!-- Header -->
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('roles.title') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ t('roles.subtitle') }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <router-link
              to="/permissions"
              :title="t('menu.permissions')"
              class="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ListIcon class="h-4 w-4" />
              {{ t('menu.permissions') }}
            </router-link>
            <TableColumnToggle
              :columns="TABLE_COLUMNS"
              :visible="visible"
              @toggle="toggleColumn"
            />
            <ActionIconButton action="refresh" @click="loadRoles" />
            <ActionIconButton action="create" :title="t('actions.newRole')" @click="openCreate" />
          </div>
        </div>

        <!-- Error -->
        <div v-if="errorMessage" class="px-6 pb-4">
          <div
            class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {{ errorMessage }}
          </div>
        </div>

        <!-- Table -->
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
                    v-if="isVisible('status')"
                    label="Holati"
                    sortable
                    :active="sortKey === 'status'"
                    :direction="sortKey === 'status' ? sortDir : null"
                    @sort="toggleSort('status')"
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
                <tr v-else-if="displayRoles.length === 0">
                  <td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    Rollar topilmadi
                  </td>
                </tr>
                <tr
                  v-for="role in displayRoles"
                  :key="role.id"
                  class="border-t border-gray-100 dark:border-gray-800"
                >
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ role.id }}</span>
                  </td>
                  <td v-if="isVisible('name')" class="px-5 py-4 sm:px-6">
                    <span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {{ role.name }}
                    </span>
                  </td>
                  <td v-if="isVisible('status')" class="px-5 py-4 sm:px-6">
                    <span
                      :class="[
                        'rounded-full px-2 py-0.5 text-theme-xs font-medium',
                        {
                          'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500':
                            role.status === 'ACTIVE',
                          'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400':
                            role.status === 'DISABLED',
                          'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500':
                            role.status === 'DELETED',
                        },
                      ]"
                    >
                      {{ role.status }}
                    </span>
                  </td>
                  <td v-if="isVisible('createdUsername')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">
                      {{ role.createdUsername || '—' }}
                    </span>
                  </td>
                  <td v-if="isVisible('createdAt')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">
                      {{ formatDate(role.createdAt) }}
                    </span>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex items-center justify-end gap-1">
                      <ActionIconButton
                        action="permissions"
                        size="sm"
                        :to="`/roles/${role.id}/permissions`"
                      />
                      <ActionIconButton
                        v-if="!isProtected(role)"
                        action="edit"
                        size="sm"
                        @click="openEdit(role)"
                      />
                      <ActionIconButton
                        v-if="!isProtected(role)"
                        action="delete"
                        size="sm"
                        @click="confirmDelete(role)"
                      />
                      <span
                        v-if="isProtected(role)"
                        :title="t('common.protected')"
                        class="inline-flex items-center justify-center rounded-lg bg-gray-100 p-2 text-gray-400 dark:bg-white/5"
                      >
                        <ShieldIcon class="w-4 h-4" />
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <Modal v-if="showFormModal" @close="closeForm">
      <template #body>
        <div
          class="relative w-full max-w-md p-6 bg-white rounded-3xl dark:bg-gray-900"
        >
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            {{ editingRole ? 'Rolni tahrirlash' : 'Yangi rol yaratish' }}
          </h4>

          <div
            v-if="formError"
            class="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {{ formError }}
          </div>

          <form @submit.prevent="submitForm">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Rol nomi<span class="text-error-500">*</span>
            </label>
            <input
              v-model="formName"
              type="text"
              required
              placeholder="Masalan: ADMIN, SUPER_ADMIN"
              class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
            />
            <p class="mt-1 text-xs text-gray-400">Katta harflarda yozing (masalan: ADMIN).</p>

            <div class="flex justify-end gap-3 mt-6">
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

    <!-- Delete Confirm Modal -->
    <Modal v-if="showDeleteModal" @close="showDeleteModal = false">
      <template #body>
        <div class="relative w-full max-w-md p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Rolni o‘chirish
          </h4>
          <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
            <span class="font-medium text-gray-700 dark:text-gray-300">{{ roleToDelete?.name }}</span>
            rolini o‘chirmoqchimisiz? Bu amalni ortga qaytarib bo‘lmaydi.
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import Modal from '@/components/ui/Modal.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import { ShieldIcon, ListIcon } from '@/icons'
import {
  useTableSort,
  useColumnVisibility,
  type TableColumnDef,
} from '@/composables/useTableControls'
import {
  fetchAllRoles,
  createRole,
  updateRole,
  deleteRole,
  type RoleResponse,
} from '@/services/roles'

const { t } = useI18n()

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Nomi', sortable: true },
  { key: 'status', label: 'Holati', sortable: true },
  { key: 'createdUsername', label: 'Yaratgan', sortable: true },
  { key: 'createdAt', label: 'Yaratilgan sana', sortable: true },
]

const currentPageTitle = ref('Rollar')

const roles = ref<RoleResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'roles-table-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<RoleResponse>(
  (row, key) => row[key as keyof RoleResponse],
)

const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)
const displayRoles = computed(() => applySort(roles.value))

// form modal state
const showFormModal = ref(false)
const editingRole = ref<RoleResponse | null>(null)
const formName = ref('')
const formError = ref('')
const saving = ref(false)

// delete modal state
const showDeleteModal = ref(false)
const roleToDelete = ref<RoleResponse | null>(null)
const deleting = ref(false)

const isProtected = (role: RoleResponse) => role.id === 1 || role.name === 'SUPER_ADMIN'

const formatDate = (value?: string) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString()
}

const loadRoles = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    roles.value = await fetchAllRoles()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Rollarni yuklashda xatolik'
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editingRole.value = null
  formName.value = ''
  formError.value = ''
  showFormModal.value = true
}

const openEdit = (role: RoleResponse) => {
  if (isProtected(role)) return
  editingRole.value = role
  formName.value = role.name
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
    if (editingRole.value) {
      await updateRole(editingRole.value.id, { name: formName.value.trim() })
    } else {
      await createRole({ name: formName.value.trim() })
    }
    showFormModal.value = false
    await loadRoles()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (role: RoleResponse) => {
  if (isProtected(role)) return
  roleToDelete.value = role
  showDeleteModal.value = true
}

const doDelete = async () => {
  if (!roleToDelete.value) return
  deleting.value = true
  try {
    await deleteRole(roleToDelete.value.id)
    showDeleteModal.value = false
    await loadRoles()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'O‘chirishda xatolik'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

onMounted(loadRoles)
</script>
