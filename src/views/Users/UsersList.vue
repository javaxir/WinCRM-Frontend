<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="space-y-5 sm:space-y-6">
      <div
        class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">Foydalanuvchilar</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Foydalanuvchilarni boshqarish (yaratish, tahrirlash, rasm bilan)
            </p>
          </div>
          <div class="flex items-center gap-3">
            <TableColumnToggle
              :columns="TABLE_COLUMNS"
              :visible="visible"
              @toggle="toggleColumn"
            />
            <ActionIconButton action="refresh" @click="loadUsers" />
            <ActionIconButton action="create" :title="t('actions.newUser')" @click="openCreate" />
          </div>
        </div>

        <div v-if="errorMessage" class="px-6 pb-4">
          <div
            class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {{ errorMessage }}
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
                  <th v-if="isVisible('photo')" class="px-5 py-3 text-left sm:px-6">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Rasm</p>
                  </th>
                  <SortableTh
                    v-if="isVisible('fullName')"
                    label="Foydalanuvchi"
                    sortable
                    :active="sortKey === 'fullName'"
                    :direction="sortKey === 'fullName' ? sortDir : null"
                    @sort="toggleSort('fullName')"
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
                    v-if="isVisible('role')"
                    label="Rollar"
                    sortable
                    :active="sortKey === 'role'"
                    :direction="sortKey === 'role' ? sortDir : null"
                    @sort="toggleSort('role')"
                  />
                  <SortableTh
                    v-if="isVisible('status')"
                    label="Holati"
                    sortable
                    :active="sortKey === 'status'"
                    :direction="sortKey === 'status' ? sortDir : null"
                    @sort="toggleSort('status')"
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
                <tr v-else-if="displayUsers.length === 0">
                  <td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    Foydalanuvchilar topilmadi
                  </td>
                </tr>
                <tr
                  v-for="user in displayUsers"
                  :key="user.id"
                  class="border-t border-gray-100 dark:border-gray-800"
                >
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ user.id }}</span>
                  </td>
                  <td v-if="isVisible('photo')" class="px-5 py-4 sm:px-6">
                    <UserAvatar :photo-link="user.photoLink" :alt="user.fullName" size="md" />
                  </td>
                  <td v-if="isVisible('fullName')" class="px-5 py-4 sm:px-6">
                    <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {{ user.fullName || '—' }}
                    </span>
                    <span class="block text-gray-500 text-theme-xs dark:text-gray-400">
                      @{{ user.username }}
                    </span>
                  </td>
                  <td v-if="isVisible('phone')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">
                      {{ user.phone || '—' }}
                    </span>
                  </td>
                  <td v-if="isVisible('role')" class="px-5 py-4 sm:px-6">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="r in user.role"
                        :key="r.id"
                        class="rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                      >
                        {{ r.name }}
                      </span>
                      <span
                        v-if="!user.role || user.role.length === 0"
                        class="text-gray-400 text-theme-xs"
                      >
                        —
                      </span>
                    </div>
                  </td>
                  <td v-if="isVisible('status')" class="px-5 py-4 sm:px-6">
                    <span
                      :class="[
                        'rounded-full px-2 py-0.5 text-theme-xs font-medium',
                        {
                          'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500':
                            user.status === 'ACTIVE',
                          'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400':
                            user.status === 'DISABLED',
                          'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500':
                            user.status === 'DELETED',
                        },
                      ]"
                    >
                      {{ user.status }}
                    </span>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        v-if="!isProtected(user)"
                        @click="toggleStatus(user)"
                        :disabled="statusPendingId === user.id"
                        class="rounded-lg border border-gray-300 px-3 py-1.5 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        {{ user.status === 'ACTIVE' ? 'Bloklash' : 'Faollashtirish' }}
                      </button>
                      <ActionIconButton action="edit" size="sm" @click="openEdit(user)" />
                      <ActionIconButton
                        v-if="!isProtected(user)"
                        action="delete"
                        size="sm"
                        @click="confirmDelete(user)"
                      />
                      <span
                        v-if="isProtected(user)"
                        class="rounded-lg bg-gray-100 px-2.5 py-1 text-theme-xs font-medium text-gray-400 dark:bg-white/5"
                      >
                        Himoyalangan
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
          class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 bg-white rounded-3xl dark:bg-gray-900"
        >
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            {{ editingUser ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi' }}
          </h4>

          <div
            v-if="formError"
            class="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          >
            {{ formError }}
          </div>

          <form @submit.prevent="submitForm" class="space-y-4">
            <!-- Photo upload -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Rasm
              </label>
              <div class="flex items-center gap-4">
                <UserAvatar
                  v-if="!photoPreview"
                  :photo-link="editingUser?.photoLink"
                  :alt="form.fullName || editingUser?.fullName"
                  size="lg"
                />
                <div
                  v-else
                  class="flex-shrink-0 w-16 h-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
                >
                  <img :src="photoPreview" alt="Preview" class="object-cover w-full h-full" />
                </div>
                <div>
                  <input
                    ref="photoInputRef"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="onPhotoSelected"
                  />
                  <button
                    type="button"
                    @click="photoInputRef?.click()"
                    class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Rasm tanlash
                  </button>
                  <button
                    v-if="photoPreview || selectedPhoto"
                    type="button"
                    @click="clearPhoto"
                    class="ml-2 text-sm text-red-500 hover:text-red-600"
                  >
                    Olib tashlash
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                To‘liq ism<span class="text-error-500">*</span>
              </label>
              <input
                v-model="form.fullName"
                type="text"
                required
                class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Login<span class="text-error-500">*</span>
                </label>
                <input
                  v-model="form.username"
                  type="text"
                  required
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Telefon<span class="text-error-500">*</span>
                </label>
                <input
                  v-model="form.phone"
                  type="text"
                  required
                  placeholder="+998-__-___-__-__"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Parol<span v-if="!editingUser" class="text-error-500">*</span>
                <span v-else class="text-xs text-gray-400">(bo‘sh qoldirsangiz o‘zgarmaydi)</span>
              </label>
              <input
                v-model="form.password"
                type="password"
                :required="!editingUser"
                autocomplete="new-password"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Rollar<span class="text-error-500">*</span>
              </label>
              <div v-if="rolesLoading" class="text-sm text-gray-400">Rollar yuklanmoqda...</div>
              <div
                v-else
                class="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <label
                  v-for="role in availableRoles"
                  :key="role.id"
                  class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    :value="role.id"
                    v-model="form.roleIds"
                    class="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  {{ role.name }}
                </label>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
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
            Foydalanuvchini o‘chirish
          </h4>
          <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
            <span class="font-medium text-gray-700 dark:text-gray-300">
              {{ userToDelete?.fullName }} (@{{ userToDelete?.username }})
            </span>
            foydalanuvchisini o‘chirmoqchimisiz?
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import Modal from '@/components/ui/Modal.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import {
  useTableSort,
  useColumnVisibility,
  type TableColumnDef,
} from '@/composables/useTableControls'
import {
  fetchAllUsers,
  createUser,
  updateUser,
  deleteUser,
  changeUserStatus,
  type UserResponse,
  type UserFormData,
} from '@/services/users'
import { fetchAllRoles, type RoleResponse } from '@/services/roles'

const { t } = useI18n()

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'photo', label: 'Rasm', sortable: false },
  { key: 'fullName', label: 'Foydalanuvchi', sortable: true },
  { key: 'phone', label: 'Telefon', sortable: true },
  { key: 'role', label: 'Rollar', sortable: true },
  { key: 'status', label: 'Holati', sortable: true },
]

const currentPageTitle = ref('Foydalanuvchilar')

const users = ref<UserResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'users-table-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<UserResponse>((row, key) => {
  if (key === 'role') return (row.role || []).map((r) => r.name).join(', ')
  return row[key as keyof UserResponse]
})

const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)
const displayUsers = computed(() => applySort(users.value))

const availableRoles = ref<RoleResponse[]>([])
const rolesLoading = ref(false)

const showFormModal = ref(false)
const editingUser = ref<UserResponse | null>(null)
const form = reactive({
  username: '',
  password: '',
  fullName: '',
  phone: '',
  roleIds: [] as number[],
})
const formError = ref('')
const saving = ref(false)

const photoInputRef = ref<HTMLInputElement | null>(null)
const selectedPhoto = ref<File | null>(null)
const photoPreview = ref<string | null>(null)

const showDeleteModal = ref(false)
const userToDelete = ref<UserResponse | null>(null)
const deleting = ref(false)

const statusPendingId = ref<number | null>(null)

const isProtected = (user: UserResponse) => user.id === 1 || user.username === 'admin'

const loadUsers = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    users.value = await fetchAllUsers()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Foydalanuvchilarni yuklashda xatolik'
  } finally {
    loading.value = false
  }
}

const loadRoles = async () => {
  rolesLoading.value = true
  try {
    availableRoles.value = await fetchAllRoles()
  } catch {
    availableRoles.value = []
  } finally {
    rolesLoading.value = false
  }
}

const onPhotoSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  selectedPhoto.value = file
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = URL.createObjectURL(file)
}

const clearPhoto = () => {
  selectedPhoto.value = null
  if (photoPreview.value) {
    URL.revokeObjectURL(photoPreview.value)
    photoPreview.value = null
  }
  if (photoInputRef.value) photoInputRef.value.value = ''
}

const resetForm = () => {
  form.username = ''
  form.password = ''
  form.fullName = ''
  form.phone = ''
  form.roleIds = []
  formError.value = ''
  clearPhoto()
}

const openCreate = () => {
  editingUser.value = null
  resetForm()
  showFormModal.value = true
  if (availableRoles.value.length === 0) loadRoles()
}

const openEdit = (user: UserResponse) => {
  editingUser.value = user
  form.username = user.username
  form.password = ''
  form.fullName = user.fullName
  form.phone = user.phone
  form.roleIds = (user.role || []).map((r) => r.id)
  formError.value = ''
  clearPhoto()
  showFormModal.value = true
  if (availableRoles.value.length === 0) loadRoles()
}

const closeForm = () => {
  showFormModal.value = false
}

const submitForm = async () => {
  formError.value = ''
  if (form.roleIds.length === 0) {
    formError.value = 'Kamida bitta rol tanlang'
    return
  }

  saving.value = true
  try {
    const payload: UserFormData = {
      username: form.username.trim(),
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      roleIds: form.roleIds,
      photo: selectedPhoto.value,
    }
    if (form.password) {
      payload.password = form.password
    }

    if (editingUser.value) {
      await updateUser(editingUser.value.id, payload)
    } else {
      if (!payload.password) {
        formError.value = 'Parol kiritilishi shart'
        return
      }
      await createUser(payload)
    }
    showFormModal.value = false
    await loadUsers()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    saving.value = false
  }
}

const toggleStatus = async (user: UserResponse) => {
  statusPendingId.value = user.id
  errorMessage.value = ''
  try {
    await changeUserStatus(user.id)
    await loadUsers()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Holatni o‘zgartirishda xatolik'
  } finally {
    statusPendingId.value = null
  }
}

const confirmDelete = (user: UserResponse) => {
  if (isProtected(user)) return
  userToDelete.value = user
  showDeleteModal.value = true
}

const doDelete = async () => {
  if (!userToDelete.value) return
  deleting.value = true
  try {
    await deleteUser(userToDelete.value.id)
    showDeleteModal.value = false
    await loadUsers()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'O‘chirishda xatolik'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadUsers()
  loadRoles()
})

onUnmounted(() => {
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
})
</script>
