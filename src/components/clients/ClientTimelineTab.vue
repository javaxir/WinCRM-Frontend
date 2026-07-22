<template>
  <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
      <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('clientDetail.tabTimeline') }}</h3>
      <p class="mt-1 text-sm text-gray-500">{{ t('clientDetail.timelineHint') }}</p>
    </div>
    <div v-if="entries.length === 0" class="px-6 py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</div>
    <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <li v-for="entry in entries" :key="entry.id" class="flex gap-4 px-6 py-4">
        <span class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" :class="typeClass(entry.type)">
          <component :is="typeIcon(entry.type)" class="h-4 w-4" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">
              <router-link v-if="entry.link" :to="entry.link" class="text-brand-600 hover:underline">{{ entry.title }}</router-link>
              <span v-else>{{ entry.title }}</span>
            </p>
            <span class="text-xs text-gray-500">{{ formatDateTime(entry.at) }}</span>
          </div>
          <p class="mt-1 text-sm text-gray-500">{{ entry.description }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ShoppingCart, CreditCard, MessageSquare, History } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import type { TimelineEntry, TimelineEntryType } from '@/utils/clientDetailAnalytics'

defineProps<{ entries: TimelineEntry[] }>()
const { t } = useI18n()

const formatDateTime = (v: string) => new Date(v).toLocaleString('uz-UZ')

const typeIcon = (type: TimelineEntryType) => ({
  order: ShoppingCart,
  payment: CreditCard,
  sms: MessageSquare,
  audit: History,
}[type])

const typeClass = (type: TimelineEntryType) => ({
  order: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15',
  payment: 'bg-success-50 text-success-600 dark:bg-success-500/15',
  sms: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15',
  audit: 'bg-gray-100 text-gray-600 dark:bg-gray-800',
}[type])
</script>
