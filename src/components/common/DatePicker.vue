<template>
  <div ref="rootRef" class="relative">
    <label v-if="label" class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ label }}</label>
    <button
      type="button"
      @click="toggleOpen"
      :class="[
        'inline-flex h-11 min-w-[220px] w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs transition hover:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90',
        open ? 'border-brand-300 ring-3 ring-brand-500/10 dark:border-brand-800' : '',
      ]"
    >
      <Calendar class="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
      <span class="truncate">{{ triggerText }}</span>
    </button>

    <div
      v-if="open"
      class="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,520px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
    >
      <div class="flex flex-row">
        <div class="min-w-0 flex-1 border-b border-gray-100 p-4 dark:border-gray-800 sm:border-b-0 sm:border-r">
          <flat-pickr
            :key="pickerKey"
            :model-value="draftDate"
            :config="flatpickrConfig"
            class="date-range-flatpickr"
          />
        </div>

        <div class="flex w-full shrink-0 flex-col gap-2 p-4 sm:w-[200px]">
          <button
            v-for="preset in presets"
            :key="preset.key"
            type="button"
            @click="selectPreset(preset)"
            :class="[
              'rounded-xl border px-4 py-3 text-left transition',
              activePreset === preset.key
                ? 'border-brand-500 bg-brand-500/10 dark:border-brand-500'
                : 'border-gray-200 bg-gray-50 hover:border-brand-300 dark:border-gray-700 dark:bg-white/5',
            ]"
          >
            <span class="block text-sm font-medium text-brand-500">{{ preset.label }}</span>
            <span class="mt-0.5 block text-xs text-gray-600 dark:text-gray-400">{{ preset.display }}</span>
          </button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3 border-t border-gray-100 px-4 py-4 dark:border-gray-800">
        <div class="flex items-center gap-1.5">
          <input v-model="dateParts.day" type="text" maxlength="2" placeholder="KK" :class="segmentClass" @input="onPartsChange" />
          <input v-model="dateParts.month" type="text" maxlength="2" placeholder="OO" :class="segmentClass" @input="onPartsChange" />
          <input v-model="dateParts.year" type="text" maxlength="4" placeholder="YYYY" :class="[segmentClass, 'w-16']" @input="onPartsChange" />
        </div>
        <button
          type="button"
          @click="applyDate"
          class="ml-auto inline-flex items-center rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
        >
          {{ t('dateRange.apply') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import flatPickr from 'vue-flatpickr-component'
import type { Instance as FlatpickrInstance } from 'flatpickr/dist/types/instance'
import { Calendar } from 'lucide-vue-next'
import {
  addDaysFromToday,
  buildDateFromParts,
  formatDisplayRange,
  formatIsoDate,
  getTodayRange,
  getTomorrowDate,
  parseDateParts,
} from '@/utils/dateRange'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    label?: string
    placeholder?: string
  }>(),
  {
    modelValue: '',
    label: '',
    placeholder: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  apply: []
}>()

const { t } = useI18n()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
const pickerKey = ref(0)
const fpInstance = ref<FlatpickrInstance | null>(null)
const activePreset = ref<string | null>(null)
const draftDate = ref(props.modelValue || '')
const dateParts = ref(parseDateParts(props.modelValue || ''))

const segmentClass =
  'h-10 w-12 rounded-lg border border-gray-300 bg-gray-50 px-2 text-center text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90'

const triggerText = computed(() => {
  const text = formatDisplayRange(props.modelValue || '', props.modelValue || '')
  return text || props.placeholder || t('dateRange.placeholder')
})

const presets = computed(() => {
  const today = getTodayRange().startDate
  const tomorrow = getTomorrowDate()
  const in7 = addDaysFromToday(7)
  const in30 = addDaysFromToday(30)
  const items = [
    { key: 'today', label: t('dateRange.today'), date: today },
    { key: 'tomorrow', label: t('dateRange.tomorrow'), date: tomorrow },
    { key: 'in7', label: t('dateRange.in7Days'), date: in7 },
    { key: 'in30', label: t('dateRange.in30Days'), date: in30 },
  ]
  return items.map((item) => ({
    ...item,
    display: formatDisplayRange(item.date, item.date),
  }))
})

const syncPartsFromDraft = () => {
  dateParts.value = parseDateParts(draftDate.value)
}

const syncFlatpickr = () => {
  if (!fpInstance.value || !draftDate.value) return
  fpInstance.value.setDate(draftDate.value, false)
}

const setDraftDate = (date: string, presetKey?: string) => {
  draftDate.value = date
  activePreset.value = presetKey ?? null
  syncPartsFromDraft()
  nextTick(syncFlatpickr)
}

const flatpickrConfig = computed(() => ({
  inline: true,
  dateFormat: 'Y-m-d',
  locale: {
    firstDayOfWeek: 1,
  },
  onChange: (dates: Date[]) => {
    activePreset.value = null
    if (!dates.length) return
    draftDate.value = formatIsoDate(dates[0])
    syncPartsFromDraft()
  },
  onReady: (_dates: Date[], _dateStr: string, instance: FlatpickrInstance) => {
    fpInstance.value = instance
    syncFlatpickr()
  },
}))

const toggleOpen = () => {
  open.value = !open.value
}

const selectPreset = (preset: { key: string; date: string }) => {
  setDraftDate(preset.date, preset.key)
}

const onPartsChange = () => {
  activePreset.value = null
  const date = buildDateFromParts(dateParts.value.day, dateParts.value.month, dateParts.value.year)
  if (date) {
    draftDate.value = date
    syncFlatpickr()
  }
}

const applyDate = () => {
  const date = buildDateFromParts(dateParts.value.day, dateParts.value.month, dateParts.value.year) || draftDate.value
  if (!date) return
  emit('update:modelValue', date)
  open.value = false
  emit('apply')
}

watch(
  () => props.modelValue,
  (value) => {
    if (!open.value) {
      draftDate.value = value || ''
      syncPartsFromDraft()
    }
  },
)

watch(open, (isOpen) => {
  if (isOpen) {
    draftDate.value = props.modelValue || getTodayRange().startDate
    syncPartsFromDraft()
    pickerKey.value += 1
    activePreset.value = null
  }
})

const onDocumentClick = (event: MouseEvent) => {
  if (!open.value || !rootRef.value) return
  if (!rootRef.value.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onDocumentClick))
onUnmounted(() => document.removeEventListener('mousedown', onDocumentClick))
</script>

<style scoped>
:deep(.date-range-flatpickr .flatpickr-input) {
  display: none;
}

:deep(.date-range-flatpickr .flatpickr-calendar) {
  margin-top: 0 !important;
  width: 100% !important;
  box-shadow: none !important;
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
}

:deep(.date-range-flatpickr .flatpickr-months) {
  margin-bottom: 0.5rem;
}

:deep(.date-range-flatpickr .flatpickr-weekdays) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

:deep(.date-range-flatpickr .flatpickr-current-month .cur-month),
:deep(.date-range-flatpickr .flatpickr-current-month input.cur-year),
:deep(.date-range-flatpickr .flatpickr-months .flatpickr-month),
:deep(.date-range-flatpickr .flatpickr-weekday),
:deep(.date-range-flatpickr .flatpickr-day) {
  color: rgb(31 41 55) !important;
}

:deep(.dark .date-range-flatpickr .flatpickr-current-month .cur-month),
:deep(.dark .date-range-flatpickr .flatpickr-current-month input.cur-year),
:deep(.dark .date-range-flatpickr .flatpickr-months .flatpickr-month),
:deep(.dark .date-range-flatpickr .flatpickr-weekday),
:deep(.dark .date-range-flatpickr .flatpickr-day),
:deep(.dark .date-range-flatpickr .flatpickr-day.prevMonthDay),
:deep(.dark .date-range-flatpickr .flatpickr-day.nextMonthDay) {
  color: rgba(255, 255, 255, 0.9) !important;
  fill: rgba(255, 255, 255, 0.9) !important;
}

:deep(.dark .date-range-flatpickr .flatpickr-day.prevMonthDay),
:deep(.dark .date-range-flatpickr .flatpickr-day.nextMonthDay) {
  color: rgba(255, 255, 255, 0.45) !important;
}

:deep(.dark .date-range-flatpickr .flatpickr-months .flatpickr-prev-month svg),
:deep(.dark .date-range-flatpickr .flatpickr-months .flatpickr-next-month svg) {
  fill: rgba(255, 255, 255, 0.9) !important;
}
</style>
