<template>
  <div class="relative" ref="rootRef">
    <button
      type="button"
      :title="t('dashboard.widgetSettings')"
      :aria-label="t('dashboard.widgetSettings')"
      @click="open = !open"
      class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2.5 text-gray-700 shadow-theme-xs transition hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      <SlidersHorizontal class="h-5 w-5" />
    </button>

    <div
      v-if="open"
      class="absolute right-0 z-50 mt-2 max-h-80 w-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-lg custom-scrollbar dark:border-gray-700 dark:bg-gray-900"
    >
      <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        {{ t('dashboard.widgetVisibility') }}
      </p>
      <label
        v-for="widget in widgets"
        :key="widget.key"
        class="flex items-center gap-2 py-1.5 text-sm text-gray-700 cursor-pointer dark:text-gray-300"
      >
        <input
          type="checkbox"
          :checked="visible[widget.key]"
          @change="$emit('toggle', widget.key)"
          class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
        />
        {{ widget.label }}
      </label>
      <button
        type="button"
        @click="$emit('reset')"
        class="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        {{ t('dashboard.widgetReset') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { SlidersHorizontal } from 'lucide-vue-next'
import type { DashboardWidgetDef, DashboardWidgetId } from '@/composables/useDashboardWidgets'

defineProps<{
  widgets: DashboardWidgetDef[]
  visible: Record<DashboardWidgetId, boolean>
}>()

defineEmits<{ toggle: [key: DashboardWidgetId]; reset: [] }>()

const { t } = useI18n()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const onClickOutside = (e: MouseEvent) => {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>
