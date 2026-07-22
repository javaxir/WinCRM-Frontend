<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />

    <div class="space-y-5 sm:space-y-6">
      <GoodsDetailNav ref="navRef" :goods-id="goodsId" />

      <div v-if="loading" class="py-12 text-center text-gray-500">{{ t('common.loading') }}</div>

      <template v-else>
        <div v-if="errorMessage" class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {{ errorMessage }}
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('goodsDetail.soldTo') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('goodsDetail.soldToHint') }}</p>
          </div>
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh label="ID" sortable :active="saleSortKey === 'id'" :direction="saleSortKey === 'id' ? saleSortDir : null" @sort="toggleSaleSort('id')" />
                  <SortableTh :label="t('goodsDetail.client')" sortable :active="saleSortKey === 'clientFullName'" :direction="saleSortKey === 'clientFullName' ? saleSortDir : null" @sort="toggleSaleSort('clientFullName')" />
                  <SortableTh :label="t('goodsDetail.order')" sortable :active="saleSortKey === 'saleOrderId'" :direction="saleSortKey === 'saleOrderId' ? saleSortDir : null" @sort="toggleSaleSort('saleOrderId')" />
                  <SortableTh :label="t('goodsDetail.warehouse')" sortable :active="saleSortKey === 'warehouseName'" :direction="saleSortKey === 'warehouseName' ? saleSortDir : null" @sort="toggleSaleSort('warehouseName')" />
                  <SortableTh :label="t('goodsDetail.quantity')" sortable align="right" :active="saleSortKey === 'count'" :direction="saleSortKey === 'count' ? saleSortDir : null" @sort="toggleSaleSort('count')" />
                  <SortableTh :label="t('goodsDetail.date')" sortable :active="saleSortKey === 'arrivalDate'" :direction="saleSortKey === 'arrivalDate' ? saleSortDir : null" @sort="toggleSaleSort('arrivalDate')" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="sortedSales.length === 0">
                  <td colspan="6" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td>
                </tr>
                <tr v-for="item in sortedSales" :key="item.id">
                  <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ item.id }}</td>
                  <td class="px-5 py-4 text-theme-sm sm:px-6">
                    <router-link :to="`/clients/${item.clientId}`" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                      {{ item.clientFullName }}
                    </router-link>
                  </td>
                  <td class="px-5 py-4 text-theme-sm sm:px-6">
                    <router-link :to="`/sale-orders/${item.saleOrderId}/items`" class="text-brand-600 hover:underline dark:text-brand-400">
                      #{{ item.saleOrderId }}
                    </router-link>
                  </td>
                  <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ item.warehouseName }}</td>
                  <td class="px-5 py-4 text-right text-theme-sm text-gray-800 sm:px-6 dark:text-white/90">{{ formatCount(item.count) }}</td>
                  <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ formatDate(item.arrivalDate) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('goodsDetail.receivedFrom') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('goodsDetail.receivedFromHint') }}</p>
          </div>
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh label="ID" sortable :active="incomingSortKey === 'id'" :direction="incomingSortKey === 'id' ? incomingSortDir : null" @sort="toggleIncomingSort('id')" />
                  <SortableTh :label="t('goodsDetail.supplier')" sortable :active="incomingSortKey === 'supplierName'" :direction="incomingSortKey === 'supplierName' ? incomingSortDir : null" @sort="toggleIncomingSort('supplierName')" />
                  <SortableTh :label="t('goodsDetail.order')" sortable :active="incomingSortKey === 'warehouseOrderId'" :direction="incomingSortKey === 'warehouseOrderId' ? incomingSortDir : null" @sort="toggleIncomingSort('warehouseOrderId')" />
                  <SortableTh :label="t('goodsDetail.warehouse')" sortable :active="incomingSortKey === 'warehouseName'" :direction="incomingSortKey === 'warehouseName' ? incomingSortDir : null" @sort="toggleIncomingSort('warehouseName')" />
                  <SortableTh :label="t('goodsDetail.quantity')" sortable align="right" :active="incomingSortKey === 'count'" :direction="incomingSortKey === 'count' ? incomingSortDir : null" @sort="toggleIncomingSort('count')" />
                  <SortableTh :label="t('goodsDetail.date')" sortable :active="incomingSortKey === 'arrivalDate'" :direction="incomingSortKey === 'arrivalDate' ? incomingSortDir : null" @sort="toggleIncomingSort('arrivalDate')" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="sortedIncoming.length === 0">
                  <td colspan="6" class="px-5 py-8 text-center text-gray-500">{{ t('common.notFound') }}</td>
                </tr>
                <tr v-for="item in sortedIncoming" :key="item.id">
                  <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ item.id }}</td>
                  <td class="px-5 py-4 text-theme-sm sm:px-6">
                    <router-link :to="`/suppliers/${item.supplierId}`" class="font-medium text-brand-600 hover:underline dark:text-brand-400">
                      {{ item.supplierName }}
                    </router-link>
                  </td>
                  <td class="px-5 py-4 text-theme-sm sm:px-6">
                    <router-link :to="`/warehouse-orders/${item.warehouseOrderId}/items`" class="text-brand-600 hover:underline dark:text-brand-400">
                      #{{ item.warehouseOrderId }}
                    </router-link>
                  </td>
                  <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ item.warehouseName }}</td>
                  <td class="px-5 py-4 text-right text-theme-sm text-gray-800 sm:px-6 dark:text-white/90">{{ formatCount(item.count) }}</td>
                  <td class="px-5 py-4 text-theme-sm text-gray-500 sm:px-6">{{ formatDate(item.arrivalDate) }}</td>
                </tr>
              </tbody>
            </table>
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
import SortableTh from '@/components/common/SortableTh.vue'
import GoodsDetailNav from '@/components/goods/GoodsDetailNav.vue'
import { useTableSort } from '@/composables/useTableControls'
import { fetchSaleOrderItemsByGoods, type SaleOrderItemResponse } from '@/services/saleOrderItems'
import { fetchWarehouseOrderItemsByGoods, type WarehouseOrderItemResponse } from '@/services/warehouseOrderItems'

const { t } = useI18n()
const route = useRoute()
const goodsId = Number(route.params.id)
const navRef = ref<InstanceType<typeof GoodsDetailNav> | null>(null)

const loading = ref(true)
const errorMessage = ref('')
const sales = ref<SaleOrderItemResponse[]>([])
const incoming = ref<WarehouseOrderItemResponse[]>([])

const goods = computed(() => navRef.value?.goods ?? null)
const pageTitle = computed(() => goods.value?.name ?? t('routes.goodsDetail'))

const formatCount = (v: number) => new Intl.NumberFormat('uz-UZ').format(v)
const formatDate = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleDateString()
}

const {
  sortKey: saleSortKey,
  sortDir: saleSortDir,
  toggleSort: toggleSaleSort,
  applySort: applySaleSort,
} = useTableSort<SaleOrderItemResponse>((row, key) => row[key as keyof SaleOrderItemResponse])

const {
  sortKey: incomingSortKey,
  sortDir: incomingSortDir,
  toggleSort: toggleIncomingSort,
  applySort: applyIncomingSort,
} = useTableSort<WarehouseOrderItemResponse>((row, key) => row[key as keyof WarehouseOrderItemResponse])

const sortedSales = computed(() => applySaleSort(sales.value))
const sortedIncoming = computed(() => applyIncomingSort(incoming.value))

const loadMovements = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [saleItems, warehouseItems] = await Promise.all([
      fetchSaleOrderItemsByGoods(goodsId),
      fetchWarehouseOrderItemsByGoods(goodsId),
    ])
    sales.value = saleItems
    incoming.value = warehouseItems
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
    sales.value = []
    incoming.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadMovements)
</script>
