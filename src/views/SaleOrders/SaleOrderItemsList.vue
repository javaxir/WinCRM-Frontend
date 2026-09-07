<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div
        v-if="orderInfo"
        id="sale-order-print-area"
        class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <!-- Header -->
        <div class="border-b border-gray-100 px-4 py-5 dark:border-gray-800 sm:px-6 print:hidden">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <router-link
                to="/sale-orders"
                class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
              >
                <ArrowLeft class="h-4 w-4 shrink-0" />
                Buyurtmalar
              </router-link>
              <div class="mt-3 flex flex-wrap items-center gap-3">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {{ t('saleOrderItems.pageTitle') }} #{{ orderInfo.id }}
                </h3>
                <ActionIconButton
                  action="edit"
                  size="sm"
                  :title="t('saleOrderItems.editOrderTitle')"
                  class="print:hidden"
                  @click="openOrderEdit"
                />
                <span :class="saleOrderStatusClass(orderInfo.orderStatus)">
                  {{ saleOrderStatusLabel(orderInfo.orderStatus) }}
                </span>
              </div>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ t('saleOrderItems.pageSubtitle', {
                  client: orderInfo.clientFullName || t('saleOrderItems.noClient'),
                  warehouse: orderInfo.warehouseName,
                  date: formatOrderDate(orderInfo.orderDate),
                }) }}
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <div class="relative">
                <select
                  :value="orderInfo.orderStatus"
                  @change="onStatusChange($event)"
                  class="h-10 appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-9 text-sm font-medium text-gray-700 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                >
                  <option v-for="s in ORDER_STATUSES" :key="s" :value="s">{{ saleOrderStatusLabel(s) }}</option>
                </select>
                <ChevronDown class="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <ActionIconButton action="refresh" @click="loadAll" />
              <button type="button" @click="printOrder" :class="btnOutline + ' !px-3'">
                <Printer class="h-4 w-4" />
                <span class="hidden sm:inline">Chop etish</span>
              </button>
              <button
                v-if="orderInfo.clientId"
                type="button"
                @click="goToPaymentsTab"
                :class="btnSuccess"
              >
                <CreditCard class="h-4 w-4" />
                To‘lov
              </button>
              <button
                v-if="activeMainTab === 'positions'"
                type="button"
                @click="openCreate(activeItemTab)"
                :class="btnPrimary"
              >
                <Plus class="h-4 w-4" />
                {{ t('actions.newItem') }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="border-b border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-6 print:hidden">
          <div class="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {{ errorMessage }}
          </div>
        </div>


        <!-- Main tabs -->
        <div class="border-b border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-6 print:hidden">
          <div class="inline-flex w-full gap-1 overflow-x-auto rounded-2xl border border-gray-200 bg-gray-100 p-1.5 dark:border-gray-800 dark:bg-gray-900 custom-scrollbar">
            <button
              v-for="tab in mainTabs"
              :key="tab.id"
              type="button"
              @click="activeMainTab = tab.id"
              :class="[
                'inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap',
                activeMainTab === tab.id
                  ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white',
              ]"
            >
              {{ tab.label }}
              <span
                v-if="tab.count != null"
                class="rounded-full px-2 py-0.5 text-xs tabular-nums"
                :class="activeMainTab === tab.id ? 'bg-brand-500/10 text-brand-600' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'"
              >
                {{ tab.count }}
              </span>
            </button>
          </div>
        </div>

        <!-- Tab: Ma'lumotlari -->
        <div v-show="activeMainTab === 'info'" class="border-b border-gray-100 px-4 py-5 dark:border-gray-800 sm:px-6 print:hidden">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('saleOrderItems.client') }}</p>
              <router-link
                v-if="orderInfo.clientId"
                :to="`/clients/${orderInfo.clientId}`"
                class="mt-1.5 block truncate text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                {{ orderInfo.clientFullName }}
              </router-link>
              <p v-else class="mt-1.5 text-sm font-medium text-gray-800 dark:text-white/90">—</p>
            </div>
            <div class="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('saleOrderItems.seller') }}</p>
              <router-link
                v-if="orderInfo.userId"
                :to="`/reports/users/${orderInfo.userId}`"
                class="mt-1.5 block truncate text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                {{ orderInfo.userFullName }}
              </router-link>
              <p v-else class="mt-1.5 truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ orderInfo.userFullName || '—' }}</p>
            </div>
            <div class="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('saleOrderItems.warehouse') }}</p>
              <p class="mt-1.5 truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ orderInfo.warehouseName }}</p>
            </div>
            <div class="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('saleOrderItems.orderDate') }}</p>
              <p class="mt-1.5 text-sm font-semibold text-gray-800 dark:text-white/90">{{ formatOrderDate(orderInfo.orderDate) }}</p>
            </div>
            <div class="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('saleOrderItems.deliveryDate') }}</p>
              <p class="mt-1.5 text-sm font-semibold text-gray-800 dark:text-white/90">{{ formatOrderDate(orderInfo.deliveryDate || undefined) }}</p>
            </div>
            <div class="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ t('saleOrderItems.comment') }}</p>
              <p class="mt-1.5 break-words text-sm text-gray-800 dark:text-white/90">{{ orderCommentText }}</p>
            </div>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div
              v-for="card in summaryCards"
              :key="card.key"
              class="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]"
            >
              <div class="flex items-start justify-between gap-3 p-4">
                <div class="min-w-0">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ card.label }}</p>
                  <p class="mt-2 text-xl font-bold" :class="card.valueClass">{{ card.value }}</p>
                </div>
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" :class="card.iconBg">
                  <component :is="card.icon" class="h-5 w-5" :class="card.iconClass" />
                </div>
              </div>
              <div class="h-1" :class="card.accentClass" />
            </div>
          </div>

          <div
            v-if="sumMismatch"
            class="mt-5 rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/30 dark:bg-warning-500/10"
          >
            <p class="text-sm font-semibold text-warning-800 dark:text-warning-300">{{ t('saleOrderItems.sumMismatchTitle') }}</p>
            <p class="mt-1 text-sm text-warning-700 dark:text-warning-400">
              {{ t('saleOrderItems.sumMismatchText', {
                orderTotal: formatMoneyShort(sumMismatch.orderTotal),
                itemsTotal: formatMoneyShort(sumMismatch.itemsTotal),
              }) }}
            </p>
          </div>

          <div class="mt-5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('saleOrderItems.paymentProgress') }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatMoneyShort(orderInfo.paidSum) }} / {{ formatMoneyShort(orderInfo.totalSum) }}
                <span class="ml-1 font-medium text-gray-700 dark:text-gray-300">({{ paymentProgress }}%)</span>
              </p>
            </div>
            <div class="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                class="h-full rounded-full bg-gradient-to-r from-brand-500 to-success-500 transition-all duration-500"
                :style="{ width: `${paymentProgress}%` }"
              />
            </div>
          </div>
        </div>

        <!-- Print header -->
        <div class="hidden border-b border-gray-200 px-6 py-5 print:block">
          <div v-if="companyDetail" class="mb-4 flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <p class="text-base font-bold text-gray-900">{{ companyDetail.companyName }}</p>
              <p v-if="companyDetail.inn" class="text-xs text-gray-600">STIR: {{ companyDetail.inn }}</p>
              <p v-if="companyDetail.address" class="text-xs text-gray-600">{{ companyDetail.address }}</p>
              <p v-if="companyDetail.phone" class="text-xs text-gray-600">{{ companyDetail.phone }}</p>
            </div>
            <div class="text-right text-xs text-gray-600">
              <p>{{ t('saleOrderItems.printInvoice') }}</p>
              <p class="font-semibold text-gray-900">#{{ orderInfo.id }}</p>
              <p>{{ formatOrderDate(orderInfo.orderDate) }}</p>
            </div>
          </div>
          <h2 class="text-center text-lg font-semibold text-gray-900">{{ t('saleOrderItems.pageTitle') }} #{{ orderInfo.id }}</h2>
          <div class="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700">
            <p><span class="font-medium">{{ t('saleOrderItems.client') }}:</span> {{ orderInfo.clientFullName || '—' }}</p>
            <p><span class="font-medium">{{ t('saleOrderItems.seller') }}:</span> {{ orderInfo.userFullName || '—' }}</p>
            <p><span class="font-medium">{{ t('saleOrderItems.warehouse') }}:</span> {{ orderInfo.warehouseName }}</p>
            <p><span class="font-medium">{{ t('saleOrderItems.deliveryDate') }}:</span> {{ formatOrderDate(orderInfo.deliveryDate || undefined) }}</p>
            <p><span class="font-medium">{{ t('saleOrderItems.orderTotal') }}:</span> {{ formatMoney(orderInfo.totalSum) }}</p>
            <p><span class="font-medium">{{ t('saleOrderItems.paid') }}:</span> {{ formatMoney(orderInfo.paidSum) }}</p>
          </div>
          <p v-if="orderCommentText !== '—'" class="mt-2 text-sm text-gray-600">
            <span class="font-medium">{{ t('saleOrderItems.comment') }}:</span> {{ orderCommentText }}
          </p>
        </div>

        <!-- Tab: Sotuv pozitsiyalari -->
        <div v-show="activeMainTab === 'positions'" class="print:block">
        <!-- Positions by type (sub-tabs) -->
        <div class="border-t border-gray-100 px-4 py-4 sm:px-6 print:hidden">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('saleOrderItems.positions') }}</h3>
              <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {{ t('saleOrderItems.positionsHint', { count: activeItemsCount }) }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <TableColumnToggle :columns="TABLE_COLUMNS" :visible="visible" @toggle="toggleColumn" />
              <ActionIconButton action="create" :title="t('actions.newItem')" @click="openCreate(activeItemTab)" />
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <input
              v-model="positionSearch"
              type="search"
              :placeholder="t('saleOrderItems.searchPositions')"
              class="h-10 min-w-[220px] flex-1 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 sm:max-w-xs"
            />
          </div>
          <div class="mt-4 inline-flex w-full flex-wrap gap-1 rounded-2xl border border-gray-200 bg-gray-100 p-1.5 dark:border-gray-800 dark:bg-gray-900">
            <button
              v-for="section in itemTypeSections"
              :key="section.type"
              type="button"
              @click="activeItemTab = section.type"
              :class="[
                'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap',
                activeItemTab === section.type
                  ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white',
              ]"
            >
              <component :is="section.icon" class="h-4 w-4 shrink-0" :class="section.iconClass" />
              {{ section.label }}
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
                :class="activeItemTab === section.type
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'"
              >
                {{ sectionStats(section.type).count }}
              </span>
            </button>
          </div>
        </div>

        <div
          v-for="section in itemTypeSections"
          :key="section.type"
          data-tab-panel
          class="border-t border-gray-100 dark:border-gray-800"
          :class="activeItemTab !== section.type ? 'hidden print:block' : ''"
        >
          <h4 class="hidden px-6 pt-4 text-sm font-semibold text-gray-800 print:block">{{ section.label }}</h4>
          <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 print:hidden">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('saleOrderItems.sectionCount', {
                count: sectionStats(section.type).count,
                total: formatMoneyShort(sectionStats(section.type).total),
              }) }}
            </p>
            <button
              type="button"
              @click="openCreate(section.type)"
              :class="btnOutline + ' !py-2 !text-xs'"
            >
              <Plus class="h-3.5 w-3.5" />
              {{ t('actions.newItem') }}
            </button>
          </div>

          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh v-if="isVisible('id')" label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
                  <SortableTh v-if="isVisible('goodsName')" label="Mahsulot" sortable :active="sortKey === 'goodsName'" :direction="sortKey === 'goodsName' ? sortDir : null" @sort="toggleSort('goodsName')" />
                  <SortableTh
                    v-if="section.type === 'WINDOW'"
                    :label="t('warehouseOrderItems.width')"
                    sortable
                    :active="sortKey === 'width'"
                    :direction="sortKey === 'width' ? sortDir : null"
                    @sort="toggleSort('width')"
                  />
                  <SortableTh
                    v-if="section.type === 'WINDOW'"
                    :label="t('warehouseOrderItems.length')"
                    sortable
                    :active="sortKey === 'height'"
                    :direction="sortKey === 'height' ? sortDir : null"
                    @sort="toggleSort('height')"
                  />
                  <SortableTh
                    v-if="section.type === 'WINDOW'"
                    :label="t('saleOrderItems.areaM2')"
                  />
                  <SortableTh
                    v-if="section.type === 'WINDOW'"
                    :label="t('saleOrderItems.totalAreaM2')"
                  />
                  <SortableTh v-if="isVisible('count')" label="Miqdor" sortable :active="sortKey === 'count'" :direction="sortKey === 'count' ? sortDir : null" @sort="toggleSort('count')" />
                  <SortableTh v-if="isVisible('priceCost')" label="Tannarx" sortable :active="sortKey === 'priceCost'" :direction="sortKey === 'priceCost' ? sortDir : null" @sort="toggleSort('priceCost')" />
                  <SortableTh v-if="isVisible('priceSelling')" label="Sotuv narxi" sortable :active="sortKey === 'priceSelling'" :direction="sortKey === 'priceSelling' ? sortDir : null" @sort="toggleSort('priceSelling')" />
                  <SortableTh v-if="isVisible('lineTotal')" :label="t('saleOrderItems.lineTotal')" sortable :active="sortKey === 'lineTotal'" :direction="sortKey === 'lineTotal' ? sortDir : null" @sort="toggleSort('lineTotal')" align="right" />
                  <SortableTh v-if="isVisible('arrivalDate')" label="Sana" sortable :active="sortKey === 'arrivalDate'" :direction="sortKey === 'arrivalDate' ? sortDir : null" @sort="toggleSort('arrivalDate')" />
                  <SortableTh :label="t('common.actions')" align="right" class="print:hidden" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading"><td :colspan="tableColCount(section.type)" class="px-5 py-8 text-center text-gray-500">{{ t('common.loading') }}</td></tr>
                <tr v-else-if="filteredItemsByType(section.type).length === 0">
                  <td :colspan="tableColCount(section.type)" class="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {{ t('saleOrderItems.sectionEmpty') }}
                  </td>
                </tr>
                <tr
                  v-for="item in filteredItemsByType(section.type)"
                  :key="item.id"
                  class="border-t border-gray-100 transition hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                >
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">#{{ item.id }}</span></td>
                  <td v-if="isVisible('goodsName')" class="px-5 py-4 sm:px-6">
                    <span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ item.goodsName }}</span>
                  </td>
                  <td v-if="section.type === 'WINDOW'" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm">{{ formatDimension(item.width) }}</span>
                  </td>
                  <td v-if="section.type === 'WINDOW'" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm">{{ formatDimension(item.height) }}</span>
                  </td>
                  <td v-if="section.type === 'WINDOW'" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm">{{ formatAreaM2(itemArea(item)) }}</span>
                  </td>
                  <td v-if="section.type === 'WINDOW'" class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm">{{ formatAreaM2(itemTotalArea(item)) }}</span>
                  </td>
                  <td v-if="isVisible('count')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.count }}</span></td>
                  <td v-if="isVisible('priceCost')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatMoney(item.priceCost) }}</span></td>
                  <td v-if="isVisible('priceSelling')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatMoney(item.priceSelling) }}</span></td>
                  <td v-if="isVisible('lineTotal')" class="px-5 py-4 text-right sm:px-6">
                    <span class="font-semibold text-brand-600 text-theme-sm dark:text-brand-400">{{ formatMoney(lineTotal(item)) }}</span>
                  </td>
                  <td v-if="isVisible('arrivalDate')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatDate(item.arrivalDate) }}</span></td>
                  <td class="px-5 py-4 sm:px-6 print:hidden">
                    <div class="flex items-center justify-end gap-2">
                      <ActionIconButton action="edit" size="sm" @click="openEdit(item)" />
                      <ActionIconButton action="delete" size="sm" @click="confirmDelete(item)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="hidden border-t border-gray-200 px-6 py-8 print:block">
          <div class="grid grid-cols-2 gap-16 text-sm text-gray-700">
            <div>
              <p class="font-medium">{{ t('saleOrderItems.printDirector') }}</p>
              <p class="mt-10 border-t border-gray-400 pt-1">{{ companyDetail?.director || '________________' }}</p>
            </div>
            <div>
              <p class="font-medium">{{ t('saleOrderItems.printClient') }}</p>
              <p class="mt-10 border-t border-gray-400 pt-1">{{ orderInfo.clientFullName || '________________' }}</p>
            </div>
          </div>
        </div>
        </div>

        <!-- Tab: To'lov / Tarix / Fayllar / Xabar -->
        <div
          v-show="isExtraTab"
          class="border-t border-gray-100 px-4 py-5 dark:border-gray-800 sm:px-6 print:hidden"
        >
          <SaleOrderExtras
            v-if="orderInfo"
            :order="orderInfo"
            :panel="extraPanel"
            @refresh="loadAll"
            @log-activity="onLogActivity"
            @add-payment="openPaymentForm"
            @payments-loaded="onPaymentsLoaded"
            @images-loaded="onImagesLoaded"
            @wastes-loaded="onWastesLoaded"
          />
        </div>
      </div>

      <div v-else-if="loading" class="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>
    </div>

    <Modal v-if="showFormModal" @close="closeForm">
      <template #body>
        <div class="relative mx-4 flex w-full max-w-3xl max-h-[92vh] flex-col overflow-hidden rounded-3xl bg-white shadow-theme-xl dark:bg-gray-900">
          <div class="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">
              {{ editing ? t('saleOrderItems.editTitle') : t('saleOrderItems.createTitle') }}
            </h4>
            <p v-if="orderInfo" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ t('saleOrderItems.orderContext', {
                id: orderInfo.id,
                client: orderInfo.clientFullName || '—',
                warehouse: orderInfo.warehouseName,
              }) }}
            </p>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5">
            <div v-if="formError" class="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {{ formError }}
            </div>

            <form id="sale-order-item-form" @submit.prevent="submitForm" class="space-y-5">
              <section class="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                <h5 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('warehouseOrderItems.sectionProduct') }}</h5>
                <div class="space-y-4">
                  <div>
                    <label :class="labelClass">{{ t('warehouseOrderItems.goods') }}<span class="text-error-500">*</span></label>
                    <SearchableSelect
                      v-model="form.goodsId"
                      :options="goodsOptions"
                      :input-class="inputClass"
                      :placeholder="t('warehouseOrderItems.searchGoods')"
                      :empty-text="t('common.notFound')"
                      @select="onGoodsSelect"
                    />
                  </div>
                  <div v-if="selectedGoods" class="flex flex-wrap gap-2">
                    <span class="rounded-full bg-white px-3 py-1 text-xs text-gray-600 shadow-theme-xs dark:bg-gray-800 dark:text-gray-300">{{ selectedGoods.goodsGroupName }}</span>
                    <span class="rounded-full bg-white px-3 py-1 text-xs text-gray-600 shadow-theme-xs dark:bg-gray-800 dark:text-gray-300">{{ selectedGoods.unitTypeName }}</span>
                    <span class="rounded-full bg-white px-3 py-1 text-xs text-gray-600 shadow-theme-xs dark:bg-gray-800 dark:text-gray-300">{{ selectedGoods.typeLabel }}</span>
                    <span v-if="selectedGoods.barcode" class="rounded-full bg-white px-3 py-1 text-xs text-gray-600 shadow-theme-xs dark:bg-gray-800 dark:text-gray-300">{{ selectedGoods.barcode }}</span>
                  </div>
                </div>
              </section>

              <section class="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
                <h5 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('warehouseOrderItems.sectionQuantity') }}</h5>
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label :class="labelClass">{{ t('warehouseOrderItems.count') }}<span class="text-error-500">*</span></label>
                    <input v-model.number="form.count" type="number" min="1" step="1" required :class="inputClass" />
                    <p v-if="isServiceGoods" class="mt-1.5 text-xs text-brand-600 dark:text-brand-400">
                      {{ t('saleOrderItems.serviceNoStockCheck') }}
                    </p>
                    <p v-else-if="warehouseStockCount !== null" class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {{ t('saleOrderItems.warehouseStockAvailable', { count: warehouseStockCount }) }}
                    </p>
                  </div>
                  <div>
                    <label :class="labelClass">{{ t('warehouseOrderItems.arrivalDate') }}<span class="text-error-500">*</span></label>
                    <input v-model="form.arrivalDateLocal" type="datetime-local" required :class="inputClass" />
                  </div>
                </div>
              </section>

              <section class="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
                <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('warehouseOrderItems.sectionPricing') }}</h5>
                  <span v-if="profitPerUnit > 0" class="rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700 dark:bg-success-500/15 dark:text-success-400">
                    +{{ formatMoney(profitPerUnit) }} / {{ t('warehouseOrderItems.unit') }}
                  </span>
                </div>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-end">
                  <div>
                    <label :class="labelClass">{{ t('warehouseOrderItems.priceCost') }}<span class="text-error-500">*</span></label>
                    <input v-model.number="form.priceCost" type="number" min="0" step="1" required :class="inputClass" @input="onPriceCostInput" />
                  </div>
                  <div class="hidden items-center justify-center pb-3 text-gray-400 md:flex">
                    <ArrowRight class="h-4 w-4" />
                  </div>
                  <div>
                    <label :class="labelClass">{{ t('goods.markupPercent') }}</label>
                    <div class="relative">
                      <input
                        v-model.number="markupPercent"
                        type="number"
                        step="0.1"
                        :class="inputClass + ' pr-10'"
                        :placeholder="t('warehouseOrderItems.markupPlaceholder')"
                        @input="onMarkupInput"
                      />
                      <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">%</span>
                    </div>
                  </div>
                  <div class="hidden items-center justify-center pb-3 text-gray-400 md:flex">
                    <ArrowRight class="h-4 w-4" />
                  </div>
                  <div>
                    <label :class="labelClass">{{ t('warehouseOrderItems.priceSelling') }}<span class="text-error-500">*</span></label>
                    <input v-model.number="form.priceSelling" type="number" min="0" step="1" required :class="inputClass" @input="onPriceSellingInput" />
                  </div>
                </div>

                <div v-if="form.count > 0 && form.priceCost > 0" class="mt-4 grid grid-cols-1 gap-3 border-t border-brand-200/70 pt-4 sm:grid-cols-3 dark:border-brand-500/20">
                  <div class="rounded-xl bg-white/80 px-4 py-3 dark:bg-gray-900/60">
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('warehouseOrderItems.totalCost') }}</p>
                    <p class="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">{{ formatMoney(totalCost) }}</p>
                  </div>
                  <div class="rounded-xl bg-white/80 px-4 py-3 dark:bg-gray-900/60">
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('warehouseOrderItems.totalSelling') }}</p>
                    <p class="mt-1 text-sm font-semibold text-brand-600">{{ formatMoney(totalSelling) }}</p>
                  </div>
                  <div class="rounded-xl bg-white/80 px-4 py-3 dark:bg-gray-900/60">
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('warehouseOrderItems.totalProfit') }}</p>
                    <p class="mt-1 text-sm font-semibold text-success-600">{{ formatMoney(totalProfit) }}</p>
                  </div>
                </div>
              </section>

              <section class="rounded-2xl border border-gray-200 dark:border-gray-800">
                <button
                  v-if="!isWindowGoods"
                  type="button"
                  class="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300"
                  @click="showOptionalFields = !showOptionalFields"
                >
                  {{ t('warehouseOrderItems.optionalFields') }}
                  <ChevronDown class="h-4 w-4 transition" :class="showOptionalFields ? 'rotate-180' : ''" />
                </button>
                <div v-else class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                  <h5 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('warehouseOrderItems.optionalFields') }}</h5>
                </div>
                <div v-show="optionalFieldsVisible" class="grid grid-cols-1 gap-4 border-t border-gray-100 px-4 py-4 sm:grid-cols-2 dark:border-gray-800">
                  <div>
                    <label :class="labelClass">{{ firstDimensionLabel }}</label>
                    <input v-model.number="form.width" type="number" min="0" step="0.01" :class="inputClass" />
                  </div>
                  <div>
                    <label :class="labelClass">{{ secondDimensionLabel }}</label>
                    <input v-model.number="form.height" type="number" min="0" step="0.01" :class="inputClass" />
                  </div>
                </div>
              </section>
            </form>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
            <button type="button" @click="closeForm" :class="btnOutline">{{ t('common.cancel') }}</button>
            <button type="submit" form="sale-order-item-form" :disabled="saving" :class="btnPrimary">
              {{ saving ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <Modal v-if="showDeleteModal" @close="showDeleteModal = false">
      <template #body>
        <div class="relative w-full max-w-md p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">O‘chirish</h4>
          <p class="mb-6 text-sm text-gray-500">{{ itemToDelete?.goodsName }} ni o‘chirmoqchimisiz?</p>
          <div class="flex justify-end gap-3">
            <button @click="showDeleteModal = false" :class="btnOutline">Bekor qilish</button>
            <button @click="doDelete" :disabled="deleting" class="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70">{{ deleting ? 'O‘chirilmoqda...' : 'O‘chirish' }}</button>
          </div>
        </div>
      </template>
    </Modal>

    <Modal v-if="showPaymentModal" @close="closePaymentForm">
      <template #body>
        <div class="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-theme-xl dark:bg-gray-900">
          <div class="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('actions.newPayment') }}</h4>
            <p v-if="orderInfo" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ t('saleOrderItems.paymentContext', {
                id: orderInfo.id,
                client: orderInfo.clientFullName || '—',
                debt: formatMoneyShort(orderInfo.debtSum),
              }) }}
            </p>
          </div>
          <div class="px-6 py-5">
            <div v-if="paymentFormError" class="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ paymentFormError }}</div>
            <form @submit.prevent="submitPaymentForm" class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('payments.client') }}<span class="text-error-500">*</span></label>
              <select v-model.number="paymentForm.clientId" required disabled :class="inputClass + ' disabled:cursor-not-allowed disabled:opacity-80'">
                <option :value="0" disabled>Tanlang</option>
                <option v-for="c in paymentClients" :key="c.id" :value="c.id">{{ c.fullName }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('payments.paymentType') }}<span class="text-error-500">*</span></label>
              <select v-model.number="paymentForm.paymentTypeId" required :class="inputClass">
                <option :value="0" disabled>Tanlang</option>
                <option v-for="pt in paymentTypes" :key="pt.id" :value="pt.id">{{ pt.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Summa<span class="text-error-500">*</span></label>
              <input v-model.number="paymentForm.paymentAmount" type="number" step="1" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">To‘lov sanasi<span class="text-error-500">*</span></label>
              <input v-model="paymentForm.paymentDateLocal" type="datetime-local" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Izoh</label>
              <textarea v-model="paymentForm.comment" rows="2" :class="inputClass" />
            </div>
              <div class="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                <button type="button" @click="closePaymentForm" :class="btnOutline">{{ t('common.cancel') }}</button>
                <button type="submit" :disabled="paymentSaving" :class="btnPrimary">{{ paymentSaving ? t('common.saving') : t('common.save') }}</button>
              </div>
            </form>
          </div>
        </div>
      </template>
    </Modal>

    <Modal v-if="showOrderEditModal" @close="closeOrderEdit">
      <template #body>
        <div class="relative w-full max-w-lg p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
            {{ t('saleOrderItems.editOrderTitle') }}
          </h4>
          <p v-if="orderInfo" class="mb-4 text-sm text-gray-500 dark:text-gray-400">
            #{{ orderInfo.id }}
          </p>
          <div v-if="orderEditError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {{ orderEditError }}
          </div>
          <form @submit.prevent="submitOrderEdit" class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrderItems.client') }}</label>
              <select v-model.number="orderEditForm.clientId" :class="inputClass">
                <option :value="0">{{ t('saleOrderItems.noClient') }}</option>
                <option v-for="c in orderClients" :key="c.id" :value="c.id">{{ c.fullName }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('saleOrderItems.warehouse') }}<span class="text-error-500">*</span>
              </label>
              <select v-model.number="orderEditForm.warehouseId" required :class="inputClass">
                <option :value="0" disabled>Tanlang</option>
                <option v-for="w in orderWarehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrderItems.seller') }}</label>
              <select v-model.number="orderEditForm.userId" :class="inputClass">
                <option :value="0">—</option>
                <option v-for="u in orderUsers" :key="u.id" :value="u.id">{{ u.fullName }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('saleOrderItems.orderDate') }}<span class="text-error-500">*</span>
              </label>
              <input v-model="orderEditForm.orderDateLocal" type="datetime-local" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('saleOrderItems.deliveryDate') }}
              </label>
              <input v-model="orderEditForm.deliveryDateLocal" type="datetime-local" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrderItems.orderTotal') }}</label>
              <input v-model.number="orderEditForm.totalSum" type="number" min="0" step="1" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrderItems.comment') }}</label>
              <textarea v-model="orderEditForm.comment" rows="2" :class="inputClass" />
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" @click="closeOrderEdit" :class="btnOutline">{{ t('common.cancel') }}</button>
              <button type="submit" :disabled="orderEditSaving" :class="btnPrimary">
                {{ orderEditSaving ? t('common.saving') : t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </template>
    </Modal>

    <Modal v-if="showCancelModal" @close="closeCancelModal">
      <template #body>
        <div class="relative w-full max-w-lg p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('saleOrderItems.cancelTitle') }}</h4>
          <div v-if="cancelError" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
            {{ cancelError }}
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              {{ t('saleOrderItems.cancelReasonLabel') }}<span class="text-error-500">*</span>
            </label>
            <textarea v-model="cancelReason" rows="3" :class="inputClass" />
          </div>
          <div class="mt-4 flex justify-end gap-3">
            <button type="button" @click="closeCancelModal" :class="btnOutline">{{ t('common.cancel') }}</button>
            <button type="button" :disabled="cancelling" class="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70" @click="confirmCancelOrder">
              {{ cancelling ? t('common.saving') : t('saleOrderItems.cancelConfirm') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import SaleOrderExtras, { type SaleOrderExtraPanel } from '@/components/saleOrders/SaleOrderExtras.vue'
import Modal from '@/components/ui/Modal.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'
import type { SearchableSelectOption } from '@/components/common/SearchableSelect.vue'
import { ArrowRight, ChevronDown, ArrowLeft, Printer, CreditCard, Plus, Banknote, Wallet, Layers, Box, Wrench, LayoutGrid, Percent, TrendingUp } from 'lucide-vue-next'
import { useTableSort, useColumnVisibility, type TableColumnDef } from '@/composables/useTableControls'
import {
  fetchSaleOrderItemsByOrder,
  createSaleOrderItem,
  updateSaleOrderItem,
  deleteSaleOrderItem,
  type SaleOrderItemResponse,
} from '@/services/saleOrderItems'
import {
  fetchSaleOrderById,
  changeSaleOrderStatus,
  updateSaleOrder,
  type SaleOrderResponse,
  type SaleOrderStatus,
} from '@/services/saleOrders'
import { fetchAllGoods, fetchGoodsById } from '@/services/goods'
import type { GoodsResponse, GoodsType } from '@/services/goods'
import { fetchStocksByGoods } from '@/services/stocks'
import { isServiceGoodsType, requiresStockValidation as goodsRequiresStockValidation } from '@/utils/goodsType'
import { createPayment } from '@/services/payments'
import { fetchAllPaymentTypes, type PaymentTypeResponse } from '@/services/paymentTypes'
import { fetchAllClients, type ClientResponse } from '@/services/clients'
import { fetchAllWarehouses, type WarehouseResponse } from '@/services/warehouses'
import { fetchAllUsers, type UserResponse } from '@/services/users'
import { fetchCurrentCompanyDetail, type CompanyDetailResponse } from '@/services/companyDetails'
import { saleOrderStatusLabel, saleOrderStatusClass } from '@/utils/saleOrderStatus'
import { calcMarkupPercent, calcSellingPriceFromMarkup } from '@/utils/markupPercent'
import {
  buildSaleOrderComment,
  appendSaleOrderActivity,
  calcWindowAreaM2,
  formatAreaM2,
  type SaleOrderMeta,
  type SaleOrderActivityEntry,
} from '@/utils/saleOrderMeta'

const { t } = useI18n()
const route = useRoute()
const orderId = computed(() => Number(route.params.orderId))

const ORDER_STATUSES: SaleOrderStatus[] = ['NEW', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'COMPLETED', 'CANCELLED']

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'goodsName', label: 'Mahsulot', sortable: true },
  { key: 'count', label: 'Miqdor', sortable: true },
  { key: 'priceCost', label: 'Tannarx', sortable: true },
  { key: 'priceSelling', label: 'Sotuv narxi', sortable: true },
  { key: 'lineTotal', label: 'Jami', sortable: true },
  { key: 'arrivalDate', label: 'Sana', sortable: true },
]
const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400'
const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'
const btnSuccess = 'inline-flex items-center gap-2 rounded-lg bg-success-600 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-success-700 disabled:opacity-70'

const currentPageTitle = ref('Sotuv pozitsiyalari')
const items = ref<SaleOrderItemResponse[]>([])
const orderInfo = ref<SaleOrderResponse | null>(null)
const goodsList = ref<GoodsResponse[]>([])
const goodsById = ref(new Map<number, GoodsResponse>())
const createTypeFilter = ref<GoodsType | null>(null)
const activeItemTab = ref<GoodsType>('WINDOW')
type MainOrderTab = 'positions' | 'info' | 'payments' | 'timeline' | 'files' | 'waste' | 'notify'
const activeMainTab = ref<MainOrderTab>('positions')
const paymentsCount = ref(0)
const imagesCount = ref(0)
const wastesCount = ref(0)
const positionSearch = ref('')
const loading = ref(false)
const errorMessage = ref('')
const companyDetail = ref<CompanyDetailResponse | null>(null)
const showCancelModal = ref(false)
const cancelReason = ref('')
const cancelError = ref('')
const cancelling = ref(false)

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'sale-order-items-cols')
const sortAccessor = (row: SaleOrderItemResponse, key: string) => {
  if (key === 'lineTotal') return lineTotal(row)
  if (key === 'width') return row.width ?? -1
  if (key === 'height') return row.height ?? -1
  return row[key as keyof SaleOrderItemResponse]
}
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<SaleOrderItemResponse>(sortAccessor)
const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)
const tableColCount = (type: GoodsType) => colCount.value + 1 + (type === 'WINDOW' ? 4 : 0)
const formatDimension = (value: number | null | undefined) => {
  if (value == null || isNaN(value)) return '—'
  return String(value)
}
const itemArea = (item: SaleOrderItemResponse) => calcWindowAreaM2(item.width, item.height)
const itemTotalArea = (item: SaleOrderItemResponse) => {
  const area = itemArea(item)
  return area == null ? null : area * item.count
}
const displayItems = computed(() => applySort(items.value))

const itemTypeSections = computed(() => [
  {
    type: 'WINDOW' as GoodsType,
    label: t('saleOrderItems.typeWindow'),
    icon: LayoutGrid,
    iconBg: 'bg-warning-500/10',
    iconClass: 'text-warning-500',
  },
  {
    type: 'PRODUCT' as GoodsType,
    label: t('saleOrderItems.typeProduct'),
    icon: Box,
    iconBg: 'bg-brand-500/10',
    iconClass: 'text-brand-500',
  },
  {
    type: 'SERVICE' as GoodsType,
    label: t('saleOrderItems.typeService'),
    icon: Wrench,
    iconBg: 'bg-success-500/10',
    iconClass: 'text-success-500',
  },
])

const resolveItemGoodsType = (item: SaleOrderItemResponse): GoodsType => {
  const goods = goodsById.value.get(item.goodsId)
  if (goods?.type) return goods.type
  if (goods && isServiceGoodsType(goods)) return 'SERVICE'
  return 'PRODUCT'
}

const displayItemsByType = (type: GoodsType) =>
  displayItems.value.filter((item) => resolveItemGoodsType(item) === type)

const filteredItemsByType = (type: GoodsType) => {
  const rows = displayItemsByType(type)
  const q = positionSearch.value.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((item) => item.goodsName.toLowerCase().includes(q))
}

const sectionStats = (type: GoodsType) => {
  const rows = displayItemsByType(type).filter((item) => item.status === 'ACTIVE')
  return {
    count: rows.length,
    total: rows.reduce((sum, item) => sum + lineTotal(item), 0),
  }
}

const showFormModal = ref(false)
const editing = ref<SaleOrderItemResponse | null>(null)
const form = ref({
  goodsId: 0,
  count: 0,
  priceCost: 0,
  priceSelling: 0,
  width: undefined as number | undefined,
  height: undefined as number | undefined,
  arrivalDateLocal: '',
})
const formError = ref('')
const saving = ref(false)
const markupPercent = ref<number | ''>('')
const priceSellingManual = ref(false)
const showOptionalFields = ref(false)
const warehouseStockCount = ref<number | null>(null)
const showDeleteModal = ref(false)
const itemToDelete = ref<SaleOrderItemResponse | null>(null)
const deleting = ref(false)

const showPaymentModal = ref(false)
const paymentTypes = ref<PaymentTypeResponse[]>([])
const paymentClients = ref<ClientResponse[]>([])
const paymentForm = ref({
  clientId: 0,
  paymentTypeId: 0,
  paymentAmount: 0,
  paymentDateLocal: '',
  comment: '',
})
const paymentFormError = ref('')
const paymentSaving = ref(false)

const showOrderEditModal = ref(false)
const orderEditError = ref('')
const orderEditSaving = ref(false)
const orderClients = ref<ClientResponse[]>([])
const orderWarehouses = ref<WarehouseResponse[]>([])
const orderUsers = ref<UserResponse[]>([])
const orderEditForm = ref({
  clientId: 0,
  warehouseId: 0,
  userId: 0,
  orderDateLocal: '',
  deliveryDateLocal: '',
  comment: '',
  totalSum: undefined as number | undefined,
})

const activeOrderItems = computed(() => items.value.filter((item) => item.status === 'ACTIVE'))

const itemsSellingTotal = computed(() =>
  activeOrderItems.value.reduce((sum, item) => sum + item.priceSelling * item.count, 0),
)

const orderProfit = computed(() => {
  if (!orderInfo.value) return 0
  return orderInfo.value.totalSum - orderInfo.value.paidSum
})

const orderMarginPercent = computed(() => {
  if (!orderInfo.value || orderInfo.value.totalSum <= 0) return null
  return (orderProfit.value / orderInfo.value.totalSum) * 100
})

const formatMarginPercent = (value: number | null) => {
  if (value == null) return '—'
  return `${value.toFixed(1)}%`
}

const orderCommentText = computed(() => {
  const comment = orderInfo.value?.userComment?.trim()
  return comment || '—'
})

const sumMismatch = computed(() => {
  if (!orderInfo.value) return null
  const diff = Math.abs(orderInfo.value.totalSum - itemsSellingTotal.value)
  if (diff < 1) return null
  return {
    orderTotal: orderInfo.value.totalSum,
    itemsTotal: itemsSellingTotal.value,
    diff,
  }
})

const getOrderMeta = (): SaleOrderMeta => ({
  deliveryDate: orderInfo.value?.deliveryDate ?? null,
  attachments: orderInfo.value?.attachments ?? [],
  cancelReason: orderInfo.value?.cancelReason ?? null,
  activity: orderInfo.value?.activityLog ?? [],
})

const saveOrderWithMeta = async (
  patch: {
    clientId?: number
    warehouseId: number
    userId?: number
    orderDate: string
    totalSum?: number
    userComment?: string | null
    meta?: SaleOrderMeta
  },
) => {
  if (!orderInfo.value) return
  const meta = patch.meta ?? getOrderMeta()
  await updateSaleOrder(orderInfo.value.id, {
    warehouseId: patch.warehouseId,
    orderDate: patch.orderDate,
    clientId: patch.clientId,
    userId: patch.userId,
    totalSum: patch.totalSum,
    comment: buildSaleOrderComment(patch.userComment ?? orderInfo.value.userComment ?? null, meta),
  })
}

const activeItemsCount = computed(() => activeOrderItems.value.length)

const mainTabs = computed(() => [
  { id: 'positions' as const, label: t('saleOrderItems.positions'), count: activeItemsCount.value },
  { id: 'info' as const, label: t('saleOrderItems.tabInfo'), count: null },
  { id: 'payments' as const, label: t('saleOrderItems.tabPayments'), count: paymentsCount.value },
  { id: 'timeline' as const, label: t('saleOrderItems.tabTimeline'), count: null },
  { id: 'files' as const, label: t('saleOrderItems.tabFiles'), count: imagesCount.value },
  { id: 'waste' as const, label: t('saleOrderItems.tabWaste'), count: wastesCount.value },
  { id: 'notify' as const, label: t('saleOrderItems.tabNotify'), count: null },
])

const isExtraTab = computed(() =>
  ['payments', 'timeline', 'files', 'waste', 'notify'].includes(activeMainTab.value),
)

const extraPanel = computed((): SaleOrderExtraPanel => {
  if (activeMainTab.value === 'payments') return 'payments'
  if (activeMainTab.value === 'timeline') return 'timeline'
  if (activeMainTab.value === 'files') return 'files'
  if (activeMainTab.value === 'waste') return 'waste'
  return 'notify'
})

const onPaymentsLoaded = (count: number) => {
  paymentsCount.value = count
}

const onImagesLoaded = (count: number) => {
  imagesCount.value = count
}

const onWastesLoaded = (count: number) => {
  wastesCount.value = count
}

const paymentProgress = computed(() => {
  if (!orderInfo.value || orderInfo.value.totalSum <= 0) return 0
  return Math.min(100, Math.round((orderInfo.value.paidSum / orderInfo.value.totalSum) * 100))
})

const summaryCards = computed(() => [
  {
    key: 'total',
    label: t('saleOrderItems.orderTotal'),
    value: formatCompactMoney(orderInfo.value?.totalSum ?? 0),
    valueClass: 'text-brand-600 dark:text-brand-400',
    icon: Banknote,
    iconBg: 'bg-brand-500/10',
    iconClass: 'text-brand-500',
    accentClass: 'bg-brand-500',
  },
  {
    key: 'paid',
    label: t('saleOrderItems.paid'),
    value: formatCompactMoney(orderInfo.value?.paidSum ?? 0),
    valueClass: 'text-warning-600 dark:text-warning-400',
    icon: Wallet,
    iconBg: 'bg-warning-500/10',
    iconClass: 'text-warning-500',
    accentClass: 'bg-warning-500',
  },
  {
    key: 'profit',
    label: t('saleOrderItems.orderDebt'),
    value: formatCompactMoney(orderProfit.value),
    valueClass: 'text-success-600 dark:text-success-400',
    icon: TrendingUp,
    iconBg: 'bg-success-500/10',
    iconClass: 'text-success-500',
    accentClass: 'bg-success-500',
  },
  {
    key: 'margin',
    label: t('saleOrderItems.orderMargin'),
    value: formatMarginPercent(orderMarginPercent.value),
    valueClass: 'text-violet-600 dark:text-violet-400',
    icon: Percent,
    iconBg: 'bg-violet-500/10',
    iconClass: 'text-violet-500',
    accentClass: 'bg-violet-500',
  },
  {
    key: 'items',
    label: t('saleOrderItems.itemsTotal'),
    value: formatCompactMoney(itemsSellingTotal.value),
    valueClass: 'text-gray-800 dark:text-white/90',
    icon: Layers,
    iconBg: 'bg-gray-500/10',
    iconClass: 'text-gray-500 dark:text-gray-400',
    accentClass: 'bg-gray-400',
  },
])

const selectedGoods = computed(() => goodsList.value.find((item) => item.id === form.value.goodsId) ?? goodsById.value.get(form.value.goodsId) ?? null)
const goodsOptions = computed<SearchableSelectOption[]>(() => {
  const source = createTypeFilter.value
    ? goodsList.value.filter((goods) => goods.type === createTypeFilter.value)
    : goodsList.value
  return source.map((goods) => ({
    value: goods.id,
    label: goods.name,
    hint: [goods.goodsGroupName, goods.unitTypeName, goods.barcode].filter(Boolean).join(' · '),
    keywords: `${goods.goodsGroupName} ${goods.unitTypeName} ${goods.barcode ?? ''} ${goods.type}`,
  }))
})
const isWindowGoods = computed(() => selectedGoods.value?.type === 'WINDOW')
const isServiceGoods = computed(() => isServiceGoodsType(selectedGoods.value))
const requiresStockCheck = computed(() => goodsRequiresStockValidation(selectedGoods.value))
const optionalFieldsVisible = computed(() => showOptionalFields.value || isWindowGoods.value)
const firstDimensionLabel = computed(() =>
  isWindowGoods.value ? t('warehouseOrderItems.width') : t('warehouseOrderItems.weight'),
)
const secondDimensionLabel = computed(() =>
  isWindowGoods.value ? t('warehouseOrderItems.length') : t('warehouseOrderItems.height'),
)
const profitPerUnit = computed(() => Math.max(0, form.value.priceSelling - form.value.priceCost))
const totalCost = computed(() => form.value.priceCost * (form.value.count || 0))
const totalSelling = computed(() => form.value.priceSelling * (form.value.count || 0))
const totalProfit = computed(() => profitPerUnit.value * (form.value.count || 0))

const syncMarkupFromPrices = () => {
  const percent = calcMarkupPercent(form.value.priceCost, form.value.priceSelling)
  markupPercent.value = percent == null ? '' : Number(percent.toFixed(1))
}

const applyMarkupToSellingPrice = () => {
  if (priceSellingManual.value) return
  if (markupPercent.value === '' || markupPercent.value == null || isNaN(Number(markupPercent.value))) return
  if (!form.value.priceCost || form.value.priceCost <= 0) return
  form.value.priceSelling = calcSellingPriceFromMarkup(form.value.priceCost, Number(markupPercent.value))
}

const onPriceCostInput = () => {
  priceSellingManual.value = false
  applyMarkupToSellingPrice()
}

const onMarkupInput = () => {
  priceSellingManual.value = false
  applyMarkupToSellingPrice()
}

const onPriceSellingInput = () => {
  priceSellingManual.value = true
  syncMarkupFromPrices()
}

const onGoodsSelect = () => {
  onGoodsChange()
}

const getWarehouseStockCount = async (goodsId: number, warehouseId: number) => {
  const stocks = await fetchStocksByGoods(goodsId)
  const stock = stocks.find((row) => row.warehouseId === warehouseId && row.status === 'ACTIVE')
  return stock?.count ?? 0
}

const loadWarehouseStock = async () => {
  warehouseStockCount.value = null
  if (!requiresStockCheck.value || !orderInfo.value || !form.value.goodsId) return
  try {
    warehouseStockCount.value = await getWarehouseStockCount(form.value.goodsId, orderInfo.value.warehouseId)
  } catch {
    warehouseStockCount.value = null
  }
}

const validateStockAvailability = async (goods: GoodsResponse | null): Promise<string | null> => {
  if (!goodsRequiresStockValidation(goods) || !orderInfo.value) return null

  let available = await getWarehouseStockCount(form.value.goodsId, orderInfo.value.warehouseId)
  if (
    editing.value
    && editing.value.goodsId === form.value.goodsId
    && editing.value.warehouseId === orderInfo.value.warehouseId
  ) {
    available += editing.value.count
  }

  if (form.value.count > available) {
    return t('saleOrderItems.insufficientStock', {
      available,
      requested: form.value.count,
    })
  }
  return null
}

const resolveGoodsForSubmit = async (): Promise<GoodsResponse | null> => {
  if (!form.value.goodsId) return null
  const cached = goodsById.value.get(form.value.goodsId) ?? goodsList.value.find((item) => item.id === form.value.goodsId) ?? null
  if (cached && (cached.type || cached.typeLabel)) return cached
  try {
    const goods = await fetchGoodsById(form.value.goodsId)
    goodsById.value.set(goods.id, goods)
    return goods
  } catch {
    return cached
  }
}

const lineTotal = (item: SaleOrderItemResponse) => item.priceSelling * item.count

const toLocalInput = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
const fromLocalInput = (val: string) => (val ? new Date(val).toISOString() : '')
const formatDate = (v?: string) => { if (!v) return '—'; const d = new Date(v); return isNaN(d.getTime()) ? v : d.toLocaleString() }
const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'
const formatMoneyShort = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'
const formatCompactMoney = (value: number) => {
  if (value >= 1_000_000) {
    const mln = value / 1_000_000
    return `${Number.isInteger(mln) ? mln.toFixed(0) : mln.toFixed(1)} mln so‘m`
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)} ming so‘m`
  return formatMoneyShort(value)
}
const formatOrderDate = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  if (isNaN(d.getTime())) return v
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const printOrder = () => window.print()

const onLogActivity = async (entry: Omit<SaleOrderActivityEntry, 'id'>) => {
  if (!orderInfo.value) return
  const meta = appendSaleOrderActivity(getOrderMeta(), entry)
  await saveOrderWithMeta({
    warehouseId: orderInfo.value.warehouseId,
    orderDate: orderInfo.value.orderDate,
    clientId: orderInfo.value.clientId ?? undefined,
    userId: orderInfo.value.userId ?? undefined,
    totalSum: orderInfo.value.totalSum,
    userComment: orderInfo.value.userComment ?? null,
    meta,
  })
  await loadAll()
}

const applyStatusChange = async (status: SaleOrderStatus, previousStatus?: SaleOrderStatus) => {
  if (!orderInfo.value) return
  await changeSaleOrderStatus(orderInfo.value.id, status)
  if (previousStatus && previousStatus !== status) {
    const meta = appendSaleOrderActivity(getOrderMeta(), {
      type: 'status',
      message: t('saleOrderItems.activityStatus', {
        from: saleOrderStatusLabel(previousStatus),
        to: saleOrderStatusLabel(status),
      }),
      at: new Date().toISOString(),
      by: null,
    })
    await saveOrderWithMeta({
      warehouseId: orderInfo.value.warehouseId,
      orderDate: orderInfo.value.orderDate,
      clientId: orderInfo.value.clientId ?? undefined,
      userId: orderInfo.value.userId ?? undefined,
      totalSum: orderInfo.value.totalSum,
      userComment: orderInfo.value.userComment ?? null,
      meta,
    })
  }
  await loadAll()
}

const onStatusChange = async (event: Event) => {
  if (!orderInfo.value) return
  const select = event.target as HTMLSelectElement
  const status = select.value as SaleOrderStatus
  if (status === orderInfo.value.orderStatus) return
  if (status === 'CANCELLED') {
    select.value = orderInfo.value.orderStatus
    cancelReason.value = orderInfo.value.cancelReason || ''
    cancelError.value = ''
    showCancelModal.value = true
    return
  }
  const previousStatus = orderInfo.value.orderStatus
  try {
    await applyStatusChange(status, previousStatus)
  } catch (e) {
    select.value = orderInfo.value.orderStatus
    errorMessage.value = e instanceof Error ? e.message : 'Holatni o‘zgartirishda xatolik'
  }
}

const closeCancelModal = () => {
  showCancelModal.value = false
  cancelError.value = ''
}

const confirmCancelOrder = async () => {
  if (!orderInfo.value) return
  cancelError.value = ''
  if (!cancelReason.value.trim()) {
    cancelError.value = t('saleOrderItems.cancelReasonRequired')
    return
  }
  cancelling.value = true
  try {
    const previousStatus = orderInfo.value.orderStatus
    const meta = appendSaleOrderActivity(
      { ...getOrderMeta(), cancelReason: cancelReason.value.trim() },
      {
        type: 'cancelled',
        message: t('saleOrderItems.activityCancelled', { reason: cancelReason.value.trim() }),
        at: new Date().toISOString(),
        by: null,
      },
    )
    await saveOrderWithMeta({
      warehouseId: orderInfo.value.warehouseId,
      orderDate: orderInfo.value.orderDate,
      clientId: orderInfo.value.clientId ?? undefined,
      userId: orderInfo.value.userId ?? undefined,
      totalSum: orderInfo.value.totalSum,
      userComment: orderInfo.value.userComment ?? null,
      meta,
    })
    await changeSaleOrderStatus(orderInfo.value.id, 'CANCELLED')
    showCancelModal.value = false
    await loadAll()
  } catch (e) {
    cancelError.value = e instanceof Error ? e.message : 'Bekor qilishda xatolik'
  } finally {
    cancelling.value = false
  }
}

const loadAll = async () => {
  if (!orderId.value || isNaN(orderId.value)) {
    errorMessage.value = 'Noto‘g‘ri buyurtma ID'
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    const [order, orderItems, goods, company] = await Promise.all([
      fetchSaleOrderById(orderId.value),
      fetchSaleOrderItemsByOrder(orderId.value),
      fetchAllGoods(),
      fetchCurrentCompanyDetail().catch(() => null),
    ])
    orderInfo.value = order
    items.value = orderItems
    companyDetail.value = company
    goodsById.value = new Map(goods.map((g) => [g.id, g]))
    goodsList.value = goods.filter((g) => g.status === 'ACTIVE')
    currentPageTitle.value = `Buyurtma #${order.id}`
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Yuklashda xatolik'
  } finally {
    loading.value = false
  }
}

const defaultForm = () => ({
  goodsId: 0,
  count: 0,
  priceCost: 0,
  priceSelling: 0,
  width: undefined as number | undefined,
  height: undefined as number | undefined,
  arrivalDateLocal: orderInfo.value ? toLocalInput(orderInfo.value.orderDate) : '',
})

const onGoodsChange = async () => {
  const goods = goodsList.value.find((item) => item.id === form.value.goodsId)
  if (!goods) {
    warehouseStockCount.value = null
    return
  }
  form.value.priceCost = goods.priceCost
  form.value.priceSelling = goods.priceSelling
  priceSellingManual.value = false
  syncMarkupFromPrices()
  if (goods.type === 'WINDOW') {
    showOptionalFields.value = true
  } else if (!form.value.width && !form.value.height) {
    showOptionalFields.value = false
  }
  await loadWarehouseStock()
}

const openCreate = (type?: GoodsType) => {
  editing.value = null
  createTypeFilter.value = type ?? null
  form.value = defaultForm()
  markupPercent.value = ''
  priceSellingManual.value = false
  showOptionalFields.value = false
  warehouseStockCount.value = null
  formError.value = ''
  showFormModal.value = true
}

const openEdit = async (item: SaleOrderItemResponse) => {
  editing.value = item
  createTypeFilter.value = resolveItemGoodsType(item)
  form.value = {
    goodsId: item.goodsId,
    count: item.count,
    priceCost: item.priceCost,
    priceSelling: item.priceSelling,
    width: item.width ?? undefined,
    height: item.height ?? undefined,
    arrivalDateLocal: toLocalInput(item.arrivalDate),
  }
  priceSellingManual.value = false
  showOptionalFields.value = goodsList.value.find((g) => g.id === item.goodsId)?.type === 'WINDOW' || !!(item.width || item.height)
  syncMarkupFromPrices()
  formError.value = ''
  warehouseStockCount.value = null
  showFormModal.value = true
  await loadWarehouseStock()
}

const closeForm = () => { showFormModal.value = false }

const buildPayload = () => {
  if (!orderInfo.value) throw new Error('Buyurtma ma’lumoti yo‘q')
  const clientId = orderInfo.value.clientId
  if (!clientId) throw new Error('Buyurtmada mijoz tanlanmagan')
  const payload = {
    warehouseId: orderInfo.value.warehouseId,
    saleOrderId: orderInfo.value.id,
    clientId,
    goodsId: form.value.goodsId,
    priceCost: form.value.priceCost,
    priceSelling: form.value.priceSelling,
    count: form.value.count,
    arrivalDate: fromLocalInput(form.value.arrivalDateLocal),
  } as const
  const extra: { width?: number; height?: number } = {}
  if (form.value.width != null && !isNaN(form.value.width)) extra.width = form.value.width
  if (form.value.height != null && !isNaN(form.value.height)) extra.height = form.value.height
  return { ...payload, ...extra }
}

const submitForm = async () => {
  formError.value = ''
  if (!form.value.goodsId || !form.value.arrivalDateLocal) {
    formError.value = 'Majburiy maydonlarni to‘ldiring'
    return
  }
  if (!orderInfo.value?.clientId) {
    formError.value = 'Avval buyurtmaga mijoz biriktiring'
    return
  }
  saving.value = true
  try {
    const goods = await resolveGoodsForSubmit()
    const stockError = await validateStockAvailability(goods)
    if (stockError) {
      formError.value = stockError
      return
    }
    const payload = buildPayload()
    const goodsType = isServiceGoodsType(goods) ? 'SERVICE' : goods?.type
    if (editing.value) await updateSaleOrderItem(editing.value.id, payload, goodsType)
    else await createSaleOrderItem(payload, goodsType)
    showFormModal.value = false
    await loadAll()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (item: SaleOrderItemResponse) => { itemToDelete.value = item; showDeleteModal.value = true }
const doDelete = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await deleteSaleOrderItem(itemToDelete.value.id)
    showDeleteModal.value = false
    await loadAll()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'O‘chirishda xatolik'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

const loadPaymentRefs = async () => {
  const [types, clientList] = await Promise.all([
    fetchAllPaymentTypes(),
    fetchAllClients(),
  ])
  paymentTypes.value = types.filter((pt) => pt.status === 'ACTIVE')
  paymentClients.value = clientList.filter((c) => c.status === 'ACTIVE')
}

const openPaymentForm = async () => {
  if (!orderInfo.value?.clientId) {
    errorMessage.value = 'Buyurtmada mijoz tanlanmagan'
    return
  }
  paymentFormError.value = ''
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  const debt = Math.max(0, orderInfo.value.debtSum)
  paymentForm.value = {
    clientId: orderInfo.value.clientId,
    paymentTypeId: 0,
    paymentAmount: debt > 0 ? debt : 0,
    paymentDateLocal: `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:${p(now.getMinutes())}`,
    comment: `Buyurtma #${orderInfo.value.id}`,
  }
  try {
    if (!paymentTypes.value.length || !paymentClients.value.length) {
      await loadPaymentRefs()
    }
    showPaymentModal.value = true
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'To‘lov ma’lumotlarini yuklashda xatolik'
  }
}

const goToPaymentsTab = () => {
  activeMainTab.value = 'payments'
  openPaymentForm()
}

const closePaymentForm = () => {
  showPaymentModal.value = false
}

const loadOrderEditRefs = async () => {
  const [cl, wh, us] = await Promise.all([
    fetchAllClients(),
    fetchAllWarehouses(),
    fetchAllUsers(),
  ])
  orderClients.value = cl.filter((c) => c.status === 'ACTIVE')
  orderWarehouses.value = wh.filter((w) => w.status === 'ACTIVE')
  orderUsers.value = us.filter((u) => u.status === 'ACTIVE')
}

const openOrderEdit = async () => {
  if (!orderInfo.value) return
  const order = orderInfo.value
  orderEditForm.value = {
    clientId: order.clientId || 0,
    warehouseId: order.warehouseId,
    userId: order.userId || 0,
    orderDateLocal: toLocalInput(order.orderDate),
    deliveryDateLocal: toLocalInput(order.deliveryDate || undefined),
    comment: order.userComment || '',
    totalSum: order.totalSum,
  }
  orderEditError.value = ''
  if (!orderClients.value.length) {
    try {
      await loadOrderEditRefs()
    } catch (e) {
      orderEditError.value = e instanceof Error ? e.message : 'Ma’lumotlarni yuklashda xatolik'
      return
    }
  }
  showOrderEditModal.value = true
}

const closeOrderEdit = () => {
  showOrderEditModal.value = false
}

const submitOrderEdit = async () => {
  if (!orderInfo.value) return
  orderEditError.value = ''
  if (!orderEditForm.value.warehouseId || !orderEditForm.value.orderDateLocal) {
    orderEditError.value = t('saleOrderItems.orderEditRequired')
    return
  }
  orderEditSaving.value = true
  try {
    const meta: SaleOrderMeta = {
      ...getOrderMeta(),
      deliveryDate: orderEditForm.value.deliveryDateLocal
        ? fromLocalInput(orderEditForm.value.deliveryDateLocal)
        : null,
    }
    await saveOrderWithMeta({
      warehouseId: orderEditForm.value.warehouseId,
      orderDate: fromLocalInput(orderEditForm.value.orderDateLocal),
      clientId: orderEditForm.value.clientId > 0 ? orderEditForm.value.clientId : undefined,
      userId: orderEditForm.value.userId > 0 ? orderEditForm.value.userId : undefined,
      totalSum: orderEditForm.value.totalSum,
      userComment: orderEditForm.value.comment.trim() || null,
      meta,
    })
    showOrderEditModal.value = false
    await loadAll()
  } catch (e) {
    orderEditError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    orderEditSaving.value = false
  }
}

const submitPaymentForm = async () => {
  paymentFormError.value = ''
  if (!orderInfo.value?.clientId) {
    paymentFormError.value = 'Buyurtmada mijoz tanlanmagan'
    return
  }
  if (!paymentForm.value.paymentTypeId || !paymentForm.value.paymentDateLocal) {
    paymentFormError.value = 'To‘lov turi va sana majburiy'
    return
  }
  if (paymentForm.value.paymentAmount <= 0) {
    paymentFormError.value = 'Summa 0 dan katta bo‘lishi kerak'
    return
  }
  paymentSaving.value = true
  try {
    await createPayment({
      clientId: orderInfo.value.clientId,
      paymentTypeId: paymentForm.value.paymentTypeId,
      paymentAmount: paymentForm.value.paymentAmount,
      paymentDate: fromLocalInput(paymentForm.value.paymentDateLocal),
      saleOrderId: orderInfo.value.id,
      comment: paymentForm.value.comment.trim() || undefined,
    })
    showPaymentModal.value = false
    await loadAll()
  } catch (e) {
    paymentFormError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    paymentSaving.value = false
  }
}

onMounted(loadAll)
</script>

<style>
@media print {
  body * { visibility: hidden; }
  #sale-order-print-area, #sale-order-print-area * { visibility: visible; }
  #sale-order-print-area { position: absolute; left: 0; top: 0; width: 100%; border: none; }
}
</style>
