<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { ref, provide, onMounted, watch, computed } from 'vue'
import type { Theme } from '@/composables/useTheme'

const theme = ref<Theme>('light')
const isInitialized = ref(false)

const isDarkMode = computed(() => theme.value === 'dark')

const applyTheme = (value: Theme) => {
  theme.value = value
}

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

const setTheme = (value: Theme) => {
  theme.value = value
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') as Theme | null
  theme.value = savedTheme || 'light'
  isInitialized.value = true
})

watch([theme, isInitialized], ([newTheme, newIsInitialized]) => {
  if (newIsInitialized) {
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
})

provide('theme', {
  theme,
  isDarkMode,
  toggleTheme,
  setTheme,
})
</script>
