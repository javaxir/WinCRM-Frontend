<template>
  <div
    class="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6"
  >
    <div class="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Orders</h3>
      </div>

      <div class="flex items-center gap-3">
        <TableColumnToggle
          :columns="TABLE_COLUMNS"
          :visible="visible"
          @toggle="toggleColumn"
        />
      </div>
    </div>

    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full">
        <thead>
          <tr class="border-t border-gray-100 dark:border-gray-800">
            <SortableTh
              v-if="isVisible('id')"
              label="ID"
              sortable
              :active="sortKey === 'id'"
              :direction="sortKey === 'id' ? sortDir : null"
              @sort="toggleSort('id')"
            />
            <SortableTh
              v-if="isVisible('name')"
              label="Products"
              sortable
              :active="sortKey === 'name'"
              :direction="sortKey === 'name' ? sortDir : null"
              @sort="toggleSort('name')"
            />
            <SortableTh
              v-if="isVisible('category')"
              label="Category"
              sortable
              :active="sortKey === 'category'"
              :direction="sortKey === 'category' ? sortDir : null"
              @sort="toggleSort('category')"
            />
            <SortableTh
              v-if="isVisible('price')"
              label="Price"
              sortable
              :active="sortKey === 'price'"
              :direction="sortKey === 'price' ? sortDir : null"
              @sort="toggleSort('price')"
            />
            <SortableTh
              v-if="isVisible('status')"
              label="Status"
              sortable
              :active="sortKey === 'status'"
              :direction="sortKey === 'status' ? sortDir : null"
              @sort="toggleSort('status')"
            />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="product in displayProducts"
            :key="product.id"
            class="border-t border-gray-100 dark:border-gray-800"
          >
            <td v-if="isVisible('id')" class="py-3 whitespace-nowrap">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ product.id }}</p>
            </td>
            <td v-if="isVisible('name')" class="py-3 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <div class="h-[50px] w-[50px] overflow-hidden rounded-md">
                  <img :src="product.image" :alt="product.name" />
                </div>
                <div>
                  <p class="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ product.name }}
                  </p>
                  <span class="text-gray-500 text-theme-xs dark:text-gray-400"
                    >{{ product.variants }} Variants</span
                  >
                </div>
              </div>
            </td>
            <td v-if="isVisible('category')" class="py-3 whitespace-nowrap">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ product.category }}</p>
            </td>
            <td v-if="isVisible('price')" class="py-3 whitespace-nowrap">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ product.priceLabel }}</p>
            </td>
            <td v-if="isVisible('status')" class="py-3 whitespace-nowrap">
              <span
                :class="{
                  'rounded-full px-2 py-0.5 text-theme-xs font-medium': true,
                  'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500':
                    product.status === 'Delivered',
                  'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400':
                    product.status === 'Pending',
                  'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500':
                    product.status === 'Canceled',
                }"
              >
                {{ product.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import {
  useTableSort,
  useColumnVisibility,
  type TableColumnDef,
} from '@/composables/useTableControls'

interface ProductRow {
  id: number
  name: string
  variants: number
  image: string
  category: string
  price: number
  priceLabel: string
  status: string
}

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Products', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'price', label: 'Price', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
]

const products = ref<ProductRow[]>([
  {
    id: 1,
    name: 'Macbook pro 13"',
    variants: 2,
    image: '/images/product/product-01.jpg',
    category: 'Laptop',
    price: 2399,
    priceLabel: '$2399.00',
    status: 'Delivered',
  },
  {
    id: 2,
    name: 'Apple Watch Ultra',
    variants: 1,
    image: '/images/product/product-02.jpg',
    category: 'Watch',
    price: 879,
    priceLabel: '$879.00',
    status: 'Pending',
  },
  {
    id: 3,
    name: 'iPhone 15 Pro Max',
    variants: 2,
    image: '/images/product/product-03.jpg',
    category: 'SmartPhone',
    price: 1869,
    priceLabel: '$1869.00',
    status: 'Delivered',
  },
  {
    id: 4,
    name: 'iPad Pro 3rd Gen',
    variants: 2,
    image: '/images/product/product-04.jpg',
    category: 'Electronics',
    price: 1699,
    priceLabel: '$1699.00',
    status: 'Canceled',
  },
  {
    id: 5,
    name: 'Airpods Pro 2nd Gen',
    variants: 1,
    image: '/images/product/product-05.jpg',
    category: 'Accessories',
    price: 240,
    priceLabel: '$240.00',
    status: 'Delivered',
  },
])

const getValue = (row: ProductRow, key: string) => row[key as keyof ProductRow]

const { sortKey, sortDir, toggleSort, applySort } = useTableSort<ProductRow>(getValue)
const { visible, toggleColumn, isVisible } = useColumnVisibility(
  TABLE_COLUMNS,
  'recent-orders-columns',
)

const displayProducts = computed(() => applySort(products.value))
</script>
