<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="space-y-5 sm:space-y-6">
      <div
        class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('roles.permissionsTitle') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ t('roles.permissionsSubtitle') }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <TableColumnToggle
              :columns="TABLE_COLUMNS"
              :visible="visible"
              @toggle="toggleColumn"
            />
            <ActionIconButton action="refresh" @click="loadPermissions" />
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
          <input
            v-model="search"
            type="text"
            :placeholder="`${t('common.search')}...`"
            class="h-11 w-full max-w-sm rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
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
                    :label="t('roles.permissionName')"
                    sortable
                    :active="sortKey === 'name'"
                    :direction="sortKey === 'name' ? sortDir : null"
                    @sort="toggleSort('name')"
                  />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading">
                  <td :colspan="colCount" class="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    {{ t('common.loading') }}
                  </td>
                </tr>
                <tr v-else-if="displayPermissions.length === 0">
                  <td :colspan="colCount" class="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                    {{ t('roles.permissionsNotFound') }}
                  </td>
                </tr>
                <tr
                  v-for="permission in displayPermissions"
                  :key="permission.id"
                  class="border-t border-gray-100 dark:border-gray-800"
                >
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">
                      {{ permission.id }}
                    </span>
                  </td>
                  <td v-if="isVisible('name')" class="px-5 py-4 sm:px-6">
                    <span
                      class="rounded-lg bg-gray-100 px-2.5 py-1 font-medium text-gray-700 text-theme-xs dark:bg-white/5 dark:text-gray-300"
                    >
                      {{ translatePermission(permission.name) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import {
  useTableSort,
  useColumnVisibility,
  type TableColumnDef,
} from '@/composables/useTableControls'
import { fetchAllPermissions, type PermissionsResponse } from '@/services/roles'
import { translatePermission } from '@/utils/translatePermission'

const { t } = useI18n()

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: t('roles.permissionName'), sortable: true },
]

const currentPageTitle = computed(() => t('roles.permissionsTitle'))
const permissions = ref<PermissionsResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const search = ref('')

const { visible, toggleColumn, isVisible } = useColumnVisibility(
  TABLE_COLUMNS,
  'permissions-table-cols',
)
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<PermissionsResponse>(
  (row, key) => row[key as keyof PermissionsResponse],
)

const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)

const filteredPermissions = computed(() => {
  const q = search.value.trim().toLowerCase()
  let result = permissions.value
  if (q) {
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        translatePermission(p.name).toLowerCase().includes(q),
    )
  }
  return applySort(result)
})

const displayPermissions = filteredPermissions

const loadPermissions = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    permissions.value = await fetchAllPermissions()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    loading.value = false
  }
}

onMounted(loadPermissions)
</script>
