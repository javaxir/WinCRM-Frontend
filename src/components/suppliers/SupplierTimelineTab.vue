<template>
  <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
      <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('supplierDetail.tabTimeline') }}</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('supplierDetail.timelineHint') }}</p>
    </div>

    <div v-if="entries.length" class="px-6 py-5">
      <ol class="relative space-y-0 border-l border-gray-200 dark:border-gray-700">
        <li v-for="(entry, index) in entries" :key="entry.id" class="relative pb-8 pl-6 last:pb-0">
          <span
            class="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full ring-4 ring-white dark:ring-gray-900"
            :class="typeDotClass(entry.type)"
          />
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                <router-link v-if="entry.link" :to="entry.link" class="text-brand-600 hover:underline dark:text-brand-400">
                  {{ entry.title }}
                </router-link>
                <span v-else>{{ entry.title }}</span>
              </p>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ entry.description }}</p>
              <p v-if="entry.createdUsername" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ t('goodsDetail.createdBy') }}: {{ entry.createdUsername }}
              </p>
            </div>
            <time class="shrink-0 text-xs text-gray-500">{{ formatDateTime(entry.at) }}</time>
          </div>
          <div
            v-if="index < entries.length - 1"
            class="absolute left-[-1px] top-4 h-[calc(100%-0.5rem)] w-px bg-gray-200 dark:bg-gray-700"
          />
        </li>
      </ol>
    </div>
    <p v-else class="px-6 py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SupplierTimelineEntry, SupplierTimelineEntryType } from '@/utils/supplierDetailAnalytics'

defineProps<{ entries: SupplierTimelineEntry[] }>()

const { t } = useI18n()

const formatDateTime = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString('uz-UZ')
}

const typeDotClass = (type: SupplierTimelineEntryType) => ({
  order: 'bg-brand-500',
  payment: 'bg-success-500',
  audit: 'bg-orange-500',
}[type])
</script>
