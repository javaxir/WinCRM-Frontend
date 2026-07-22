import { ref, watch } from 'vue'

const STORAGE_KEY = 'showPageHeader'

const showPageHeader = ref(true)

function loadShowPageHeader() {
  if (typeof window === 'undefined') return
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved !== null) {
    showPageHeader.value = saved === 'true'
  }
}

loadShowPageHeader()

watch(showPageHeader, (value) => {
  localStorage.setItem(STORAGE_KEY, String(value))
})

export function usePageHeader() {
  return {
    showPageHeader,
    setShowPageHeader: (value: boolean) => {
      showPageHeader.value = value
    },
  }
}
