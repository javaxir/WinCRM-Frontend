<template>
  <component
    :is="to ? 'router-link' : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    :title="label"
    :aria-label="label"
    :class="buttonClass"
    @click="onClick"
  >
    <component :is="icon" :class="iconClass" />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  RefreshIcon,
  PlusIcon,
  TrashIcon,
  FilterIcon,
  ClearIcon,
  SunIcon,
  MoonIcon,
} from '@/icons'
import EditIcon from '@/icons/EditIcon.vue'
import ShieldIcon from '@/icons/ShieldIcon.vue'

type ActionType =
  | 'refresh'
  | 'create'
  | 'edit'
  | 'delete'
  | 'permissions'
  | 'filter'
  | 'reset'
  | 'light'
  | 'dark'
type ButtonSize = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    action: ActionType
    title?: string
    to?: string
    size?: ButtonSize
    active?: boolean
  }>(),
  { size: 'md', active: false },
)

const emit = defineEmits<{ click: [MouseEvent] }>()

const { t } = useI18n()

const defaultTitleKeys: Record<ActionType, string> = {
  refresh: 'common.refresh',
  create: 'common.create',
  edit: 'common.edit',
  delete: 'common.delete',
  permissions: 'common.permissions',
  filter: 'common.filter',
  reset: 'common.reset',
  light: 'settings.lightMode',
  dark: 'settings.darkMode',
}

const iconMap: Record<ActionType, typeof RefreshIcon> = {
  refresh: RefreshIcon,
  create: PlusIcon,
  edit: EditIcon,
  delete: TrashIcon,
  permissions: ShieldIcon,
  filter: FilterIcon,
  reset: ClearIcon,
  light: SunIcon,
  dark: MoonIcon,
}

const label = computed(() => props.title ?? t(defaultTitleKeys[props.action]))
const icon = computed(() => iconMap[props.action])

const buttonClass = computed(() => {
  const base =
    'inline-flex items-center justify-center rounded-lg transition focus:outline-hidden focus:ring-2 focus:ring-brand-500/20'
  const size = props.size === 'sm' ? 'p-2' : 'p-2.5'
  const variant =
    props.action === 'create' || (props.active && (props.action === 'light' || props.action === 'dark'))
      ? 'bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600'
      : props.action === 'delete'
        ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
        : props.action === 'edit'
          ? 'text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10'
          : 'border border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
  return [base, size, variant]
})

const iconClass = computed(() => (props.size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'))

const onClick = (event: MouseEvent) => {
  if (!props.to) {
    emit('click', event)
  }
}
</script>
