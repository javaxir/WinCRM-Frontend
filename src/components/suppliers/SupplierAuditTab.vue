<template>
  <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
      <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('supplierDetail.tabAudit') }}</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('supplierDetail.auditHint') }}</p>
    </div>

    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <SortableTh label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
            <SortableTh :label="t('auth.username')" sortable :active="sortKey === 'username'" :direction="sortKey === 'username' ? sortDir : null" @sort="toggleSort('username')" />
            <SortableTh :label="t('userReports.auditEntity')" sortable :active="sortKey === 'entity'" :direction="sortKey === 'entity' ? sortDir : null" @sort="toggleSort('entity')" />
            <SortableTh :label="t('userReports.auditAction')" sortable :active="sortKey === 'action'" :direction="sortKey === 'action' ? sortDir : null" @sort="toggleSort('action')" />
            <SortableTh :label="t('userReports.auditDescription')" sortable :active="sortKey === 'description'" :direction="sortKey === 'description' ? sortDir : null" @sort="toggleSort('description')" />
            <SortableTh :label="t('userReports.auditAt')" sortable :active="sortKey === 'createdAt'" :direction="sortKey === 'createdAt' ? sortDir : null" @sort="toggleSort('createdAt')" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="displayLogs.length === 0">
            <td colspan="6" class="px-5 py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td>
          </tr>
          <tr v-for="log in displayLogs" :key="log.id">
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ log.id }}</td>
            <td class="px-5 py-4 text-theme-sm text-gray-800 sm:px-6 dark:text-white/90">{{ log.username || '—' }}</td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ log.entity || '—' }}</td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ log.action || '—' }}</td>
            <td class="px-5 py-4 text-theme-sm text-gray-600 sm:px-6 dark:text-gray-300 max-w-md truncate">{{ log.description || '—' }}</td>
            <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6 whitespace-nowrap">{{ formatDateTime(log.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SortableTh from '@/components/common/SortableTh.vue'
import { useTableSort } from '@/composables/useTableControls'
import type { AuditLog } from '@/services/audit'

const props = defineProps<{ logs: AuditLog[] }>()
const { t } = useI18n()

const formatDateTime = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString('uz-UZ')
}

const { sortKey, sortDir, toggleSort, applySort } = useTableSort<AuditLog>((row, key) => {
  if (key === 'createdAt') return row.createdAt
  return row[key as keyof AuditLog]
})

const displayLogs = computed(() => applySort(props.logs))
</script>
