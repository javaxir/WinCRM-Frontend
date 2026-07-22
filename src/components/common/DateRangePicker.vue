<template>
  <div ref="rootRef" class="relative">
    <label v-if="label" class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ label }}</label>
    <button
      type="button"
      @click="toggleOpen"
      :class="[
        'inline-flex h-11 min-w-[220px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs transition hover:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90',
        open ? 'border-brand-300 ring-3 ring-brand-500/10 dark:border-brand-800' : '',
      ]"
    >
      <Calendar class="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
      <span class="truncate">{{ triggerText }}</span>
    </button>

    <div
      v-if="open"
      class="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,720px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
    >
      <div class="flex flex-row">
        <div class="min-w-0 flex-1 border-b border-gray-100 p-4 dark:border-gray-800 sm:border-b-0 sm:border-r">
          <flat-pickr
            :key="pickerKey"
            :model-value="pickerValue"
            :config="flatpickrConfig"
            class="date-range-flatpickr"
          />
        </div>

        <div class="flex w-full shrink-0 flex-col gap-2 p-4 sm:w-[240px]">
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
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1.5">
            <input v-model="startParts.day" type="text" maxlength="2" placeholder="KK" :class="segmentClass" @input="onStartPartsChange" />
            <input v-model="startParts.month" type="text" maxlength="2" placeholder="OO" :class="segmentClass" @input="onStartPartsChange" />
            <input v-model="startParts.year" type="text" maxlength="4" placeholder="YYYY" :class="[segmentClass, 'w-16']" @input="onStartPartsChange" />
          </div>
          <ArrowRight class="h-4 w-4 text-gray-400" />
          <div class="flex items-center gap-1.5">
            <input v-model="endParts.day" type="text" maxlength="2" placeholder="KK" :class="segmentClass" @input="onEndPartsChange" />
            <input v-model="endParts.month" type="text" maxlength="2" placeholder="OO" :class="segmentClass" @input="onEndPartsChange" />
            <input v-model="endParts.year" type="text" maxlength="4" placeholder="YYYY" :class="[segmentClass, 'w-16']" @input="onEndPartsChange" />
          </div>
        </div>
        <button
          type="button"
          @click="applyRange"
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
import { Calendar, ArrowRight } from 'lucide-vue-next'
import {
  buildDateFromParts,
  formatDisplayRange,
  formatIsoDate,
  getThisMonthRange,
  getThisWeekRange,
  getThisYearRange,
  getTodayRange,
  getYesterdayRange,
  parseDateParts,
} from '@/utils/dateRange'

const props = defineProps<{
  startDate: string
  endDate: string
  label?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:startDate': [value: string]
  'update:endDate': [value: string]
  apply: []
}>()

const { t } = useI18n()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
const pickerKey = ref(0)
const fpInstance = ref<FlatpickrInstance | null>(null)
const activePreset = ref<string | null>(null)

const draftStart = ref(props.startDate)
const draftEnd = ref(props.endDate)
const startParts = ref(parseDateParts(props.startDate))
const endParts = ref(parseDateParts(props.endDate))

const segmentClass =
  'h-10 w-12 rounded-lg border border-gray-300 bg-gray-50 px-2 text-center text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90'

const triggerText = computed(() => {
  const text = formatDisplayRange(props.startDate, props.endDate)
  return text || props.placeholder || t('dateRange.placeholder')
})

const pickerValue = computed(() => {
  if (!draftStart.value) return ''
  if (!draftEnd.value || draftStart.value === draftEnd.value) return draftStart.value
  return `${draftStart.value} to ${draftEnd.value}`
})

const presets = computed(() => {
  const items = [
    { key: 'yesterday', label: t('dateRange.yesterday'), range: getYesterdayRange() },
    { key: 'today', label: t('dateRange.today'), range: getTodayRange() },
    { key: 'week', label: t('dateRange.thisWeek'), range: getThisWeekRange() },
    { key: 'month', label: t('dateRange.thisMonth'), range: getThisMonthRange() },
    { key: 'year', label: t('dateRange.thisYear'), range: getThisYearRange() },
  ]
  return items.map((item) => ({
    ...item,
    display: formatDisplayRange(item.range.startDate, item.range.endDate),
  }))
})

const syncPartsFromDraft = () => {
  startParts.value = parseDateParts(draftStart.value)
  endParts.value = parseDateParts(draftEnd.value)
}

const syncFlatpickr = () => {
  if (!fpInstance.value || !draftStart.value) return
  const dates = draftEnd.value && draftEnd.value !== draftStart.value
    ? [draftStart.value, draftEnd.value]
    : [draftStart.value]
  fpInstance.value.setDate(dates, false)
}

const setDraftRange = (start: string, end: string, presetKey?: string) => {
  draftStart.value = start
  draftEnd.value = end
  activePreset.value = presetKey ?? null
  syncPartsFromDraft()
  nextTick(syncFlatpickr)
}

const flatpickrConfig = computed(() => ({
  mode: 'range' as const,
  inline: true,
  dateFormat: 'Y-m-d',
  locale: {
    firstDayOfWeek: 1,
  },
  onChange: (dates: Date[]) => {
    activePreset.value = null
    if (!dates.length) return
    if (dates.length === 1) {
      const date = formatIsoDate(dates[0])
      draftStart.value = date
      draftEnd.value = date
    } else {
      draftStart.value = formatIsoDate(dates[0])
      draftEnd.value = formatIsoDate(dates[1])
    }
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

const selectPreset = (preset: { key: string; range: { startDate: string; endDate: string } }) => {
  setDraftRange(preset.range.startDate, preset.range.endDate, preset.key)
}

const onStartPartsChange = () => {
  activePreset.value = null
  const date = buildDateFromParts(startParts.value.day, startParts.value.month, startParts.value.year)
  if (date) {
    draftStart.value = date
    syncFlatpickr()
  }
}

const onEndPartsChange = () => {
  activePreset.value = null
  const date = buildDateFromParts(endParts.value.day, endParts.value.month, endParts.value.year)
  if (date) {
    draftEnd.value = date
    syncFlatpickr()
  }
}

const applyRange = () => {
  let start = buildDateFromParts(startParts.value.day, startParts.value.month, startParts.value.year) || draftStart.value
  let end = buildDateFromParts(endParts.value.day, endParts.value.month, endParts.value.year) || draftEnd.value
  if (!start || !end) return
  if (start > end) [start, end] = [end, start]
  emit('update:startDate', start)
  emit('update:endDate', end)
  open.value = false
  emit('apply')
}

watch(
  () => [props.startDate, props.endDate] as const,
  ([start, end]) => {
    if (!open.value) {
      draftStart.value = start
      draftEnd.value = end
      syncPartsFromDraft()
    }
  },
)

watch(open, (isOpen) => {
  if (isOpen) {
    draftStart.value = props.startDate || getTodayRange().startDate
    draftEnd.value = props.endDate || getTodayRange().endDate
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
