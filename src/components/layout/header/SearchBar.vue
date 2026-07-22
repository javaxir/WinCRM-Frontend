<template>
  <div ref="rootRef" class="relative hidden lg:block">
    <div class="relative">
      <button type="button" class="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
        <svg class="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
          />
        </svg>
      </button>

      <input
        ref="inputRef"
        v-model="query"
        type="text"
        :placeholder="t('search.placeholder')"
        autocomplete="off"
        class="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-20 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
        @focus="openPalette"
        @input="openPalette"
        @keydown="onInputKeydown"
      />

      <kbd
        class="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 pointer-events-none"
      >
        <span>{{ modKey }}</span>
        <span>K</span>
      </kbd>
    </div>

    <div
      v-if="isOpen && query.trim()"
      class="absolute left-0 z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900 xl:w-[430px]"
    >
      <div v-if="loadingClients" class="px-4 py-6 text-center text-sm text-gray-500">{{ t('search.loading') }}</div>
      <div v-else-if="filteredClients.length === 0" class="px-4 py-6 text-center text-sm text-gray-500">
        {{ t('search.notFound') }}
      </div>
      <ul v-else class="max-h-72 overflow-y-auto py-1">
        <li v-for="(client, index) in filteredClients" :key="client.id">
          <button
            type="button"
            :class="[
              'flex w-full items-start gap-3 px-4 py-2.5 text-left transition',
              index === activeIndex
                ? 'bg-brand-50 dark:bg-brand-500/10'
                : 'hover:bg-gray-50 dark:hover:bg-white/5',
            ]"
            @mouseenter="activeIndex = index"
            @click="selectClient(client)"
          >
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
              {{ clientInitials(client.fullName) }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                {{ client.fullName }}
              </span>
              <span class="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
                {{ client.phone }}<span v-if="client.inn"> · INN: {{ client.inn }}</span>
              </span>
            </span>
          </button>
        </li>
      </ul>
      <div class="border-t border-gray-100 px-4 py-2 text-xs text-gray-400 dark:border-gray-800">
        {{ t('search.hint') }}
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="isOpen && isMobilePalette"
      class="fixed inset-0 z-[99999] flex items-start justify-center bg-gray-900/50 px-4 pt-20 lg:hidden"
      @click.self="closePalette"
    >
      <div class="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900">
        <div class="relative border-b border-gray-100 p-3 dark:border-gray-800">
          <input
            ref="mobileInputRef"
            v-model="query"
            type="text"
            placeholder="Mijoz qidirish..."
            autocomplete="off"
            class="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-4 pr-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            @input="openPalette"
            @keydown="onInputKeydown"
          />
        </div>
        <div v-if="!query.trim()" class="px-4 py-8 text-center text-sm text-gray-500">
          {{ t('search.typeToSearch') }}
        </div>
        <div v-else-if="loadingClients" class="px-4 py-8 text-center text-sm text-gray-500">{{ t('search.loading') }}</div>
        <div v-else-if="filteredClients.length === 0" class="px-4 py-8 text-center text-sm text-gray-500">
          {{ t('search.notFound') }}
        </div>
        <ul v-else class="max-h-80 overflow-y-auto py-1">
          <li v-for="(client, index) in filteredClients" :key="client.id">
            <button
              type="button"
              :class="[
                'flex w-full items-start gap-3 px-4 py-3 text-left',
                index === activeIndex ? 'bg-brand-50 dark:bg-brand-500/10' : '',
              ]"
              @click="selectClient(client)"
            >
              <span class="font-medium text-gray-800 dark:text-white/90">{{ client.fullName }}</span>
              <span class="ml-auto text-xs text-gray-500">{{ client.phone }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { fetchAllClients, type ClientResponse } from '@/services/clients'

const router = useRouter()
const { t } = useI18n()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const mobileInputRef = ref<HTMLInputElement | null>(null)

const query = ref('')
const isOpen = ref(false)
const isMobilePalette = ref(false)
const activeIndex = ref(0)
const clients = ref<ClientResponse[]>([])
const loadingClients = ref(false)
const clientsLoaded = ref(false)

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const modKey = isMac ? '⌘' : 'Ctrl'

const filteredClients = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return clients.value
    .filter((c) => c.status === 'ACTIVE')
    .filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.inn || '').toLowerCase().includes(q),
    )
    .slice(0, 10)
})

const clientInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const ensureClientsLoaded = async () => {
  if (clientsLoaded.value || loadingClients.value) return
  loadingClients.value = true
  try {
    clients.value = await fetchAllClients()
    clientsLoaded.value = true
  } catch {
    clients.value = []
  } finally {
    loadingClients.value = false
  }
}

const openPalette = async () => {
  isOpen.value = true
  activeIndex.value = 0
  await ensureClientsLoaded()
}

const closePalette = () => {
  isOpen.value = false
  isMobilePalette.value = false
  query.value = ''
  activeIndex.value = 0
}

const selectClient = (client: ClientResponse) => {
  closePalette()
  router.push(`/clients/${client.id}`)
}

const focusSearch = async () => {
  const isDesktop = window.innerWidth >= 1024
  isMobilePalette.value = !isDesktop
  isOpen.value = true
  activeIndex.value = 0
  await ensureClientsLoaded()
  await nextTick()
  if (isDesktop) {
    inputRef.value?.focus()
  } else {
    mobileInputRef.value?.focus()
  }
}

const onInputKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value || !query.value.trim()) {
    if (e.key === 'Escape') closePalette()
    return
  }

  const count = filteredClients.value.length
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = count ? (activeIndex.value + 1) % count : 0
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = count ? (activeIndex.value - 1 + count) % count : 0
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const client = filteredClients.value[activeIndex.value]
    if (client) selectClient(client)
  } else if (e.key === 'Escape') {
    e.preventDefault()
    closePalette()
    inputRef.value?.blur()
  }
}

const onGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    focusSearch()
  }
}

const onDocumentClick = (e: MouseEvent) => {
  if (!isOpen.value || isMobilePalette.value) return
  const target = e.target as Node
  if (rootRef.value && !rootRef.value.contains(target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
  document.addEventListener('mousedown', onDocumentClick)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  document.removeEventListener('mousedown', onDocumentClick)
})
</script>
