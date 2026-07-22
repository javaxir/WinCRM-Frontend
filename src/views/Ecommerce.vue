<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="t('dashboard.title')" />

    <div class="space-y-5 sm:space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('dashboard.title') }}</h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ dateRangeLabel }}
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-3">
          <div class="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            <button
              v-for="opt in periodOptions"
              :key="opt.value"
              type="button"
              @click="setPeriod(opt.value)"
              :class="[
                period === opt.value
                  ? 'shadow-theme-xs bg-white text-gray-900 dark:bg-gray-800 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400',
                'rounded-md px-3 py-2 text-theme-sm font-medium hover:text-gray-900 dark:hover:text-white',
              ]"
            >
              {{ opt.label }}
            </button>
          </div>
          <DateRangePicker
            v-model:start-date="filterStartDate"
            v-model:end-date="filterEndDate"
            :label="t('saleOrderItemsFilter.period')"
            @apply="applyDateRange"
          />
          <ActionIconButton action="reset" @click="resetDateRange" />
          <DashboardWidgetToggle :widgets="widgetDefs" :visible="widgetVisible" @toggle="toggleWidget" @reset="resetWidgets" />
          <ActionIconButton action="refresh" @click="loadDashboard" />
        </div>
      </div>

      <div v-if="errorMessage" class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
        {{ errorMessage }}
      </div>

      <div v-if="loading" class="py-16 text-center text-gray-500">{{ t('common.loading') }}</div>

      <template v-else>
        <draggable
          v-model="draggableOrder"
          :item-key="(id: string) => id"
          handle=".widget-drag-handle"
          :animation="200"
          class="grid grid-cols-12 gap-4 md:gap-6"
          @end="onDragEnd"
        >
          <template #item="{ element: widgetId }">
            <div :class="widgetColClass(widgetId)">
              <!-- Metrika: Jami sotuv -->
              <div
                v-if="widgetId === 'metricSales'"
                class="relative h-full rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
              >
                <button type="button" class="widget-drag-handle absolute left-3 top-3 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300" :title="t('dashboard.dragHint')">
                  <GripVertical class="h-4 w-4" />
                </button>
                <p class="pl-6 text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.totalSales') }}</p>
                <h4 class="mt-2 pl-6 font-bold text-gray-800 text-title-sm dark:text-white/90">{{ formatMoney(totalAmount) }}</h4>
              </div>

              <!-- Metrika: Jami to'lovlar -->
              <div
                v-else-if="widgetId === 'metricPayments'"
                class="relative h-full rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
              >
                <button type="button" class="widget-drag-handle absolute left-3 top-3 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300" :title="t('dashboard.dragHint')">
                  <GripVertical class="h-4 w-4" />
                </button>
                <p class="pl-6 text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.totalPayments') }}</p>
                <h4 class="mt-2 pl-6 font-bold text-gray-800 text-title-sm dark:text-white/90">{{ formatMoney(totalPayments) }}</h4>
              </div>

              <!-- Metrika: Jami xarajatlar -->
              <div
                v-else-if="widgetId === 'metricExpenses'"
                class="relative h-full rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
              >
                <button type="button" class="widget-drag-handle absolute left-3 top-3 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300" :title="t('dashboard.dragHint')">
                  <GripVertical class="h-4 w-4" />
                </button>
                <p class="pl-6 text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.totalExpenses') }}</p>
                <h4 class="mt-2 pl-6 font-bold text-gray-800 text-title-sm dark:text-white/90">{{ formatMoney(totalExpenses) }}</h4>
              </div>

              <!-- Metrika: Jami miqdor -->
              <div
                v-else-if="widgetId === 'metricQuantity'"
                class="relative h-full rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
              >
                <button type="button" class="widget-drag-handle absolute left-3 top-3 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300" :title="t('dashboard.dragHint')">
                  <GripVertical class="h-4 w-4" />
                </button>
                <p class="pl-6 text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.totalQuantity') }}</p>
                <h4 class="mt-2 pl-6 font-bold text-gray-800 text-title-sm dark:text-white/90">{{ formatCount(totalCount) }}</h4>
              </div>

              <!-- Sotuvlar chart -->
              <div
                v-else-if="widgetId === 'salesChart'"
                class="h-full rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
              >
                <div class="flex items-start gap-2">
                  <button type="button" class="widget-drag-handle mt-0.5 shrink-0 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300" :title="t('dashboard.dragHint')">
                    <GripVertical class="h-5 w-5" />
                  </button>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                      <div class="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                        <button
                          v-for="opt in salesPeriodOptions"
                          :key="opt.value"
                          type="button"
                          @click="setSalesPeriod(opt.value)"
                          :class="[
                            salesPeriod === opt.value
                              ? 'shadow-theme-xs bg-white text-gray-900 dark:bg-gray-800 dark:text-white'
                              : 'text-gray-500 dark:text-gray-400',
                            'rounded-md px-3 py-2 text-theme-sm font-medium hover:text-gray-900 dark:hover:text-white',
                          ]"
                        >
                          {{ opt.label }}
                        </button>
                      </div>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ salesDetailsLabel }}</p>
                    </div>
                    <h3 class="mt-5 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('dashboard.salesChart') }}</h3>
                    <div class="mt-5 max-w-full overflow-x-auto custom-scrollbar">
                      <div v-if="salesChartLoading" class="py-16 text-center text-sm text-gray-500">{{ t('common.loading') }}</div>
                      <VueApexCharts
                        v-else-if="hasSalesChartData"
                        :key="salesChartKey"
                        type="area"
                        height="360"
                        :options="salesChartOptions"
                        :series="salesChartSeries"
                      />
                      <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Top mahsulotlar -->
              <div
                v-if="widgetId === 'topProducts'"
                class="h-full rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
              >
                <div class="flex items-start gap-2">
                  <button type="button" class="widget-drag-handle mt-0.5 shrink-0 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300" :title="t('dashboard.dragHint')">
                    <GripVertical class="h-5 w-5" />
                  </button>
                  <div class="min-w-0 flex-1">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('dashboard.topProductsTitle') }}</h3>
                    <div class="mt-4 flex items-center justify-between px-1">
                      <button type="button" @click="toggleTopSort('goodsName')" class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400">
                        {{ t('clientDetail.productName') }}
                        <ChevronDown class="h-3.5 w-3.5 transition" :class="topSortKey === 'goodsName' ? 'text-brand-500' : 'text-gray-400'" :style="topSortKey === 'goodsName' && topSortDir === 'asc' ? { transform: 'rotate(180deg)' } : undefined" />
                      </button>
                      <button type="button" @click="toggleTopSort('totalAmount')" class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400">
                        {{ t('dashboard.netRevenue') }}
                        <ChevronDown class="h-3.5 w-3.5 transition" :class="topSortKey === 'totalAmount' ? 'text-brand-500' : 'text-gray-400'" :style="topSortKey === 'totalAmount' && topSortDir === 'asc' ? { transform: 'rotate(180deg)' } : undefined" />
                      </button>
                    </div>
                    <div v-if="sortedTopProducts.length" class="mt-3 max-h-[360px] space-y-2 overflow-y-auto custom-scrollbar pr-1">
                      <div v-for="item in sortedTopProducts" :key="item.goodsId" class="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5 dark:border-gray-800 dark:bg-white/5">
                        <span class="min-w-0 truncate text-sm text-gray-800 dark:text-white/90">{{ item.goodsName }}</span>
                        <div class="shrink-0 text-right">
                          <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ formatAmountNumber(item.totalAmount) }}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">so‘m</p>
                        </div>
                      </div>
                    </div>
                    <p v-else class="py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                  </div>
                </div>
              </div>

              <!-- Top sotuvchilar -->
              <div
                v-else-if="widgetId === 'topSellers'"
                class="h-full rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
              >
                <div class="flex items-start gap-2">
                  <button type="button" class="widget-drag-handle mt-0.5 shrink-0 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300" :title="t('dashboard.dragHint')">
                    <GripVertical class="h-5 w-5" />
                  </button>
                  <div class="min-w-0 flex-1">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('dashboard.topSellersTitle') }}</h3>
                    <div class="mt-4 flex items-center justify-between px-1">
                      <button type="button" @click="toggleSellerSort('userName')" class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400">
                        {{ t('dashboard.sellerName') }}
                        <ChevronDown class="h-3.5 w-3.5 transition" :class="sellerSortKey === 'userName' ? 'text-brand-500' : 'text-gray-400'" :style="sellerSortKey === 'userName' && sellerSortDir === 'asc' ? { transform: 'rotate(180deg)' } : undefined" />
                      </button>
                      <button type="button" @click="toggleSellerSort('totalAmount')" class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 transition hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400">
                        {{ t('dashboard.netRevenue') }}
                        <ChevronDown class="h-3.5 w-3.5 transition" :class="sellerSortKey === 'totalAmount' ? 'text-brand-500' : 'text-gray-400'" :style="sellerSortKey === 'totalAmount' && sellerSortDir === 'asc' ? { transform: 'rotate(180deg)' } : undefined" />
                      </button>
                    </div>
                    <div v-if="sortedTopSellers.length" class="mt-3 max-h-[360px] space-y-2 overflow-y-auto custom-scrollbar pr-1">
                      <div v-for="item in sortedTopSellers" :key="item.userId" class="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5 dark:border-gray-800 dark:bg-white/5">
                        <span class="min-w-0 truncate text-sm text-gray-800 dark:text-white/90">{{ item.userName || '—' }}</span>
                        <div class="shrink-0 text-right">
                          <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ formatAmountNumber(item.totalAmount) }}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">so‘m</p>
                        </div>
                      </div>
                    </div>
                    <p v-else class="py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                  </div>
                </div>
              </div>

              <!-- To'lovlar chart -->
              <div
                v-else-if="widgetId === 'paymentsChart'"
                class="h-full rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
              >
                <div class="flex items-start gap-2">
                  <button type="button" class="widget-drag-handle mt-0.5 shrink-0 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300" :title="t('dashboard.dragHint')">
                    <GripVertical class="h-5 w-5" />
                  </button>
                  <div class="min-w-0 flex-1">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('dashboard.paymentsByType') }}</h3>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.paymentsByTypeHint') }}</p>
                    <div class="mt-5">
                      <VueApexCharts v-if="paymentsByType.length" type="donut" height="340" :options="paymentsDonutOptions" :series="paymentsDonutSeries" />
                      <p v-else class="py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Guruhlar chart -->
              <div
                v-else-if="widgetId === 'groupSummaryChart'"
                class="h-full rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
              >
                <div class="flex items-start gap-2">
                  <button type="button" class="widget-drag-handle mt-0.5 shrink-0 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300" :title="t('dashboard.dragHint')">
                    <GripVertical class="h-5 w-5" />
                  </button>
                  <div class="min-w-0 flex-1">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('dashboard.groupSummary') }}</h3>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.groupSummaryHint') }}</p>
                    <div class="mt-5">
                      <VueApexCharts v-if="groupSummary.length" type="donut" height="340" :options="groupDonutOptions" :series="groupDonutSeries" />
                      <p v-else class="py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Xarajatlar chart -->
              <div
                v-else-if="widgetId === 'expensesChart'"
                class="h-full rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6"
              >
                <div class="flex items-start gap-2">
                  <button type="button" class="widget-drag-handle mt-0.5 shrink-0 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300" :title="t('dashboard.dragHint')">
                    <GripVertical class="h-5 w-5" />
                  </button>
                  <div class="min-w-0 flex-1">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('dashboard.expensesByCategory') }}</h3>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.expensesByCategoryHint') }}</p>
                    <div class="mt-5">
                      <VueApexCharts v-if="expensesByCategory.length" type="donut" height="340" :options="expensesDonutOptions" :series="expensesDonutSeries" />
                      <p v-else class="py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- To'lovlar ro'yxati -->
              <div
                v-else-if="widgetId === 'paymentsList'"
                class="h-full rounded-2xl border border-gray-200 bg-white px-5 py-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6"
              >
                <div class="flex items-start gap-2">
                  <button type="button" class="widget-drag-handle mt-0.5 shrink-0 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300" :title="t('dashboard.dragHint')">
                    <GripVertical class="h-5 w-5" />
                  </button>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('dashboard.paymentsByType') }}</h4>
                      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right dark:border-gray-700 dark:bg-white/5">
                        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.paymentsTotalSum') }}</p>
                        <p class="mt-1 text-lg font-semibold text-brand-600 dark:text-brand-400">{{ formatMoney(totalPayments) }}</p>
                      </div>
                    </div>
                    <div v-if="paymentsByType.length" class="mt-4 space-y-3">
                      <div v-for="(item, index) in paymentsByType" :key="item.paymentTypeId" class="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800">
                        <div class="flex min-w-0 items-center gap-3">
                          <span class="h-3 w-3 shrink-0 rounded-full" :style="{ backgroundColor: chartColors[index % chartColors.length] }" />
                          <span class="truncate text-sm font-medium text-gray-800 dark:text-white/90">{{ item.paymentTypeName }}</span>
                        </div>
                        <div class="shrink-0 text-right">
                          <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ formatMoney(item.totalAmount) }}</p>
                          <p class="text-xs text-gray-500">{{ item.paymentCount }} {{ t('dashboard.paymentsCount') }}</p>
                        </div>
                      </div>
                    </div>
                    <p v-else class="py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                  </div>
                </div>
              </div>

              <!-- Guruhlar ro'yxati -->
              <div
                v-else-if="widgetId === 'groupSummaryList'"
                class="h-full rounded-2xl border border-gray-200 bg-white px-5 py-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6"
              >
                <div class="flex items-start gap-2">
                  <button type="button" class="widget-drag-handle mt-0.5 shrink-0 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300" :title="t('dashboard.dragHint')">
                    <GripVertical class="h-5 w-5" />
                  </button>
                  <div class="min-w-0 flex-1">
                    <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('dashboard.groupSummary') }}</h4>
                    <div v-if="groupSummary.length" class="mt-4 space-y-3">
                      <div v-for="(item, index) in groupSummary" :key="item.goodsGroupId" class="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800">
                        <div class="flex min-w-0 items-center gap-3">
                          <span class="h-3 w-3 shrink-0 rounded-full" :style="{ backgroundColor: chartColors[index % chartColors.length] }" />
                          <span class="truncate text-sm font-medium text-gray-800 dark:text-white/90">{{ item.goodsGroupName }}</span>
                        </div>
                        <div class="shrink-0 text-right">
                          <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ formatMoney(item.totalAmount) }}</p>
                          <p class="text-xs text-gray-500">{{ formatCount(item.totalCount) }}</p>
                        </div>
                      </div>
                    </div>
                    <p v-else class="py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                  </div>
                </div>
              </div>

              <!-- Xarajatlar ro'yxati -->
              <div
                v-else-if="widgetId === 'expensesList'"
                class="h-full rounded-2xl border border-gray-200 bg-white px-5 py-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6"
              >
                <div class="flex items-start gap-2">
                  <button type="button" class="widget-drag-handle mt-0.5 shrink-0 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300" :title="t('dashboard.dragHint')">
                    <GripVertical class="h-5 w-5" />
                  </button>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('dashboard.expensesByCategory') }}</h4>
                      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right dark:border-gray-700 dark:bg-white/5">
                        <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.expensesTotalSum') }}</p>
                        <p class="mt-1 text-lg font-semibold text-error-600 dark:text-error-400">{{ formatMoney(totalExpenses) }}</p>
                      </div>
                    </div>
                    <div v-if="expensesByCategory.length" class="mt-4 space-y-3">
                      <div v-for="(item, index) in expensesByCategory" :key="item.categoryId" class="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-800">
                        <div class="flex min-w-0 items-center gap-3">
                          <span class="h-3 w-3 shrink-0 rounded-full" :style="{ backgroundColor: expenseChartColors[index % expenseChartColors.length] }" />
                          <span class="truncate text-sm font-medium text-gray-800 dark:text-white/90">{{ item.categoryName }}</span>
                        </div>
                        <div class="shrink-0 text-right">
                          <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ formatMoney(item.totalAmount) }}</p>
                          <p v-if="totalExpenses > 0" class="text-xs text-gray-500">{{ Math.round((item.totalAmount / totalExpenses) * 100) }}%</p>
                        </div>
                      </div>
                    </div>
                    <p v-else class="py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import VueApexCharts from 'vue3-apexcharts'
import draggable from 'vuedraggable'
import { ChevronDown, GripVertical } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import DashboardWidgetToggle from '@/components/common/DashboardWidgetToggle.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import { useTableSort } from '@/composables/useTableControls'
import { useDashboardWidgets, type DashboardWidgetId } from '@/composables/useDashboardWidgets'
import {
  fetchDashboardData,
  fetchDashboardDataByRange,
  getDashboardDateRange,
  getSalesChartDateRange,
  type DashboardPeriod,
  type SalesChartPeriod,
  type TopGoodsResponse,
  type TopSellerResponse,
  type GoodsGroupSummaryResponse,
  type PaymentTypeSummaryResponse,
  type ExpenseCategoryInfoResponse,
} from '@/services/dashboard'
import { fetchSaleOrdersByDateRange, fetchAllSaleOrders, type SaleOrderResponse } from '@/services/saleOrders'
import { toStartDateTime, toEndDateTime } from '@/utils/dateRange'

const { t } = useI18n()

const { visible: widgetVisible, draggableOrder, toggleWidget, onDragEnd, resetWidgets } = useDashboardWidgets()

const widgetDefs = computed(() => [
  { key: 'metricSales' as const, label: t('dashboard.totalSales') },
  { key: 'metricPayments' as const, label: t('dashboard.totalPayments') },
  { key: 'metricExpenses' as const, label: t('dashboard.totalExpenses') },
  { key: 'metricQuantity' as const, label: t('dashboard.totalQuantity') },
  { key: 'salesChart' as const, label: t('dashboard.salesChart') },
  { key: 'topProducts' as const, label: t('dashboard.topProductsTitle') },
  { key: 'topSellers' as const, label: t('dashboard.topSellersTitle') },
  { key: 'paymentsChart' as const, label: `${t('dashboard.paymentsByType')} (${t('dashboard.chart')})` },
  { key: 'groupSummaryChart' as const, label: `${t('dashboard.groupSummary')} (${t('dashboard.chart')})` },
  { key: 'expensesChart' as const, label: `${t('dashboard.expensesByCategory')} (${t('dashboard.chart')})` },
  { key: 'paymentsList' as const, label: `${t('dashboard.paymentsByType')} (${t('dashboard.list')})` },
  { key: 'groupSummaryList' as const, label: `${t('dashboard.groupSummary')} (${t('dashboard.list')})` },
  { key: 'expensesList' as const, label: `${t('dashboard.expensesByCategory')} (${t('dashboard.list')})` },
])

const METRIC_WIDGETS: DashboardWidgetId[] = ['metricSales', 'metricPayments', 'metricExpenses', 'metricQuantity']

const widgetColClass = (id: DashboardWidgetId) => {
  if (METRIC_WIDGETS.includes(id)) return 'col-span-12 sm:col-span-6 xl:col-span-3'
  if (id === 'salesChart') return 'col-span-12'
  return 'col-span-12 xl:col-span-6'
}

const chartColors = ['#465FFF', '#7592FF', '#9CB9FF', '#C2D6FF', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899']
const expenseChartColors = ['#EF4444', '#F97316', '#F59E0B', '#FB923C', '#FBBF24', '#DC2626', '#EA580C', '#D97706', '#B45309', '#991B1B']
const dayShortLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const periodOptions: { value: DashboardPeriod; label: string }[] = [
  { value: 'DAILY', label: 'Kunlik' },
  { value: 'WEEKLY', label: 'Haftalik' },
  { value: 'MONTHLY', label: 'Oylik' },
]

const salesPeriodOptions = computed(() => [
  { value: 'YESTERDAY' as const, label: t('dashboard.periodYesterday') },
  { value: 'TODAY' as const, label: t('dashboard.periodToday') },
  { value: 'WEEK' as const, label: t('dashboard.periodWeek') },
  { value: 'MONTH' as const, label: t('dashboard.periodMonth') },
])

const period = ref<DashboardPeriod | null>('MONTHLY')
const salesPeriod = ref<SalesChartPeriod>('MONTH')
const loading = ref(false)
const salesChartLoading = ref(false)
const errorMessage = ref('')
const startDate = ref('')
const endDate = ref('')
const filterStartDate = ref('')
const filterEndDate = ref('')
const topByQuantity = ref<TopGoodsResponse[]>([])
const topByAmount = ref<TopGoodsResponse[]>([])
const topSellers = ref<TopSellerResponse[]>([])
const groupSummary = ref<GoodsGroupSummaryResponse[]>([])
const paymentsByType = ref<PaymentTypeSummaryResponse[]>([])
const expensesByCategory = ref<ExpenseCategoryInfoResponse[]>([])
const salesOrders = ref<SaleOrderResponse[]>([])

const formatMoney = (value: number) => new Intl.NumberFormat('uz-UZ').format(value) + ' so‘m'
const formatCount = (value: number) => new Intl.NumberFormat('uz-UZ').format(value)
const formatAmountNumber = (value: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(value))

const formatIsoDate = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const formatDayLabel = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dayShortLabels[d.getDay()]} ${dd}.${mm}`
}

const dateRangeLabel = computed(() => {
  if (!startDate.value || !endDate.value) return ''
  if (startDate.value === endDate.value) return startDate.value
  return `${startDate.value} — ${endDate.value}`
})

const totalAmount = computed(() => groupSummary.value.reduce((sum, item) => sum + item.totalAmount, 0))
const totalCount = computed(() => groupSummary.value.reduce((sum, item) => sum + item.totalCount, 0))
const totalPayments = computed(() => paymentsByType.value.reduce((sum, item) => sum + item.totalAmount, 0))
const totalExpenses = computed(() => expensesByCategory.value.reduce((sum, item) => sum + item.totalAmount, 0))

const {
  sortKey: topSortKey,
  sortDir: topSortDir,
  toggleSort: toggleTopSort,
  applySort: applyTopSort,
} = useTableSort<TopGoodsResponse>((row, key) => row[key as keyof TopGoodsResponse])

const sortedTopProducts = computed(() => {
  const items = [...topByAmount.value]
  if (!topSortKey.value) {
    return items.sort((a, b) => b.totalAmount - a.totalAmount)
  }
  return applyTopSort(items)
})

const {
  sortKey: sellerSortKey,
  sortDir: sellerSortDir,
  toggleSort: toggleSellerSort,
  applySort: applySellerSort,
} = useTableSort<TopSellerResponse>((row, key) => row[key as keyof TopSellerResponse])

const sortedTopSellers = computed(() => {
  const items = [...topSellers.value]
  if (!sellerSortKey.value) {
    return items.sort((a, b) => b.totalAmount - a.totalAmount)
  }
  return applySellerSort(items)
})

const salesChartRange = computed(() => getSalesChartDateRange(salesPeriod.value))

const salesDetailsLabel = computed(() =>
  salesChartRange.value.granularity === 'hour'
    ? t('dashboard.detailsByHours')
    : t('dashboard.detailsByDays'),
)

const buildSalesChartData = () => {
  const { startDate: rangeStart, endDate: rangeEnd, granularity } = salesChartRange.value
  const labels: string[] = []
  const data: number[] = []

  if (granularity === 'hour') {
    for (let h = 0; h < 24; h++) {
      labels.push(`${String(h).padStart(2, '0')}:00`)
      data.push(0)
    }
    for (const order of salesOrders.value) {
      const d = new Date(order.orderDate)
      const orderDate = formatIsoDate(d)
      if (orderDate < rangeStart || orderDate > rangeEnd) continue
      data[d.getHours()] += order.totalSum
    }
    return { labels, data }
  }

  const start = new Date(`${rangeStart}T00:00:00`)
  const end = new Date(`${rangeEnd}T00:00:00`)
  const dayKeys: string[] = []
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const key = formatIsoDate(cursor)
    dayKeys.push(key)
    labels.push(formatDayLabel(cursor))
    data.push(0)
  }

  for (const order of salesOrders.value) {
    const d = new Date(order.orderDate)
    const key = formatIsoDate(d)
    const index = dayKeys.indexOf(key)
    if (index >= 0) data[index] += order.totalSum
  }

  return { labels, data }
}

const salesChartData = computed(() => buildSalesChartData())

const salesChartSeries = computed(() => [
  {
    name: t('dashboard.salesChart'),
    data: salesChartData.value.data,
  },
])

const hasSalesChartData = computed(() => salesChartData.value.labels.length > 0)

const salesChartKey = computed(
  () => `${salesPeriod.value}-${salesChartData.value.labels.join('|')}-${salesOrders.value.length}`,
)

const salesChartOptions = computed(() => ({
  chart: {
    type: 'area' as const,
    fontFamily: 'Outfit, sans-serif',
    toolbar: { show: false },
    zoom: { enabled: true, type: 'x' as const, autoScaleYaxis: true },
  },
  colors: ['#A78BFA'],
  stroke: { curve: 'smooth' as const, width: 3 },
  dataLabels: { enabled: false },
  grid: {
    borderColor: '#374151',
    strokeDashArray: 0,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
  },
  markers: { size: 0, hover: { size: 5 } },
  xaxis: {
    categories: salesChartData.value.labels,
    labels: {
      style: { fontSize: '11px', colors: '#9CA3AF' },
      rotate: -45,
      rotateAlways: salesChartData.value.labels.length > 10,
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
    tooltip: { enabled: false },
  },
  yaxis: {
    labels: {
      style: { fontSize: '11px', colors: '#9CA3AF' },
      formatter: (val: number) => {
        if (val >= 1_000_000) return `${Math.round(val / 1_000_000)}M`
        if (val >= 1_000) return `${Math.round(val / 1_000)}K`
        return String(Math.round(val))
      },
    },
  },
  tooltip: {
    theme: 'dark',
    y: { formatter: (val: number) => formatMoney(val) },
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.35,
      opacityTo: 0.02,
      stops: [0, 90, 100],
    },
  },
}))

const groupDonutSeries = computed(() => groupSummary.value.map((item) => item.totalAmount))
const paymentsDonutSeries = computed(() => paymentsByType.value.map((item) => item.totalAmount))
const expensesDonutSeries = computed(() => expensesByCategory.value.map((item) => item.totalAmount))

const paymentsDonutOptions = computed(() => ({
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'donut',
  },
  colors: chartColors,
  labels: paymentsByType.value.map((item) => item.paymentTypeName),
  legend: {
    position: 'bottom',
    fontSize: '12px',
  },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          total: {
            show: true,
            label: t('dashboard.totalPayments'),
            formatter: () => {
              const val = totalPayments.value
              if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
              if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`
              return String(val)
            },
          },
        },
      },
    },
  },
  tooltip: {
    y: {
      formatter: (val: number) => formatMoney(val),
    },
  },
}))

const groupDonutOptions = computed(() => ({
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'donut',
  },
  colors: chartColors,
  labels: groupSummary.value.map((item) => item.goodsGroupName),
  legend: {
    position: 'bottom',
    fontSize: '12px',
  },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          total: {
            show: true,
            label: t('dashboard.totalSales'),
            formatter: () => {
              const val = totalAmount.value
              if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
              if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`
              return String(val)
            },
          },
        },
      },
    },
  },
  tooltip: {
    y: {
      formatter: (val: number) => formatMoney(val),
    },
  },
}))

const expensesDonutOptions = computed(() => ({
  chart: {
    fontFamily: 'Outfit, sans-serif',
    type: 'donut',
  },
  colors: expenseChartColors,
  labels: expensesByCategory.value.map((item) => item.categoryName),
  legend: {
    position: 'bottom',
    fontSize: '12px',
  },
  dataLabels: { enabled: false },
  plotOptions: {
    pie: {
      donut: {
        size: '68%',
        labels: {
          show: true,
          total: {
            show: true,
            label: t('dashboard.totalExpenses'),
            formatter: () => {
              const val = totalExpenses.value
              if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
              if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`
              return String(val)
            },
          },
        },
      },
    },
  },
  tooltip: {
    y: {
      formatter: (val: number) => formatMoney(val),
    },
  },
}))

const setPeriod = (value: DashboardPeriod) => {
  period.value = value
  const range = getDashboardDateRange(value)
  filterStartDate.value = range.startDate
  filterEndDate.value = range.endDate
  loadDashboard()
}

const setSalesPeriod = (value: SalesChartPeriod) => {
  salesPeriod.value = value
}

const applyDateRange = () => {
  period.value = null
  loadDashboard()
}

const resetDateRange = () => {
  period.value = 'MONTHLY'
  const range = getDashboardDateRange('MONTHLY')
  filterStartDate.value = range.startDate
  filterEndDate.value = range.endDate
  loadDashboard()
}

const loadSalesChart = async () => {
  salesChartLoading.value = true
  const { startDate: rangeStart, endDate: rangeEnd } = getSalesChartDateRange(salesPeriod.value)
  try {
    salesOrders.value = await fetchSaleOrdersByDateRange(
      toStartDateTime(rangeStart),
      toEndDateTime(rangeEnd),
    )
  } catch {
    try {
      const all = await fetchAllSaleOrders()
      salesOrders.value = all.filter((order) => {
        const orderDate = formatIsoDate(new Date(order.orderDate))
        return orderDate >= rangeStart && orderDate <= rangeEnd
      })
    } catch {
      salesOrders.value = []
    }
  } finally {
    salesChartLoading.value = false
  }
}

const loadDashboard = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const rangeStart = filterStartDate.value
    const rangeEnd = filterEndDate.value
    if (!rangeStart || !rangeEnd) {
      errorMessage.value = t('saleOrderItemsFilter.dateRequired')
      return
    }
    if (rangeStart > rangeEnd) {
      errorMessage.value = t('saleOrderItemsFilter.invalidDateRange')
      return
    }
    const data = period.value
      ? await fetchDashboardData(period.value)
      : await fetchDashboardDataByRange(rangeStart, rangeEnd)
    startDate.value = data.startDate
    endDate.value = data.endDate
    filterStartDate.value = data.startDate
    filterEndDate.value = data.endDate
    topByQuantity.value = data.topByQuantity
    topByAmount.value = data.topByAmount
    topSellers.value = data.topSellers
    groupSummary.value = data.groupSummary
    paymentsByType.value = data.paymentsByType
    expensesByCategory.value = data.expensesByCategory
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
    topByQuantity.value = []
    topByAmount.value = []
    topSellers.value = []
    groupSummary.value = []
    paymentsByType.value = []
    expensesByCategory.value = []
  } finally {
    loading.value = false
  }
}

watch(salesPeriod, () => {
  loadSalesChart()
})

onMounted(() => {
  const range = getDashboardDateRange('MONTHLY')
  filterStartDate.value = range.startDate
  filterEndDate.value = range.endDate
  loadDashboard()
  loadSalesChart()
})
</script>
