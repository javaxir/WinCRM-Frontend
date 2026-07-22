<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />

    <div class="space-y-5 sm:space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <router-link
          to="/clients"
          class="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
        >
          ← Mijozlar ro‘yxati
        </router-link>
      </div>

      <div v-if="errorMessage" class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
        {{ errorMessage }}
      </div>

      <div v-if="loading" class="py-12 text-center text-gray-500">Yuklanmoqda...</div>

      <template v-else-if="client">
        <div class="space-y-5">
          <ClientDetailHeader
            :client="client"
            :total-sales="financeSummary.totalSales"
            :total-paid="financeSummary.totalPayments"
            :debt="financeSummary.clientDebt"
            :segment="clientSegment"
            :last-activity-label="lastActivityLabel"
            :promised-payment-date="promisedPaymentDate"
            @new-order="openOrderForm"
            @add-payment="openPaymentForm"
            @send-sms="sendClientDebtSms"
            @send-telegram="openTelegramForm"
          />

          <div class="inline-flex w-full flex-wrap gap-1 rounded-2xl border border-gray-200 bg-gray-100 p-1.5 dark:border-gray-800 dark:bg-gray-900">
            <button
              v-for="tab in clientTabs"
              :key="tab.id"
              type="button"
              @click="activeTab = tab.id"
              :class="[
                'rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white',
              ]"
            >
              {{ tab.label }}
            </button>
          </div>

          <ClientOverviewTab
            v-show="activeTab === 'overview'"
            :client-id="clientId"
            :debt-aging="debtAging"
            :profit="profitStats"
            :window-stats="windowStatsData"
            :seller-stats="sellerStats"
            :warehouse-stats="warehouseStatsData"
            :total-debt="financeSummary.clientDebt"
            :total-sales="financeSummary.totalSales"
            :orders-count="ordersCount"
            :average-check="averageCheck"
            :days-since-activity="daysSinceActivity"
            :promised-payment-date="promisedPaymentDate"
            @promised-updated="refreshPromisedDate"
          />

          <div v-show="activeTab === 'analytics'" class="space-y-5">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div class="flex items-start justify-between gap-3 p-5">
                  <div class="flex items-start gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5">
                      <Calendar class="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ formatShortDate(lastActivityDate) }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('clientDetail.lastActivity') }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-3xl font-bold text-orange-500">{{ daysSinceActivity }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('clientDetail.daysAgo') }}</p>
                  </div>
                </div>
                <div class="h-1.5 bg-orange-500"></div>
              </div>

              <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div class="flex items-center gap-3 p-5">
                  <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5">
                    <CalendarClock class="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                    {{ t('clientDetail.promisedPayment') }}
                    <span v-if="promisedPaymentDate" :class="promisedPaymentDays != null && promisedPaymentDays < 0 ? 'text-error-600' : 'text-warning-500'">
                      {{ formatDate(promisedPaymentDate) }}
                      <span v-if="promisedPaymentDays != null"> ({{ promisedPaymentDays >= 0 ? t('clientDetail.promisedDays', { count: promisedPaymentDays }) : t('clientDetail.promisedOverdue') }})</span>
                    </span>
                    <span v-else class="text-gray-500">—</span>
                  </p>
                </div>
                <div class="h-1.5 bg-warning-500"></div>
              </div>

              <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-xl font-bold text-gray-800 dark:text-white/90">{{ formatMoney(averageCheck) }}</p>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('clientDetail.averageCheck') }}</p>
                  </div>
                  <div class="h-16 w-28">
                    <VueApexCharts v-if="averageCheckSeries[0].data.length" type="bar" height="64" width="112" :options="miniBarOptions" :series="averageCheckSeries" />
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-xl font-bold text-gray-800 dark:text-white/90">{{ ordersCount }} {{ t('sms.orders') }}</p>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('clientDetail.orders') }}</p>
                  </div>
                  <div class="h-16 w-28">
                    <VueApexCharts v-if="ordersSparklineSeries[0].data.length" type="line" height="64" width="112" :options="sparklineOptions" :series="ordersSparklineSeries" />
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <div class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.salesTrend') }}</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.salesTrendHint') }}</p>
                <div class="mt-5">
                  <VueApexCharts v-if="monthlyStats.labels.length" type="area" height="300" :options="salesLineOptions" :series="salesLineSeries" />
                  <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                </div>
              </div>

              <div class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.ordersTrend') }}</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.ordersTrendHint') }}</p>
                <div class="mt-5">
                  <VueApexCharts v-if="monthlyStats.labels.length" type="line" height="300" :options="ordersLineOptions" :series="ordersLineSeries" />
                  <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <div class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.paymentsTrend') }}</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.paymentsTrendHint') }}</p>
                <div class="mt-5">
                  <VueApexCharts v-if="monthlyPaymentStats.labels.length" type="line" height="300" :options="paymentsLineOptions" :series="paymentsLineSeries" />
                  <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                </div>
              </div>

              <div class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.debtSummary') }}</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.debtSummaryHint') }}</p>
                <div class="mt-5">
                  <VueApexCharts v-if="financeSummary.total > 0" type="bar" height="300" :options="debtBarOptions" :series="debtBarSeries" />
                  <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <div class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.topTransactions') }}</h3>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.topTransactionsHint') }}</p>
                <div class="mt-5">
                  <VueApexCharts v-if="topTransactions.length" type="bar" height="280" :options="topTransactionsBarOptions" :series="topTransactionsBarSeries" />
                  <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                </div>
                <div v-if="topTransactions.length" class="mt-4 border-t border-gray-100 dark:border-gray-800">
                  <table class="min-w-full">
                    <thead>
                      <tr class="border-b border-gray-100 dark:border-gray-800">
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">{{ t('clientDetail.transactionDate') }}</th>
                        <th class="px-3 py-2 text-right text-xs font-medium text-gray-500">{{ t('clientDetail.transactionAmount') }}</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                      <tr v-for="order in topTransactions" :key="order.id">
                        <td class="px-3 py-2 text-sm">
                          <router-link :to="`/sale-orders/${order.id}/items`" class="text-brand-600 hover:underline dark:text-brand-400">#{{ order.id }}</router-link>
                        </td>
                        <td class="px-3 py-2 text-sm text-gray-500">{{ formatDate(order.orderDate) }}</td>
                        <td class="px-3 py-2 text-right text-sm font-medium text-gray-800 dark:text-white/90">{{ formatMoney(order.totalSum) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.visitsCount') }}</h3>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.visitsCountHint') }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-2xl font-bold text-brand-600">{{ totalVisits }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('clientDetail.totalVisits') }}</p>
                  </div>
                </div>
                <div class="mt-5">
                  <VueApexCharts v-if="visitStats.labels.length" type="bar" height="300" :options="visitsBarOptions" :series="visitsBarSeries" />
                  <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
                <div class="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                  <button type="button" @click="productMode = 'amount'" :class="productMode === 'amount' ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'" class="rounded-md px-3 py-1.5 text-xs font-medium">{{ t('clientDetail.byAmount') }}</button>
                  <button type="button" @click="productMode = 'quantity'" :class="productMode === 'quantity' ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'" class="rounded-md px-3 py-1.5 text-xs font-medium">{{ t('clientDetail.byQuantity') }}</button>
                </div>
                <h4 class="mt-3 text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.popularProducts') }}</h4>
              </div>
              <div class="grid grid-cols-1 gap-5 p-5 xl:grid-cols-2 sm:p-6">
                <div>
                  <VueApexCharts v-if="popularDonutSeries.length" type="donut" height="280" :options="popularDonutOptions" :series="popularDonutSeries" />
                  <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                </div>
                <div>
                  <VueApexCharts v-if="popularProducts.length" type="bar" height="280" :options="popularBarOptions" :series="popularBarSeries" />
                  <p v-else class="py-16 text-center text-sm text-gray-500">{{ t('common.notFound') }}</p>
                </div>
              </div>
              <div v-if="popularProducts.length" class="border-t border-gray-100 dark:border-gray-800">
                <table class="min-w-full">
                  <thead>
                    <tr class="border-b border-gray-100 dark:border-gray-800">
                      <SortableTh :label="t('clientDetail.productName')" sortable :active="productSortKey === 'name'" :direction="productSortKey === 'name' ? productSortDir : null" @sort="toggleProductSort('name')" />
                      <SortableTh :label="productMode === 'amount' ? t('dashboard.amount') : t('dashboard.quantity')" sortable align="right" :active="productSortKey === productMode" :direction="productSortKey === productMode ? productSortDir : null" @sort="toggleProductSort(productMode)" />
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr v-for="item in sortedPopularProducts" :key="item.name">
                      <td class="px-5 py-3 text-sm text-gray-800 dark:text-white/90">{{ item.name }}</td>
                      <td class="px-5 py-3 text-right text-sm text-gray-500">{{ productMode === 'amount' ? formatMoney(item.amount) : formatCount(item.quantity) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <ClientOrdersTab v-show="activeTab === 'orders'" :orders="orders" />
          <ClientPositionsTab v-show="activeTab === 'positions'" :items="orderItems" />
          <ClientTimelineTab v-show="activeTab === 'timeline'" :entries="timelineEntries" />
          <ClientNotesTab
            v-show="activeTab === 'notes'"
            :notes="clientNotes"
            @add="addNote"
            @delete="deleteNote"
            @reminder="updateNoteReminder"
          />

          <div v-show="activeTab === 'info'" class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
                <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('clientDetail.tabInfo') }}</h3>
                <button type="button" @click="openClientEdit" :class="btnOutline">
                  <Pencil class="h-4 w-4" />
                  {{ t('clientDetail.editClient') }}
                </button>
              </div>
              <div class="space-y-6 px-6 py-6">
                <div>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div v-for="field in basicFields" :key="field.label">
                      <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ field.label }}</label>
                      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-white/5 dark:text-white/90">
                        {{ field.value }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="border-t border-dashed border-gray-300 pt-6 dark:border-gray-700">
                  <h4 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.sectionBank') }}</h4>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div v-for="field in bankFields" :key="field.label">
                      <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ field.label }}</label>
                      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-white/5 dark:text-white/90">
                        {{ field.value }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="border-t border-dashed border-gray-300 pt-6 dark:border-gray-700">
                  <h4 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.sectionOther') }}</h4>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div v-for="field in otherFields" :key="field.label" :class="field.class">
                      <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ field.label }}</label>
                      <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-white/5 dark:text-white/90">
                        {{ field.value }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-show="activeTab === 'act'" id="client-act-print" class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
                <div>
                  <h3 class="text-base font-medium text-gray-800 dark:text-white/90">Акт сверки (Hisob-kitob)</h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.actSubtitle') }}</p>
                </div>
                <div class="flex flex-wrap items-end gap-2 print:hidden">
                  <DateRangePicker
                    v-model:start-date="filterStart"
                    v-model:end-date="filterEnd"
                    :label="t('saleOrderItemsFilter.period')"
                    @apply="applyDateFilter"
                  />
                  <ActionIconButton action="reset" @click="resetDateFilter" />
                  <button type="button" @click="printAct" :class="btnOutline">{{ t('clientDetail.printAct') }}</button>
                  <button type="button" @click="exportActCsv" :class="btnOutline">
                    <Download class="h-4 w-4" />
                    {{ t('clientDetail.exportCsv') }}
                  </button>
                </div>
              </div>

              <div class="hidden px-6 pt-5 print:block">
                <h2 class="text-lg font-semibold text-center text-gray-900">Акт сверки</h2>
                <p class="mt-2 text-sm text-center text-gray-600">
                  Mijoz: <strong>{{ client.fullName }}</strong>
                  <span v-if="client.inn"> | INN: {{ client.inn }}</span>
                </p>
                <p v-if="appliedStart || appliedEnd" class="mt-1 text-xs text-center text-gray-500">
                  Davr: {{ appliedStart || '...' }} — {{ appliedEnd || '...' }}
                </p>
              </div>

              <div class="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-3 border-b border-gray-100 dark:border-gray-800">
                <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
                  <p class="text-xs font-medium text-gray-500">{{ t('clientDetail.totalSales') }}</p>
                  <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{{ formatMoney(actTotals.totalSales) }}</p>
                </div>
                <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
                  <p class="text-xs font-medium text-gray-500">{{ t('clientDetail.totalPaid') }}</p>
                  <p class="mt-1 text-lg font-semibold text-success-600">{{ formatMoney(actTotals.totalPaid) }}</p>
                </div>
                <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
                  <p class="text-xs font-medium text-gray-500">{{ t('clientDetail.actBalance') }}</p>
                  <p class="mt-1 text-lg font-semibold" :class="balanceClass(actTotals.balance)">{{ formatBalance(actTotals.balance) }}</p>
                </div>
              </div>

              <p class="px-6 py-2 text-xs text-gray-500 dark:text-gray-400 print:hidden">{{ t('clientDetail.actAllRecords') }}</p>

              <div v-if="smsMessage" class="mx-6 mb-4 p-3 text-sm rounded-lg print:hidden" :class="smsMessageClass">
                {{ smsMessage }}
              </div>

              <div class="max-w-full overflow-x-auto custom-scrollbar">
                <table class="min-w-full">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <SortableTh label="#" />
                      <SortableTh label="Turi" sortable :active="actSortKey === 'type'" :direction="actSortKey === 'type' ? actSortDir : null" @sort="toggleActSort('type')" />
                      <SortableTh label="Sana" sortable :active="actSortKey === 'date'" :direction="actSortKey === 'date' ? actSortDir : null" @sort="toggleActSort('date')" />
                      <SortableTh label="Tavsif" sortable :active="actSortKey === 'description'" :direction="actSortKey === 'description' ? actSortDir : null" @sort="toggleActSort('description')" />
                      <SortableTh label="Debit" sortable align="right" :active="actSortKey === 'debit'" :direction="actSortKey === 'debit' ? actSortDir : null" @sort="toggleActSort('debit')" />
                      <SortableTh label="Kredit" sortable align="right" :active="actSortKey === 'credit'" :direction="actSortKey === 'credit' ? actSortDir : null" @sort="toggleActSort('credit')" />
                      <SortableTh :label="t('clientDetail.actBalance')" sortable align="right" :active="actSortKey === 'balance'" :direction="actSortKey === 'balance' ? actSortDir : null" @sort="toggleActSort('balance')" />
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-if="sortedActRows.length === 0">
                      <td colspan="7" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td>
                    </tr>
                    <tr v-for="(row, index) in sortedActRows" :key="row.id">
                      <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ index + 1 }}</td>
                      <td class="px-5 py-4 text-theme-sm sm:px-6">
                        <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="row.type === 'order' ? 'bg-brand-50 text-brand-600' : 'bg-success-50 text-success-600'">
                          {{ row.type === 'order' ? t('clientDetail.tabOrders') : t('clientDetail.tabPayments') }}
                        </span>
                      </td>
                      <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ formatDate(row.date) }}</td>
                      <td class="px-5 py-4 text-theme-sm sm:px-6">
                        <router-link
                          v-if="row.orderId"
                          :to="`/sale-orders/${row.orderId}/items`"
                          class="text-brand-600 hover:underline dark:text-brand-400 print:no-underline print:text-black"
                        >
                          {{ row.description }}
                        </router-link>
                        <span v-else>{{ row.description }}</span>
                      </td>
                      <td class="px-5 py-4 text-right text-theme-sm text-error-600 sm:px-6">{{ row.debit > 0 ? formatMoney(row.debit) : '—' }}</td>
                      <td class="px-5 py-4 text-right text-theme-sm text-success-600 sm:px-6">{{ row.credit > 0 ? formatMoney(row.credit) : '—' }}</td>
                      <td class="px-5 py-4 text-right text-theme-sm sm:px-6" :class="balanceClass(row.balance ?? 0)">{{ formatBalance(row.balance ?? 0) }}</td>
                    </tr>
                  </tbody>
                  <tfoot v-if="sortedActRows.length > 0">
                    <tr class="border-t-2 border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-white/5">
                      <td colspan="4" class="px-5 py-4 text-sm font-semibold text-gray-800 sm:px-6 dark:text-white/90">{{ t('common.total') || 'Jami' }}</td>
                      <td class="px-5 py-4 text-right text-sm font-semibold text-error-600 sm:px-6">{{ formatMoney(actTotals.totalSales) }}</td>
                      <td class="px-5 py-4 text-right text-sm font-semibold text-success-600 sm:px-6">{{ formatMoney(actTotals.totalPaid) }}</td>
                      <td class="px-5 py-4 text-right text-sm font-semibold sm:px-6" :class="balanceClass(actTotals.balance)">{{ formatBalance(actTotals.balance) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div class="hidden px-6 py-6 print:flex print:justify-between print:text-sm">
                <div>
                  <p class="font-medium">Mijoz:</p>
                  <p class="mt-8 border-t border-gray-400 pt-1 w-48">Imzo</p>
                </div>
                <div class="text-right">
                  <p class="font-medium">Tashkilot:</p>
                  <p class="mt-8 border-t border-gray-400 pt-1 w-48 ml-auto">Imzo</p>
                </div>
              </div>
            </div>

            <div v-show="activeTab === 'sms'" class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] print:hidden">
              <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('clientDetail.smsHistory') }}</h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.smsHistoryHint') }}</p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    :disabled="sendingClientSms || clientDebtBalance <= 0"
                    @click="sendClientDebtSms"
                    class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70"
                  >
                    {{ sendingClientSms ? t('clientDetail.sendingSms') : t('clientDetail.sendDebtSms') }}
                  </button>
                  <ActionIconButton action="refresh" @click="loadSmsHistory" />
                </div>
              </div>

              <div v-if="smsMessage" class="mx-6 mt-4 p-3 text-sm rounded-lg" :class="smsMessageClass">
                {{ smsMessage }}
              </div>

              <div class="max-w-full overflow-x-auto custom-scrollbar">
                <table class="min-w-full">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <SortableTh label="ID" sortable :active="smsSortKey === 'id'" :direction="smsSortKey === 'id' ? smsSortDir : null" @sort="toggleSmsSort('id')" />
                      <SortableTh :label="t('clientDetail.smsPhone')" sortable :active="smsSortKey === 'phone'" :direction="smsSortKey === 'phone' ? smsSortDir : null" @sort="toggleSmsSort('phone')" />
                      <SortableTh :label="t('clientDetail.smsDebt')" sortable align="right" :active="smsSortKey === 'debtAmount'" :direction="smsSortKey === 'debtAmount' ? smsSortDir : null" @sort="toggleSmsSort('debtAmount')" />
                      <SortableTh :label="t('common.status')" sortable :active="smsSortKey === 'status'" :direction="smsSortKey === 'status' ? smsSortDir : null" @sort="toggleSmsSort('status')" />
                      <SortableTh :label="t('sms.message')" sortable :active="smsSortKey === 'message'" :direction="smsSortKey === 'message' ? smsSortDir : null" @sort="toggleSmsSort('message')" />
                      <SortableTh :label="t('clientDetail.smsDate')" sortable :active="smsSortKey === 'sentAt'" :direction="smsSortKey === 'sentAt' ? smsSortDir : null" @sort="toggleSmsSort('sentAt')" />
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-if="smsHistoryLoading"><td colspan="6" class="px-5 py-8 text-center text-gray-500">{{ t('common.loading') }}</td></tr>
                    <tr v-else-if="sortedSmsHistory.length === 0"><td colspan="6" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td></tr>
                    <tr v-for="item in sortedSmsHistory" :key="item.id">
                      <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ item.id }}</td>
                      <td class="px-5 py-4 text-theme-sm text-gray-800 sm:px-6 dark:text-white/90">{{ item.phone || client?.phone || '—' }}</td>
                      <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ getSmsDebtAmount(item) != null ? formatMoney(getSmsDebtAmount(item)!) : '—' }}</td>
                      <td class="px-5 py-4 text-theme-sm sm:px-6">
                        <span :class="smsStatusClass(item)">{{ smsStatusLabel(item) }}</span>
                      </td>
                      <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ getSmsDisplayMessage(item) }}</td>
                      <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ formatDateTime(item.sentAt || item.createdAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-show="activeTab === 'payments'" class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('clientDetail.tabPayments') }}</h3>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('clientDetail.paymentsHint') }}</p>
                </div>
                <div class="flex flex-wrap items-end gap-2">
                  <DateRangePicker
                    v-model:start-date="paymentFilterStart"
                    v-model:end-date="paymentFilterEnd"
                    :label="t('saleOrderItemsFilter.period')"
                    @apply="applyPaymentDateFilter"
                  />
                  <ActionIconButton action="reset" @click="resetPaymentDateFilter" />
                  <button type="button" @click="openPaymentForm" :class="btnPrimary">
                    <Wallet class="h-4 w-4" />
                    {{ t('clientDetail.addPayment') }}
                  </button>
                  <ActionIconButton action="refresh" @click="loadPayments" />
                </div>
              </div>

              <div class="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2 border-b border-gray-100 dark:border-gray-800">
                <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
                  <p class="text-xs font-medium text-gray-500">{{ t('clientDetail.paymentsTotal') }}</p>
                  <p class="mt-1 text-lg font-semibold text-brand-600">{{ formatMoney(filteredPaymentsTotal) }}</p>
                </div>
                <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
                  <p class="text-xs font-medium text-gray-500">{{ t('clientDetail.tabPayments') }}</p>
                  <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{{ sortedPayments.length }} ta</p>
                </div>
              </div>

              <div class="max-w-full overflow-x-auto custom-scrollbar">
                <table class="min-w-full">
                  <thead>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <SortableTh label="ID" sortable :active="paymentSortKey === 'id'" :direction="paymentSortKey === 'id' ? paymentSortDir : null" @sort="togglePaymentSort('id')" />
                      <SortableTh :label="t('clientDetail.paymentDate')" sortable :active="paymentSortKey === 'paymentDate'" :direction="paymentSortKey === 'paymentDate' ? paymentSortDir : null" @sort="togglePaymentSort('paymentDate')" />
                      <SortableTh :label="t('clientDetail.paymentType')" sortable :active="paymentSortKey === 'paymentTypeName'" :direction="paymentSortKey === 'paymentTypeName' ? paymentSortDir : null" @sort="togglePaymentSort('paymentTypeName')" />
                      <SortableTh :label="t('clientDetail.paymentAmount')" sortable align="right" :active="paymentSortKey === 'paymentAmount'" :direction="paymentSortKey === 'paymentAmount' ? paymentSortDir : null" @sort="togglePaymentSort('paymentAmount')" />
                      <SortableTh label="Izoh" sortable :active="paymentSortKey === 'comment'" :direction="paymentSortKey === 'comment' ? paymentSortDir : null" @sort="togglePaymentSort('comment')" />
                      <SortableTh :label="t('common.status')" sortable :active="paymentSortKey === 'status'" :direction="paymentSortKey === 'status' ? paymentSortDir : null" @sort="togglePaymentSort('status')" />
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-if="paymentsLoading"><td colspan="6" class="px-5 py-8 text-center text-gray-500">{{ t('common.loading') }}</td></tr>
                    <tr v-else-if="sortedPayments.length === 0"><td colspan="6" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td></tr>
                    <tr v-for="payment in sortedPayments" :key="payment.id">
                      <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ payment.id }}</td>
                      <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ formatDateTime(payment.paymentDate) }}</td>
                      <td class="px-5 py-4 text-theme-sm text-gray-800 sm:px-6 dark:text-white/90">{{ payment.paymentTypeName }}</td>
                      <td class="px-5 py-4 text-right text-theme-sm font-medium text-success-600 sm:px-6">{{ formatMoney(payment.paymentAmount) }}</td>
                      <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ payment.comment || '—' }}</td>
                      <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ payment.status }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      </template>
    </div>

    <Teleport to="body">
      <Modal v-if="showPaymentModal" full-screen-backdrop @close="closePaymentForm">
        <template #body>
          <div class="relative z-10 mx-4 w-full max-w-lg rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.addPayment') }}</h4>
          <p class="mb-4 text-sm text-gray-500">{{ client?.fullName }}</p>
          <div v-if="paymentFormError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ paymentFormError }}</div>
          <form @submit.prevent="submitPaymentForm" class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('clientDetail.paymentOrder') }}</label>
              <select v-model.number="paymentForm.saleOrderId" :class="inputClass">
                <option :value="0">{{ t('clientDetail.selectDebtOrder') }} (ixtiyoriy)</option>
                <option v-for="order in debtOrders" :key="order.id" :value="order.id">
                  #{{ order.id }} · {{ formatDate(order.orderDate) }} · {{ formatMoney(order.debtSum) }}
                </option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Foydalanuvchi (sotuvchi)<span class="text-error-500">*</span></label>
              <select v-model.number="paymentForm.userId" required :class="inputClass">
                <option :value="0" disabled>Tanlang</option>
                <option v-for="u in activeUsers" :key="u.id" :value="u.id">{{ u.fullName }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('clientDetail.paymentType') }}<span class="text-error-500">*</span></label>
              <select v-model.number="paymentForm.paymentTypeId" required :class="inputClass">
                <option :value="0" disabled>Tanlang</option>
                <option v-for="pt in paymentTypes" :key="pt.id" :value="pt.id">{{ pt.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('clientDetail.paymentAmount') }}<span class="text-error-500">*</span></label>
              <input v-model.number="paymentForm.paymentAmount" type="number" step="1" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('clientDetail.paymentDate') }}<span class="text-error-500">*</span></label>
              <input v-model="paymentForm.paymentDateLocal" type="datetime-local" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Izoh</label>
              <textarea v-model="paymentForm.comment" rows="2" :class="inputClass" />
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" @click="closePaymentForm" :class="btnOutline">Bekor qilish</button>
              <button type="submit" :disabled="paymentSaving" :class="btnPrimary">{{ paymentSaving ? 'Saqlanmoqda...' : 'Saqlash' }}</button>
            </div>
          </form>
          </div>
        </template>
      </Modal>
    </Teleport>

    <Teleport to="body">
      <Modal v-if="showClientEditModal" full-screen-backdrop @close="closeClientEdit">
        <template #body>
          <div class="relative z-10 mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.editClient') }}</h4>
          <div v-if="clientFormError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ clientFormError }}</div>
          <form @submit.prevent="submitClientEdit" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">F.I.O<span class="text-error-500">*</span></label>
              <input v-model="clientForm.fullName" type="text" required :class="inputClass" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('clients.group') }}<span class="text-error-500">*</span></label>
              <select v-model.number="clientForm.clientGroupId" required :class="inputClass">
                <option :value="0" disabled>{{ t('clients.selectGroup') }}</option>
                <option v-for="group in activeClientGroups" :key="group.id" :value="group.id">{{ group.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">INN</label>
              <input v-model="clientForm.inn" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Telefon<span class="text-error-500">*</span></label>
              <input
                :value="clientForm.phone"
                type="tel"
                required
                placeholder="+998 __ ___ __ __"
                :class="inputClass"
                @input="onClientPhoneInput"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Qo‘shimcha telefon</label>
              <input v-model="clientForm.additionalPhone" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Bank nomi</label>
              <input v-model="clientForm.bankName" type="text" :class="inputClass" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Manzil<span class="text-error-500">*</span></label>
              <input v-model="clientForm.address" type="text" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">MFO</label>
              <input v-model="clientForm.mfo" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Hisob raqami</label>
              <input v-model="clientForm.accountNumber" type="text" :class="inputClass" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Izoh</label>
              <textarea v-model="clientForm.description" rows="3" :class="inputClass" />
            </div>
            <div class="flex justify-end gap-3 pt-2 sm:col-span-2">
              <button type="button" @click="closeClientEdit" :class="btnOutline">Bekor qilish</button>
              <button type="submit" :disabled="clientSaving" :class="btnPrimary">{{ clientSaving ? 'Saqlanmoqda...' : 'Saqlash' }}</button>
            </div>
          </form>
          </div>
        </template>
      </Modal>
    </Teleport>

    <Teleport to="body">
      <Modal v-if="showTelegramModal" full-screen-backdrop @close="closeTelegramForm">
        <template #body>
          <div class="relative z-10 mx-4 w-full max-w-lg rounded-3xl bg-white p-6 dark:bg-gray-900">
            <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.sendTelegram') }}</h4>
            <p class="mb-4 text-sm text-gray-500">{{ client?.fullName }}</p>
            <div v-if="telegramFormError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ telegramFormError }}</div>
            <form @submit.prevent="submitTelegramForm" class="space-y-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('clientDetail.telegramMessage') }}<span class="text-error-500">*</span></label>
                <textarea v-model="telegramMessage" rows="5" required :class="inputClass" />
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" @click="closeTelegramForm" :class="btnOutline">Bekor qilish</button>
                <button type="submit" :disabled="telegramSending" :class="btnPrimary">
                  {{ telegramSending ? t('clientDetail.sendingTelegram') : t('clientDetail.sendTelegram') }}
                </button>
              </div>
            </form>
          </div>
        </template>
      </Modal>
    </Teleport>

    <Teleport to="body">
      <Modal v-if="showOrderModal" full-screen-backdrop @close="closeOrderForm">
        <template #body>
          <div class="relative z-10 mx-4 w-full max-w-lg rounded-3xl bg-white p-6 dark:bg-gray-900">
            <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('clientDetail.newOrder') }}</h4>
            <p class="mb-4 text-sm text-gray-500">{{ client?.fullName }}</p>
            <div v-if="orderFormError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ orderFormError }}</div>
            <form @submit.prevent="submitOrderForm" class="space-y-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Ombor<span class="text-error-500">*</span></label>
                <select v-model.number="orderForm.warehouseId" required :class="inputClass">
                  <option :value="0" disabled>Tanlang</option>
                  <option v-for="wh in activeWarehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Sotuvchi</label>
                <select v-model.number="orderForm.userId" :class="inputClass">
                  <option :value="0">Tanlanmagan</option>
                  <option v-for="user in activeUsers" :key="user.id" :value="user.id">{{ user.fullName }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Buyurtma sanasi<span class="text-error-500">*</span></label>
                <input v-model="orderForm.orderDateLocal" type="datetime-local" required :class="inputClass" />
              </div>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrders.plannedReadyDate') }}</label>
                  <input v-model="orderForm.plannedReadyDate" type="date" :class="inputClass" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrders.plannedDeliveryDate') }}</label>
                  <input v-model="orderForm.plannedDeliveryDate" type="date" :class="inputClass" />
                </div>
              </div>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrders.discountType') }}</label>
                  <select v-model="orderForm.discountType" :class="inputClass">
                    <option value="">—</option>
                    <option value="PERCENTAGE">{{ t('saleOrders.discountTypePercentage') }}</option>
                    <option value="FIXED_AMOUNT">{{ t('saleOrders.discountTypeFixed') }}</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrders.discountValue') }}</label>
                  <input v-model.number="orderForm.discountValue" type="number" min="0" step="0.01" :class="inputClass" />
                </div>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Izoh</label>
                <textarea v-model="orderForm.comment" rows="2" :class="inputClass" />
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" @click="closeOrderForm" :class="btnOutline">Bekor qilish</button>
                <button type="submit" :disabled="orderSaving" :class="btnPrimary">{{ orderSaving ? 'Saqlanmoqda...' : 'Saqlash' }}</button>
              </div>
            </form>
          </div>
        </template>
      </Modal>
    </Teleport>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import VueApexCharts from 'vue3-apexcharts'
import { Calendar, CalendarClock, Pencil, Wallet, Download } from 'lucide-vue-next'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import Modal from '@/components/ui/Modal.vue'
import ClientDetailHeader from '@/components/clients/ClientDetailHeader.vue'
import ClientOverviewTab from '@/components/clients/ClientOverviewTab.vue'
import ClientOrdersTab from '@/components/clients/ClientOrdersTab.vue'
import ClientPositionsTab from '@/components/clients/ClientPositionsTab.vue'
import ClientTimelineTab from '@/components/clients/ClientTimelineTab.vue'
import ClientNotesTab from '@/components/clients/ClientNotesTab.vue'
import { useTableSort } from '@/composables/useTableControls'
import { useCurrentUser } from '@/composables/useCurrentUser'
import { fetchClientById, updateClient, type ClientResponse, type ClientDTO } from '@/services/clients'
import { fetchAllClientGroups, type ClientGroupResponse } from '@/services/clientGroups'
import { fetchSaleOrdersByClient, createSaleOrder, type SaleOrderResponse, type DiscountType } from '@/services/saleOrders'
import { fetchSaleOrderItemsForClient, type SaleOrderItemResponse } from '@/services/saleOrderItems'
import { fetchPaymentsByClient, createPayment, type PaymentResponse } from '@/services/payments'
import { fetchAllPaymentTypes, type PaymentTypeResponse } from '@/services/paymentTypes'
import { fetchAllWarehouses, type WarehouseResponse } from '@/services/warehouses'
import { fetchAllUsers, type UserResponse } from '@/services/users'
import { fetchAllAuditLogs, type AuditLog } from '@/services/audit'
import { formatPhoneInput, phoneFromStorage, phoneToStorage, isPhoneComplete } from '@/utils/phone'
import {
  buildActRows,
  buildActivityTimeline,
  buildClientSegment,
  buildDebtAging,
  buildProfitStats,
  buildSellerStats,
  buildWarehouseStats,
  buildWindowStats,
  summarizeFinance,
  type ActRow,
} from '@/utils/clientDetailAnalytics'
import { buildClientActCsv, downloadCsv } from '@/utils/clientDetailExport'
import {
  getClientPromisedPaymentDate,
  setClientPromisedPaymentDate,
} from '@/utils/clientLocalMeta'
import {
  fetchClientNotesByClient,
  createClientNote,
  deleteClientNote as deleteClientNoteApi,
  updateClientNoteReminderStatus,
  type ClientNoteResponse,
  type ClientNoteType,
  type ClientNoteReminderStatus,
} from '@/services/clientNotes'
import {
  fetchClientBalanceByClientId,
  recalculateClientBalance,
  type ClientBalanceResponse,
} from '@/services/clientBalances'
import {
  sendDebtSmsToClient,
  fetchDebtNotificationHistoryByClient,
  type DebtNotificationHistoryResponse,
} from '@/services/notifications'
import { sendTelegramMessageToClient } from '@/services/telegramMessages'
import {
  normalizeSmsStatus,
  isSmsStatusSuccess,
  getSmsDebtAmount,
  getSmsDisplayMessage,
  SMS_STATUS_I18N_KEY,
} from '@/utils/smsNotificationStatus'

const TOP_TRANSACTIONS_LIMIT = 5

type ClientTab =
  | 'overview'
  | 'analytics'
  | 'orders'
  | 'positions'
  | 'act'
  | 'payments'
  | 'timeline'
  | 'notes'
  | 'info'
  | 'sms'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { user: currentUser, ensureUser } = useCurrentUser()
const clientId = Number(route.params.id)

const client = ref<ClientResponse | null>(null)
const orders = ref<SaleOrderResponse[]>([])
const orderItems = ref<SaleOrderItemResponse[]>([])
const payments = ref<PaymentResponse[]>([])
const smsHistory = ref<DebtNotificationHistoryResponse[]>([])
const auditLogs = ref<AuditLog[]>([])
const promisedPaymentDate = ref<string | null>(null)
const clientNotes = ref<ClientNoteResponse[]>([])
const clientBalance = ref<ClientBalanceResponse | null>(null)
const loading = ref(true)
const smsHistoryLoading = ref(false)
const paymentsLoading = ref(false)
const errorMessage = ref('')
const smsMessage = ref('')
const smsMessageType = ref<'success' | 'error'>('success')
const sendingClientSms = ref(false)
const filterStart = ref('')
const filterEnd = ref('')
const appliedStart = ref('')
const appliedEnd = ref('')
const paymentFilterStart = ref('')
const paymentFilterEnd = ref('')
const appliedPaymentStart = ref('')
const appliedPaymentEnd = ref('')
const productMode = ref<'amount' | 'quantity'>('amount')
const activeTab = ref<ClientTab>('overview')

const showPaymentModal = ref(false)
const paymentTypes = ref<PaymentTypeResponse[]>([])
const paymentForm = ref({
  userId: 0,
  paymentTypeId: 0,
  paymentAmount: 0,
  paymentDateLocal: '',
  comment: '',
  saleOrderId: 0,
})
const paymentFormError = ref('')
const paymentSaving = ref(false)

const showOrderModal = ref(false)
const warehouses = ref<WarehouseResponse[]>([])
const users = ref<UserResponse[]>([])
const orderForm = ref({
  warehouseId: 0,
  userId: 0,
  orderDateLocal: '',
  plannedReadyDate: '',
  plannedDeliveryDate: '',
  discountType: '' as '' | DiscountType,
  discountValue: 0,
  comment: '',
})
const orderFormError = ref('')
const orderSaving = ref(false)

const showTelegramModal = ref(false)
const telegramMessage = ref('')
const telegramFormError = ref('')
const telegramSending = ref(false)

const showClientEditModal = ref(false)
const clientGroups = ref<ClientGroupResponse[]>([])
const clientForm = ref<ClientDTO>({
  fullName: '',
  phone: '+998 ',
  address: '',
  clientGroupId: 0,
  inn: '',
  additionalPhone: '',
  bankName: '',
  mfo: '',
  accountNumber: '',
  description: '',
})
const clientFormError = ref('')
const clientSaving = ref(false)

const inputClass = 'h-11 min-w-[180px] w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'

const clientTabs = computed(() => [
  { id: 'overview' as const, label: t('clientDetail.tabOverview') },
  { id: 'analytics' as const, label: t('clientDetail.tabAnalytics') },
  { id: 'orders' as const, label: t('clientDetail.tabOrders') },
  { id: 'positions' as const, label: t('clientDetail.tabPositions') },
  { id: 'act' as const, label: t('clientDetail.tabAct') },
  { id: 'payments' as const, label: t('clientDetail.tabPayments') },
  { id: 'timeline' as const, label: t('clientDetail.tabTimeline') },
  { id: 'notes' as const, label: t('clientDetail.tabNotes') },
  { id: 'info' as const, label: t('clientDetail.tabInfo') },
  { id: 'sms' as const, label: t('clientDetail.tabSms') },
])

const activeWarehouses = computed(() => warehouses.value.filter((w) => w.status === 'ACTIVE'))
const activeUsers = computed(() => users.value.filter((u) => u.status === 'ACTIVE'))

const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'

const pageTitle = computed(() => client.value?.fullName ?? 'Mijoz')

const activeClientGroups = computed(() =>
  clientGroups.value.filter((group) => group.status === 'ACTIVE'),
)

const display = (v?: string | null) => v || '—'

const basicFields = computed(() => {
  if (!client.value) return []
  const c = client.value
  return [
    { label: 'F.I.O', value: display(c.fullName) },
    { label: 'INN', value: display(c.inn) },
    { label: t('clients.group'), value: display(c.clientGroupName) },
    { label: 'Telefon', value: display(c.phone) },
    { label: 'Qo‘shimcha telefon', value: display(c.additionalPhone) },
    { label: 'Manzil', value: display(c.address) },
    { label: 'Holati', value: c.status ? t(`common.statusValues.${c.status}`) : '—' },
  ]
})

const bankFields = computed(() => {
  if (!client.value) return []
  const c = client.value
  return [
    { label: 'Bank', value: display(c.bankName) },
    { label: 'MFO', value: display(c.mfo) },
    { label: 'Hisob raqami', value: display(c.accountNumber) },
  ]
})

const otherFields = computed(() => {
  if (!client.value) return []
  const c = client.value
  return [
    { label: 'Izoh', value: display(c.description), class: 'sm:col-span-2' },
    { label: 'Yaratilgan', value: formatDateTime(c.createdAt) },
    { label: 'Yangilangan', value: formatDateTime(c.updatedAt) },
  ]
})

const paymentsTotal = computed(() =>
  payments.value.filter((p) => p.status === 'ACTIVE').reduce((sum, p) => sum + p.paymentAmount, 0),
)

const displayPayments = computed(() => {
  let result = [...payments.value]
  if (appliedPaymentStart.value) {
    const start = new Date(appliedPaymentStart.value)
    start.setHours(0, 0, 0, 0)
    result = result.filter((p) => new Date(p.paymentDate) >= start)
  }
  if (appliedPaymentEnd.value) {
    const end = new Date(appliedPaymentEnd.value)
    end.setHours(23, 59, 59, 999)
    result = result.filter((p) => new Date(p.paymentDate) <= end)
  }
  return result
})

const filteredPaymentsTotal = computed(() =>
  displayPayments.value.reduce((sum, p) => sum + p.paymentAmount, 0),
)

const allOrdersTotalSum = computed(() => orders.value.reduce((s, o) => s + o.totalSum, 0))

const sortedOrders = computed(() =>
  [...orders.value].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()),
)

const filteredOrders = computed(() => {
  let result = [...sortedOrders.value]
  if (appliedStart.value) {
    const start = new Date(appliedStart.value)
    start.setHours(0, 0, 0, 0)
    result = result.filter((o) => new Date(o.orderDate) >= start)
  }
  if (appliedEnd.value) {
    const end = new Date(appliedEnd.value)
    end.setHours(23, 59, 59, 999)
    result = result.filter((o) => new Date(o.orderDate) <= end)
  }
  return result
})

const filteredActPayments = computed(() => {
  let result = payments.value.filter((p) => p.status === 'ACTIVE')
  if (appliedStart.value) {
    const start = new Date(appliedStart.value)
    start.setHours(0, 0, 0, 0)
    result = result.filter((p) => new Date(p.paymentDate) >= start)
  }
  if (appliedEnd.value) {
    const end = new Date(appliedEnd.value)
    end.setHours(23, 59, 59, 999)
    result = result.filter((p) => new Date(p.paymentDate) <= end)
  }
  return result
})

const actRows = computed(() => buildActRows(filteredOrders.value, filteredActPayments.value))

const actTotals = computed(() => {
  const totalSales = filteredOrders.value.reduce((s, o) => s + o.totalSum, 0)
  const totalPaid = filteredActPayments.value.reduce((s, p) => s + p.paymentAmount, 0)
  return { totalSales, totalPaid, balance: totalPaid - totalSales }
})

const debtOrders = computed(() =>
  [...orders.value]
    .filter((o) => o.debtSum > 0)
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()),
)

const {
  sortKey: actSortKey,
  sortDir: actSortDir,
  toggleSort: toggleActSort,
  applySort: applyActSort,
} = useTableSort<ActRow>((row, key) => {
  if (key === 'date') return row.date
  if (key === 'type') return row.type
  if (key === 'description') return row.description
  if (key === 'debit') return row.debit
  if (key === 'credit') return row.credit
  if (key === 'balance') return row.balance ?? 0
  return row[key as keyof ActRow]
})

const sortedActRows = computed(() => applyActSort(actRows.value))

const {
  sortKey: smsSortKey,
  sortDir: smsSortDir,
  toggleSort: toggleSmsSort,
  applySort: applySmsSort,
} = useTableSort<DebtNotificationHistoryResponse>((row, key) => {
  if (key === 'sentAt') return row.sentAt || row.createdAt
  if (key === 'phone') return row.phone || client.value?.phone
  if (key === 'debtAmount') return getSmsDebtAmount(row) ?? 0
  if (key === 'status') return normalizeSmsStatus(row)
  if (key === 'message') return getSmsDisplayMessage(row)
  return row[key as keyof DebtNotificationHistoryResponse]
})

const sortedSmsHistory = computed(() => applySmsSort(smsHistory.value))

const {
  sortKey: paymentSortKey,
  sortDir: paymentSortDir,
  toggleSort: togglePaymentSort,
  applySort: applyPaymentSort,
} = useTableSort<PaymentResponse>((row, key) => row[key as keyof PaymentResponse])

const sortedPayments = computed(() => applyPaymentSort(displayPayments.value))

type ProductStat = { name: string; amount: number; quantity: number }

const {
  sortKey: productSortKey,
  sortDir: productSortDir,
  toggleSort: toggleProductSort,
  applySort: applyProductSort,
} = useTableSort<ProductStat>((row, key) => {
  if (key === 'amount' || key === 'quantity') return row[key]
  return row.name
})

const financeSummary = computed(() => {
  const summary = summarizeFinance(orders.value, payments.value.filter((p) => p.status === 'ACTIVE'))
  if (clientBalance.value) {
    return {
      totalSales: clientBalance.value.totalPurchase,
      totalPayments: clientBalance.value.totalPaid,
      clientDebt: clientBalance.value.totalDebt,
      total:
        clientBalance.value.totalPurchase +
        clientBalance.value.totalPaid +
        clientBalance.value.totalDebt,
    }
  }
  return {
    ...summary,
    total: summary.totalSales + summary.totalPayments + summary.clientDebt,
  }
})

const debtAging = computed(() => buildDebtAging(orders.value))
const profitStats = computed(() => buildProfitStats(orderItems.value))
const windowStatsData = computed(() => buildWindowStats(orderItems.value, orders.value))
const sellerStats = computed(() => buildSellerStats(orders.value))
const warehouseStatsData = computed(() => buildWarehouseStats(orders.value))
const clientSegment = computed(() =>
  buildClientSegment(orders.value, financeSummary.value.clientDebt, daysSinceActivity.value),
)
const timelineEntries = computed(() =>
  buildActivityTimeline(
    orders.value,
    payments.value.filter((p) => p.status === 'ACTIVE'),
    smsHistory.value,
    auditLogs.value,
    client.value?.fullName ?? '',
  ),
)

const lastActivityLabel = computed(() => formatShortDate(lastActivityDate.value))

const refreshPromisedDate = () => {
  const fromNotes = clientNotes.value
    .filter((n) => n.type === 'PAYMENT_PROMISE' && n.reminderDate && n.reminderStatus === 'PENDING')
    .sort((a, b) => String(a.reminderDate).localeCompare(String(b.reminderDate)))[0]
  promisedPaymentDate.value =
    fromNotes?.reminderDate ?? getClientPromisedPaymentDate(clientId)
}

const refreshNotes = async () => {
  try {
    clientNotes.value = (await fetchClientNotesByClient(clientId))
      .filter((n) => n.status === 'ACTIVE')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    clientNotes.value = []
  }
  refreshPromisedDate()
}

const addNote = async (payload: {
  type: ClientNoteType
  content: string
  reminderDate?: string | null
  promisedAmount?: number | null
}) => {
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  await createClientNote({
    clientId,
    type: payload.type,
    content: payload.content,
    interactionDate: `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:${p(now.getMinutes())}:00`,
    reminderDate: payload.reminderDate || null,
    reminderStatus: payload.reminderDate ? 'PENDING' : 'NONE',
    promisedAmount: payload.promisedAmount ?? null,
  })
  if (payload.type === 'PAYMENT_PROMISE' && payload.reminderDate) {
    setClientPromisedPaymentDate(clientId, payload.reminderDate)
  }
  await refreshNotes()
}

const deleteNote = async (noteId: number) => {
  await deleteClientNoteApi(noteId)
  await refreshNotes()
}

const updateNoteReminder = async (noteId: number, status: ClientNoteReminderStatus) => {
  await updateClientNoteReminderStatus(noteId, status)
  await refreshNotes()
}

const recalculateBalance = async () => {
  try {
    clientBalance.value = await recalculateClientBalance(clientId)
  } catch {
    /* ignore */
  }
}

const balanceClass = (balance: number) => {
  if (balance > 0) return 'text-success-600'
  if (balance < 0) return 'text-error-600'
  return 'text-gray-800 dark:text-white/90'
}

const clientDebtBalance = computed(() => financeSummary.value.clientDebt)

const lastActivityDate = computed(() => sortedOrders.value[0]?.orderDate || client.value?.updatedAt || '')

const daysSinceActivity = computed(() => {
  if (!lastActivityDate.value) return 0
  const diff = Date.now() - new Date(lastActivityDate.value).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
})

const promisedPaymentDays = computed(() => {
  if (!promisedPaymentDate.value) return null
  const diff = new Date(promisedPaymentDate.value).getTime() - Date.now()
  return Math.ceil(diff / 86_400_000)
})

const averageCheck = computed(() => {
  if (!orders.value.length) return 0
  return orders.value.reduce((s, o) => s + o.totalSum, 0) / orders.value.length
})

const ordersCount = computed(() => orders.value.length)

const recentOrderTotals = computed(() => sortedOrders.value.slice(0, 6).reverse().map((o) => o.totalSum))

const averageCheckSeries = computed(() => [{ name: 'Summa', data: recentOrderTotals.value }])

const ordersSparklineSeries = computed(() => {
  const monthly = new Map<string, number>()
  for (const order of sortedOrders.value) {
    const d = new Date(order.orderDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthly.set(key, (monthly.get(key) || 0) + 1)
  }
  const keys = [...monthly.keys()].sort().slice(-6)
  return [{ name: 'Buyurtmalar', data: keys.map((k) => monthly.get(k) || 0) }]
})

const popularProducts = computed(() => {
  const map = new Map<string, { name: string; amount: number; quantity: number }>()
  for (const item of orderItems.value) {
    const existing = map.get(item.goodsName) || { name: item.goodsName, amount: 0, quantity: 0 }
    existing.amount += item.priceSelling * item.count
    existing.quantity += item.count
    map.set(item.goodsName, existing)
  }
  return [...map.values()].slice(0, 5)
})

const sortedPopularProducts = computed(() => {
  const items = [...popularProducts.value]
  if (!productSortKey.value) {
    return items.sort((a, b) =>
      productMode.value === 'amount' ? b.amount - a.amount : b.quantity - a.quantity,
    )
  }
  return applyProductSort(items)
})

const popularDonutSeries = computed(() =>
  popularProducts.value.map((item) => (productMode.value === 'amount' ? item.amount : item.quantity)),
)

const monthLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number)
  const d = new Date(year, month - 1, 1)
  return d.toLocaleDateString('uz-UZ', { month: 'short', year: '2-digit' })
}

const monthlyStats = computed(() => {
  const map = new Map<string, { total: number; count: number; paid: number; debt: number }>()
  for (const order of sortedOrders.value) {
    const d = new Date(order.orderDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const row = map.get(key) || { total: 0, count: 0, paid: 0, debt: 0 }
    row.total += order.totalSum
    row.count += 1
    row.paid += order.paidSum
    row.debt += order.debtSum
    map.set(key, row)
  }
  const keys = [...map.keys()].sort()
  return {
    labels: keys.map(monthLabel),
    totals: keys.map((k) => map.get(k)!.total),
    counts: keys.map((k) => map.get(k)!.count),
    paid: keys.map((k) => map.get(k)!.paid),
    debt: keys.map((k) => map.get(k)!.debt),
  }
})

const monthlyPaymentStats = computed(() => {
  const map = new Map<string, number>()
  for (const payment of payments.value) {
    const d = new Date(payment.paymentDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) || 0) + payment.paymentAmount)
  }
  const keys = [...map.keys()].sort()
  return {
    labels: keys.map(monthLabel),
    amounts: keys.map((k) => map.get(k) || 0),
  }
})

const topTransactions = computed(() =>
  [...orders.value]
    .sort((a, b) => b.totalSum - a.totalSum)
    .slice(0, TOP_TRANSACTIONS_LIMIT),
)

const visitStats = computed(() => {
  const monthlyVisits = new Map<string, Set<string>>()
  for (const order of sortedOrders.value) {
    const d = new Date(order.orderDate)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const dayKey = order.orderDate.slice(0, 10)
    if (!monthlyVisits.has(monthKey)) monthlyVisits.set(monthKey, new Set())
    monthlyVisits.get(monthKey)!.add(dayKey)
  }
  const keys = [...monthlyVisits.keys()].sort()
  return {
    labels: keys.map(monthLabel),
    counts: keys.map((k) => monthlyVisits.get(k)!.size),
  }
})

const totalVisits = computed(() => {
  const days = new Set(sortedOrders.value.map((order) => order.orderDate.slice(0, 10)))
  return days.size
})

const debtBarSeries = computed(() => [{
  name: t('clientDetail.debtSummary'),
  data: [financeSummary.value.totalSales, financeSummary.value.totalPayments, financeSummary.value.clientDebt],
}])

const baseLineChart = {
  chart: { fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  grid: { strokeDashArray: 4 },
  xaxis: { labels: { style: { fontSize: '12px' } } },
  yaxis: { labels: { style: { fontSize: '12px' } } },
}

const salesLineSeries = computed(() => [{ name: t('clientDetail.totalSales'), data: monthlyStats.value.totals }])
const salesLineOptions = computed(() => ({
  ...baseLineChart,
  colors: ['#465FFF'],
  fill: { type: 'gradient', gradient: { opacityFrom: 0.45, opacityTo: 0.05 } },
  xaxis: { ...baseLineChart.xaxis, categories: monthlyStats.value.labels },
  tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
}))

const ordersLineSeries = computed(() => [{ name: t('clientDetail.orders'), data: monthlyStats.value.counts }])
const ordersLineOptions = computed(() => ({
  ...baseLineChart,
  colors: ['#8B5CF6'],
  xaxis: { ...baseLineChart.xaxis, categories: monthlyStats.value.labels },
}))

const paymentsLineSeries = computed(() => [{ name: t('clientDetail.tabPayments'), data: monthlyPaymentStats.value.amounts }])
const paymentsLineOptions = computed(() => ({
  ...baseLineChart,
  colors: ['#22C55E'],
  xaxis: { ...baseLineChart.xaxis, categories: monthlyPaymentStats.value.labels },
  tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
}))

const debtBarOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
  colors: ['#465FFF', '#22C55E', '#F59E0B'],
  plotOptions: { bar: { borderRadius: 8, columnWidth: '45%', distributed: true } },
  dataLabels: { enabled: false },
  legend: { show: false },
  xaxis: {
    categories: [t('clientDetail.totalSales'), t('clientDetail.totalPaid'), t('clientDetail.totalDebt')],
    labels: { style: { fontSize: '12px' } },
  },
  tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
}))

const topTransactionsBarSeries = computed(() => [{
  name: t('clientDetail.topTransactions'),
  data: topTransactions.value.map((order) => order.totalSum),
}])
const topTransactionsBarOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
  colors: ['#465FFF'],
  plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '60%' } },
  dataLabels: { enabled: false },
  xaxis: {
    categories: topTransactions.value.map((order) => `#${order.id} · ${formatShortDate(order.orderDate)}`),
    labels: { style: { fontSize: '11px' } },
  },
  tooltip: { y: { formatter: (v: number) => formatMoney(v) } },
}))

const visitsBarSeries = computed(() => [{ name: t('clientDetail.visitsCount'), data: visitStats.value.counts }])
const visitsBarOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
  colors: ['#F59E0B'],
  plotOptions: { bar: { borderRadius: 8, columnWidth: '55%' } },
  dataLabels: { enabled: false },
  grid: { strokeDashArray: 4 },
  xaxis: { labels: { style: { fontSize: '12px' } }, categories: visitStats.value.labels },
  yaxis: { labels: { style: { fontSize: '12px' } } },
  tooltip: { y: { formatter: (v: number) => formatCount(v) } },
}))

const popularBarSeries = computed(() => [{
  name: productMode.value === 'amount' ? t('dashboard.amount') : t('dashboard.quantity'),
  data: popularProducts.value.map((item) => (productMode.value === 'amount' ? item.amount : item.quantity)),
}])
const popularBarOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif', toolbar: { show: false } },
  colors: ['#465FFF'],
  plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '60%' } },
  dataLabels: { enabled: false },
  xaxis: { categories: popularProducts.value.map((item) => item.name), labels: { style: { fontSize: '11px' } } },
  tooltip: {
    y: {
      formatter: (v: number) => (productMode.value === 'amount' ? formatMoney(v) : formatCount(v)),
    },
  },
}))

const miniBarOptions = {
  chart: { sparkline: { enabled: true }, toolbar: { show: false } },
  colors: ['#22C55E'],
  plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
  tooltip: { enabled: false },
  grid: { show: false },
  xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { show: false },
}

const sparklineOptions = {
  chart: { sparkline: { enabled: true }, toolbar: { show: false } },
  colors: ['#8B5CF6'],
  stroke: { curve: 'smooth', width: 2 },
  tooltip: { enabled: false },
  grid: { show: false },
  xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { show: false },
}

const popularDonutOptions = computed(() => ({
  chart: { fontFamily: 'Outfit, sans-serif' },
  colors: ['#465FFF', '#7592FF', '#9CB9FF', '#22C55E', '#F59E0B'],
  labels: popularProducts.value.map((item) => item.name),
  legend: { show: false },
  dataLabels: { enabled: false },
  plotOptions: { pie: { donut: { size: '72%' } } },
}))

const formatShortDate = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  if (isNaN(d.getTime())) return v
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`
}

const formatDate = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleDateString()
}

const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(v)) + ' so‘m'
const formatBalance = (balance: number) => formatMoney(Math.abs(balance))
const formatCount = (v: number) => new Intl.NumberFormat('uz-UZ').format(v)

const formatDateTime = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString()
}

const smsMessageClass = computed(() =>
  smsMessageType.value === 'success'
    ? 'text-success-700 border border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400'
    : 'text-red-700 border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400',
)

const smsStatusLabel = (item: DebtNotificationHistoryResponse) => {
  const key = normalizeSmsStatus(item)
  return t(SMS_STATUS_I18N_KEY[key])
}

const smsStatusClass = (item: DebtNotificationHistoryResponse) => {
  const ok = isSmsStatusSuccess(normalizeSmsStatus(item))
  return [
    'rounded-full px-2 py-0.5 text-theme-xs font-medium',
    ok
      ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
      : 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500',
  ]
}

const showSmsResult = (message: string, type: 'success' | 'error') => {
  smsMessage.value = message
  smsMessageType.value = type
}

const loadSmsHistory = async () => {
  smsHistoryLoading.value = true
  try {
    smsHistory.value = await fetchDebtNotificationHistoryByClient(clientId)
  } catch {
    smsHistory.value = []
  } finally {
    smsHistoryLoading.value = false
  }
}

const loadPaymentTypes = async () => {
  try {
    paymentTypes.value = (await fetchAllPaymentTypes()).filter((pt) => pt.status === 'ACTIVE')
  } catch {
    paymentTypes.value = []
  }
}

const loadPayments = async () => {
  paymentsLoading.value = true
  try {
    payments.value = (await fetchPaymentsByClient(clientId))
      .filter((p) => p.status === 'ACTIVE')
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  } catch {
    payments.value = []
  } finally {
    paymentsLoading.value = false
  }
}

const sendClientDebtSms = async () => {
  sendingClientSms.value = true
  smsMessage.value = ''
  try {
    await sendDebtSmsToClient(clientId)
    showSmsResult(t('clientDetail.smsSent'), 'success')
    await loadSmsHistory()
  } catch (e) {
    showSmsResult(e instanceof Error ? e.message : t('common.error'), 'error')
  } finally {
    sendingClientSms.value = false
  }
}

const defaultTelegramDebtMessage = () => {
  const name = client.value?.fullName || ''
  const debt = financeSummary.value.clientDebt
  const debtText = new Intl.NumberFormat('uz-UZ').format(Math.round(debt))
  return t('clientDetail.telegramDebtTemplate', { name, debt: debtText })
}

const openTelegramForm = () => {
  telegramMessage.value = defaultTelegramDebtMessage()
  telegramFormError.value = ''
  showTelegramModal.value = true
}

const closeTelegramForm = () => {
  showTelegramModal.value = false
}

const submitTelegramForm = async () => {
  telegramFormError.value = ''
  const message = telegramMessage.value.trim()
  if (!message) {
    telegramFormError.value = t('clientDetail.telegramMessageRequired')
    return
  }
  telegramSending.value = true
  try {
    await sendTelegramMessageToClient({ clientId, message })
    showTelegramModal.value = false
    showSmsResult(t('clientDetail.telegramSent'), 'success')
  } catch (e) {
    telegramFormError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    telegramSending.value = false
  }
}

const applyDateFilter = () => {
  appliedStart.value = filterStart.value
  appliedEnd.value = filterEnd.value
}

const resetDateFilter = () => {
  filterStart.value = ''
  filterEnd.value = ''
  appliedStart.value = ''
  appliedEnd.value = ''
}

const applyPaymentDateFilter = () => {
  appliedPaymentStart.value = paymentFilterStart.value
  appliedPaymentEnd.value = paymentFilterEnd.value
}

const resetPaymentDateFilter = () => {
  paymentFilterStart.value = ''
  paymentFilterEnd.value = ''
  appliedPaymentStart.value = ''
  appliedPaymentEnd.value = ''
}

const toLocalInput = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

const fromLocalInput = (val: string) => (val ? new Date(val).toISOString() : '')

const openPaymentForm = async () => {
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  await Promise.all([loadOrderRefs(), ensureUser()])
  paymentForm.value = {
    userId: currentUser.value?.id ?? 0,
    paymentTypeId: 0,
    paymentAmount: 0,
    paymentDateLocal: `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:${p(now.getMinutes())}`,
    comment: '',
    saleOrderId: 0,
  }
  paymentFormError.value = ''
  showPaymentModal.value = true
  if (!paymentTypes.value.length) loadPaymentTypes()
}

watch(
  () => paymentForm.value.saleOrderId,
  (orderId) => {
    if (!orderId) {
      paymentForm.value.paymentAmount = 0
      return
    }
    const order = orders.value.find((o) => o.id === orderId)
    if (order && order.debtSum > 0) paymentForm.value.paymentAmount = order.debtSum
  },
)

const closePaymentForm = () => {
  showPaymentModal.value = false
}

const submitPaymentForm = async () => {
  paymentFormError.value = ''
  if (!paymentForm.value.userId || !paymentForm.value.paymentTypeId || !paymentForm.value.paymentDateLocal) {
    paymentFormError.value = 'Foydalanuvchi, to‘lov turi va sana majburiy'
    return
  }
  if (paymentForm.value.paymentAmount <= 0) {
    paymentFormError.value = 'Summa 0 dan katta bo‘lishi kerak'
    return
  }
  paymentSaving.value = true
  try {
    await createPayment({
      clientId,
      userId: paymentForm.value.userId,
      paymentTypeId: paymentForm.value.paymentTypeId,
      paymentAmount: paymentForm.value.paymentAmount,
      paymentDate: fromLocalInput(paymentForm.value.paymentDateLocal),
      comment: paymentForm.value.comment.trim() || undefined,
      saleOrderId: paymentForm.value.saleOrderId > 0 ? paymentForm.value.saleOrderId : undefined,
    })
    showPaymentModal.value = false
    await Promise.all([loadPayments(), reloadOrders()])
  } catch (e) {
    paymentFormError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    paymentSaving.value = false
  }
}

const cleanClientPayload = (data: ClientDTO): ClientDTO => {
  const payload: ClientDTO = {
    fullName: data.fullName.trim(),
    phone: phoneToStorage(data.phone),
    address: data.address.trim(),
    clientGroupId: data.clientGroupId,
  }
  const optional = ['inn', 'additionalPhone', 'bankName', 'mfo', 'accountNumber', 'description'] as const
  optional.forEach((key) => {
    const value = data[key]?.trim()
    if (value) payload[key] = value
  })
  return payload
}

const openClientEdit = () => {
  if (!client.value) return
  const c = client.value
  clientForm.value = {
    fullName: c.fullName,
    phone: phoneFromStorage(c.phone),
    address: c.address,
    clientGroupId: c.clientGroupId || 0,
    inn: c.inn || '',
    additionalPhone: c.additionalPhone || '',
    bankName: c.bankName || '',
    mfo: c.mfo || '',
    accountNumber: c.accountNumber || '',
    description: c.description || '',
  }
  clientFormError.value = ''
  showClientEditModal.value = true
}

const closeClientEdit = () => {
  showClientEditModal.value = false
}

const onClientPhoneInput = (event: Event) => {
  clientForm.value.phone = formatPhoneInput((event.target as HTMLInputElement).value)
}

const submitClientEdit = async () => {
  clientFormError.value = ''
  if (!clientForm.value.clientGroupId) {
    clientFormError.value = t('clients.groupRequired')
    return
  }
  if (!isPhoneComplete(clientForm.value.phone)) {
    clientFormError.value = 'Telefon raqamini to‘liq kiriting (+998 XX XXX XX XX)'
    return
  }
  clientSaving.value = true
  try {
    const payload = cleanClientPayload(clientForm.value)
    await updateClient(clientId, payload)
    client.value = await fetchClientById(clientId)
    showClientEditModal.value = false
  } catch (e) {
    clientFormError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    clientSaving.value = false
  }
}

const printAct = () => window.print()

const exportActCsv = () => {
  if (!client.value) return
  const csv = buildClientActCsv(
    client.value.fullName,
    appliedStart.value,
    appliedEnd.value,
    sortedActRows.value,
    actTotals.value,
  )
  const safeName = client.value.fullName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')
  downloadCsv(`akt_${safeName || clientId}.csv`, csv)
}

const loadOrderRefs = async () => {
  if (warehouses.value.length && users.value.length) return
  const [wh, us] = await Promise.all([fetchAllWarehouses(), fetchAllUsers()])
  warehouses.value = wh
  users.value = us
}

const openOrderForm = async () => {
  await Promise.all([loadOrderRefs(), ensureUser()])
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  orderForm.value = {
    warehouseId: activeWarehouses.value[0]?.id ?? 0,
    userId: currentUser.value?.id ?? 0,
    orderDateLocal: `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:${p(now.getMinutes())}`,
    plannedReadyDate: '',
    plannedDeliveryDate: '',
    discountType: '',
    discountValue: 0,
    comment: '',
  }
  orderFormError.value = ''
  showOrderModal.value = true
}

const closeOrderForm = () => {
  showOrderModal.value = false
}

const toPlannedDateTime = (date: string) => (date ? `${date}T00:00:00` : undefined)

const submitOrderForm = async () => {
  orderFormError.value = ''
  if (!orderForm.value.warehouseId || !orderForm.value.orderDateLocal) {
    orderFormError.value = 'Ombor va sana majburiy'
    return
  }
  orderSaving.value = true
  try {
    const created = await createSaleOrder({
      clientId,
      warehouseId: orderForm.value.warehouseId,
      userId: orderForm.value.userId > 0 ? orderForm.value.userId : undefined,
      orderDate: fromLocalInput(orderForm.value.orderDateLocal),
      plannedReadyDate: toPlannedDateTime(orderForm.value.plannedReadyDate),
      plannedDeliveryDate: toPlannedDateTime(orderForm.value.plannedDeliveryDate),
      comment: orderForm.value.comment.trim() || undefined,
      ...(orderForm.value.discountType && orderForm.value.discountValue > 0
        ? {
            discountType: orderForm.value.discountType,
            discountValue: orderForm.value.discountValue,
          }
        : {}),
    })
    showOrderModal.value = false
    await reloadOrders()
    router.push(`/sale-orders/${created.id}/items`)
  } catch (e) {
    orderFormError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    orderSaving.value = false
  }
}

const reloadOrders = async () => {
  orders.value = await fetchSaleOrdersByClient(clientId)
  orderItems.value = await fetchSaleOrderItemsForClient(clientId)
}

const loadClientGroups = async () => {
  try {
    clientGroups.value = await fetchAllClientGroups()
  } catch {
    clientGroups.value = []
  }
}

const loadData = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [clientData, ordersData, itemsData, auditData, balanceData] = await Promise.all([
      fetchClientById(clientId),
      fetchSaleOrdersByClient(clientId),
      fetchSaleOrderItemsForClient(clientId),
      fetchAllAuditLogs().catch(() => []),
      fetchClientBalanceByClientId(clientId).catch(() => null),
    ])
    client.value = clientData
    orders.value = ordersData
    orderItems.value = itemsData
    auditLogs.value = auditData
    clientBalance.value = balanceData
    await Promise.all([loadSmsHistory(), loadPayments(), loadPaymentTypes(), refreshNotes()])
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Ma’lumotlarni yuklashda xatolik'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadClientGroups()
  await loadData()
})
</script>

<style>
@media print {
  body * { visibility: hidden; }
  #client-act-print, #client-act-print * { visibility: visible; }
  #client-act-print { position: absolute; left: 0; top: 0; width: 100%; border: none; }
}
</style>
