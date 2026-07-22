<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      @click="toggleDropdown"
    >
      <span
        v-if="hasUnread"
        class="absolute right-0 top-0.5 z-1 flex h-2 w-2 rounded-full bg-orange-400"
      >
        <span class="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 -z-1 animate-ping" />
      </span>
      <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
        />
      </svg>
    </button>

    <div
      v-if="dropdownOpen"
      class="absolute -right-[240px] mt-[17px] flex h-[520px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[400px] lg:right-0"
    >
      <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
        <h5 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ t('headerNotifications.title') }}</h5>
        <button type="button" @click="closeDropdown" class="text-gray-500 dark:text-gray-400">
          <svg class="fill-current" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
            />
          </svg>
        </button>
      </div>

      <div class="mt-3 inline-flex w-full gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-100 p-1 custom-scrollbar dark:border-gray-800 dark:bg-gray-900">
        <button
          v-for="tab in notificationTabs"
          :key="tab.id"
          type="button"
          @click="activeTab = tab.id"
          :class="[
            'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition whitespace-nowrap',
            activeTab === tab.id
              ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white',
          ]"
        >
          <component :is="tab.icon" class="h-3.5 w-3.5" />
          {{ tab.label }}
          <span
            v-if="tab.unreadCount > 0"
            class="rounded-full px-1.5 py-0.5 text-[10px] tabular-nums"
            :class="activeTab === tab.id ? 'bg-brand-500/10 text-brand-600' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'"
          >
            {{ tab.unreadCount }}
          </span>
        </button>
      </div>

      <div v-if="loading" class="flex flex-1 items-center justify-center text-sm text-gray-500">
        {{ t('headerNotifications.loading') }}
      </div>

      <ul v-else class="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto custom-scrollbar">
        <li v-if="filteredNotifications.length === 0" class="px-3 py-10 text-center text-sm text-gray-500">
          {{ t('headerNotifications.empty') }}
        </li>
        <li v-for="notification in filteredNotifications" :key="notification.id">
          <button
            type="button"
            class="flex w-full gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 text-left hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
            :class="!notification.read ? 'bg-brand-500/[0.03]' : ''"
            @click="openNotification(notification)"
          >
            <span
              class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              :class="typeBadgeClass(notification.type)"
            >
              <component :is="typeIcon(notification.type)" class="h-4 w-4" />
            </span>

            <span class="block min-w-0 flex-1">
              <span class="mb-1 block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                {{ t(notification.titleKey) }}
              </span>
              <span class="mb-1.5 block text-theme-sm text-gray-500 dark:text-gray-400">
                {{ formatMessage(notification) }}
              </span>
              <span class="text-theme-xs text-gray-500 dark:text-gray-400">
                {{ formatRelativeTime(notification.at) }}
              </span>
            </span>
          </button>
        </li>
      </ul>

      <router-link
        :to="activeTabLink"
        class="mt-3 flex shrink-0 justify-center rounded-lg border border-gray-300 bg-white p-3 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        @click="closeDropdown"
      >
        {{ t('headerNotifications.viewAll') }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ShoppingCart,
  CreditCard,
  Package,
  MessageSquareWarning,
} from 'lucide-vue-next'
import { useCurrentUser } from '@/composables/useCurrentUser'
import {
  fetchInAppNotifications,
  getReadNotificationIds,
  markNotificationsRead,
  type InAppNotification,
  type InAppNotificationType,
} from '@/services/inAppNotifications'

const POLL_INTERVAL_MS = 120_000

const TAB_ORDER: InAppNotificationType[] = [
  'NEW_ORDER',
  'NEW_PAYMENT',
  'LOW_STOCK',
  'SMS_FAILED',
]

const TAB_LINKS: Record<InAppNotificationType, string> = {
  NEW_ORDER: '/sale-orders',
  NEW_PAYMENT: '/payments',
  LOW_STOCK: '/stocks',
  SMS_FAILED: '/sms/history',
}

const TAB_ICONS = {
  NEW_ORDER: ShoppingCart,
  NEW_PAYMENT: CreditCard,
  LOW_STOCK: Package,
  SMS_FAILED: MessageSquareWarning,
}

const router = useRouter()
const { t } = useI18n()
const { user, isAdmin, ensureUser } = useCurrentUser()

const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const activeTab = ref<InAppNotificationType>('NEW_ORDER')
const notifications = ref<InAppNotification[]>([])
const readIds = ref(getReadNotificationIds())
let pollTimer: ReturnType<typeof setInterval> | null = null

const displayNotifications = computed(() =>
  notifications.value.map((item) => ({
    ...item,
    read: readIds.value.has(item.id),
  })),
)

const visibleTabTypes = computed(() =>
  TAB_ORDER.filter((type) => type !== 'LOW_STOCK' || isAdmin.value),
)

const notificationTabs = computed(() =>
  visibleTabTypes.value.map((type) => {
    const items = displayNotifications.value.filter((item) => item.type === type)
    return {
      id: type,
      label: t(`headerNotifications.tabs.${type}`),
      icon: TAB_ICONS[type],
      unreadCount: items.filter((item) => !item.read).length,
      totalCount: items.length,
    }
  }),
)

const filteredNotifications = computed(() =>
  displayNotifications.value.filter((item) => item.type === activeTab.value),
)

const activeTabLink = computed(() => TAB_LINKS[activeTab.value])

const hasUnread = computed(() => displayNotifications.value.some((item) => !item.read))

const formatMoney = (value: number) => `${new Intl.NumberFormat('uz-UZ').format(value)} so‘m`

const formatMessage = (notification: InAppNotification) => {
  const params = { ...(notification.messageParams ?? {}) }
  if (params.amount != null) params.amount = formatMoney(Number(params.amount))
  return t(notification.messageKey, params)
}

const formatRelativeTime = (iso: string) => {
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return iso
  const diffMin = Math.floor((Date.now() - ts) / 60_000)
  if (diffMin < 1) return t('headerNotifications.justNow')
  if (diffMin < 60) return t('headerNotifications.minutesAgo', { n: diffMin })
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return t('headerNotifications.hoursAgo', { n: diffHours })
  const diffDays = Math.floor(diffHours / 24)
  return t('headerNotifications.daysAgo', { n: diffDays })
}

const typeIcon = (type: InAppNotificationType) => TAB_ICONS[type]

const typeBadgeClass = (type: InAppNotificationType) => {
  const map = {
    NEW_ORDER: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    NEW_PAYMENT: 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400',
    LOW_STOCK: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400',
    SMS_FAILED: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
  }
  return map[type]
}

const loadNotifications = async () => {
  loading.value = notifications.value.length === 0
  try {
    await ensureUser()
    notifications.value = await fetchInAppNotifications({
      userId: user.value?.id ?? null,
      username: user.value?.username ?? null,
      isAdmin: isAdmin.value,
    })
    readIds.value = getReadNotificationIds()

    if (!visibleTabTypes.value.includes(activeTab.value)) {
      activeTab.value = visibleTabTypes.value[0] ?? 'NEW_ORDER'
    }
  } catch {
    notifications.value = []
  } finally {
    loading.value = false
  }
}

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value) {
    markNotificationsRead(notifications.value.map((item) => item.id))
    readIds.value = getReadNotificationIds()
    loadNotifications()
  }
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const openNotification = (notification: InAppNotification & { read?: boolean }) => {
  markNotificationsRead([notification.id])
  readIds.value = getReadNotificationIds()
  closeDropdown()
  router.push(notification.link)
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadNotifications()
  pollTimer = setInterval(loadNotifications, POLL_INTERVAL_MS)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (pollTimer) clearInterval(pollTimer)
})
</script>
