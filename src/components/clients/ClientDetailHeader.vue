<template>
  <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="flex flex-wrap items-start justify-between gap-4 px-5 py-5 sm:px-6">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">{{ client.fullName }}</h2>
          <span v-if="segmentLabel" class="rounded-full px-2.5 py-1 text-xs font-medium" :class="segmentClass">
            {{ segmentLabel }}
          </span>
        </div>
        <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          <span v-if="client.clientGroupName">{{ client.clientGroupName }}</span>
          <span>{{ statusLabel }}</span>
          <span>{{ t('clientDetail.lastActivity') }}: {{ lastActivityLabel }}</span>
          <span v-if="promisedPaymentDate" :class="promisedOverdue ? 'text-error-600' : 'text-warning-600'">
            {{ t('clientDetail.promisedPayment') }}: {{ formatDate(promisedPaymentDate) }}
          </span>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" :class="btnPrimary" @click="$emit('new-order')">
          <Plus class="h-4 w-4" />
          {{ t('clientDetail.newOrder') }}
        </button>
        <button type="button" :class="btnOutline" @click="$emit('add-payment')">
          <Wallet class="h-4 w-4" />
          {{ t('clientDetail.addPayment') }}
        </button>
        <button type="button" :class="btnOutline" :disabled="debt <= 0" @click="$emit('send-sms')">
          <MessageSquare class="h-4 w-4" />
          {{ t('clientDetail.sendDebtSms') }}
        </button>
        <button type="button" :class="btnOutline" @click="$emit('send-telegram')">
          <Send class="h-4 w-4" />
          {{ t('clientDetail.sendTelegram') }}
        </button>
        <a v-if="phoneHref" :href="phoneHref" :class="btnOutline">
          <Phone class="h-4 w-4" />
          {{ t('clientDetail.callPhone') }}
        </a>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-px border-t border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-800 sm:grid-cols-3">
      <div class="bg-white px-5 py-4 dark:bg-white/[0.03]">
        <p class="text-xs font-medium text-gray-500">{{ t('clientDetail.totalSales') }}</p>
        <p class="mt-1 text-2xl font-bold text-brand-600">{{ formatMoney(totalSales) }}</p>
      </div>
      <div class="bg-white px-5 py-4 dark:bg-white/[0.03]">
        <p class="text-xs font-medium text-gray-500">{{ t('clientDetail.totalPaid') }}</p>
        <p class="mt-1 text-2xl font-bold text-success-600">{{ formatMoney(totalPaid) }}</p>
      </div>
      <div class="bg-white px-5 py-4 dark:bg-white/[0.03]">
        <p class="text-xs font-medium text-gray-500">{{ t('clientDetail.totalDebt') }}</p>
        <p class="mt-1 text-2xl font-bold" :class="debt > 0 ? 'text-error-600' : 'text-gray-800 dark:text-white/90'">
          {{ formatMoney(debt) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Wallet, MessageSquare, Phone, Send } from 'lucide-vue-next'
import type { ClientResponse } from '@/services/clients'
import type { ClientSegment } from '@/utils/clientDetailAnalytics'

const props = defineProps<{
  client: ClientResponse
  totalSales: number
  totalPaid: number
  debt: number
  segment: ClientSegment
  lastActivityLabel: string
  promisedPaymentDate?: string | null
}>()

defineEmits<{
  'new-order': []
  'add-payment': []
  'send-sms': []
  'send-telegram': []
}>()

const { t } = useI18n()

const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'
const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'

const formatMoney = (v: number) => `${new Intl.NumberFormat('uz-UZ').format(Math.round(v))} so‘m`
const formatDate = (v: string) => {
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('uz-UZ')
}

const statusLabel = computed(() => t(`common.statusValues.${props.client.status}`))
const phoneHref = computed(() => {
  const digits = props.client.phone?.replace(/\D/g, '')
  return digits ? `tel:+${digits}` : null
})

const segmentLabel = computed(() => {
  const map: Record<ClientSegment, string> = {
    VIP: t('clientDetail.segmentVip'),
    RISKY: t('clientDetail.segmentRisky'),
    DORMANT: t('clientDetail.segmentDormant'),
    REGULAR: t('clientDetail.segmentRegular'),
  }
  return map[props.segment]
})

const segmentClass = computed(() => {
  const map: Record<ClientSegment, string> = {
    VIP: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    RISKY: 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
    DORMANT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    REGULAR: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
  }
  return map[props.segment]
})

const promisedOverdue = computed(() => {
  if (!props.promisedPaymentDate) return false
  return new Date(props.promisedPaymentDate).getTime() < Date.now()
})
</script>
