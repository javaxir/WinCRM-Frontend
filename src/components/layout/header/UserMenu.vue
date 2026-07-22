<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.prevent="toggleDropdown"
    >
      <span class="mr-3 shrink-0">
        <UserAvatar
          :photo-link="user?.photoLink"
          :alt="displayName"
          size="md"
        />
      </span>

      <span class="hidden text-left sm:block">
        <span class="block font-medium text-theme-sm text-gray-800 dark:text-white/90">{{ displayName }}</span>
      </span>

      <ChevronDownIcon :class="{ 'rotate-180': dropdownOpen }" class="ml-1" />
    </button>

    <div
      v-if="dropdownOpen"
      class="absolute right-0 mt-[17px] flex w-[280px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
    >
      <div class="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
        <UserAvatar :photo-link="user?.photoLink" :alt="displayName" size="md" />
        <div class="min-w-0">
          <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ displayName }}</span>
          <span v-if="roleLabel" class="block text-theme-xs text-gray-500 dark:text-gray-400">{{ roleLabel }}</span>
          <span v-if="user?.username" class="block text-theme-xs text-gray-400">@{{ user.username }}</span>
        </div>
      </div>

      <div class="py-3 border-b border-gray-200 dark:border-gray-800">
        <span class="block mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {{ t('headerUser.support') }}
        </span>
        <div class="flex flex-col gap-1.5">
          <a
            v-for="link in supportLinks"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            @click="closeDropdown"
            class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <component :is="link.icon" class="w-4 h-4 text-gray-500" />
            {{ link.label }}
            <svg class="w-3 h-3 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      <router-link
        to="/settings"
        @click="closeDropdown"
        class="flex w-full items-center gap-3 px-3 py-2 mt-1 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
      >
        <SettingsIcon class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
        {{ t('menu.settings') }}
      </router-link>

      <button
        type="button"
        @click="signOut"
        class="flex w-full items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
      >
        <LogoutIcon class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
        {{ t('auth.signOut') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronDownIcon, LogoutIcon, HomeIcon, DocsIcon, SupportIcon, SettingsIcon } from '@/icons'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { useCurrentUser } from '@/composables/useCurrentUser'
import { serverLogout } from '@/services/auth'

const router = useRouter()
const { t } = useI18n()
const { user, displayName, roleLabel, ensureUser } = useCurrentUser()

const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const supportLinks = computed(() => [
  { label: t('headerUser.mainSite'), url: 'https://tailadmin.com', icon: HomeIcon },
  { label: t('headerUser.docs'), url: 'https://tailadmin.com/docs', icon: DocsIcon },
  { label: t('headerUser.supportCenter'), url: 'https://tailadmin.com/support', icon: SupportIcon },
])

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const signOut = async () => {
  closeDropdown()
  await serverLogout()
  router.push('/login')
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  ensureUser()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
