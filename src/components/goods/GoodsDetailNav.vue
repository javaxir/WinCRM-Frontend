<template>
  <div class="space-y-5">
    <router-link
      :to="backPath"
      class="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
    >
      ← {{ t('goodsDetail.backToList') }}
    </router-link>

    <div v-if="loading" class="py-6 text-center text-sm text-gray-500">{{ t('common.loading') }}</div>

    <template v-else-if="goods">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">{{ goods.name }}</h2>

      <div class="inline-flex w-full flex-wrap gap-1 rounded-2xl border border-gray-200 bg-gray-100 p-1.5 dark:border-gray-800 dark:bg-gray-900">
        <router-link
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          :class="[
            'rounded-xl px-4 py-2.5 text-sm font-medium transition whitespace-nowrap',
            isActive(tab.to)
              ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
              : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white',
          ]"
        >
          {{ tab.label }}
        </router-link>
      </div>
    </template>

    <div v-else-if="errorMessage" class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { fetchGoodsById, type GoodsResponse } from '@/services/goods'

const props = defineProps<{
  goodsId: number
}>()

const { t } = useI18n()
const route = useRoute()

const goods = ref<GoodsResponse | null>(null)
const loading = ref(true)
const errorMessage = ref('')

const backPath = computed(() => (goods.value?.status === 'DISABLED' ? '/goods/inactive' : '/goods'))

const tabs = computed(() => [
  { to: `/goods/${props.goodsId}/stock`, label: t('goodsDetail.tabStock') },
  { to: `/goods/${props.goodsId}/movements`, label: t('goodsDetail.tabMovements') },
  { to: `/goods/${props.goodsId}/info`, label: t('goodsDetail.tabInfo') },
])

const isActive = (path: string) => route.path === path

const loadGoods = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    goods.value = await fetchGoodsById(props.goodsId)
  } catch (e) {
    goods.value = null
    errorMessage.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    loading.value = false
  }
}

onMounted(loadGoods)
watch(() => props.goodsId, loadGoods)

defineExpose({ goods, loading, errorMessage, reload: loadGoods })
</script>
