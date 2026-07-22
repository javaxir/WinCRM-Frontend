<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">Buyurtma pozitsiyalari</h3>
            <p v-if="orderInfo" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Buyurtma #{{ orderInfo.id }} — {{ orderInfo.supplierName }} → {{ orderInfo.warehouseName }}
              ({{ formatDate(orderInfo.arrivalDate) }})
            </p>
          </div>
          <div class="flex items-center gap-3">
            <router-link to="/warehouse-orders" :class="btnOutline">← Buyurtmalar</router-link>
            <TableColumnToggle :columns="TABLE_COLUMNS" :visible="visible" @toggle="toggleColumn" />
            <ActionIconButton action="refresh" @click="loadAll" />
            <ActionIconButton action="create" :title="t('actions.newItem')" @click="openCreate" />
          </div>
        </div>
        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
        </div>

        <div class="grid grid-cols-1 gap-4 border-t border-gray-100 px-6 py-5 dark:border-gray-800 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="card in summaryCards"
            :key="card.key"
            class="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ card.label }}</p>
                <p class="mt-2 text-xl font-bold text-brand-500">{{ card.value }}</p>
              </div>
              <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                <component :is="card.icon" class="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh v-if="isVisible('id')" label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
                  <SortableTh v-if="isVisible('goodsName')" label="Mahsulot" sortable :active="sortKey === 'goodsName'" :direction="sortKey === 'goodsName' ? sortDir : null" @sort="toggleSort('goodsName')" />
                  <SortableTh v-if="isVisible('count')" label="Miqdor" sortable :active="sortKey === 'count'" :direction="sortKey === 'count' ? sortDir : null" @sort="toggleSort('count')" />
                  <SortableTh v-if="isVisible('priceCost')" label="Tannarx" sortable :active="sortKey === 'priceCost'" :direction="sortKey === 'priceCost' ? sortDir : null" @sort="toggleSort('priceCost')" />
                  <SortableTh v-if="isVisible('priceSelling')" label="Sotuv narxi" sortable :active="sortKey === 'priceSelling'" :direction="sortKey === 'priceSelling' ? sortDir : null" @sort="toggleSort('priceSelling')" />
                  <SortableTh v-if="isVisible('arrivalDate')" label="Kelish sanasi" sortable :active="sortKey === 'arrivalDate'" :direction="sortKey === 'arrivalDate' ? sortDir : null" @sort="toggleSort('arrivalDate')" />
                  <SortableTh v-if="isVisible('status')" label="Holati" sortable :active="sortKey === 'status'" :direction="sortKey === 'status' ? sortDir : null" @sort="toggleSort('status')" />
                  <SortableTh :label="t('common.actions')" align="right" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading"><td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
                <tr v-else-if="displayItems.length === 0"><td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">Pozitsiyalar topilmadi</td></tr>
                <tr v-for="item in displayItems" :key="item.id" class="border-t border-gray-100 dark:border-gray-800">
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.id }}</span></td>
                  <td v-if="isVisible('goodsName')" class="px-5 py-4 sm:px-6"><span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ item.goodsName }}</span></td>
                  <td v-if="isVisible('count')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.count }}</span></td>
                  <td v-if="isVisible('priceCost')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatMoney(item.priceCost) }}</span></td>
                  <td v-if="isVisible('priceSelling')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatMoney(item.priceSelling) }}</span></td>
                  <td v-if="isVisible('arrivalDate')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatDate(item.arrivalDate) }}</span></td>
                  <td v-if="isVisible('status')" class="px-5 py-4 sm:px-6"><span :class="statusClass(item.status)">{{ item.status }}</span></td>
                  <td class="px-5 py-4 sm:px-6">
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
      </div>
    </div>

    <Modal v-if="showFormModal" @close="closeForm">
      <template #body>
        <div class="relative mx-4 flex w-full max-w-3xl max-h-[92vh] flex-col overflow-hidden rounded-3xl bg-white shadow-theme-xl dark:bg-gray-900">
          <div class="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">
              {{ editing ? t('warehouseOrderItems.editTitle') : t('warehouseOrderItems.createTitle') }}
            </h4>
            <p v-if="orderInfo" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ t('warehouseOrderItems.orderContext', {
                id: orderInfo.id,
                supplier: orderInfo.supplierName,
                warehouse: orderInfo.warehouseName,
              }) }}
            </p>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-5">
            <div v-if="formError" class="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
              {{ formError }}
            </div>

            <form id="warehouse-order-item-form" @submit.prevent="submitForm" class="space-y-5">
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
                    <input v-model.number="form.weight" type="number" min="0" step="0.01" :class="inputClass" />
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
            <button type="submit" form="warehouse-order-item-form" :disabled="saving" :class="btnPrimary">
              {{ saving ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <Modal v-if="showDeleteModal" @close="showDeleteModal = false">
      <template #body>
        <div class="relative w-full max-w-md p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Pozitsiyani o‘chirish</h4>
          <p class="mb-6 text-sm text-gray-500">{{ itemToDelete?.goodsName }} ni o‘chirmoqchimisiz?</p>
          <div class="flex justify-end gap-3">
            <button @click="showDeleteModal = false" :class="btnOutline">Bekor qilish</button>
            <button @click="doDelete" :disabled="deleting" class="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70">{{ deleting ? 'O‘chirilmoqda...' : 'O‘chirish' }}</button>
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
import Modal from '@/components/ui/Modal.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'
import type { SearchableSelectOption } from '@/components/common/SearchableSelect.vue'
import { ArrowRight, ChevronDown, Layers, Package, Banknote, Wallet } from 'lucide-vue-next'
import { useTableSort, useColumnVisibility, type TableColumnDef } from '@/composables/useTableControls'
import {
  fetchWarehouseOrderItemsByOrder,
  createWarehouseOrderItem,
  updateWarehouseOrderItem,
  deleteWarehouseOrderItem,
  type WarehouseOrderItemResponse,
} from '@/services/warehouseOrderItems'
import { fetchWarehouseOrderById } from '@/services/warehouseOrders'
import { fetchAllGoods } from '@/services/goods'
import type { Status } from '@/services/roles'
import type { WarehouseOrderResponse } from '@/services/warehouseOrders'
import type { GoodsResponse } from '@/services/goods'
import { calcMarkupPercent, calcSellingPriceFromMarkup } from '@/utils/markupPercent'

const { t } = useI18n()
const route = useRoute()
const orderId = computed(() => Number(route.params.orderId))

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'goodsName', label: 'Mahsulot', sortable: true },
  { key: 'count', label: 'Miqdor', sortable: true },
  { key: 'priceCost', label: 'Tannarx', sortable: true },
  { key: 'priceSelling', label: 'Sotuv narxi', sortable: true },
  { key: 'arrivalDate', label: 'Kelish sanasi', sortable: true },
  { key: 'status', label: 'Holati', sortable: true },
]
const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400'
const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'

const currentPageTitle = ref('Buyurtma pozitsiyalari')
const items = ref<WarehouseOrderItemResponse[]>([])
const orderInfo = ref<WarehouseOrderResponse | null>(null)
const goodsList = ref<GoodsResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')

const { visible, toggleColumn, isVisible } = useColumnVisibility(TABLE_COLUMNS, 'warehouse-order-items-cols')
const { sortKey, sortDir, toggleSort, applySort } = useTableSort<WarehouseOrderItemResponse>((row, key) => row[key as keyof WarehouseOrderItemResponse])
const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)
const displayItems = computed(() => applySort(items.value))

const showFormModal = ref(false)
const editing = ref<WarehouseOrderItemResponse | null>(null)
const form = ref({
  goodsId: 0,
  count: 0,
  priceCost: 0,
  priceSelling: 0,
  weight: undefined as number | undefined,
  height: undefined as number | undefined,
  arrivalDateLocal: '',
})
const formError = ref('')
const saving = ref(false)
const markupPercent = ref<number | ''>('')
const priceSellingManual = ref(false)
const showOptionalFields = ref(false)
const showDeleteModal = ref(false)
const itemToDelete = ref<WarehouseOrderItemResponse | null>(null)
const deleting = ref(false)

const toLocalInput = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
const fromLocalInput = (val: string) => (val ? new Date(val).toISOString() : '')
const statusClass = (status: Status) => ['rounded-full px-2 py-0.5 text-theme-xs font-medium', {
  'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500': status === 'ACTIVE',
  'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400': status === 'DISABLED',
  'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500': status === 'DELETED',
}]
const formatDate = (v?: string) => { if (!v) return '—'; const d = new Date(v); return isNaN(d.getTime()) ? v : d.toLocaleString() }
const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'
const formatCompactMoney = (value: number) => {
  if (value >= 1_000_000) {
    const mln = value / 1_000_000
    return `${Number.isInteger(mln) ? mln.toFixed(0) : mln.toFixed(1)} mln so‘m`
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)} ming so‘m`
  return formatMoney(value)
}
const formatCount = (value: number) => new Intl.NumberFormat('uz-UZ').format(value)

const summaryStats = computed(() => {
  const activeItems = items.value.filter((item) => item.status === 'ACTIVE')
  const uniqueGoods = new Set(activeItems.map((item) => item.goodsId)).size
  const totalUnits = activeItems.reduce((sum, item) => sum + item.count, 0)
  const totalCostAmount = activeItems.reduce((sum, item) => sum + item.priceCost * item.count, 0)
  const totalSellingAmount = activeItems.reduce((sum, item) => sum + item.priceSelling * item.count, 0)
  return { uniqueGoods, totalUnits, totalCostAmount, totalSellingAmount }
})

const summaryCards = computed(() => [
  {
    key: 'names',
    label: t('warehouseOrderItems.summaryNames'),
    value: `${formatCount(summaryStats.value.uniqueGoods)} ${t('warehouseOrderItems.piece')}`,
    icon: Layers,
  },
  {
    key: 'units',
    label: t('warehouseOrderItems.summaryUnits'),
    value: `${formatCount(summaryStats.value.totalUnits)} ${t('warehouseOrderItems.unitLabel')}`,
    icon: Package,
  },
  {
    key: 'cost',
    label: t('warehouseOrderItems.summaryCostTotal'),
    value: formatCompactMoney(summaryStats.value.totalCostAmount),
    icon: Banknote,
  },
  {
    key: 'selling',
    label: t('warehouseOrderItems.summarySellingTotal'),
    value: formatCompactMoney(summaryStats.value.totalSellingAmount),
    icon: Wallet,
  },
])

const selectedGoods = computed(() => goodsList.value.find((item) => item.id === form.value.goodsId) ?? null)
const goodsOptions = computed<SearchableSelectOption[]>(() =>
  goodsList.value.map((goods) => ({
    value: goods.id,
    label: goods.name,
    hint: [goods.goodsGroupName, goods.unitTypeName, goods.barcode].filter(Boolean).join(' · '),
    keywords: `${goods.goodsGroupName} ${goods.unitTypeName} ${goods.barcode ?? ''} ${goods.type}`,
  })),
)
const isWindowGoods = computed(() => selectedGoods.value?.type === 'WINDOW')
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

const onGoodsChange = () => {
  const goods = goodsList.value.find((item) => item.id === form.value.goodsId)
  if (!goods) return
  form.value.priceCost = goods.priceCost
  form.value.priceSelling = goods.priceSelling
  priceSellingManual.value = false
  syncMarkupFromPrices()
  if (goods.type === 'WINDOW') {
    showOptionalFields.value = true
  } else if (!form.value.weight && !form.value.height) {
    showOptionalFields.value = false
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
    const [order, orderItems, goods] = await Promise.all([
      fetchWarehouseOrderById(orderId.value),
      fetchWarehouseOrderItemsByOrder(orderId.value),
      fetchAllGoods(),
    ])
    orderInfo.value = order
    items.value = orderItems
    goodsList.value = goods.filter((g) => g.status === 'ACTIVE')
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
  weight: undefined as number | undefined,
  height: undefined as number | undefined,
  arrivalDateLocal: orderInfo.value ? toLocalInput(orderInfo.value.arrivalDate) : '',
})

const openCreate = () => {
  editing.value = null
  form.value = defaultForm()
  markupPercent.value = ''
  priceSellingManual.value = false
  showOptionalFields.value = false
  formError.value = ''
  showFormModal.value = true
}

const openEdit = (item: WarehouseOrderItemResponse) => {
  editing.value = item
  form.value = {
    goodsId: item.goodsId,
    count: item.count,
    priceCost: item.priceCost,
    priceSelling: item.priceSelling,
    weight: item.weight ?? undefined,
    height: item.height ?? undefined,
    arrivalDateLocal: toLocalInput(item.arrivalDate),
  }
  priceSellingManual.value = false
  showOptionalFields.value = goodsList.value.find((g) => g.id === item.goodsId)?.type === 'WINDOW' || !!(item.weight || item.height)
  syncMarkupFromPrices()
  formError.value = ''
  showFormModal.value = true
}

const closeForm = () => { showFormModal.value = false }

const buildPayload = () => {
  if (!orderInfo.value) throw new Error('Buyurtma ma’lumoti yo‘q')
  const payload = {
    warehouseId: orderInfo.value.warehouseId,
    warehouseOrderId: orderInfo.value.id,
    supplierId: orderInfo.value.supplierId,
    goodsId: form.value.goodsId,
    priceCost: form.value.priceCost,
    priceSelling: form.value.priceSelling,
    count: form.value.count,
    arrivalDate: fromLocalInput(form.value.arrivalDateLocal),
  } as const
  const extra: { weight?: number; height?: number } = {}
  if (form.value.weight != null && !isNaN(form.value.weight)) extra.weight = form.value.weight
  if (form.value.height != null && !isNaN(form.value.height)) extra.height = form.value.height
  return { ...payload, ...extra }
}

const submitForm = async () => {
  formError.value = ''
  if (!form.value.goodsId || !form.value.arrivalDateLocal) {
    formError.value = 'Majburiy maydonlarni to‘ldiring'
    return
  }
  saving.value = true
  try {
    const payload = buildPayload()
    if (editing.value) await updateWarehouseOrderItem(editing.value.id, payload)
    else await createWarehouseOrderItem(payload)
    showFormModal.value = false
    await loadAll()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (item: WarehouseOrderItemResponse) => { itemToDelete.value = item; showDeleteModal.value = true }
const doDelete = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await deleteWarehouseOrderItem(itemToDelete.value.id)
    showDeleteModal.value = false
    await loadAll()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'O‘chirishda xatolik'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

onMounted(loadAll)
</script>
