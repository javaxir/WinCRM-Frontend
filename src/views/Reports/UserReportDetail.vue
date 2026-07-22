<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />
    <div id="user-report-print-area" class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
          <div class="flex items-start gap-4">
            <UserAvatar v-if="user" :photo-link="user.photoLink" :alt="user.fullName" size="lg" />
            <div>
              <router-link to="/reports/users" class="text-sm text-brand-600 hover:underline dark:text-brand-400">
                ← {{ t('userReports.backToList') }}
              </router-link>
              <h3 class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{{ user?.fullName || '—' }}</h3>
              <p v-if="roleNames" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ roleNames }}</p>
            </div>
          </div>
          <ActionIconButton action="refresh" @click="loadData" />
        </div>

        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {{ errorMessage }}
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-4 border-t border-gray-100 px-6 pb-5 pt-4 dark:border-gray-800 print:hidden">
          <DateRangePicker
            v-model:start-date="filterStart"
            v-model:end-date="filterEnd"
            :label="t('userReports.period')"
            @apply="applyFilter"
          />
          <ActionIconButton action="filter" @click="applyFilter" />
          <ActionIconButton action="reset" @click="resetFilter" />
        </div>
      </div>

      <div v-if="loading" class="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center text-gray-500 dark:border-gray-800 dark:bg-white/[0.03]">
        {{ t('common.loading') }}
      </div>

      <template v-else>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div
            v-for="metric in kpiMetrics"
            :key="metric.key"
            class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div class="px-5 py-4">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ metric.label }}</p>
              <p class="mt-2 text-xl font-bold" :class="metric.valueClass">{{ metric.value }}</p>
              <p
                v-if="metric.delta"
                class="mt-1 flex items-center gap-1 text-xs font-medium"
                :class="metric.delta.positive ? 'text-success-600' : 'text-error-600'"
              >
                <TrendingUp v-if="metric.delta.positive" class="h-3.5 w-3.5" />
                <TrendingDown v-else class="h-3.5 w-3.5" />
                {{ metric.delta.text }}
              </p>
            </div>
            <div class="h-1" :class="metric.accentClass" />
          </div>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="border-b border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-6 print:hidden">
            <div class="inline-flex w-full gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-gray-100 p-1.5 dark:border-gray-800 dark:bg-gray-900 custom-scrollbar">
              <button
                v-for="tab in mainTabs"
                :key="tab.id"
                type="button"
                @click="activeTab = tab.id"
                :class="[
                  'inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white',
                ]"
              >
                {{ tab.label }}
                <span
                  v-if="tab.count != null"
                  class="rounded-full px-2 py-0.5 text-xs tabular-nums"
                  :class="activeTab === tab.id ? 'bg-brand-500/10 text-brand-600' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'"
                >
                  {{ tab.count }}
                </span>
              </button>
            </div>
          </div>

          <!-- Tab: Buyurtmalar -->
          <div v-show="activeTab === 'orders'" class="px-4 py-5 sm:px-6">
            <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">{{ t('userReports.ordersHint') }}</p>
            <div class="max-w-full overflow-x-auto custom-scrollbar">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/5">
                    <SortableTh label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
                    <SortableTh :label="t('userReports.client')" sortable :active="sortKey === 'clientFullName'" :direction="sortKey === 'clientFullName' ? sortDir : null" @sort="toggleSort('clientFullName')" />
                    <SortableTh :label="t('userReports.orderDate')" sortable :active="sortKey === 'orderDate'" :direction="sortKey === 'orderDate' ? sortDir : null" @sort="toggleSort('orderDate')" />
                    <SortableTh :label="t('common.status')" sortable :active="sortKey === 'orderStatus'" :direction="sortKey === 'orderStatus' ? sortDir : null" @sort="toggleSort('orderStatus')" />
                    <SortableTh :label="t('userReports.totalSales')" sortable align="right" :active="sortKey === 'totalSum'" :direction="sortKey === 'totalSum' ? sortDir : null" @sort="toggleSort('totalSum')" />
                    <SortableTh :label="t('userReports.paid')" sortable align="right" :active="sortKey === 'paidSum'" :direction="sortKey === 'paidSum' ? sortDir : null" @sort="toggleSort('paidSum')" />
                    <SortableTh :label="t('userReports.debt')" sortable align="right" :active="sortKey === 'debtSum'" :direction="sortKey === 'debtSum' ? sortDir : null" @sort="toggleSort('debtSum')" />
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr v-if="displayOrders.length === 0">
                    <td colspan="7" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td>
                  </tr>
                  <tr v-for="order in displayOrders" :key="order.id">
                    <td class="px-5 py-4">
                      <router-link :to="`/sale-orders/${order.id}/items`" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                        #{{ order.id }}
                      </router-link>
                    </td>
                    <td class="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{{ order.clientFullName || '—' }}</td>
                    <td class="px-5 py-4 text-sm text-gray-500">{{ formatDateTime(order.orderDate) }}</td>
                    <td class="px-5 py-4"><span :class="saleOrderStatusClass(order.orderStatus)">{{ saleOrderStatusLabel(order.orderStatus) }}</span></td>
                    <td class="px-5 py-4 text-right text-sm font-semibold text-brand-600">{{ formatMoney(order.totalSum) }}</td>
                    <td class="px-5 py-4 text-right text-sm text-success-600">{{ formatMoney(order.paidSum) }}</td>
                    <td class="px-5 py-4 text-right text-sm" :class="order.debtSum > 0 ? 'text-error-600' : 'text-gray-500'">{{ formatMoney(order.debtSum) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tab: Buyurtmalar holati -->
          <div v-show="activeTab === 'status'" class="px-4 py-5 sm:px-6">
            <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">{{ t('userReports.statusTabHint') }}</p>
            <div v-if="statusSummaries.length === 0" class="py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</div>
            <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="item in statusSummaries"
                :key="item.status"
                class="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-white/[0.03]"
              >
                <div class="px-5 py-5">
                  <span :class="saleOrderStatusClass(item.status)">{{ saleOrderStatusLabel(item.status) }}</span>
                  <p class="mt-4 text-3xl font-bold text-gray-800 dark:text-white/90">{{ item.orderCount }}</p>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('userReports.orderCount') }}</p>
                  <p class="mt-4 text-base font-semibold" :style="{ color: saleOrderStatusColor(item.status) }">
                    {{ formatMoney(item.totalAmount) }}
                  </p>
                  <div class="mt-4 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                    <div
                      class="h-full rounded-full transition-all"
                      :style="{ width: `${item.sharePercent}%`, backgroundColor: saleOrderStatusColor(item.status) }"
                    />
                  </div>
                  <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">{{ item.sharePercent }}% {{ t('userReports.share') }}</p>
                </div>
                <div class="h-1.5" :style="{ backgroundColor: saleOrderStatusColor(item.status) }" />
              </div>
            </div>
          </div>

          <div v-if="supplementaryLoading" class="border-b border-gray-100 px-4 py-3 text-sm text-gray-500 dark:border-gray-800 sm:px-6">
            {{ t('userReports.supplementaryLoading') }}
          </div>

          <!-- Tab: To'lovlar -->
          <div v-show="activeTab === 'payments'" class="px-4 py-5 sm:px-6">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('userReports.paymentsHint') }}</p>
              <p class="text-sm font-semibold text-success-600">{{ t('userReports.paymentsTotal') }}: {{ formatMoney(paymentsGrandTotal) }}</p>
            </div>
            <div class="max-w-full overflow-x-auto custom-scrollbar">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/5">
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('userReports.tabOrders') }}</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('userReports.client') }}</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('userReports.paymentDate') }}</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('userReports.paymentType') }}</th>
                    <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('userReports.paymentAmount') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr v-if="paymentRows.length === 0">
                    <td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td>
                  </tr>
                  <template v-for="row in paymentRows" :key="row.saleOrderId">
                    <tr v-for="(payment, idx) in row.payments" :key="payment.id" class="bg-white dark:bg-transparent">
                      <td class="px-5 py-3 text-sm">
                        <router-link
                          v-if="idx === 0"
                          :to="`/sale-orders/${row.saleOrderId}/items`"
                          class="font-medium text-brand-600 hover:underline dark:text-brand-400"
                        >
                          #{{ row.saleOrderId }}
                        </router-link>
                      </td>
                      <td class="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{{ idx === 0 ? row.clientName : '' }}</td>
                      <td class="px-5 py-3 text-sm text-gray-500">{{ formatDateTime(payment.paymentDate) }}</td>
                      <td class="px-5 py-3 text-sm text-gray-500">{{ payment.paymentTypeName || '—' }}</td>
                      <td class="px-5 py-3 text-right text-sm font-semibold text-success-600">{{ formatMoney(payment.paymentAmount) }}</td>
                    </tr>
                    <tr class="bg-gray-50/80 dark:bg-white/[0.02]">
                      <td colspan="4" class="px-5 py-2 text-right text-xs text-gray-500">
                        #{{ row.saleOrderId }} — {{ t('userReports.paid') }} / {{ formatMoney(row.orderTotal) }}
                      </td>
                      <td class="px-5 py-2 text-right text-xs font-semibold text-brand-600">{{ formatMoney(row.paidTotal) }}</td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tab: Mijozlar TOP -->
          <div v-show="activeTab === 'clients'" class="px-4 py-5 sm:px-6">
            <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">{{ t('userReports.clientsHint') }}</p>
            <div class="max-w-full overflow-x-auto custom-scrollbar">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/5">
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">#</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('userReports.client') }}</th>
                    <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('userReports.orderCount') }}</th>
                    <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('userReports.totalSales') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr v-if="topClients.length === 0">
                    <td colspan="4" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td>
                  </tr>
                  <tr v-for="(client, index) in topClients" :key="client.clientId">
                    <td class="px-5 py-4 text-sm text-gray-500">{{ index + 1 }}</td>
                    <td class="px-5 py-4 text-sm">
                      <router-link :to="`/clients/${client.clientId}`" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                        {{ client.clientName }}
                      </router-link>
                    </td>
                    <td class="px-5 py-4 text-right text-sm text-gray-800 dark:text-white/90">{{ client.orderCount }}</td>
                    <td class="px-5 py-4 text-right text-sm font-semibold text-brand-600">{{ formatMoney(client.totalAmount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tab: Mahsulotlar TOP -->
          <div v-show="activeTab === 'products'" class="px-4 py-5 sm:px-6">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('userReports.productsHint') }}</p>
              <div class="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
                <button
                  type="button"
                  class="rounded-md px-3 py-1.5 text-xs font-medium transition"
                  :class="productMode === 'amount' ? 'bg-brand-500 text-white' : 'text-gray-500'"
                  @click="productMode = 'amount'"
                >
                  {{ t('userReports.amount') }}
                </button>
                <button
                  type="button"
                  class="rounded-md px-3 py-1.5 text-xs font-medium transition"
                  :class="productMode === 'quantity' ? 'bg-brand-500 text-white' : 'text-gray-500'"
                  @click="productMode = 'quantity'"
                >
                  {{ t('userReports.quantity') }}
                </button>
              </div>
            </div>

            <div v-if="topProducts.length === 0" class="py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</div>
            <template v-else>
              <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
                  <VueApexCharts type="bar" height="280" :options="popularBarOptions" :series="popularBarSeries" />
                </div>
                <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
                  <VueApexCharts type="donut" height="280" :options="popularDonutOptions" :series="popularDonutSeries" />
                </div>
              </div>
              <div class="mt-5 max-w-full overflow-x-auto custom-scrollbar">
                <table class="min-w-full">
                  <thead>
                    <tr class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/5">
                      <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">#</th>
                      <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('userReports.productName') }}</th>
                      <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('userReports.quantity') }}</th>
                      <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('userReports.amount') }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr v-for="(product, index) in topProducts" :key="product.goodsId">
                      <td class="px-5 py-4 text-sm text-gray-500">{{ index + 1 }}</td>
                      <td class="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{{ product.name }}</td>
                      <td class="px-5 py-4 text-right text-sm text-white">{{ product.quantity }}</td>
                      <td class="px-5 py-4 text-right text-sm font-semibold text-brand-600">{{ formatMoney(product.amount) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="windowStats.hasEnoughData" class="mt-5 rounded-xl border border-gray-200 bg-gray-50/60 p-5 dark:border-gray-800 dark:bg-white/[0.02]">
                <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('userReports.windowStatsTitle') }}</h4>
                <dl class="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt class="text-gray-500">{{ t('userReports.windowTotalArea') }}</dt>
                    <dd class="mt-1 font-semibold text-gray-800 dark:text-white/90">{{ formatAreaM2(windowStats.totalAreaM2) }}</dd>
                  </div>
                  <div>
                    <dt class="text-gray-500">{{ t('userReports.windowAvgArea') }}</dt>
                    <dd class="mt-1 font-semibold text-gray-800 dark:text-white/90">{{ formatAreaM2(windowStats.avgAreaM2) }}</dd>
                  </div>
                  <div>
                    <dt class="text-gray-500">{{ t('userReports.windowOrderCount') }}</dt>
                    <dd class="mt-1 font-semibold text-gray-800 dark:text-white/90">{{ windowStats.windowOrderCount }}</dd>
                  </div>
                  <div>
                    <dt class="text-gray-500">{{ t('userReports.windowItemCount') }}</dt>
                    <dd class="mt-1 font-semibold text-gray-800 dark:text-white/90">{{ windowStats.windowItemCount }}</dd>
                  </div>
                </dl>
              </div>
            </template>
          </div>

          <!-- Tab: Pozitsiyalar -->
          <div v-show="activeTab === 'items'" class="px-4 py-5 sm:px-6">
            <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">{{ t('userReports.itemsHint') }}</p>
            <div class="max-w-full overflow-x-auto custom-scrollbar">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/5">
                    <SortableTh label="ID" sortable :active="itemSortKey === 'id'" :direction="itemSortKey === 'id' ? itemSortDir : null" @sort="toggleItemSort('id')" />
                    <SortableTh :label="t('userReports.tabOrders')" sortable :active="itemSortKey === 'saleOrderId'" :direction="itemSortKey === 'saleOrderId' ? itemSortDir : null" @sort="toggleItemSort('saleOrderId')" />
                    <SortableTh :label="t('userReports.client')" sortable :active="itemSortKey === 'clientFullName'" :direction="itemSortKey === 'clientFullName' ? itemSortDir : null" @sort="toggleItemSort('clientFullName')" />
                    <SortableTh :label="t('userReports.productName')" sortable :active="itemSortKey === 'goodsName'" :direction="itemSortKey === 'goodsName' ? itemSortDir : null" @sort="toggleItemSort('goodsName')" />
                    <SortableTh :label="t('userReports.quantity')" sortable align="right" :active="itemSortKey === 'count'" :direction="itemSortKey === 'count' ? itemSortDir : null" @sort="toggleItemSort('count')" />
                    <SortableTh :label="t('userReports.amount')" sortable align="right" :active="itemSortKey === 'priceSelling'" :direction="itemSortKey === 'priceSelling' ? itemSortDir : null" @sort="toggleItemSort('priceSelling')" />
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr v-if="displayUserSaleItems.length === 0">
                    <td colspan="6" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td>
                  </tr>
                  <tr v-for="item in displayUserSaleItems" :key="item.id">
                    <td class="px-5 py-4 text-sm text-gray-500">{{ item.id }}</td>
                    <td class="px-5 py-4 text-sm">
                      <router-link :to="`/sale-orders/${item.saleOrderId}/items`" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                        #{{ item.saleOrderId }}
                      </router-link>
                    </td>
                    <td class="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{{ item.clientFullName || '—' }}</td>
                    <td class="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{{ item.goodsName }}</td>
                    <td class="px-5 py-4 text-right text-sm text-gray-500">{{ item.count }}</td>
                    <td class="px-5 py-4 text-right text-sm font-semibold text-brand-600">{{ formatMoney(item.priceSelling) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tab: Hisobotlar -->
          <div v-show="activeTab === 'reports'" class="px-4 py-5 sm:px-6">
            <div class="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div class="rounded-xl border border-gray-200 bg-gray-50/60 p-5 dark:border-gray-800 dark:bg-white/[0.02] xl:col-span-1">
                <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('userReports.reportSummary') }}</h4>
                <dl class="mt-4 space-y-3 text-sm">
                  <div class="flex justify-between gap-3">
                    <dt class="text-gray-500">{{ t('userReports.period') }}</dt>
                    <dd class="text-right font-medium text-gray-800 dark:text-white/90">{{ appliedStart }} — {{ appliedEnd }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-gray-500">{{ t('userReports.orderCount') }}</dt>
                    <dd class="font-medium text-gray-800 dark:text-white/90">{{ summary.orderCount }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-gray-500">{{ t('userReports.totalSales') }}</dt>
                    <dd class="font-medium text-brand-600 dark:text-brand-400">{{ formatMoney(summary.totalAmount) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-gray-500">{{ t('userReports.avgCheckLabel') }}</dt>
                    <dd class="font-medium text-gray-800 dark:text-white/90">{{ formatMoney(avgCheckAmount) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-gray-500">{{ t('userReports.paid') }}</dt>
                    <dd class="font-medium text-success-600">{{ formatMoney(summary.paidAmount) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-gray-500">{{ t('userReports.debt') }}</dt>
                    <dd class="font-medium" :class="summary.debtAmount > 0 ? 'text-error-600' : 'text-gray-800 dark:text-white/90'">
                      {{ formatMoney(summary.debtAmount) }}
                    </dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-gray-500">{{ t('userReports.completed') }}</dt>
                    <dd class="font-medium text-gray-800 dark:text-white/90">{{ summary.completedCount }}</dd>
                  </div>
                </dl>
              </div>

              <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02] xl:col-span-2">
                <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('userReports.chartSalesTrendTitle') }}</h4>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('userReports.chartSalesTrendHint') }}</p>
                <VueApexCharts
                  v-if="hasTimelineData"
                  type="line"
                  height="300"
                  class="mt-4"
                  :options="salesTrendOptions"
                  :series="salesTrendSeries"
                />
                <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
              </div>
            </div>

            <div class="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
                <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('userReports.chartStatusTitle') }}</h4>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('userReports.chartStatusHint') }}</p>
                <VueApexCharts
                  v-if="statusChartItems.length"
                  type="donut"
                  height="320"
                  class="mt-4"
                  :options="statusDonutOptions"
                  :series="statusDonutSeries"
                />
                <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
              </div>

              <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
                <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('userReports.chartPaymentTitle') }}</h4>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('userReports.chartPaymentHint') }}</p>
                <VueApexCharts
                  v-if="hasPaymentChartData"
                  type="pie"
                  height="320"
                  class="mt-4"
                  :options="paymentPieOptions"
                  :series="paymentPieSeries"
                />
                <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
              </div>
            </div>

            <div class="mt-5 flex flex-wrap gap-3">
              <button type="button" :class="btnOutline" @click="exportCsv">
                <Download class="h-4 w-4" />
                {{ t('userReports.exportCsv') }}
              </button>
              <button type="button" :class="btnOutline" @click="printReport">
                <Printer class="h-4 w-4" />
                {{ t('userReports.exportPdf') }}
              </button>
            </div>

            <div class="mt-5 rounded-xl border border-gray-200 bg-gray-50/60 p-5 dark:border-gray-800 dark:bg-white/[0.02]">
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('userReports.periodComparison') }}</h4>
              <p class="mt-1 text-xs text-gray-500">{{ t('userReports.previousPeriod') }}: {{ previousPeriod.startDate }} — {{ previousPeriod.endDate }}</p>
              <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <p class="text-xs text-gray-500">{{ t('userReports.totalSales') }}</p>
                  <p class="mt-1 text-lg font-bold text-brand-600">{{ formatMoney(summary.totalAmount) }}</p>
                  <p class="text-sm text-gray-500">{{ formatMoney(previousSummary.totalAmount) }}</p>
                  <p v-if="formatDeltaText(salesDelta, true)" class="mt-1 flex items-center gap-1 text-xs" :class="salesDelta.delta >= 0 ? 'text-success-600' : 'text-error-600'">
                    <TrendingUp v-if="salesDelta.delta >= 0" class="h-3.5 w-3.5" />
                    <TrendingDown v-else class="h-3.5 w-3.5" />
                    {{ formatDeltaText(salesDelta, true) }}
                  </p>
                </div>
                <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <p class="text-xs text-gray-500">{{ t('userReports.orderCount') }}</p>
                  <p class="mt-1 text-lg font-bold text-gray-800 dark:text-white/90">{{ summary.orderCount }}</p>
                  <p class="text-sm text-gray-500">{{ previousSummary.orderCount }}</p>
                  <p v-if="formatDeltaText(ordersDelta, false)" class="mt-1 flex items-center gap-1 text-xs" :class="ordersDelta.delta >= 0 ? 'text-success-600' : 'text-error-600'">
                    <TrendingUp v-if="ordersDelta.delta >= 0" class="h-3.5 w-3.5" />
                    <TrendingDown v-else class="h-3.5 w-3.5" />
                    {{ formatDeltaText(ordersDelta, false) }}
                  </p>
                </div>
              </div>
            </div>

            <div v-if="orderItems.length > 0" class="mt-5 rounded-xl border border-gray-200 bg-gray-50/60 p-5 dark:border-gray-800 dark:bg-white/[0.02]">
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('userReports.profitTitle') }}</h4>
              <dl class="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt class="text-gray-500">{{ t('userReports.totalSales') }}</dt>
                  <dd class="mt-1 font-semibold text-brand-600">{{ formatMoney(profitStats.totalRevenue) }}</dd>
                </div>
                <div>
                  <dt class="text-gray-500">{{ t('userReports.totalCost') }}</dt>
                  <dd class="mt-1 font-semibold text-gray-800 dark:text-white/90">{{ formatMoney(profitStats.totalCost) }}</dd>
                </div>
                <div>
                  <dt class="text-gray-500">{{ t('userReports.totalProfit') }}</dt>
                  <dd class="mt-1 font-semibold text-success-600">{{ formatMoney(profitStats.totalProfit) }}</dd>
                </div>
                <div>
                  <dt class="text-gray-500">{{ t('userReports.marginPercent') }}</dt>
                  <dd class="mt-1 font-semibold text-gray-800 dark:text-white/90">{{ profitStats.marginPercent.toFixed(1) }}%</dd>
                </div>
              </dl>
            </div>

            <div class="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
                <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('userReports.activityTitle') }}</h4>
                <dl class="mt-4 space-y-3 text-sm">
                  <div class="flex justify-between gap-3">
                    <dt class="text-gray-500">{{ t('userReports.lastOrderDate') }}</dt>
                    <dd class="font-medium text-gray-800 dark:text-white/90">{{ formatDateTime(activityStats.lastOrderDate ?? undefined) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-gray-500">{{ t('userReports.dailyAvgOrders') }}</dt>
                    <dd class="font-medium text-gray-800 dark:text-white/90">{{ activityStats.dailyAvgOrders.toFixed(1) }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-gray-500">{{ t('userReports.busiestDay') }}</dt>
                    <dd class="font-medium text-gray-800 dark:text-white/90">{{ busiestDayLabel }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-gray-500">{{ t('userReports.busiestHour') }}</dt>
                    <dd class="font-medium text-gray-800 dark:text-white/90">{{ busiestHourLabel }}</dd>
                  </div>
                </dl>
                <h5 class="mt-5 text-xs font-semibold text-gray-700 dark:text-gray-300">{{ t('userReports.hourlyChartTitle') }}</h5>
                <VueApexCharts
                  v-if="summary.orderCount > 0"
                  type="line"
                  height="220"
                  class="mt-3"
                  :options="hourlyChartOptions"
                  :series="hourlyChartSeries"
                />
              </div>

              <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
                <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('userReports.warehouseTitle') }}</h4>
                <p class="mt-1 text-xs text-gray-500">{{ t('userReports.warehouseChartHint') }}</p>
                <VueApexCharts
                  v-if="warehouseStats.length"
                  type="pie"
                  height="280"
                  class="mt-4"
                  :options="warehousePieOptions"
                  :series="warehousePieSeries"
                />
                <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
              </div>
            </div>

            <div v-if="sellerRank.rank > 0" class="mt-5 rounded-xl border border-gray-200 bg-gray-50/60 p-5 dark:border-gray-800 dark:bg-white/[0.02]">
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('userReports.sellerRankTitle') }}</h4>
              <p class="mt-1 text-xs text-gray-500">{{ t('userReports.sellerRankHint') }}</p>
              <p class="mt-3 text-lg font-bold text-brand-600">
                {{ t('userReports.rankPosition', { rank: sellerRank.rank, total: sellerRank.totalSellers }) }}
              </p>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {{ t('userReports.marketShare', { percent: sellerRank.sharePercent.toFixed(1) }) }}
              </p>
              <div class="mt-4 max-w-full overflow-x-auto custom-scrollbar">
                <table class="min-w-full text-sm">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th class="px-3 py-2 text-left text-xs text-gray-500">#</th>
                      <th class="px-3 py-2 text-left text-xs text-gray-500">{{ t('userReports.user') }}</th>
                      <th class="px-3 py-2 text-right text-xs text-gray-500">{{ t('userReports.orderCount') }}</th>
                      <th class="px-3 py-2 text-right text-xs text-gray-500">{{ t('userReports.totalSales') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(seller, index) in sellerRank.topSellers"
                      :key="seller.userId"
                      class="border-b border-gray-100 dark:border-gray-800"
                      :class="seller.userId === userId ? 'bg-brand-500/5' : ''"
                    >
                      <td class="px-3 py-2">{{ index + 1 }}</td>
                      <td class="px-3 py-2">
                        <router-link
                          :to="`/reports/users/${seller.userId}`"
                          class="hover:text-brand-600"
                          :class="seller.userId === userId ? 'font-semibold text-brand-600' : 'text-gray-800 dark:text-white/90'"
                        >
                          {{ seller.userName }}
                        </router-link>
                      </td>
                      <td class="px-3 py-2 text-right">{{ seller.orderCount }}</td>
                      <td class="px-3 py-2 text-right font-medium">{{ formatMoney(seller.totalAmount) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Tab: SMS -->
          <div v-show="activeTab === 'sms'" class="px-4 py-5 sm:px-6">
            <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">{{ t('userReports.smsHint') }}</p>
            <div class="max-w-full overflow-x-auto custom-scrollbar">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/5">
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('userReports.client') }}</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('userReports.smsPhone') }}</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('userReports.smsSentAt') }}</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('userReports.smsStatus') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr v-if="filteredSmsHistory.length === 0">
                    <td colspan="4" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td>
                  </tr>
                  <tr v-for="sms in filteredSmsHistory" :key="sms.id">
                    <td class="px-5 py-4 text-sm">
                      <router-link
                        v-if="sms.clientId"
                        :to="`/clients/${sms.clientId}`"
                        class="font-medium text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {{ sms.clientFullName || `#${sms.clientId}` }}
                      </router-link>
                      <span v-else>{{ sms.clientFullName || '—' }}</span>
                    </td>
                    <td class="px-5 py-4 text-sm text-gray-500">{{ sms.phone || '—' }}</td>
                    <td class="px-5 py-4 text-sm text-gray-500">{{ formatDateTime(sms.sentAt || sms.createdAt) }}</td>
                    <td class="px-5 py-4 text-sm">
                      <span
                        class="rounded-full px-2.5 py-1 text-xs font-medium"
                        :class="sms.success ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400' : 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400'"
                      >
                        {{ sms.success ? t('userReports.smsSuccess') : (sms.errorMessage || sms.status || t('userReports.smsFailed')) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tab: Audit -->
          <div v-show="activeTab === 'audit'" class="px-4 py-5 sm:px-6">
            <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">{{ t('userReports.auditHint') }}</p>
            <div class="max-w-full overflow-x-auto custom-scrollbar">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/5">
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('userReports.auditAt') }}</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('userReports.auditEntity') }}</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('userReports.auditAction') }}</th>
                    <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('userReports.auditDescription') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                  <tr v-if="filteredAuditLogs.length === 0">
                    <td colspan="4" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td>
                  </tr>
                  <tr v-for="log in filteredAuditLogs" :key="log.id">
                    <td class="px-5 py-4 text-sm text-gray-500">{{ formatDateTime(log.createdAt) }}</td>
                    <td class="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{{ log.entity || '—' }}</td>
                    <td class="px-5 py-4 text-sm text-gray-500">{{ log.action || '—' }}</td>
                    <td class="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{{ log.description || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tab: Ma'lumotlari -->
          <div v-show="activeTab === 'info'" class="px-4 py-5 sm:px-6">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('userReports.userInfoHint') }}</p>
              <button
                v-if="user"
                type="button"
                :class="btnOutline"
                @click="openEditModal"
              >
                <Pencil class="h-4 w-4" />
                {{ t('common.edit') }}
              </button>
            </div>

            <div class="rounded-xl border border-gray-200 bg-gray-50/60 p-5 dark:border-gray-800 dark:bg-white/[0.02]">
              <dl class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div class="flex justify-between gap-3 sm:flex-col sm:justify-start">
                  <dt class="text-gray-500">{{ t('userReports.user') }}</dt>
                  <dd class="font-medium text-gray-800 dark:text-white/90">{{ user?.fullName || '—' }}</dd>
                </div>
                <div class="flex justify-between gap-3 sm:flex-col sm:justify-start">
                  <dt class="text-gray-500">{{ t('userReports.username') }}</dt>
                  <dd class="font-medium text-gray-800 dark:text-white/90">{{ user?.username || '—' }}</dd>
                </div>
                <div class="flex justify-between gap-3 sm:flex-col sm:justify-start">
                  <dt class="text-gray-500">{{ t('userReports.phone') }}</dt>
                  <dd class="font-medium text-gray-800 dark:text-white/90">{{ user?.phone || '—' }}</dd>
                </div>
                <div class="flex justify-between gap-3 sm:flex-col sm:justify-start">
                  <dt class="text-gray-500">{{ t('userReports.status') }}</dt>
                  <dd class="font-medium text-gray-800 dark:text-white/90">{{ userStatusLabel(user?.status) }}</dd>
                </div>
                <div class="flex justify-between gap-3 sm:flex-col sm:justify-start">
                  <dt class="text-gray-500">{{ t('userReports.roles') }}</dt>
                  <dd class="font-medium text-gray-800 dark:text-white/90">{{ roleNames || '—' }}</dd>
                </div>
                <div class="flex justify-between gap-3 sm:flex-col sm:justify-start">
                  <dt class="text-gray-500">{{ t('userReports.createdAt') }}</dt>
                  <dd class="font-medium text-gray-800 dark:text-white/90">{{ formatDateTime(user?.createdAt) }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </template>
    </div>

    <Modal v-if="showEditModal" @close="closeEditModal">
      <template #body>
        <div class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('userReports.editUserTitle') }}</h4>

          <div v-if="formError" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {{ formError }}
          </div>
          <div v-if="formSuccess" class="mb-4 rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
            {{ formSuccess }}
          </div>

          <form class="space-y-4" @submit.prevent="submitEditForm">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('userReports.photo') }}</label>
              <div class="flex items-center gap-4">
                <UserAvatar
                  v-if="!photoPreview"
                  :photo-link="user?.photoLink"
                  :alt="editForm.fullName || user?.fullName"
                  size="lg"
                />
                <div v-else class="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <img :src="photoPreview" alt="Preview" class="h-full w-full object-cover" />
                </div>
                <div>
                  <input ref="photoInputRef" type="file" accept="image/*" class="hidden" @change="onPhotoSelected" />
                  <button type="button" :class="btnOutline + ' !py-2 !text-xs'" @click="photoInputRef?.click()">
                    {{ t('userReports.choosePhoto') }}
                  </button>
                  <button
                    v-if="photoPreview || selectedPhoto"
                    type="button"
                    class="ml-2 text-sm text-red-500 hover:text-red-600"
                    @click="clearPhoto"
                  >
                    {{ t('userReports.removePhoto') }}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('userReports.fullName') }}<span class="text-error-500">*</span>
              </label>
              <input v-model="editForm.fullName" type="text" required :class="inputClass" />
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('userReports.username') }}<span class="text-error-500">*</span>
                </label>
                <input v-model="editForm.username" type="text" required :class="inputClass" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('userReports.phone') }}<span class="text-error-500">*</span>
                </label>
                <input v-model="editForm.phone" type="text" required :class="inputClass" />
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('userReports.password') }}
                <span class="text-xs text-gray-400">({{ t('userReports.passwordOptional') }})</span>
              </label>
              <input v-model="editForm.password" type="password" autocomplete="new-password" :class="inputClass" />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('userReports.roles') }}<span class="text-error-500">*</span>
              </label>
              <div v-if="rolesLoading" class="text-sm text-gray-400">{{ t('common.loading') }}</div>
              <div v-else class="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <label
                  v-for="role in availableRoles"
                  :key="role.id"
                  class="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input v-model="editForm.roleIds" type="checkbox" :value="role.id" class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                  {{ role.name }}
                </label>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" :class="btnOutline" @click="closeEditModal">{{ t('common.cancel') }}</button>
              <button type="submit" :disabled="saving" :class="btnPrimary">
                {{ saving ? t('common.saving') : t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Pencil, TrendingUp, TrendingDown, Printer, Download } from 'lucide-vue-next'
import VueApexCharts from 'vue3-apexcharts'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import Modal from '@/components/ui/Modal.vue'
import { useTableSort } from '@/composables/useTableControls'
import { fetchUserById, fetchAllUsers, fetchUserStats, updateUser, type UserFormData, type UserStatResponse } from '@/services/users'
import { fetchAllRoles, type RoleResponse, type Status } from '@/services/roles'
import { fetchSaleOrdersByUser, fetchSaleOrdersByDateRange, type SaleOrderResponse } from '@/services/saleOrders'
import { fetchPaymentsBySaleOrder, type PaymentResponse } from '@/services/payments'
import { fetchSaleOrderItemsByOrder, fetchSaleOrderItemsByUser, type SaleOrderItemResponse } from '@/services/saleOrderItems'
import { fetchDebtNotificationHistory, type DebtNotificationHistoryResponse } from '@/services/notifications'
import { fetchAllAuditLogs, type AuditLog } from '@/services/audit'
import { filterOrdersByDateRange, summarizeOrdersForUser } from '@/utils/userReport'
import {
  buildActivityStats,
  buildProfitStats,
  buildSellerRank,
  buildTopClients,
  buildTopProducts,
  buildWarehouseStats,
  buildWindowStats,
  calcMetricDelta,
  countPeriodDays,
  filterAuditLogsForUser,
  getPreviousPeriodRange,
  groupPaymentsByOrder,
  loadItemsForOrders,
  loadPaymentsForOrders,
} from '@/utils/userReportAnalytics'
import { buildUserReportCsv, downloadUserReportCsv } from '@/utils/userReportExport'
import { formatAreaM2 } from '@/utils/saleOrderMeta'
import { formatIsoDate, getThisMonthRange } from '@/utils/dateRange'
import {
  SALE_ORDER_STATUSES,
  saleOrderStatusLabel,
  saleOrderStatusClass,
  saleOrderStatusColor,
} from '@/utils/saleOrderStatus'

type UserReportTab = 'orders' | 'status' | 'payments' | 'clients' | 'products' | 'items' | 'reports' | 'sms' | 'audit' | 'info'

const route = useRoute()
const { t, locale } = useI18n()
const monthRange = getThisMonthRange()

const userId = computed(() => Number(route.params.userId))
const loading = ref(false)
const errorMessage = ref('')
const user = ref<Awaited<ReturnType<typeof fetchUserById>> | null>(null)
const allOrders = ref<SaleOrderResponse[]>([])
const filterStart = ref(monthRange.startDate)
const filterEnd = ref(monthRange.endDate)
const appliedStart = ref(monthRange.startDate)
const appliedEnd = ref(monthRange.endDate)
const activeTab = ref<UserReportTab>('orders')
const supplementaryLoading = ref(false)
const orderItems = ref<SaleOrderItemResponse[]>([])
const userSaleItems = ref<SaleOrderItemResponse[]>([])
const userStats = ref<UserStatResponse | null>(null)
const allPayments = ref<PaymentResponse[]>([])
const smsHistory = ref<DebtNotificationHistoryResponse[]>([])
const auditLogs = ref<AuditLog[]>([])
const peerOrders = ref<SaleOrderResponse[]>([])
const allUsers = ref<Awaited<ReturnType<typeof fetchAllUsers>>>([])
const productMode = ref<'amount' | 'quantity'>('amount')

const { sortKey: itemSortKey, sortDir: itemSortDir, toggleSort: toggleItemSort, applySort: applyItemSort } = useTableSort<SaleOrderItemResponse>(
  (row, key) => row[key as keyof SaleOrderItemResponse],
)
const displayUserSaleItems = computed(() => applyItemSort(userSaleItems.value))

const showEditModal = ref(false)
const saving = ref(false)
const formError = ref('')
const formSuccess = ref('')
const rolesLoading = ref(false)
const availableRoles = ref<RoleResponse[]>([])
const photoInputRef = ref<HTMLInputElement | null>(null)
const selectedPhoto = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const editForm = reactive({
  username: '',
  password: '',
  fullName: '',
  phone: '',
  roleIds: [] as number[],
})

const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'

const formatMoney = (value: number) => `${new Intl.NumberFormat('uz-UZ').format(value)} so‘m`
const formatCompactMoney = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(Math.round(value))
}
const formatDateTime = (value?: string) => {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString('uz-UZ')
}
const userStatusLabel = (status?: Status | null) => {
  if (!status) return '—'
  return t(`common.statusValues.${status}`)
}
const formatDayLabel = (date: Date) => date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })

const pageTitle = computed(() => user.value?.fullName || t('userReports.detailTitle'))
const roleNames = computed(() => user.value?.role?.map((role) => role.name).join(', ') || '')

const filteredOrders = computed(() =>
  filterOrdersByDateRange(allOrders.value, appliedStart.value, appliedEnd.value),
)

const summary = computed(() => summarizeOrdersForUser(filteredOrders.value))
const avgCheckAmount = computed(() =>
  summary.value.orderCount > 0 ? summary.value.totalAmount / summary.value.orderCount : 0,
)

const periodDays = computed(() => countPeriodDays(appliedStart.value, appliedEnd.value))

const previousPeriod = computed(() => getPreviousPeriodRange(appliedStart.value, appliedEnd.value))

const previousOrders = computed(() =>
  filterOrdersByDateRange(allOrders.value, previousPeriod.value.startDate, previousPeriod.value.endDate),
)

const previousSummary = computed(() => summarizeOrdersForUser(previousOrders.value))

const salesDelta = computed(() => calcMetricDelta(summary.value.totalAmount, previousSummary.value.totalAmount))
const ordersDelta = computed(() => calcMetricDelta(summary.value.orderCount, previousSummary.value.orderCount))

const formatDeltaText = (delta: ReturnType<typeof calcMetricDelta>, isMoney = false) => {
  if (delta.percent == null && delta.delta === 0) return null
  const sign = delta.delta >= 0 ? '+' : ''
  const value = isMoney
    ? `${sign}${new Intl.NumberFormat('uz-UZ').format(Math.round(delta.delta))} so‘m`
    : `${sign}${delta.delta} ta`
  const percent = delta.percent != null ? ` (${sign}${delta.percent.toFixed(0)}%)` : ''
  return `${value}${percent}`
}

const topClients = computed(() => buildTopClients(filteredOrders.value))
const topProducts = computed(() => buildTopProducts(orderItems.value))
const windowStats = computed(() => buildWindowStats(orderItems.value))
const profitStats = computed(() => buildProfitStats(orderItems.value))
const warehouseStats = computed(() => buildWarehouseStats(filteredOrders.value))
const activityStats = computed(() => buildActivityStats(filteredOrders.value, periodDays.value))
const sellerRank = computed(() =>
  buildSellerRank(allUsers.value, peerOrders.value, userId.value),
)

const paymentRows = computed(() => groupPaymentsByOrder(filteredOrders.value, allPayments.value))
const paymentsGrandTotal = computed(() =>
  paymentRows.value.reduce((sum, row) => sum + row.paidTotal, 0),
)

const userClientIds = computed(() => {
  const ids = new Set<number>()
  for (const order of filteredOrders.value) {
    if (order.clientId) ids.add(order.clientId)
  }
  return ids
})

const filteredSmsHistory = computed(() =>
  smsHistory.value.filter((row) => row.clientId && userClientIds.value.has(row.clientId)),
)

const filteredAuditLogs = computed(() =>
  filterAuditLogsForUser(
    auditLogs.value,
    user.value?.username,
    new Set(filteredOrders.value.map((order) => order.id)),
  ),
)

const dayNames = computed(() =>
  locale.value === 'ru'
    ? ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    : ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'],
)

const busiestDayLabel = computed(() => {
  const idx = activityStats.value.busiestDayOfWeek
  return idx != null ? dayNames.value[idx] ?? '—' : '—'
})

const busiestHourLabel = computed(() => {
  const hour = activityStats.value.busiestHour
  return hour != null ? `${String(hour).padStart(2, '0')}:00` : '—'
})

const hourlyChartCategories = computed(() =>
  Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`),
)

const hourlyChartSeries = computed(() => [
  { name: t('userReports.orderCount'), data: activityStats.value.hourlyCounts },
])

const hourlyChartOptions = computed(() => ({
  ...baseChartOptions,
  chart: { ...baseChartOptions.chart, type: 'line' as const },
  colors: ['#8B5CF6'],
  stroke: { curve: 'smooth' as const, width: 3 },
  xaxis: {
    categories: hourlyChartCategories.value,
    labels: { style: { fontSize: '10px', colors: '#9CA3AF' }, rotate: -45 },
  },
  yaxis: {
    labels: { style: { fontSize: '11px', colors: '#9CA3AF' } },
    min: 0,
    forceNiceScale: true,
  },
  grid: { borderColor: '#374151', strokeDashArray: 4 },
}))

const warehousePieSeries = computed(() => warehouseStats.value.map((row) => row.totalAmount))

const warehousePieOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', type: 'pie' as const },
  colors: ['#465FFF', '#7592FF', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'],
  labels: warehouseStats.value.map((row) => row.warehouseName),
  legend: { position: 'bottom' as const, fontSize: '12px', labels: { colors: '#9CA3AF' } },
  dataLabels: { enabled: false },
  tooltip: { theme: 'dark', y: { formatter: (val: number) => formatMoney(val) } },
}))

const popularBarSeries = computed(() => [{
  name: productMode.value === 'amount' ? t('userReports.amount') : t('userReports.quantity'),
  data: topProducts.value.map((item) => (productMode.value === 'amount' ? item.amount : item.quantity)),
}])

const popularBarOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
  colors: ['#465FFF'],
  plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '60%' } },
  dataLabels: { enabled: false },
  xaxis: {
    categories: topProducts.value.map((item) => item.name),
    labels: { style: { fontSize: '11px', colors: '#9CA3AF' } },
  },
  tooltip: {
    theme: 'dark',
    y: {
      formatter: (val: number) => (productMode.value === 'amount' ? formatMoney(val) : String(val)),
    },
  },
}))

const popularDonutSeries = computed(() =>
  topProducts.value.map((item) => (productMode.value === 'amount' ? item.amount : item.quantity)),
)

const popularDonutOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', type: 'donut' as const },
  colors: ['#465FFF', '#7592FF', '#9CB9FF', '#22C55E', '#F59E0B'],
  labels: topProducts.value.map((item) => item.name),
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: '72%' } } },
  tooltip: {
    theme: 'dark',
    y: {
      formatter: (val: number) => (productMode.value === 'amount' ? formatMoney(val) : String(val)),
    },
  },
}))

const statusSummaries = computed(() => {
  const total = summary.value.totalAmount
  return SALE_ORDER_STATUSES.map((status) => {
    const matched = filteredOrders.value.filter((order) => order.orderStatus === status)
    const totalAmount = matched.reduce((sum, order) => sum + order.totalSum, 0)
    return {
      status,
      orderCount: matched.length,
      totalAmount,
      sharePercent: total > 0 ? Math.round((totalAmount / total) * 100) : 0,
    }
  }).filter((item) => item.orderCount > 0)
})

const statusChartItems = computed(() => statusSummaries.value.filter((item) => item.totalAmount > 0))

const mainTabs = computed(() => [
  { id: 'orders' as const, label: t('userReports.tabOrders'), count: filteredOrders.value.length },
  { id: 'status' as const, label: t('userReports.tabStatus'), count: statusSummaries.value.length },
  { id: 'payments' as const, label: t('userReports.tabPayments'), count: paymentRows.value.length },
  { id: 'clients' as const, label: t('userReports.tabClients'), count: topClients.value.length },
  { id: 'products' as const, label: t('userReports.tabProducts'), count: topProducts.value.length },
  { id: 'items' as const, label: t('userReports.tabItems'), count: userSaleItems.value.length },
  { id: 'reports' as const, label: t('userReports.tabReports'), count: null },
  { id: 'sms' as const, label: t('userReports.tabSms'), count: filteredSmsHistory.value.length },
  { id: 'audit' as const, label: t('userReports.tabAudit'), count: filteredAuditLogs.value.length },
  { id: 'info' as const, label: t('userReports.tabInfo'), count: null },
])

const kpiMetrics = computed(() => {
  const salesDeltaText = formatDeltaText(salesDelta.value, true)
  const ordersDeltaText = formatDeltaText(ordersDelta.value, false)
  const stats = userStats.value
  const orderCount = stats?.totalOrdersCount ?? summary.value.orderCount
  const totalAmount = stats?.totalOrdersSum ?? summary.value.totalAmount
  const paidAmount = stats?.totalPaidSum ?? summary.value.paidAmount
  const debtAmount = stats?.totalDebt ?? summary.value.debtAmount
  const avgCheck = orderCount > 0 ? totalAmount / orderCount : 0

  return [
    {
      key: 'orders',
      label: t('userReports.orderCount'),
      value: String(orderCount),
      valueClass: 'text-gray-800 dark:text-white/90',
      accentClass: 'bg-brand-500',
      delta: !stats && ordersDeltaText
        ? { positive: ordersDelta.value.delta >= 0, text: ordersDeltaText }
        : null,
    },
    {
      key: 'sales',
      label: t('userReports.totalSales'),
      value: formatMoney(totalAmount),
      valueClass: 'text-brand-600 dark:text-brand-400',
      accentClass: 'bg-brand-500',
      delta: !stats && salesDeltaText
        ? { positive: salesDelta.value.delta >= 0, text: salesDeltaText }
        : null,
    },
    {
      key: 'avgCheck',
      label: t('userReports.avgCheckLabel'),
      value: formatMoney(avgCheck),
      valueClass: 'text-gray-800 dark:text-white/90',
      accentClass: 'bg-warning-500',
      delta: null,
    },
    {
      key: 'paid',
      label: t('userReports.paid'),
      value: formatMoney(paidAmount),
      valueClass: 'text-success-600',
      accentClass: 'bg-success-500',
      delta: null,
    },
    {
      key: 'debt',
      label: t('userReports.debt'),
      value: formatMoney(debtAmount),
      valueClass: debtAmount > 0 ? 'text-error-600' : 'text-gray-500',
      accentClass: 'bg-error-500',
      delta: null,
    },
    {
      key: 'completed',
      label: t('userReports.completed'),
      value: String(summary.value.completedCount),
      valueClass: 'text-gray-800 dark:text-white/90',
      accentClass: 'bg-success-500',
      delta: null,
    },
  ]
})

const timelineData = computed(() => {
  const labels: string[] = []
  const salesData: number[] = []
  const debtData: number[] = []
  const dayKeys: string[] = []

  const start = new Date(`${appliedStart.value}T00:00:00`)
  const end = new Date(`${appliedEnd.value}T00:00:00`)

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const key = formatIsoDate(cursor)
    dayKeys.push(key)
    labels.push(formatDayLabel(cursor))
    salesData.push(0)
    debtData.push(0)
  }

  for (const order of filteredOrders.value) {
    const key = formatIsoDate(new Date(order.orderDate))
    const index = dayKeys.indexOf(key)
    if (index >= 0) {
      salesData[index] += order.totalSum
      debtData[index] += order.debtSum
    }
  }

  return { labels, salesData, debtData }
})

const hasTimelineData = computed(() => timelineData.value.labels.length > 0 && summary.value.orderCount > 0)
const hasPaymentChartData = computed(() => summary.value.paidAmount > 0 || summary.value.debtAmount > 0)

const baseChartOptions = {
  chart: {
    fontFamily: 'Outfit, sans-serif',
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  dataLabels: { enabled: false },
  tooltip: {
    theme: 'dark' as const,
    y: { formatter: (val: number) => formatMoney(val) },
  },
}

const salesTrendSeries = computed(() => [
  { name: t('userReports.totalSales'), data: timelineData.value.salesData },
  { name: t('userReports.debt'), data: timelineData.value.debtData },
])

const salesTrendOptions = computed(() => ({
  ...baseChartOptions,
  chart: { ...baseChartOptions.chart, type: 'line' as const },
  colors: ['#465FFF', '#EF4444'],
  stroke: { curve: 'smooth' as const, width: [3, 2] },
  markers: { size: 4, strokeWidth: 2 },
  xaxis: {
    categories: timelineData.value.labels,
    labels: {
      style: { fontSize: '11px', colors: '#9CA3AF' },
      rotate: -45,
      rotateAlways: timelineData.value.labels.length > 10,
    },
  },
  yaxis: {
    labels: {
      style: { fontSize: '11px', colors: '#9CA3AF' },
      formatter: (val: number) => formatCompactMoney(val),
    },
  },
  legend: {
    position: 'top' as const,
    horizontalAlign: 'right' as const,
    fontSize: '12px',
    labels: { colors: '#9CA3AF' },
  },
  grid: {
    borderColor: '#374151',
    strokeDashArray: 4,
    xaxis: { lines: { show: false } },
  },
}))

const statusDonutSeries = computed(() => statusChartItems.value.map((item) => item.totalAmount))

const statusDonutOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', type: 'donut' as const },
  colors: statusChartItems.value.map((item) => saleOrderStatusColor(item.status)),
  labels: statusChartItems.value.map((item) => saleOrderStatusLabel(item.status)),
  legend: {
    position: 'bottom' as const,
    fontSize: '12px',
    labels: { colors: '#9CA3AF' },
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
            label: t('userReports.totalSales'),
            formatter: () => formatCompactMoney(summary.value.totalAmount),
          },
        },
      },
    },
  },
  tooltip: {
    theme: 'dark',
    y: { formatter: (val: number) => formatMoney(val) },
  },
}))

const paymentPieSeries = computed(() => [summary.value.paidAmount, summary.value.debtAmount])

const paymentPieOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', type: 'pie' as const },
  colors: ['#22C55E', '#EF4444'],
  labels: [t('userReports.paid'), t('userReports.debt')],
  legend: {
    position: 'bottom' as const,
    fontSize: '12px',
    labels: { colors: '#9CA3AF' },
  },
  dataLabels: { enabled: false },
  tooltip: {
    theme: 'dark',
    y: { formatter: (val: number) => formatMoney(val) },
  },
}))

const { sortKey, sortDir, toggleSort, applySort } = useTableSort<SaleOrderResponse>((row, key) => {
  if (key === 'orderDate') return row.orderDate
  return row[key as keyof SaleOrderResponse]
})

const displayOrders = computed(() => applySort(filteredOrders.value))

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

const loadExtendedData = async () => {
  const orderIds = filteredOrders.value.map((order) => order.id)
  supplementaryLoading.value = true
  try {
    const [items, payments, sms, audit, peers, users] = await Promise.all([
      loadItemsForOrders(orderIds, fetchSaleOrderItemsByOrder),
      loadPaymentsForOrders(orderIds, fetchPaymentsBySaleOrder),
      fetchDebtNotificationHistory(0, 1000),
      fetchAllAuditLogs(),
      fetchSaleOrdersByDateRange(appliedStart.value, appliedEnd.value),
      allUsers.value.length > 0 ? Promise.resolve(allUsers.value) : fetchAllUsers(),
    ])
    orderItems.value = items.filter((item) => item.status === 'ACTIVE')
    allPayments.value = payments.filter((payment) => payment.status === 'ACTIVE')
    smsHistory.value = sms
    auditLogs.value = audit
    peerOrders.value = peers.filter((order) => order.status === 'ACTIVE')
    allUsers.value = users
  } catch {
    orderItems.value = []
    allPayments.value = []
    smsHistory.value = []
    auditLogs.value = []
    peerOrders.value = []
  } finally {
    supplementaryLoading.value = false
  }
}

const exportCsv = () => {
  if (!user.value) return
  const csv = buildUserReportCsv(
    {
      userName: user.value.fullName,
      periodStart: appliedStart.value,
      periodEnd: appliedEnd.value,
      orderCount: summary.value.orderCount,
      totalAmount: summary.value.totalAmount,
      paidAmount: summary.value.paidAmount,
      debtAmount: summary.value.debtAmount,
      completedCount: summary.value.completedCount,
      avgCheck: avgCheckAmount.value,
    },
    filteredOrders.value,
  )
  const filename = `user-report-${user.value.id}-${appliedStart.value}-${appliedEnd.value}.csv`
  downloadUserReportCsv(filename, csv)
}

const printReport = () => window.print()

const loadData = async () => {
  if (!userId.value || Number.isNaN(userId.value)) return
  loading.value = true
  errorMessage.value = ''
  try {
    const [userData, orders, stats, itemsByUser] = await Promise.all([
      fetchUserById(userId.value),
      fetchSaleOrdersByUser(userId.value),
      fetchUserStats(userId.value).catch(() => null),
      fetchSaleOrderItemsByUser(userId.value).catch(() => [] as SaleOrderItemResponse[]),
    ])
    user.value = userData
    allOrders.value = orders.filter((order) => order.status === 'ACTIVE')
    userStats.value = stats && typeof stats === 'object' && 'totalOrdersCount' in stats
      ? stats
      : null
    userSaleItems.value = Array.isArray(itemsByUser) ? itemsByUser : []
    await loadExtendedData()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
    user.value = null
    allOrders.value = []
    userStats.value = null
    userSaleItems.value = []
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  appliedStart.value = filterStart.value
  appliedEnd.value = filterEnd.value
  loadExtendedData()
}

const resetFilter = () => {
  filterStart.value = monthRange.startDate
  filterEnd.value = monthRange.endDate
  appliedStart.value = monthRange.startDate
  appliedEnd.value = monthRange.endDate
  loadExtendedData()
}

const clearPhoto = () => {
  selectedPhoto.value = null
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = null
  if (photoInputRef.value) photoInputRef.value.value = ''
}

const onPhotoSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  selectedPhoto.value = file
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = URL.createObjectURL(file)
}

const openEditModal = () => {
  if (!user.value) return
  editForm.username = user.value.username
  editForm.password = ''
  editForm.fullName = user.value.fullName
  editForm.phone = user.value.phone
  editForm.roleIds = (user.value.role || []).map((role) => role.id)
  formError.value = ''
  formSuccess.value = ''
  clearPhoto()
  showEditModal.value = true
  if (availableRoles.value.length === 0) loadRoles()
}

const closeEditModal = () => {
  showEditModal.value = false
  formError.value = ''
  formSuccess.value = ''
  clearPhoto()
}

const submitEditForm = async () => {
  if (!user.value) return
  formError.value = ''
  formSuccess.value = ''
  if (editForm.roleIds.length === 0) {
    formError.value = t('userReports.roleRequired')
    return
  }

  saving.value = true
  try {
    const payload: UserFormData = {
      username: editForm.username.trim(),
      fullName: editForm.fullName.trim(),
      phone: editForm.phone.trim(),
      roleIds: editForm.roleIds,
      photo: selectedPhoto.value,
    }
    if (editForm.password.trim()) {
      payload.password = editForm.password.trim()
    }
    user.value = await updateUser(user.value.id, payload)
    formSuccess.value = t('userReports.saveSuccess')
    setTimeout(() => {
      closeEditModal()
    }, 700)
  } catch (e) {
    formError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    saving.value = false
  }
}

watch(userId, () => {
  activeTab.value = 'orders'
  loadData()
}, { immediate: true })

onMounted(loadData)
onUnmounted(() => {
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
})
</script>

<style>
@media print {
  body * { visibility: hidden; }
  #user-report-print-area, #user-report-print-area * { visibility: visible; }
  #user-report-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none;
  }
  .print\:hidden { display: none !important; }
}
</style>
