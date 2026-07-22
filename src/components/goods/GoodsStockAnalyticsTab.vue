<template>
  <div class="space-y-5">
    <!-- Sales velocity -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="card in velocityCards"
        :key="card.key"
        class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="px-5 py-4">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ card.label }}</p>
          <p class="mt-2 text-2xl font-bold tabular-nums" :class="card.valueClass">{{ card.value }}</p>
          <p v-if="card.hint" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ card.hint }}</p>
        </div>
        <div class="h-1" :class="card.accent" />
      </div>
    </div>

    <!-- Stockout forecast -->
    <div
      v-if="velocity.daysUntilStockout != null"
      class="rounded-2xl border border-brand-200 bg-brand-50/60 px-5 py-4 dark:border-brand-500/30 dark:bg-brand-500/10"
    >
      <div class="flex items-start gap-3">
        <TrendingDown class="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
        <div>
          <h4 class="text-sm font-semibold text-brand-800 dark:text-brand-300">
            {{ t('goodsDetail.stockoutForecast') }}
          </h4>
          <p class="mt-1 text-sm text-brand-700 dark:text-brand-400">
            {{
              t('goodsDetail.stockoutForecastHint', {
                days: velocity.daysUntilStockout,
                unit: unitLabel,
              })
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Mini timeline -->
    <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('goodsDetail.miniTimeline') }}</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('goodsDetail.miniTimelineHint') }}</p>
      </div>

      <div v-if="timeline.length" class="px-6 py-5">
        <ol class="relative space-y-0 border-l border-gray-200 dark:border-gray-700">
          <li v-for="(event, index) in timeline" :key="event.id" class="relative pb-8 pl-6 last:pb-0">
            <span
              class="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full ring-4 ring-white dark:ring-gray-900"
              :class="event.kind === 'IN' ? 'bg-success-500' : 'bg-orange-500'"
            />
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ event.kind === 'IN' ? t('goodsDetail.movementIn') : t('goodsDetail.movementOut') }}
                  —
                  {{ event.warehouseName }}
                </p>
                <p class="mt-1 text-sm tabular-nums text-gray-600 dark:text-gray-300">
                  {{ event.kind === 'IN' ? '+' : '−' }}{{ formatCount(event.count) }} {{ unitLabel }}
                  <span v-if="event.balanceAfter != null" class="text-gray-400">
                    · {{ t('goodsDetail.balanceAfter') }}: {{ formatCount(event.balanceAfter) }}
                  </span>
                </p>
                <p v-if="event.comment" class="mt-1 max-w-lg text-xs text-gray-500">{{ event.comment }}</p>
              </div>
              <time class="shrink-0 text-xs text-gray-500">{{ formatDateTime(event.at) }}</time>
            </div>
            <div
              v-if="index < timeline.length - 1"
              class="absolute left-[-1px] top-4 h-[calc(100%-0.5rem)] w-px bg-gray-200 dark:bg-gray-700"
            />
          </li>
        </ol>
      </div>
      <p v-else class="px-6 py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { TrendingDown } from 'lucide-vue-next'
import { buildStockTimeline, type SalesVelocityStats } from '@/utils/goodsStockAnalytics'
import type { StockHistoryResponse } from '@/services/stockHistories'

const props = defineProps<{
  histories: StockHistoryResponse[]
  velocity: SalesVelocityStats
  unitLabel: string
}>()

const { t } = useI18n()

const formatCount = (v: number) => new Intl.NumberFormat('uz-UZ').format(Number(v.toFixed(2)))
const formatDateTime = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString()
}

const timeline = computed(() => buildStockTimeline(props.histories, 20))

const velocityCards = computed(() => [
  {
    key: '7d',
    label: t('goodsDetail.soldLast7Days'),
    value: formatCount(props.velocity.soldLast7Days),
    hint: `${t('goodsDetail.dailyAvg')}: ${formatCount(props.velocity.dailyAvg7)}`,
    valueClass: 'text-orange-500',
    accent: 'bg-orange-500',
  },
  {
    key: '30d',
    label: t('goodsDetail.soldLast30Days'),
    value: formatCount(props.velocity.soldLast30Days),
    hint: `${t('goodsDetail.dailyAvg')}: ${formatCount(props.velocity.dailyAvg30)}`,
    valueClass: 'text-brand-600',
    accent: 'bg-brand-500',
  },
  {
    key: 'last',
    label: t('goodsDetail.lastSaleDate'),
    value: props.velocity.lastSaleDate ? formatDateTime(props.velocity.lastSaleDate) : '—',
    hint: t('goodsDetail.lastSaleDateHint'),
    valueClass: 'text-gray-800 dark:text-white/90',
    accent: 'bg-gray-400',
  },
  {
    key: 'forecast',
    label: t('goodsDetail.daysUntilStockout'),
    value:
      props.velocity.daysUntilStockout != null
        ? t('goodsDetail.daysCount', { count: props.velocity.daysUntilStockout })
        : '—',
    hint: t('goodsDetail.daysUntilStockoutHint'),
    valueClass:
      props.velocity.daysUntilStockout != null && props.velocity.daysUntilStockout <= 14
        ? 'text-error-600'
        : 'text-success-600',
    accent:
      props.velocity.daysUntilStockout != null && props.velocity.daysUntilStockout <= 14
        ? 'bg-error-500'
        : 'bg-success-500',
  },
])
</script>
