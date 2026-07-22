<template>
  <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="flex flex-wrap items-start justify-between gap-4 px-5 py-5 sm:px-6">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">{{ supplier.name }}</h2>
          <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClass">
            {{ statusLabel }}
          </span>
        </div>
        <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          <span v-if="supplier.inn">INN: {{ supplier.inn }}</span>
          <span>{{ t('supplierDetail.lastActivity') }}: {{ lastActivityLabel }}</span>
          <span>{{ finance.ordersCount }} {{ t('supplierDetail.orders') }}</span>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" :class="btnPrimary" @click="$emit('new-order')">
          <Plus class="h-4 w-4" />
          {{ t('supplierDetail.newOrder') }}
        </button>
        <button type="button" :class="btnOutline" @click="$emit('add-payment')">
          <Wallet class="h-4 w-4" />
          {{ t('supplierDetail.addPayment') }}
        </button>
        <button type="button" :class="btnOutline" @click="$emit('edit')">
          <Pencil class="h-4 w-4" />
          {{ t('supplierDetail.editSupplier') }}
        </button>
        <a v-if="phoneHref" :href="phoneHref" :class="btnOutline">
          <Phone class="h-4 w-4" />
          {{ t('supplierDetail.callPhone') }}
        </a>
        <button type="button" :class="btnOutline" @click="$emit('toggle-status')">
          <Power class="h-4 w-4" />
          {{ supplier.status === 'ACTIVE' ? t('supplierDetail.deactivate') : t('supplierDetail.activate') }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-px border-t border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-800 sm:grid-cols-2 xl:grid-cols-4">
      <div class="bg-white px-5 py-4 dark:bg-white/[0.03]">
        <p class="text-xs font-medium text-gray-500">{{ t('supplierDetail.totalPurchases') }}</p>
        <p class="mt-1 text-2xl font-bold text-brand-600">{{ formatMoney(finance.totalPurchases) }}</p>
      </div>
      <div class="bg-white px-5 py-4 dark:bg-white/[0.03]">
        <p class="text-xs font-medium text-gray-500">{{ t('supplierDetail.totalPaid') }}</p>
        <p class="mt-1 text-2xl font-bold text-success-600">{{ formatMoney(finance.totalPaid) }}</p>
      </div>
      <div class="bg-white px-5 py-4 dark:bg-white/[0.03]">
        <p class="text-xs font-medium text-gray-500">{{ t('supplierDetail.totalDebt') }}</p>
        <p class="mt-1 text-2xl font-bold" :class="finance.totalDebt > 0 ? 'text-error-600' : 'text-gray-800 dark:text-white/90'">
          {{ formatMoney(finance.totalDebt) }}
        </p>
      </div>
      <div class="bg-white px-5 py-4 dark:bg-white/[0.03]">
        <p class="text-xs font-medium text-gray-500">{{ t('supplierDetail.orders') }}</p>
        <p class="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{{ finance.ordersCount }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Wallet, Pencil, Phone, Power } from 'lucide-vue-next'
import type { SupplierResponse } from '@/services/suppliers'
import type { SupplierFinanceSummary } from '@/utils/supplierDetailAnalytics'

const props = defineProps<{
  supplier: SupplierResponse
  finance: SupplierFinanceSummary
  lastActivityLabel: string
}>()

defineEmits<{
  'new-order': []
  'add-payment': []
  edit: []
  'toggle-status': []
}>()

const { t } = useI18n()

const btnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'
const btnOutline =
  'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'

const formatMoney = (v: number) => `${new Intl.NumberFormat('uz-UZ').format(Math.round(v))} so‘m`

const statusLabel = computed(() => t(`common.statusValues.${props.supplier.status}`))
const statusClass = computed(() =>
  props.supplier.status === 'ACTIVE'
    ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400'
    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
)

const phoneHref = computed(() => {
  const digits = props.supplier.phone?.replace(/\D/g, '')
  return digits ? `tel:+${digits}` : null
})
</script>
