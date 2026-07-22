<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />

    <div class="space-y-5 sm:space-y-6">
      <GoodsDetailNav ref="navRef" :goods-id="goodsId" />

      <div v-if="loading" class="py-12 text-center text-gray-500">{{ t('common.loading') }}</div>

      <template v-else>
        <div
          v-if="errorMessage"
          class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
        >
          {{ errorMessage }}
        </div>

        <div
          v-if="loadWarnings.length"
          class="space-y-2"
        >
          <div
            v-for="(warning, index) in loadWarnings"
            :key="index"
            class="p-3 text-sm text-warning-800 border border-warning-200 rounded-lg bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300"
          >
            {{ warning }}
          </div>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-6">
            <div
              class="inline-flex w-full gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-gray-100 p-1.5 dark:border-gray-800 dark:bg-gray-900 custom-scrollbar"
            >
              <button
                v-for="tab in stockSubTabs"
                :key="tab.id"
                type="button"
                @click="activeSubTab = tab.id"
                :class="[
                  'inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap',
                  activeSubTab === tab.id
                    ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white',
                ]"
              >
                {{ tab.label }}
                <span
                  v-if="tab.count != null"
                  class="rounded-full px-2 py-0.5 text-xs tabular-nums"
                  :class="
                    activeSubTab === tab.id
                      ? 'bg-brand-500/10 text-brand-600'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  "
                >
                  {{ tab.count }}
                </span>
              </button>
            </div>
            <ActionIconButton action="refresh" @click="loadStock" />
          </div>

          <div class="px-4 py-5 sm:px-6">
            <GoodsStockOverviewTab
              v-show="activeSubTab === 'overview'"
              :rows="rows"
              :summary="summary"
              :histories="histories"
              :price-cost="priceCost"
              :price-selling="priceSelling"
              :unit-label="unitLabel"
              @go-history="activeSubTab = 'history'"
            />

            <GoodsStockHistoryTab
              v-show="activeSubTab === 'history'"
              :histories="histories"
              :rows="rows"
            />

            <GoodsStockAnalyticsTab
              v-show="activeSubTab === 'analytics'"
              :histories="histories"
              :velocity="velocity"
              :unit-label="unitLabel"
            />
          </div>
        </div>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import GoodsDetailNav from '@/components/goods/GoodsDetailNav.vue'
import GoodsStockOverviewTab from '@/components/goods/GoodsStockOverviewTab.vue'
import GoodsStockHistoryTab from '@/components/goods/GoodsStockHistoryTab.vue'
import GoodsStockAnalyticsTab from '@/components/goods/GoodsStockAnalyticsTab.vue'
import { fetchStocksByGoods } from '@/services/stocks'
import { fetchStockHistoriesByGoods } from '@/services/stockHistories'
import { fetchSaleOrderItemsByGoods } from '@/services/saleOrderItems'
import { fetchWarehouseOrderItemsByGoods } from '@/services/warehouseOrderItems'
import { getRequestErrorMessage } from '@/services/fetchFallbacks'
import {
  buildGoodsStockRows,
  summarizeStockRows,
  computeSalesVelocity,
  type GoodsStockRow,
  type GoodsStockSummary,
  type SalesVelocityStats,
} from '@/utils/goodsStockAnalytics'
import type { StockHistoryResponse } from '@/services/stockHistories'

type StockSubTab = 'overview' | 'history' | 'analytics'

const { t } = useI18n()
const route = useRoute()
const goodsId = Number(route.params.id)
const navRef = ref<InstanceType<typeof GoodsDetailNav> | null>(null)

const loading = ref(true)
const errorMessage = ref('')
const loadWarnings = ref<string[]>([])
const activeSubTab = ref<StockSubTab>('overview')
const rows = ref<GoodsStockRow[]>([])
const summary = ref<GoodsStockSummary>({ received: 0, sold: 0, balance: 0, currentStock: 0 })
const histories = ref<StockHistoryResponse[]>([])
const velocity = ref<SalesVelocityStats>({
  soldLast7Days: 0,
  soldLast30Days: 0,
  dailyAvg7: 0,
  dailyAvg30: 0,
  lastSaleDate: null,
  daysUntilStockout: null,
})

const goods = computed(() => navRef.value?.goods ?? null)
const pageTitle = computed(() => goods.value?.name ?? t('routes.goodsDetail'))
const priceCost = computed(() => goods.value?.priceCost ?? 0)
const priceSelling = computed(() => goods.value?.priceSelling ?? 0)
const unitLabel = computed(() => goods.value?.unitTypeName ?? '')

const stockSubTabs = computed(() => [
  { id: 'overview' as const, label: t('goodsDetail.stockSubOverview'), count: null },
  { id: 'history' as const, label: t('goodsDetail.stockSubHistory'), count: histories.value.length || null },
  { id: 'analytics' as const, label: t('goodsDetail.stockSubAnalytics'), count: null },
])

const loadStock = async () => {
  loading.value = true
  errorMessage.value = ''
  loadWarnings.value = []
  try {
    const [incomingResult, saleResult, stocksResult, historyResult] = await Promise.allSettled([
      fetchWarehouseOrderItemsByGoods(goodsId),
      fetchSaleOrderItemsByGoods(goodsId),
      fetchStocksByGoods(goodsId),
      fetchStockHistoriesByGoods(goodsId),
    ])

    const incoming = incomingResult.status === 'fulfilled' ? incomingResult.value : []
    const saleItems = saleResult.status === 'fulfilled' ? saleResult.value : []
    const stocks = stocksResult.status === 'fulfilled' ? stocksResult.value : []
    const historyItems = historyResult.status === 'fulfilled' ? historyResult.value : []

    if (incomingResult.status === 'rejected') {
      loadWarnings.value.push(
        `${t('goodsDetail.loadIncomingFailed')}: ${getRequestErrorMessage(incomingResult.reason, t('common.error'))}`,
      )
    }
    if (saleResult.status === 'rejected') {
      loadWarnings.value.push(
        `${t('goodsDetail.loadSalesFailed')}: ${getRequestErrorMessage(saleResult.reason, t('common.error'))}`,
      )
    }
    if (stocksResult.status === 'rejected') {
      loadWarnings.value.push(
        `${t('goodsDetail.loadStocksFailed')}: ${getRequestErrorMessage(stocksResult.reason, t('common.error'))}`,
      )
    }
    if (historyResult.status === 'rejected') {
      loadWarnings.value.push(
        `${t('goodsDetail.loadHistoryFailed')}: ${getRequestErrorMessage(historyResult.reason, t('common.error'))}`,
      )
    }

    if (
      incomingResult.status === 'rejected' &&
      saleResult.status === 'rejected' &&
      stocksResult.status === 'rejected'
    ) {
      errorMessage.value = t('common.accessDenied')
      rows.value = []
      summary.value = { received: 0, sold: 0, balance: 0, currentStock: 0 }
      histories.value = []
      velocity.value = {
        soldLast7Days: 0,
        soldLast30Days: 0,
        dailyAvg7: 0,
        dailyAvg30: 0,
        lastSaleDate: null,
        daysUntilStockout: null,
      }
      return
    }

    rows.value = buildGoodsStockRows(incoming, saleItems, stocks)
    summary.value = summarizeStockRows(rows.value)
    histories.value = historyItems
    velocity.value = computeSalesVelocity(saleItems, summary.value.currentStock)
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
    rows.value = []
    summary.value = { received: 0, sold: 0, balance: 0, currentStock: 0 }
    histories.value = []
    velocity.value = {
      soldLast7Days: 0,
      soldLast30Days: 0,
      dailyAvg7: 0,
      dailyAvg30: 0,
      lastSaleDate: null,
      daysUntilStockout: null,
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadStock)
</script>
