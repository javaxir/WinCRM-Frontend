<template>
  <th
    :class="[
      'px-5 py-3 sm:px-6',
      align === 'right' ? 'text-right' : 'text-left',
    ]"
  >
    <button
      v-if="sortable"
      type="button"
      @click="$emit('sort')"
      class="inline-flex items-center gap-1 font-medium text-gray-500 transition text-theme-xs hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
    >
      {{ label }}
      <span class="inline-flex flex-col leading-none">
        <svg
          :class="[
            'w-3 h-3 -mb-0.5',
            active && direction === 'asc' ? 'text-brand-500' : 'text-gray-300 dark:text-gray-600',
          ]"
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M6 2L10 7H2L6 2Z" />
        </svg>
        <svg
          :class="[
            'w-3 h-3',
            active && direction === 'desc' ? 'text-brand-500' : 'text-gray-300 dark:text-gray-600',
          ]"
          viewBox="0 0 12 12"
          fill="currentColor"
        >
          <path d="M6 10L2 5H10L6 10Z" />
        </svg>
      </span>
    </button>
    <p v-else class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">
      {{ label }}
    </p>
  </th>
</template>

<script setup lang="ts">
import type { SortDirection } from '@/composables/useTableControls'

defineProps<{
  label: string
  sortable?: boolean
  active?: boolean
  direction?: SortDirection | null
  align?: 'left' | 'right'
}>()

defineEmits<{ sort: [] }>()
</script>
