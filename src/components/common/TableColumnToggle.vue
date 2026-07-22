<template>
  <div class="relative" ref="rootRef">
    <button
      type="button"
      :title="t('common.columns')"
      :aria-label="t('common.columns')"
      @click="open = !open"
      class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2.5 text-gray-700 shadow-theme-xs transition hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      <ColumnsIcon class="w-5 h-5" />
    </button>

    <div
      v-if="open"
      class="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900"
    >
      <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        {{ t('common.columnVisibility') }}
      </p>
      <label
        v-for="col in columns"
        :key="col.key"
        class="flex items-center gap-2 py-1.5 text-sm text-gray-700 cursor-pointer dark:text-gray-300"
      >
        <input
          type="checkbox"
          :checked="visible[col.key]"
          @change="$emit('toggle', col.key)"
          class="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
        />
        {{ col.label }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ColumnsIcon } from '@/icons'
import type { TableColumnDef } from '@/composables/useTableControls'

defineProps<{
  columns: TableColumnDef[]
  visible: Record<string, boolean>
}>()

defineEmits<{ toggle: [key: string] }>()

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
