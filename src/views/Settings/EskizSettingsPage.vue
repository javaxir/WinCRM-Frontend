<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="t('eskizSettings.title')" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('eskizSettings.title') }}</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('eskizSettings.subtitle') }}</p>
        </div>

        <div v-if="loading" class="px-6 py-10 text-center text-gray-500">{{ t('common.loading') }}</div>
        <div v-else class="p-6">
          <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
          <div v-if="successMessage" class="mb-4 p-3 text-sm text-success-700 border border-success-200 rounded-lg bg-success-50 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">{{ successMessage }}</div>

          <div v-if="settings?.configured" class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('eskizSettings.email') }}</p>
              <p class="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{{ settings.email }}</p>
            </div>
            <div class="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('eskizSettings.configured') }}</p>
              <span :class="statusPillClass(settings.configured)">{{ settings.configured ? t('eskizSettings.configuredYes') : t('eskizSettings.configuredNo') }}</span>
            </div>
            <div class="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('eskizSettings.tokenActive') }}</p>
              <span :class="statusPillClass(settings.tokenActive)">{{ settings.tokenActive ? t('eskizSettings.tokenActiveYes') : t('eskizSettings.tokenActiveNo') }}</span>
            </div>
            <div class="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('eskizSettings.tokenExpiresAt') }}</p>
              <p class="mt-1 text-sm text-gray-800 dark:text-white/90">{{ formatDateTime(settings.tokenExpiresAt) }}</p>
            </div>
          </div>

          <form @submit.prevent="submitSave" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('eskizSettings.email') }}<span class="text-error-500">*</span>
              </label>
              <input
                v-model="form.email"
                type="email"
                required
                :placeholder="t('eskizSettings.emailPlaceholder')"
                :class="inputClass"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('eskizSettings.password') }}<span class="text-error-500">*</span>
              </label>
              <input
                v-model="form.password"
                type="password"
                required
                autocomplete="off"
                :placeholder="t('eskizSettings.passwordPlaceholder')"
                :class="inputClass"
              />
            </div>
            <div v-if="settings?.updatedAt" class="sm:col-span-2 text-xs text-gray-500 dark:text-gray-400">
              {{ t('eskizSettings.updatedAt') }}: {{ formatDateTime(settings.updatedAt) }}
            </div>
            <div class="sm:col-span-2 flex flex-wrap justify-end gap-3 pt-2">
              <ActionIconButton action="refresh" @click="loadSettings" />
              <button
                type="button"
                :disabled="refreshingToken || loading"
                :class="btnOutline"
                @click="refreshTokenStatus"
              >
                {{ refreshingToken ? t('common.loading') : t('eskizSettings.refreshTokenStatus') }}
              </button>
              <button type="submit" :disabled="saving" :class="btnPrimary">
                {{ saving ? t('common.saving') : t('common.save') }}
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
  fetchEskizSettings,
  saveEskizSettings,
  fetchEskizTokenStatus,
  type EskizSettingsResponse,
} from '@/services/eskizSettings'

const { t } = useI18n()

const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 disabled:opacity-70'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'

const loading = ref(false)
const saving = ref(false)
const refreshingToken = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const settings = ref<EskizSettingsResponse | null>(null)

const form = ref({
  email: '',
  password: '',
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

const fillForm = (data: EskizSettingsResponse) => {
  form.value.email = data.email || ''
}

const loadSettings = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    settings.value = await fetchEskizSettings()
    fillForm(settings.value)
    form.value.password = ''
  } catch {
    settings.value = null
    form.value = { email: '', password: '' }
  } finally {
    loading.value = false
  }
}

const submitSave = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  saving.value = true
  try {
    settings.value = await saveEskizSettings({
      email: form.value.email.trim(),
      password: form.value.password.trim(),
    })
    fillForm(settings.value)
    form.value.password = ''
    successMessage.value = t('eskizSettings.saved')
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    saving.value = false
  }
}

const refreshTokenStatus = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  refreshingToken.value = true
  try {
    settings.value = await fetchEskizTokenStatus()
    fillForm(settings.value)
    successMessage.value = t('eskizSettings.tokenStatusUpdated')
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    refreshingToken.value = false
  }
}

onMounted(loadSettings)
</script>
