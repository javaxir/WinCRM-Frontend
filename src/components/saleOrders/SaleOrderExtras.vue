<template>
  <div>
    <!-- Payments -->
    <div v-if="panel === 'payments'">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{{ t('saleOrderItems.paymentsHint') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="order.clientId"
            type="button"
            :class="btnSuccess"
            @click="emit('add-payment')"
          >
            <CreditCard class="h-4 w-4" />
            {{ t('actions.newPayment') }}
          </button>
          <ActionIconButton action="refresh" @click="loadPayments" />
        </div>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
          <p class="text-xs font-medium text-gray-500">{{ t('clientDetail.paymentsTotal') }}</p>
          <p class="mt-1 text-lg font-semibold text-brand-600">{{ formatMoney(paymentsTotal) }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
          <p class="text-xs font-medium text-gray-500">{{ t('saleOrderItems.tabPayments') }}</p>
          <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{{ orderPayments.length }} ta</p>
        </div>
      </div>
      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">ID</th>
              <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('clientDetail.paymentDate') }}</th>
              <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('clientDetail.paymentType') }}</th>
              <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('clientDetail.paymentAmount') }}</th>
              <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('saleOrderItems.comment') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="paymentsLoading"><td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.loading') }}</td></tr>
            <tr v-else-if="orderPayments.length === 0"><td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td></tr>
            <tr v-for="payment in orderPayments" :key="payment.id">
              <td class="px-5 py-4 text-sm text-gray-500">#{{ payment.id }}</td>
              <td class="px-5 py-4 text-sm text-gray-500">{{ formatDateTime(payment.paymentDate) }}</td>
              <td class="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{{ payment.paymentTypeName }}</td>
              <td class="px-5 py-4 text-right text-sm font-medium text-success-600">{{ formatMoney(payment.paymentAmount) }}</td>
              <td class="px-5 py-4 text-sm text-gray-500">{{ payment.comment || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Timeline -->
    <div v-else-if="panel === 'timeline'">
      <div v-if="timelineEntries.length === 0" class="py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</div>
      <ol v-else class="space-y-4">
        <li
          v-for="entry in timelineEntries"
          :key="entry.id"
          class="relative flex gap-3 border-l-2 border-brand-200 pl-4 dark:border-brand-500/30"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm text-gray-800 dark:text-white/90">{{ entry.message }}</p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ formatDateTime(entry.at) }}
              <span v-if="entry.by"> · {{ entry.by }}</span>
            </p>
          </div>
        </li>
      </ol>
    </div>

    <!-- Attachments -->
    <div v-else-if="panel === 'files'">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('saleOrderItems.filesHint') }}</p>
        <label :class="btnOutline + ' cursor-pointer'">
          <input type="file" class="hidden" multiple @change="onFileSelect" />
          <Plus class="h-4 w-4" />
          {{ t('saleOrderItems.uploadFile') }}
        </label>
      </div>
      <div v-if="fileError" class="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
        {{ fileError }}
      </div>
      <div v-if="uploading" class="mb-3 text-sm text-gray-500">{{ t('common.saving') }}</div>
      <div v-if="attachments.length === 0" class="py-8 text-center text-sm text-gray-500">{{ t('saleOrderItems.noFiles') }}</div>
      <ul v-else class="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
        <li
          v-for="file in attachments"
          :key="file.fileName"
          class="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">{{ file.originalName }}</p>
            <p class="text-xs text-gray-500">{{ formatDateTime(file.uploadedAt) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <a
              :href="getFileUrl(file.fileName)"
              target="_blank"
              rel="noopener"
              :class="btnOutline + ' !py-2 !text-xs'"
            >
              {{ t('saleOrderItems.openFile') }}
            </a>
            <button type="button" :class="btnOutline + ' !py-2 !text-xs text-red-600'" @click="removeAttachment(file.fileName)">
              {{ t('common.delete') }}
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Notifications -->
    <div v-else-if="panel === 'notify'">
      <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">{{ t('saleOrderItems.notifyHint') }}</p>

      <div v-if="notifyError" class="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
        {{ notifyError }}
      </div>
      <div v-if="notifySuccess" class="mb-3 rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
        {{ notifySuccess }}
      </div>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <!-- SMS -->
        <div class="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <div class="mb-3 flex items-center gap-2">
            <MessageSquare class="h-4 w-4 text-brand-500" />
            <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('saleOrderItems.channelSms') }}</h4>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('saleOrderItems.notifyPreview') }}</p>
          <p class="mt-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            {{ debtSmsPreview }}
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <button type="button" :disabled="notifySending === 'sms-order'" :class="btnPrimary" @click="sendOrderDebtSms">
              {{ notifySending === 'sms-order' ? t('common.saving') : t('saleOrderItems.sendOrderDebtSms') }}
            </button>
            <button
              v-if="order.clientId"
              type="button"
              :disabled="notifySending === 'sms-client'"
              :class="btnOutline"
              @click="sendClientDebtSms"
            >
              {{ notifySending === 'sms-client' ? t('common.saving') : t('saleOrderItems.sendClientDebtSms') }}
            </button>
          </div>
        </div>

        <!-- Telegram -->
        <div class="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <Send class="h-4 w-4 text-brand-500" />
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('saleOrderItems.channelTelegram') }}</h4>
            </div>
            <span v-if="botSettings" :class="botStatusClass">
              {{ botSettings.botConnected ? t('telegramBot.connectedYes') : t('telegramBot.connectedNo') }}
            </span>
          </div>

          <div v-if="!order.clientId" class="rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
            {{ t('saleOrderItems.noClientForTelegram') }}
          </div>
          <template v-else>
            <div v-if="botSettings && !botSettings.botConnected" class="mb-3 rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
              {{ t('saleOrderItems.botNotConnectedWarning') }}
            </div>
            <div class="space-y-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('saleOrderItems.notifyTemplate') }}</label>
                <select v-model="notifyTemplate" :class="inputClass">
                  <option value="ready">{{ t('saleOrderItems.templateReady') }}</option>
                  <option value="confirmed">{{ t('saleOrderItems.templateConfirmed') }}</option>
                  <option value="debt">{{ t('saleOrderItems.templateDebt') }}</option>
                  <option value="custom">{{ t('saleOrderItems.templateCustom') }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('saleOrderItems.notifyMessage') }}</label>
                <textarea
                  v-model="telegramMessage"
                  rows="4"
                  :class="inputClass + ' min-h-[96px] resize-y'"
                  :placeholder="t('saleOrderItems.notifyMessage')"
                />
              </div>
            </div>
            <div class="mt-4">
              <button
                type="button"
                :disabled="notifySending === 'telegram' || !telegramMessage.trim()"
                :class="btnPrimary"
                @click="sendTelegramMessage"
              >
                {{ notifySending === 'telegram' ? t('common.saving') : t('saleOrderItems.sendTelegram') }}
              </button>
            </div>
          </template>
        </div>
      </div>

      <!-- History -->
      <div class="mt-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('saleOrderItems.notifyHistory') }}</h4>
          <div class="flex items-center gap-2">
            <div class="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-900">
              <button
                type="button"
                :class="historyTabBtnClass('sms')"
                @click="historyTab = 'sms'"
              >
                SMS
              </button>
              <button
                type="button"
                :class="historyTabBtnClass('telegram')"
                @click="historyTab = 'telegram'"
              >
                Telegram
              </button>
            </div>
            <ActionIconButton action="refresh" @click="loadNotifyHistory" />
          </div>
        </div>

        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">ID</th>
                <th v-if="historyTab === 'sms'" class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('clientDetail.smsPhone') }}</th>
                <th v-else class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('saleOrderItems.telegramChat') }}</th>
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('common.status') }}</th>
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('sms.message') }}</th>
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('clientDetail.smsDate') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="historyLoading"><td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.loading') }}</td></tr>
              <tr v-else-if="historyTab === 'sms' && smsHistory.length === 0"><td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td></tr>
              <tr v-else-if="historyTab === 'telegram' && telegramHistory.length === 0"><td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td></tr>
              <template v-else-if="historyTab === 'sms'">
                <tr v-for="item in smsHistory" :key="item.id">
                  <td class="px-5 py-4 text-sm text-gray-500">#{{ item.id }}</td>
                  <td class="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{{ item.phone || '—' }}</td>
                  <td class="px-5 py-4 text-sm"><span :class="smsStatusClass(item)">{{ smsStatusLabel(item) }}</span></td>
                  <td class="px-5 py-4 text-sm text-gray-500">{{ getSmsDisplayMessage(item) }}</td>
                  <td class="px-5 py-4 text-sm text-gray-500">{{ formatDateTime(item.sentAt || item.createdAt) }}</td>
                </tr>
              </template>
              <template v-else>
                <tr v-for="item in telegramHistory" :key="item.id">
                  <td class="px-5 py-4 text-sm text-gray-500">#{{ item.id }}</td>
                  <td class="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{{ item.chatId || '—' }}</td>
                  <td class="px-5 py-4 text-sm"><span :class="telegramStatusClass(item)">{{ telegramStatusLabel(item) }}</span></td>
                  <td class="px-5 py-4 text-sm text-gray-500">{{ getTelegramDisplayMessage(item) }}</td>
                  <td class="px-5 py-4 text-sm text-gray-500">{{ formatDateTime(item.sentAt || item.createdAt) }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, CreditCard, MessageSquare, Send } from 'lucide-vue-next'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import { fetchPaymentsBySaleOrder, type PaymentResponse } from '@/services/payments'
import {
  sendDebtSmsForOrder,
  sendDebtSmsToClient,
  sendTelegramForOrder,
  fetchDebtNotificationHistoryByClient,
  fetchTelegramHistoryByOrder,
  type DebtNotificationHistoryResponse,
  type TelegramNotificationHistoryResponse,
} from '@/services/notifications'
import { fetchTelegramBotSettings, type TelegramBotSettingsResponse } from '@/services/telegramBotSettings'
import { getFileUrl, uploadFile } from '@/services/files'
import type { SaleOrderResponse } from '@/services/saleOrders'
import type { SaleOrderAttachment, SaleOrderActivityEntry } from '@/utils/saleOrderMeta'
import {
  normalizeSmsStatus,
  isSmsStatusSuccess,
  getSmsDisplayMessage,
  SMS_STATUS_I18N_KEY,
} from '@/utils/smsNotificationStatus'
import {
  normalizeTelegramStatus,
  isTelegramStatusSuccess,
  getTelegramDisplayMessage,
  TELEGRAM_STATUS_I18N_KEY,
} from '@/utils/telegramNotificationStatus'

export type SaleOrderExtraPanel = 'payments' | 'timeline' | 'files' | 'notify'

const props = defineProps<{
  order: SaleOrderResponse
  attachments: SaleOrderAttachment[]
  panel: SaleOrderExtraPanel
}>()

const emit = defineEmits<{
  refresh: []
  'update-attachments': [SaleOrderAttachment[]]
  'log-activity': [Omit<SaleOrderActivityEntry, 'id'>]
  'add-payment': []
  'payments-loaded': [number]
}>()

const { t } = useI18n()

const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'
const btnSuccess = 'inline-flex items-center gap-2 rounded-lg bg-success-600 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-success-700 disabled:opacity-70'

const orderPayments = ref<PaymentResponse[]>([])
const paymentsLoading = ref(false)
const fileError = ref('')
const uploading = ref(false)
const notifySending = ref<'sms-order' | 'sms-client' | 'telegram' | null>(null)
const notifyError = ref('')
const notifySuccess = ref('')
const notifyTemplate = ref<'ready' | 'confirmed' | 'debt' | 'custom'>('ready')
const telegramMessage = ref('')
const botSettings = ref<TelegramBotSettingsResponse | null>(null)
const historyTab = ref<'sms' | 'telegram'>('sms')
const historyLoading = ref(false)
const smsHistory = ref<DebtNotificationHistoryResponse[]>([])
const telegramHistory = ref<TelegramNotificationHistoryResponse[]>([])

const debtSmsPreview = computed(() =>
  t('saleOrderItems.msgDebt', {
    id: props.order.id,
    client: props.order.clientFullName || t('saleOrderItems.noClient'),
    debt: formatMoney(props.order.debtSum),
  }),
)

const templateMessage = computed(() => {
  const client = props.order.clientFullName || t('saleOrderItems.noClient')
  if (notifyTemplate.value === 'ready') {
    return t('saleOrderItems.msgReady', { client, id: props.order.id })
  }
  if (notifyTemplate.value === 'confirmed') {
    return t('saleOrderItems.msgConfirmed', { client, id: props.order.id })
  }
  if (notifyTemplate.value === 'debt') {
    return t('saleOrderItems.msgDebt', { client, id: props.order.id, debt: formatMoney(props.order.debtSum) })
  }
  return telegramMessage.value
})

const botStatusClass = computed(() =>
  botSettings.value?.botConnected
    ? 'inline-flex rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400'
    : 'inline-flex rounded-full bg-warning-50 px-2.5 py-1 text-xs font-medium text-warning-700 dark:bg-warning-500/10 dark:text-warning-400',
)

const historyTabBtnClass = (tab: 'sms' | 'telegram') =>
  [
    'rounded-md px-3 py-1.5 text-xs font-medium transition',
    historyTab.value === tab
      ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
      : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white',
  ].join(' ')

const smsStatusLabel = (item: DebtNotificationHistoryResponse) => t(SMS_STATUS_I18N_KEY[normalizeSmsStatus(item)])
const smsStatusClass = (item: DebtNotificationHistoryResponse) => {
  const ok = isSmsStatusSuccess(normalizeSmsStatus(item))
  return ok
    ? 'inline-flex rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400'
    : 'inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400'
}

const telegramStatusLabel = (item: TelegramNotificationHistoryResponse) =>
  t(TELEGRAM_STATUS_I18N_KEY[normalizeTelegramStatus(item)])
const telegramStatusClass = (item: TelegramNotificationHistoryResponse) => {
  const ok = isTelegramStatusSuccess(normalizeTelegramStatus(item))
  return ok
    ? 'inline-flex rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400'
    : 'inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400'
}

const paymentsTotal = computed(() =>
  orderPayments.value.reduce((sum, payment) => sum + payment.paymentAmount, 0),
)

const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'
const formatDateTime = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString('uz-UZ')
}

const timelineEntries = computed(() => {
  const entries: SaleOrderActivityEntry[] = []

  entries.push({
    id: 'created',
    type: 'created',
    message: t('saleOrderItems.activityCreated', { id: props.order.id }),
    at: props.order.createdAt,
    by: props.order.createdUsername,
  })

  for (const payment of orderPayments.value) {
    entries.push({
      id: `payment-${payment.id}`,
      type: 'payment',
      message: t('saleOrderItems.activityPayment', {
        amount: formatMoney(payment.paymentAmount),
        type: payment.paymentTypeName,
      }),
      at: payment.paymentDate,
      by: payment.createdUsername,
    })
  }

  for (const item of props.order.activityLog ?? []) {
    entries.push(item)
  }

  if (props.order.cancelReason) {
    entries.push({
      id: 'cancel-reason',
      type: 'cancelled',
      message: t('saleOrderItems.activityCancelled', { reason: props.order.cancelReason }),
      at: props.order.updatedAt,
      by: null,
    })
  }

  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
})

const loadPayments = async () => {
  paymentsLoading.value = true
  try {
    const rows = await fetchPaymentsBySaleOrder(props.order.id)
    orderPayments.value = rows.filter((p) => p.status === 'ACTIVE').sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
    )
    emit('payments-loaded', orderPayments.value.length)
  } catch {
    orderPayments.value = []
    emit('payments-loaded', 0)
  } finally {
    paymentsLoading.value = false
  }
}

const loadBotSettings = async () => {
  try {
    botSettings.value = await fetchTelegramBotSettings()
  } catch {
    botSettings.value = null
  }
}

const loadNotifyHistory = async () => {
  historyLoading.value = true
  try {
    const tasks: Promise<void>[] = []

    if (props.order.clientId) {
      tasks.push(
        fetchDebtNotificationHistoryByClient(props.order.clientId)
          .then((rows) => {
            smsHistory.value = rows.sort(
              (a, b) =>
                new Date(b.sentAt || b.createdAt || 0).getTime() -
                new Date(a.sentAt || a.createdAt || 0).getTime(),
            )
          })
          .catch(() => {
            smsHistory.value = []
          }),
      )
    } else {
      smsHistory.value = []
    }

    tasks.push(
      fetchTelegramHistoryByOrder(props.order.id)
        .then((rows) => {
          telegramHistory.value = rows.sort(
            (a, b) =>
              new Date(b.sentAt || b.createdAt || 0).getTime() -
              new Date(a.sentAt || a.createdAt || 0).getTime(),
          )
        })
        .catch(() => {
          telegramHistory.value = []
        }),
    )

    await Promise.all(tasks)
  } finally {
    historyLoading.value = false
  }
}

const sendOrderDebtSms = async () => {
  notifyError.value = ''
  notifySuccess.value = ''
  notifySending.value = 'sms-order'
  try {
    await sendDebtSmsForOrder(props.order.id)
    notifySuccess.value = t('saleOrderItems.debtSmsSent')
    emit('log-activity', {
      type: 'message',
      message: t('saleOrderItems.activityDebtSms'),
      at: new Date().toISOString(),
      by: null,
    })
    await loadNotifyHistory()
  } catch (e) {
    notifyError.value = e instanceof Error ? e.message : t('saleOrderItems.notifyFailed')
  } finally {
    notifySending.value = null
  }
}

const sendClientDebtSms = async () => {
  if (!props.order.clientId) return
  notifyError.value = ''
  notifySuccess.value = ''
  notifySending.value = 'sms-client'
  try {
    await sendDebtSmsToClient(props.order.clientId)
    notifySuccess.value = t('saleOrderItems.clientDebtSmsSent')
    emit('log-activity', {
      type: 'message',
      message: t('saleOrderItems.activityClientDebtSms'),
      at: new Date().toISOString(),
      by: null,
    })
    await loadNotifyHistory()
  } catch (e) {
    notifyError.value = e instanceof Error ? e.message : t('saleOrderItems.notifyFailed')
  } finally {
    notifySending.value = null
  }
}

const sendTelegramMessage = async () => {
  const message = telegramMessage.value.trim()
  if (!message) {
    notifyError.value = t('saleOrderItems.notifyMessageRequired')
    return
  }
  notifyError.value = ''
  notifySuccess.value = ''
  notifySending.value = 'telegram'
  try {
    await sendTelegramForOrder(props.order.id, { message })
    notifySuccess.value = t('saleOrderItems.telegramSent')
    emit('log-activity', {
      type: 'message',
      message: t('saleOrderItems.activityTelegram'),
      at: new Date().toISOString(),
      by: null,
    })
    await loadNotifyHistory()
  } catch (e) {
    notifyError.value = e instanceof Error ? e.message : t('saleOrderItems.notifyFailed')
  } finally {
    notifySending.value = null
  }
}

const onFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return
  fileError.value = ''
  uploading.value = true
  try {
    const next = [...props.attachments]
    for (const file of Array.from(files)) {
      const fileName = await uploadFile(file)
      next.push({
        fileName,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      })
    }
    emit('update-attachments', next)
    emit('log-activity', {
      type: 'file',
      message: t('saleOrderItems.activityFileUploaded', { count: files.length }),
      at: new Date().toISOString(),
      by: null,
    })
  } catch (e) {
    fileError.value = e instanceof Error ? e.message : t('saleOrderItems.uploadFailed')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

const removeAttachment = (fileName: string) => {
  emit(
    'update-attachments',
    props.attachments.filter((file) => file.fileName !== fileName),
  )
}

watch(
  () => props.order.id,
  () => {
    loadPayments()
  },
  { immediate: true },
)

watch(
  () => [props.panel, props.order.id] as const,
  ([panel]) => {
    if (panel !== 'notify') return
    loadBotSettings()
    loadNotifyHistory()
  },
  { immediate: true },
)

watch(notifyTemplate, (template) => {
  if (template !== 'custom') {
    telegramMessage.value = templateMessage.value
  }
})

watch(templateMessage, (message) => {
  if (notifyTemplate.value !== 'custom') {
    telegramMessage.value = message
  }
}, { immediate: true })

defineExpose({ loadPayments, timelineCount: computed(() => timelineEntries.value.length) })
</script>
