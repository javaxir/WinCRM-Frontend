<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">
              {{ t('roles.rolePermissions') }}
              <span v-if="role" class="text-brand-500">— {{ role.name }}</span>
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ t('roles.rolePermissionsHint') }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <router-link
              to="/permissions"
              :title="t('menu.permissions')"
              class="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ListIcon class="h-4 w-4" />
              {{ t('menu.permissions') }}
            </router-link>
            <router-link
              to="/roles"
              :title="t('roles.backToRoles')"
              class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ChevronRightIcon class="w-5 h-5 rotate-180" />
            </router-link>
          </div>
        </div>

        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {{ errorMessage }}
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-4 border-t border-gray-100 px-6 pb-4 pt-4 dark:border-gray-800">
          <input
            v-model="search"
            type="text"
            :placeholder="`${t('common.search')}...`"
            class="h-11 w-full max-w-sm rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
          <button
            type="button"
            class="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="toggleAllSections"
          >
            <ChevronDownIcon
              :class="[
                'h-4 w-4 transition-transform duration-200',
                allSectionsOpen ? 'rotate-0' : '-rotate-90',
              ]"
            />
            {{ allSectionsOpen ? t('roles.collapseAll') : t('roles.expandAll') }}
          </button>
          <p v-if="!loading" class="text-xs text-gray-500 dark:text-gray-400">
            {{ assignedCount }} / {{ allPermissions.length }} {{ t('roles.permissionsAssigned') }}
          </p>
        </div>
      </div>

      <div v-if="loading" class="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03]">
        {{ t('common.loading') }}
      </div>

      <div v-else-if="filteredGroups.length === 0" class="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03]">
        {{ t('roles.permissionsNotFound') }}
      </div>

      <div v-else class="space-y-4">
        <section
          v-for="group in filteredGroups"
          :key="group.key"
          class="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]"
        >
          <div class="flex items-center justify-between gap-4 border-b border-gray-200/80 px-5 py-4 dark:border-gray-800">
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-2 text-left"
              @click="toggleSection(group.key)"
            >
              <ChevronDownIcon
                :class="[
                  'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200',
                  isSectionOpen(group.key) ? 'rotate-0' : '-rotate-90',
                ]"
              />
              <div>
                <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t(group.labelKey) }}</h4>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ sectionAssignedCount(group) }} / {{ flattenGroupPermissions(group).length }}
                </p>
              </div>
            </button>

            <label class="relative inline-flex shrink-0 cursor-pointer items-center">
              <input
                type="checkbox"
                class="sr-only peer"
                :checked="isSectionFullyAssigned(group)"
                :disabled="isSectionPending(group)"
                @change="toggleSectionPermissions(group, ($event.target as HTMLInputElement).checked)"
              />
              <div
                class="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-500 peer-disabled:opacity-50 peer-checked:after:translate-x-full dark:bg-gray-700"
              />
            </label>
          </div>

          <div v-show="isSectionOpen(group.key)" class="space-y-2 p-4">
            <div
              v-for="entity in group.entities"
              :key="entity.entityKey"
              class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/40"
            >
              <div class="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
                  @click="toggleEntity(entity.entityKey)"
                >
                  <ChevronDownIcon
                    :class="[
                      'h-4 w-4 transition-transform duration-200',
                      isEntityOpen(entity.entityKey) ? 'rotate-0' : '-rotate-90',
                    ]"
                  />
                </button>

                <label class="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900"
                    :checked="isEntityFullyAssigned(entity)"
                    :disabled="isEntityPending(entity)"
                    @change="toggleEntityPermissions(entity, ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                    {{ entityLabel(entity.entityKey) }}
                  </span>
                </label>
              </div>

              <div
                v-show="isEntityOpen(entity.entityKey)"
                class="border-t border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.02]"
              >
                <div class="space-y-2 pl-11">
                  <label
                    v-for="item in entity.permissions"
                    :key="item.permission.id"
                    class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white dark:hover:bg-white/[0.04]"
                  >
                    <input
                      type="checkbox"
                      class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-900"
                      :checked="assignedIds.has(item.permission.id)"
                      :disabled="pendingIds.has(item.permission.id)"
                      @change="togglePermission(item.permission)"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">
                      {{ translatePermission(item.permission.name) }}
                    </span>
                    <span class="ml-auto text-xs text-gray-400">{{ item.permission.name }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { ChevronRightIcon, ChevronDownIcon, ListIcon } from '@/icons'
import { translatePermission } from '@/utils/translatePermission'
import {
  groupPermissions,
  flattenGroupPermissions,
  type PermissionMenuGroup,
  type PermissionEntityGroup,
} from '@/utils/permissionGroups'
import {
  fetchRoleById,
  fetchAllPermissions,
  fetchPermissionsByRoleId,
  assignPermissionToRole,
  removePermissionFromRole,
  type RoleResponse,
  type PermissionsResponse,
} from '@/services/roles'

const route = useRoute()
const { t, te } = useI18n()
const roleId = Number(route.params.id)

const currentPageTitle = computed(() => t('roles.rolePermissions'))
const role = ref<RoleResponse | null>(null)
const allPermissions = ref<PermissionsResponse[]>([])
const assignedIds = ref<Set<number>>(new Set())
const pendingIds = ref<Set<number>>(new Set())
const openSections = ref<Set<string>>(new Set())
const openEntities = ref<Set<string>>(new Set())

const loading = ref(false)
const errorMessage = ref('')
const search = ref('')

const permissionGroups = computed(() => groupPermissions(allPermissions.value))

const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return permissionGroups.value

  return permissionGroups.value
    .map((group) => ({
      ...group,
      entities: group.entities
        .map((entity) => ({
          ...entity,
          permissions: entity.permissions.filter(
            (item) =>
              item.permission.name.toLowerCase().includes(q) ||
              translatePermission(item.permission.name).toLowerCase().includes(q) ||
              entityLabel(entity.entityKey).toLowerCase().includes(q) ||
              t(group.labelKey).toLowerCase().includes(q),
          ),
        }))
        .filter((entity) => entity.permissions.length > 0),
    }))
    .filter((group) => group.entities.length > 0)
})

const assignedCount = computed(() => assignedIds.value.size)

const allSectionsOpen = computed(() => {
  if (filteredGroups.value.length === 0) return false
  return filteredGroups.value.every((group) => openSections.value.has(group.key))
})

const expandAllSections = () => {
  openSections.value = new Set(filteredGroups.value.map((group) => group.key))
  openEntities.value = new Set(
    filteredGroups.value.flatMap((group) => group.entities.map((entity) => entity.entityKey)),
  )
}

const collapseAllSections = () => {
  openSections.value = new Set()
  openEntities.value = new Set()
}

const toggleAllSections = () => {
  if (allSectionsOpen.value) collapseAllSections()
  else expandAllSections()
}

const entityLabel = (entityKey: string) => {
  const key = `permissionEntities.${entityKey}`
  return te(key) ? t(key) : entityKey.replace(/_/g, ' ')
}

const isSectionOpen = (key: string) => openSections.value.has(key)
const isEntityOpen = (key: string) => openEntities.value.has(key)

const toggleSection = (key: string) => {
  const next = new Set(openSections.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  openSections.value = next
}

const toggleEntity = (key: string) => {
  const next = new Set(openEntities.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  openEntities.value = next
}

const isEntityFullyAssigned = (entity: PermissionEntityGroup) =>
  entity.permissions.every((item) => assignedIds.value.has(item.permission.id))

const isSectionFullyAssigned = (group: PermissionMenuGroup) =>
  flattenGroupPermissions(group).every((permission) => assignedIds.value.has(permission.id))

const sectionAssignedCount = (group: PermissionMenuGroup) =>
  flattenGroupPermissions(group).filter((permission) => assignedIds.value.has(permission.id)).length

const isEntityPending = (entity: PermissionEntityGroup) =>
  entity.permissions.some((item) => pendingIds.value.has(item.permission.id))

const isSectionPending = (group: PermissionMenuGroup) =>
  flattenGroupPermissions(group).some((permission) => pendingIds.value.has(permission.id))

const applyPermissionChange = async (permissionId: number, shouldAssign: boolean) => {
  pendingIds.value = new Set(pendingIds.value).add(permissionId)
  errorMessage.value = ''
  try {
    if (shouldAssign) {
      await assignPermissionToRole(roleId, permissionId)
      assignedIds.value = new Set(assignedIds.value).add(permissionId)
    } else {
      await removePermissionFromRole(roleId, permissionId)
      const next = new Set(assignedIds.value)
      next.delete(permissionId)
      assignedIds.value = next
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    const nextPending = new Set(pendingIds.value)
    nextPending.delete(permissionId)
    pendingIds.value = nextPending
  }
}

const togglePermission = async (permission: PermissionsResponse) => {
  await applyPermissionChange(permission.id, !assignedIds.value.has(permission.id))
}

const toggleEntityPermissions = async (entity: PermissionEntityGroup, checked: boolean) => {
  for (const item of entity.permissions) {
    const isAssigned = assignedIds.value.has(item.permission.id)
    if (checked && !isAssigned) await applyPermissionChange(item.permission.id, true)
    if (!checked && isAssigned) await applyPermissionChange(item.permission.id, false)
  }
}

const toggleSectionPermissions = async (group: PermissionMenuGroup, checked: boolean) => {
  for (const permission of flattenGroupPermissions(group)) {
    const isAssigned = assignedIds.value.has(permission.id)
    if (checked && !isAssigned) await applyPermissionChange(permission.id, true)
    if (!checked && isAssigned) await applyPermissionChange(permission.id, false)
  }
}

const loadData = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [roleData, permissions, rolePermissions] = await Promise.all([
      fetchRoleById(roleId),
      fetchAllPermissions(),
      fetchPermissionsByRoleId(roleId),
    ])
    role.value = roleData
    allPermissions.value = permissions
    assignedIds.value = new Set(rolePermissions.map((p) => p.id))
    openSections.value = new Set(groupPermissions(permissions).map((group) => group.key))
    openEntities.value = new Set(
      groupPermissions(permissions).flatMap((group) => group.entities.map((entity) => entity.entityKey)),
    )
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
