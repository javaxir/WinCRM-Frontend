<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="t('telegramBot.title')" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('telegramBot.title') }}</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('telegramBot.subtitle') }}</p>
        </div>

        <div v-if="loading" class="px-6 py-10 text-center text-gray-500">{{ t('common.loading') }}</div>
        <div v-else class="p-6">
          <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
          <div v-if="successMessage" class="mb-4 p-3 text-sm text-success-700 border border-success-200 rounded-lg bg-success-50 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">{{ successMessage }}</div>

          <div v-if="settings" class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('telegramBot.botUsername') }}</p>
              <p class="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{{ settings.botUsername }}</p>
            </div>
            <div class="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('telegramBot.maskedToken') }}</p>
              <p class="mt-1 font-mono text-sm text-gray-800 dark:text-white/90">{{ settings.maskedToken }}</p>
            </div>
            <div class="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('telegramBot.active') }}</p>
              <span :class="statusPillClass(settings.active)">{{ settings.active ? t('telegramBot.activeYes') : t('telegramBot.activeNo') }}</span>
            </div>
            <div class="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('telegramBot.botConnected') }}</p>
              <span :class="statusPillClass(settings.botConnected)">{{ settings.botConnected ? t('telegramBot.connectedYes') : t('telegramBot.connectedNo') }}</span>
            </div>
          </div>

          <form @submit.prevent="submitRegister" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('telegramBot.botUsername') }}<span class="text-error-500">*</span>
              </label>
              <input
                v-model="form.botUsername"
                type="text"
                required
                :placeholder="t('telegramBot.botUsernamePlaceholder')"
                :class="inputClass"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('telegramBot.token') }}<span class="text-error-500">*</span>
              </label>
              <input
                v-model="form.token"
                type="password"
                required
                autocomplete="off"
                :placeholder="t('telegramBot.tokenPlaceholder')"
                :class="inputClass"
              />
            </div>
            <div v-if="settings" class="sm:col-span-2 text-xs text-gray-500 dark:text-gray-400">
              {{ t('telegramBot.updatedAt') }}: {{ formatDateTime(settings.updatedAt) }}
            </div>
            <div class="sm:col-span-2 flex flex-wrap justify-end gap-3 pt-2">
              <ActionIconButton action="refresh" @click="loadSettings" />
              <button
                v-if="settings"
                type="button"
                :disabled="reconnecting"
                :class="btnSecondary"
                @click="submitReconnect"
              >
                {{ reconnecting ? t('telegramBot.reconnecting') : t('telegramBot.reconnect') }}
              </button>
              <button type="submit" :disabled="saving" :class="btnPrimary">
                {{ saving ? t('common.saving') : t('telegramBot.register') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import {
  fetchTelegramBotSettings,
  registerTelegramBot,
  reconnectTelegramBot,
  type TelegramBotSettingsResponse,
} from '@/services/telegramBotSettings'

const { t } = useI18n()

const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'
const btnSecondary = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-70 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'

const loading = ref(false)
const saving = ref(false)
const reconnecting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const settings = ref<TelegramBotSettingsResponse | null>(null)

const form = ref({
  botUsername: '',
  token: '',
})

const statusPillClass = (active: boolean) => [
  'mt-1 inline-flex rounded-full px-2 py-0.5 text-theme-xs font-medium',
  active
    ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400'
    : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
]

const formatDateTime = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const fillForm = (data: TelegramBotSettingsResponse) => {
  form.value.botUsername = data.botUsername
}

const loadSettings = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    settings.value = await fetchTelegramBotSettings()
    fillForm(settings.value)
    form.value.token = ''
  } catch {
    settings.value = null
    form.value = { botUsername: '', token: '' }
  } finally {
    loading.value = false
  }
}

const submitRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  saving.value = true
  try {
    settings.value = await registerTelegramBot({
      botUsername: form.value.botUsername.trim(),
      token: form.value.token.trim(),
    })
    fillForm(settings.value)
    form.value.token = ''
    successMessage.value = t('telegramBot.saved')
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    saving.value = false
  }
}

const submitReconnect = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  reconnecting.value = true
  try {
    settings.value = await reconnectTelegramBot()
    fillForm(settings.value)
    successMessage.value = t('telegramBot.reconnected')
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    reconnecting.value = false
  }
}

onMounted(loadSettings)
</script>
