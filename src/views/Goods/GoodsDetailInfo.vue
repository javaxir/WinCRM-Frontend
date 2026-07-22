<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="pageTitle" />

    <div class="space-y-5 sm:space-y-6">
      <GoodsDetailNav ref="navRef" :goods-id="goodsId" />

      <div v-if="goods" class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('goodsDetail.tabInfo') }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('goodsDetail.infoHint') }}</p>
          </div>
          <ActionIconButton action="edit" :title="t('goodsDetail.editTitle')" @click="openEdit" />
        </div>

        <div class="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[240px_1fr]">
          <div class="flex justify-center lg:justify-start">
            <GoodsPhoto :photo="goods.photo" :alt="goods.name" size="xl" />
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div v-for="field in fields" :key="field.label" :class="field.class">
              <label class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{{ field.label }}</label>
              <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-white/5 dark:text-white/90">
                {{ field.value }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <GoodsFormModal
      :show="showEditModal"
      :goods="goods"
      @close="showEditModal = false"
      @saved="onSaved"
    />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import GoodsPhoto from '@/components/common/GoodsPhoto.vue'
import GoodsDetailNav from '@/components/goods/GoodsDetailNav.vue'
import GoodsFormModal from '@/components/goods/GoodsFormModal.vue'
import { formatMarkupPercent } from '@/utils/markupPercent'
import type { GoodsResponse } from '@/services/goods'

const { t } = useI18n()
const route = useRoute()
const goodsId = Number(route.params.id)
const navRef = ref<InstanceType<typeof GoodsDetailNav> | null>(null)
const showEditModal = ref(false)

const goods = computed(() => navRef.value?.goods ?? null)
const pageTitle = computed(() => goods.value?.name ?? t('routes.goodsDetail'))

const display = (v?: string | null) => v || '—'
const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'
const formatDateTime = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString()
}

const statusLabel = (status?: string) => {
  if (!status) return '—'
  const key = `common.statusValues.${status}`
  const translated = t(key)
  return translated !== key ? translated : status
}

const fields = computed(() => {
  const item = goods.value as GoodsResponse | null
  if (!item) return []
  return [
    { label: t('goodsDetail.name'), value: display(item.name) },
    { label: t('goodsDetail.group'), value: display(item.goodsGroupName) },
    { label: t('goodsDetail.unit'), value: display(item.unitTypeName) },
    { label: t('goodsDetail.type'), value: display(item.typeLabel || item.type) },
    { label: t('goodsDetail.priceCost'), value: formatMoney(item.priceCost) },
    { label: t('goodsDetail.priceSelling'), value: formatMoney(item.priceSelling) },
    { label: t('goodsDetail.markupPercent'), value: formatMarkupPercent(item.priceCost, item.priceSelling) },
    { label: t('goodsDetail.barcode'), value: display(item.barcode) },
    { label: t('common.status'), value: statusLabel(item.status) },
    { label: t('goodsDetail.createdAt'), value: formatDateTime(item.createdAt) },
    { label: t('goodsDetail.updatedAt'), value: formatDateTime(item.updatedAt) },
    { label: t('goodsDetail.createdBy'), value: display(item.createdUsername), class: 'sm:col-span-2' },
  ]
})

const openEdit = () => {
  showEditModal.value = true
}

const onSaved = async () => {
  await navRef.value?.reload()
}
</script>
