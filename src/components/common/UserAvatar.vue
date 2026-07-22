<template>
  <div
    :class="[
      'overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center',
      sizeClass,
    ]"
  >
    <img
      v-if="blobUrl"
      :src="blobUrl"
      :alt="alt"
      class="object-cover w-full h-full"
    />
    <span v-else class="font-medium text-gray-400" :class="textClass">
      {{ fallbackLetter }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { getAccessToken } from '@/services/auth'
import { getUserPhotoUrl } from '@/services/users'

const props = withDefaults(
  defineProps<{
    photoLink?: string | null
    alt?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { alt: '', size: 'md' },
)

const blobUrl = ref<string | null>(null)

const sizeClass = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
}[props.size]

const textClass = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-xl',
}[props.size]

const fallbackLetter = props.alt?.charAt(0)?.toUpperCase() || '?'

const loadImage = async () => {
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value)
    blobUrl.value = null
  }

  const url = getUserPhotoUrl(props.photoLink)
  if (!url) return

  const token = getAccessToken()
  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) return
    const blob = await response.blob()
    blobUrl.value = URL.createObjectURL(blob)
  } catch {
    // fallback letter ko'rsatiladi
  }
}

watch(() => props.photoLink, loadImage, { immediate: true })

onUnmounted(() => {
  if (blobUrl.value) URL.revokeObjectURL(blobUrl.value)
})
</script>
