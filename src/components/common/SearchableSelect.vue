<template>
  <div class="relative" v-click-outside="closeDropdown">
    <div class="relative">
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        ref="inputRef"
        :value="inputValue"
        type="text"
        :placeholder="placeholder"
        :class="inputClass + ' pl-10 pr-10'"
        autocomplete="off"
        @input="onInput"
        @focus="openDropdown"
      />
      <ChevronDown
        class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition"
        :class="open ? 'rotate-180' : ''"
      />
    </div>

    <div
      v-if="open"
      class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
    >
      <button
        v-for="option in filteredOptions"
        :key="option.value"
        type="button"
        class="flex w-full flex-col items-start px-4 py-2.5 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-white/5"
        :class="option.value === modelValue ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-gray-800 dark:text-white/90'"
        @mousedown.prevent="selectOption(option)"
      >
        <span class="font-medium">{{ option.label }}</span>
        <span v-if="option.hint" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ option.hint }}</span>
      </button>
      <p v-if="filteredOptions.length === 0" class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
        {{ emptyText }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, ChevronDown } from 'lucide-vue-next'

export interface SearchableSelectOption {
  value: number
  label: string
  hint?: string
  keywords?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: number
    options: SearchableSelectOption[]
    placeholder?: string
    emptyText?: string
    inputClass?: string
  }>(),
  {
    placeholder: 'Tanlang yoki qidiring...',
    emptyText: 'Topilmadi',
    inputClass:
      'h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
  select: [option: SearchableSelectOption]
}>()

const open = ref(false)
const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const selectedOption = computed(() => props.options.find((option) => option.value === props.modelValue) ?? null)

const inputValue = computed(() => (open.value ? query.value : selectedOption.value?.label ?? query.value))

const filteredOptions = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((option) => {
    const haystack = `${option.label} ${option.hint ?? ''} ${option.keywords ?? ''}`.toLowerCase()
    return haystack.includes(q)
  })
})

const openDropdown = () => {
  open.value = true
  query.value = ''
}

const closeDropdown = () => {
  open.value = false
  query.value = ''
}

const onInput = (event: Event) => {
  query.value = (event.target as HTMLInputElement).value
  open.value = true
  if (!query.value.trim() && props.modelValue) {
    emit('update:modelValue', 0)
  }
}

const selectOption = (option: SearchableSelectOption) => {
  emit('update:modelValue', option.value)
  emit('select', option)
  closeDropdown()
}

watch(
  () => props.modelValue,
  (value) => {
    if (!value) query.value = ''
  },
)
</script>

<script lang="ts">
import vClickOutside from './v-click-outside.vue'

export default {
  directives: {
    clickOutside: vClickOutside,
  },
}
</script>
