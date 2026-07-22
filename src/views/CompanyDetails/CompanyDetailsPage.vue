<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="t('companyDetails.title')" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('companyDetails.title') }}</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('companyDetails.subtitle') }}</p>
        </div>

        <div v-if="loading" class="px-6 py-10 text-center text-gray-500">{{ t('common.loading') }}</div>
        <div v-else class="p-6">
          <div v-if="errorMessage" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
          <div v-if="successMessage" class="mb-4 p-3 text-sm text-success-700 border border-success-200 rounded-lg bg-success-50 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">{{ successMessage }}</div>

          <form @submit.prevent="submitForm" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('companyDetails.companyName') }}<span class="text-error-500">*</span></label>
              <input v-model="form.companyName" type="text" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('companyDetails.inn') }}<span class="text-error-500">*</span></label>
              <input v-model="form.inn" type="text" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('companyDetails.oked') }}</label>
              <input v-model="form.oked" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('companyDetails.mfo') }}</label>
              <input v-model="form.mfo" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('companyDetails.accountNumber') }}</label>
              <input v-model="form.accountNumber" type="text" :class="inputClass" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('companyDetails.bankName') }}</label>
              <input v-model="form.bankName" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('companyDetails.director') }}</label>
              <input v-model="form.director" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('companyDetails.phone') }}</label>
              <input v-model="form.phone" type="text" :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('companyDetails.email') }}</label>
              <input v-model="form.email" type="email" :class="inputClass" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('companyDetails.address') }}</label>
              <input v-model="form.address" type="text" :class="inputClass" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('companyDetails.description') }}</label>
              <textarea v-model="form.description" rows="3" :class="inputClass" />
            </div>
            <div class="sm:col-span-2 flex justify-end gap-3 pt-2">
              <ActionIconButton action="refresh" @click="loadCurrent" />
              <button type="submit" :disabled="saving" :class="btnPrimary">{{ saving ? t('common.saving') : t('common.save') }}</button>
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
  fetchCurrentCompanyDetail,
  createCompanyDetail,
  updateCompanyDetail,
  type CompanyDetailResponse,
} from '@/services/companyDetails'

const { t } = useI18n()

const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const current = ref<CompanyDetailResponse | null>(null)

const emptyForm = () => ({
  companyName: '',
  inn: '',
  oked: '',
  mfo: '',
  accountNumber: '',
  bankName: '',
  director: '',
  phone: '',
  email: '',
  address: '',
  description: '',
})

const form = ref(emptyForm())

const fillForm = (data: CompanyDetailResponse) => {
  form.value = {
    companyName: data.companyName,
    inn: data.inn,
    oked: data.oked || '',
    mfo: data.mfo || '',
    accountNumber: data.accountNumber || '',
    bankName: data.bankName || '',
    director: data.director || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    description: data.description || '',
  }
}

const loadCurrent = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    current.value = await fetchCurrentCompanyDetail()
    fillForm(current.value)
  } catch {
    current.value = null
    form.value = emptyForm()
  } finally {
    loading.value = false
  }
}

const buildPayload = () => ({
  companyName: form.value.companyName.trim(),
  inn: form.value.inn.trim(),
  oked: form.value.oked.trim() || undefined,
  mfo: form.value.mfo.trim() || undefined,
  accountNumber: form.value.accountNumber.trim() || undefined,
  bankName: form.value.bankName.trim() || undefined,
  director: form.value.director.trim() || undefined,
  phone: form.value.phone.trim() || undefined,
  email: form.value.email.trim() || undefined,
  address: form.value.address.trim() || undefined,
  description: form.value.description.trim() || undefined,
})

const submitForm = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  saving.value = true
  try {
    const payload = buildPayload()
    if (current.value?.id) {
      current.value = await updateCompanyDetail(current.value.id, payload)
    } else {
      current.value = await createCompanyDetail(payload)
    }
    fillForm(current.value)
    successMessage.value = t('companyDetails.saved')
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    saving.value = false
  }
}

onMounted(loadCurrent)
</script>
