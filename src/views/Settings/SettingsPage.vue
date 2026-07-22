<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="t('settings.title')" />

    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('settings.title') }}</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('settings.subtitle') }}</p>
        </div>

        <div class="divide-y divide-gray-100 dark:divide-gray-800">
          <div class="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ t('settings.language') }}</p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('settings.languageHint') }}</p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                @click="setLocale('uz')"
                :class="localeBtnClass(currentLocale === 'uz')"
              >
                {{ t('settings.uzbek') }}
              </button>
              <button
                type="button"
                @click="setLocale('ru')"
                :class="localeBtnClass(currentLocale === 'ru')"
              >
                {{ t('settings.russian') }}
              </button>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ t('settings.theme') }}</p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('settings.themeHint') }}</p>
            </div>
            <div class="flex gap-2">
              <ActionIconButton
                action="light"
                :active="!isDarkMode"
                @click="setTheme('light')"
              />
              <ActionIconButton
                action="dark"
                :active="isDarkMode"
                @click="setTheme('dark')"
              />
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ t('settings.pageHeader') }}</p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('settings.pageHeaderHint') }}</p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                @click="setShowPageHeader(true)"
                :class="localeBtnClass(showPageHeader)"
              >
                {{ t('settings.show') }}
              </button>
              <button
                type="button"
                @click="setShowPageHeader(false)"
                :class="localeBtnClass(!showPageHeader)"
              >
                {{ t('settings.hide') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import { setAppLocale, type AppLocale } from '@/i18n'
import { useTheme } from '@/composables/useTheme'
import { usePageHeader } from '@/composables/usePageHeader'

const { t, locale } = useI18n()
const { isDarkMode, setTheme } = useTheme()
const { showPageHeader, setShowPageHeader } = usePageHeader()

const currentLocale = computed(() => locale.value as AppLocale)

const setLocale = (value: AppLocale) => {
  setAppLocale(value)
}

const localeBtnClass = (active: boolean) => [
  'rounded-lg px-4 py-2.5 text-sm font-medium transition',
  active
    ? 'bg-brand-500 text-white shadow-theme-xs'
    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
]
</script>
