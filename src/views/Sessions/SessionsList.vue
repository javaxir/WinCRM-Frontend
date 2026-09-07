<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">
              {{ t('sessions.title') }}
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ t('sessions.subtitle') }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <ActionIconButton action="refresh" @click="loadAll" />
            <button
              type="button"
              :disabled="revokingOthers"
              class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              @click="revokeOthers"
            >
              {{ revokingOthers ? t('common.saving') : t('sessions.revokeOthers') }}
            </button>
          </div>
        </div>

        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {{ errorMessage }}
          </div>
        </div>
        <div v-if="successMessage" class="px-6 pb-4">
          <div class="rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
            {{ successMessage }}
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-4 border-t border-gray-100 px-6 pb-4 pt-4 dark:border-gray-800">
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('sessions.username') }}</label>
            <input
              v-model="filterUsername"
              type="text"
              :placeholder="t('sessions.usernamePlaceholder')"
              :class="inputClass"
              @keyup.enter="applyFilter"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('sessions.status') }}</label>
            <select v-model="filterStatus" :class="inputClass">
              <option value="ALL">{{ t('sessions.statusAll') }}</option>
              <option value="ONLINE">{{ t('sessions.statusOnline') }}</option>
              <option value="OFFLINE">{{ t('sessions.statusOffline') }}</option>
            </select>
          </div>
          <ActionIconButton action="filter" @click="applyFilter" />
          <ActionIconButton action="reset" @click="resetFilter" />
        </div>

        <div class="border-t border-gray-100 px-6 py-5 dark:border-gray-800">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div class="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
              <div class="px-4 py-4">
                <p class="text-xs font-medium text-gray-500">{{ t('sessions.totalSessions') }}</p>
                <p class="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">{{ summary.totalSessions }}</p>
              </div>
              <div class="h-1.5 bg-brand-500" />
            </div>
            <div class="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
              <div class="px-4 py-4">
                <p class="text-xs font-medium text-gray-500">{{ t('sessions.onlineSessions') }}</p>
                <p class="mt-2 text-xl font-bold text-success-600">{{ summary.onlineSessions }}</p>
              </div>
              <div class="h-1.5 bg-success-500" />
            </div>
            <div class="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
              <div class="px-4 py-4">
                <p class="text-xs font-medium text-gray-500">{{ t('sessions.onlineUsers') }}</p>
                <p class="mt-2 text-xl font-bold text-brand-600">{{ summary.onlineUsers }}</p>
              </div>
              <div class="h-1.5 bg-brand-500" />
            </div>
            <div class="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
              <div class="px-4 py-4">
                <p class="text-xs font-medium text-gray-500">{{ t('sessions.offlineUsers') }}</p>
                <p class="mt-2 text-xl font-bold text-gray-500">{{ summary.offlineUsers }}</p>
              </div>
              <div class="h-1.5 bg-gray-300 dark:bg-gray-700" />
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
                  <SortableTh :label="t('sessions.username')" sortable :active="sortKey === 'username'" :direction="sortKey === 'username' ? sortDir : null" @sort="toggleSort('username')" />
                  <SortableTh :label="t('sessions.device')" sortable :active="sortKey === 'deviceName'" :direction="sortKey === 'deviceName' ? sortDir : null" @sort="toggleSort('deviceName')" />
                  <SortableTh :label="t('sessions.ip')" sortable :active="sortKey === 'ipAddress'" :direction="sortKey === 'ipAddress' ? sortDir : null" @sort="toggleSort('ipAddress')" />
                  <SortableTh :label="t('sessions.lastSeen')" sortable :active="sortKey === 'lastSeenAt'" :direction="sortKey === 'lastSeenAt' ? sortDir : null" @sort="toggleSort('lastSeenAt')" />
                  <SortableTh :label="t('sessions.expires')" sortable :active="sortKey === 'expiresAt'" :direction="sortKey === 'expiresAt' ? sortDir : null" @sort="toggleSort('expiresAt')" />
                  <SortableTh :label="t('sessions.status')" />
                  <SortableTh :label="t('common.actions')" align="right" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading">
                  <td colspan="8" class="px-5 py-8 text-center text-gray-500">{{ t('common.loading') }}</td>
                </tr>
                <tr v-else-if="displaySessions.length === 0">
                  <td colspan="8" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td>
                </tr>
                <tr v-for="session in displaySessions" :key="session.id" class="border-t border-gray-100 dark:border-gray-800">
                  <td class="px-5 py-4 sm:px-6"><span class="text-theme-sm text-gray-500">{{ session.id }}</span></td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="min-w-0">
                      <p class="text-theme-sm font-medium text-gray-800 dark:text-white/90">{{ session.username }}</p>
                      <p v-if="session.current" class="mt-0.5 text-xs text-brand-600 dark:text-brand-400">{{ t('sessions.current') }}</p>
                    </div>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <p class="text-theme-sm text-gray-800 dark:text-white/90">{{ session.deviceName || '—' }}</p>
                    <p class="mt-0.5 max-w-[220px] truncate text-xs text-gray-500" :title="session.userAgent || ''">
                      {{ session.userAgent || '—' }}
                    </p>
                  </td>
                  <td class="px-5 py-4 sm:px-6"><span class="text-theme-sm text-gray-500">{{ session.ipAddress || '—' }}</span></td>
                  <td class="px-5 py-4 sm:px-6"><span class="text-theme-sm text-gray-500">{{ formatDate(session.lastSeenAt) }}</span></td>
                  <td class="px-5 py-4 sm:px-6"><span class="text-theme-sm text-gray-500">{{ formatDate(session.expiresAt) }}</span></td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex flex-wrap gap-1">
                      <span class="rounded-full px-2 py-0.5 text-theme-xs font-medium" :class="onlineClass(session)">
                        {{ session.online ? t('sessions.statusOnline') : t('sessions.statusOffline') }}
                      </span>
                      <span v-if="session.revoked" class="rounded-full bg-error-50 px-2 py-0.5 text-theme-xs font-medium text-error-700 dark:bg-error-500/15 dark:text-error-400">
                        {{ t('sessions.revoked') }}
                      </span>
                      <span v-if="session.expired" class="rounded-full bg-gray-100 px-2 py-0.5 text-theme-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {{ t('sessions.expired') }}
                      </span>
                    </div>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                        :disabled="session.revoked || revokingUser === session.username"
                        @click="revokeByUser(session.username)"
                      >
                        {{ t('sessions.revokeUser') }}
                      </button>
                      <button
                        type="button"
                        class="rounded-lg border border-error-200 px-2.5 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 disabled:opacity-50 dark:border-error-500/30 dark:text-error-400"
                        :disabled="session.revoked || session.current || revokingId === session.id"
                        @click="revokeOne(session)"
                      >
                        {{ revokingId === session.id ? '...' : t('sessions.revoke') }}
                      </button>
                    </div>
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
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import { useTableSort } from '@/composables/useTableControls'
import {
  fetchSessions,
  fetchSessionsSummary,
  revokeSession,
  revokeUserSessions,
  revokeOtherSessions,
  type SessionResponse,
  type SessionStatusFilter,
  type SessionSummaryResponse,
} from '@/services/sessions'

const { t } = useI18n()

const inputClass =
  'h-11 min-w-[180px] w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

const currentPageTitle = computed(() => t('sessions.title'))
const sessions = ref<SessionResponse[]>([])
const summary = ref<SessionSummaryResponse>({
  totalSessions: 0,
  onlineSessions: 0,
  onlineUsers: 0,
  offlineUsers: 0,
})
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const filterUsername = ref('')
const filterStatus = ref<SessionStatusFilter>('ALL')
const appliedUsername = ref('')
const appliedStatus = ref<SessionStatusFilter>('ALL')
const revokingId = ref<number | null>(null)
const revokingUser = ref<string | null>(null)
const revokingOthers = ref(false)

const { sortKey, sortDir, toggleSort, applySort } = useTableSort<SessionResponse>(
  (row, key) => row[key as keyof SessionResponse],
)
const displaySessions = computed(() => applySort(sessions.value))

const formatDate = (v?: string | null) => {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString()
}

const onlineClass = (session: SessionResponse) =>
  session.online
    ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400'
    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'

const loadAll = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [list, sum] = await Promise.all([
      fetchSessions({
        username: appliedUsername.value || undefined,
        status: appliedStatus.value,
      }),
      fetchSessionsSummary().catch(() => ({
        totalSessions: 0,
        onlineSessions: 0,
        onlineUsers: 0,
        offlineUsers: 0,
      })),
    ])
    sessions.value = list
    summary.value = {
      totalSessions: Number(sum.totalSessions) || list.length,
      onlineSessions: Number(sum.onlineSessions) || list.filter((s) => s.online).length,
      onlineUsers: Number(sum.onlineUsers) || 0,
      offlineUsers: Number(sum.offlineUsers) || 0,
    }
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
    sessions.value = []
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  appliedUsername.value = filterUsername.value.trim()
  appliedStatus.value = filterStatus.value
  loadAll()
}

const resetFilter = () => {
  filterUsername.value = ''
  filterStatus.value = 'ALL'
  appliedUsername.value = ''
  appliedStatus.value = 'ALL'
  loadAll()
}

const revokeOne = async (session: SessionResponse) => {
  if (session.current || session.revoked) return
  revokingId.value = session.id
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await revokeSession(session.id)
    successMessage.value = t('sessions.revokedOk')
    await loadAll()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    revokingId.value = null
  }
}

const revokeByUser = async (username: string) => {
  revokingUser.value = username
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await revokeUserSessions(username)
    successMessage.value = t('sessions.revokedUserOk', { username })
    await loadAll()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    revokingUser.value = null
  }
}

const revokeOthers = async () => {
  revokingOthers.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await revokeOtherSessions()
    successMessage.value = t('sessions.revokedOthersOk')
    await loadAll()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    revokingOthers.value = false
  }
}

onMounted(loadAll)
</script>
