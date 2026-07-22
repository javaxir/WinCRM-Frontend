<template>
  <Modal v-if="show" @close="emit('close')">
    <template #body>
      <div class="relative w-full max-w-2xl p-6 bg-white rounded-3xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
        <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {{ isEdit ? t('goodsDetail.editTitle') : t('goods.createTitle') }}
        </h4>
        <div
          v-if="formError"
          class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400"
        >
          {{ formError }}
        </div>
        <form @submit.prevent="submitForm" class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="h-20 w-20 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <img v-if="photoPreview" :src="photoPreview" alt="Preview" class="object-cover w-full h-full" />
              <GoodsPhoto v-else :photo="goods?.photo" :alt="form.name" size="lg" />
            </div>
            <div>
              <input ref="photoInputRef" type="file" accept="image/*" class="hidden" @change="onPhotoChange" />
              <button type="button" @click="photoInputRef?.click()" :class="btnOutline">
                {{ t('goods.selectPhoto') }}
              </button>
              <button
                v-if="photoPreview || selectedPhoto"
                type="button"
                @click="clearPhoto"
                class="ml-2 text-sm text-gray-500 hover:text-gray-700"
              >
                {{ t('common.reset') }}
              </button>
              <p v-if="!isEdit" class="mt-1 text-xs text-gray-400">{{ t('goods.photoRequiredOnCreate') }}</p>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('goodsDetail.name') }}<span class="text-error-500">*</span>
              </label>
              <input v-model="form.name" type="text" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('goodsDetail.group') }}<span class="text-error-500">*</span>
              </label>
              <select v-model.number="form.goodsGroupId" required :class="inputClass">
                <option :value="0" disabled>{{ t('goods.selectGroup') }}</option>
                <option v-for="g in goodsGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('goodsDetail.unit') }}<span class="text-error-500">*</span>
              </label>
              <select v-model.number="form.unitTypeId" required :class="inputClass">
                <option :value="0" disabled>{{ t('goods.selectUnit') }}</option>
                <option v-for="u in unitTypes" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('goodsDetail.type') }}<span class="text-error-500">*</span>
              </label>
              <select v-model="form.type" required :class="inputClass">
                <option v-for="opt in GOODS_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('goodsDetail.priceCost') }}<span class="text-error-500">*</span>
              </label>
              <input v-model.number="form.priceCost" type="number" min="0" step="1" required :class="inputClass" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('goodsDetail.priceSelling') }}<span class="text-error-500">*</span>
              </label>
              <input v-model.number="form.priceSelling" type="number" min="0" step="1" required :class="inputClass" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('goodsDetail.barcode') }}
              </label>
              <input v-model="form.barcode" type="text" :class="inputClass" />
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="emit('close')" :class="btnOutline">{{ t('common.cancel') }}</button>
            <button type="submit" :disabled="saving" :class="btnPrimary">
              {{ saving ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/ui/Modal.vue'
import GoodsPhoto from '@/components/common/GoodsPhoto.vue'
import {
  createGoods,
  updateGoods,
  type GoodsResponse,
  type GoodsType,
} from '@/services/goods'
import { fetchAllGoodsGroups, type GoodsGroupResponse } from '@/services/goodsGroups'
import { fetchAllUnitTypes, type UnitTypeResponse } from '@/services/unitTypes'

const GOODS_TYPE_OPTIONS: { value: GoodsType; label: string }[] = [
  { value: 'PRODUCT', label: 'Mahsulot' },
  { value: 'SERVICE', label: 'Xizmat' },
  { value: 'WINDOW', label: 'Oyna' },
]

const props = defineProps<{
  show: boolean
  goods?: GoodsResponse | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { t } = useI18n()

const inputClass =
  'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnOutline =
  'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'

const isEdit = computed(() => !!props.goods)
const goodsGroups = ref<GoodsGroupResponse[]>([])
const unitTypes = ref<UnitTypeResponse[]>([])
const form = ref({
  name: '',
  goodsGroupId: 0,
  unitTypeId: 0,
  type: 'PRODUCT' as GoodsType,
  priceCost: 0,
  priceSelling: 0,
  barcode: '',
})
const formError = ref('')
const saving = ref(false)
const photoInputRef = ref<HTMLInputElement | null>(null)
const selectedPhoto = ref<File | null>(null)
const photoPreview = ref<string | null>(null)

const clearPhoto = () => {
  selectedPhoto.value = null
  if (photoPreview.value) {
    URL.revokeObjectURL(photoPreview.value)
    photoPreview.value = null
  }
  if (photoInputRef.value) photoInputRef.value.value = ''
}

const resetForm = () => {
  form.value = {
    name: '',
    goodsGroupId: 0,
    unitTypeId: 0,
    type: 'PRODUCT',
    priceCost: 0,
    priceSelling: 0,
    barcode: '',
  }
  clearPhoto()
  formError.value = ''
}

const fillForm = (item: GoodsResponse) => {
  form.value = {
    name: item.name,
    goodsGroupId: item.goodsGroupId,
    unitTypeId: item.unitTypeId,
    type: item.type || 'PRODUCT',
    priceCost: item.priceCost,
    priceSelling: item.priceSelling,
    barcode: item.barcode || '',
  }
  clearPhoto()
  formError.value = ''
}

const loadRefs = async () => {
  const [groups, units] = await Promise.all([fetchAllGoodsGroups(), fetchAllUnitTypes()])
  goodsGroups.value = groups.filter((g) => g.status === 'ACTIVE')
  unitTypes.value = units.filter((u) => u.status === 'ACTIVE')
}

const onPhotoChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  selectedPhoto.value = file
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = URL.createObjectURL(file)
}

const submitForm = async () => {
  formError.value = ''
  if (!form.value.goodsGroupId || !form.value.unitTypeId) {
    formError.value = t('goods.groupUnitRequired')
    return
  }
  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      goodsGroupId: form.value.goodsGroupId,
      unitTypeId: form.value.unitTypeId,
      type: form.value.type,
      priceCost: form.value.priceCost,
      priceSelling: form.value.priceSelling,
      barcode: form.value.barcode.trim() || undefined,
      photo: selectedPhoto.value,
    }
    if (isEdit.value && props.goods) {
      await updateGoods(props.goods.id, payload)
    } else {
      await createGoods(payload)
    }
    emit('saved')
    emit('close')
  } catch (e) {
    formError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    saving.value = false
  }
}

watch(
  () => [props.show, props.goods] as const,
  async ([show, goods]) => {
    if (!show) return
    if (goodsGroups.value.length === 0 || unitTypes.value.length === 0) {
      try {
        await loadRefs()
      } catch (e) {
        formError.value = e instanceof Error ? e.message : t('common.error')
      }
    }
    if (goods) fillForm(goods)
    else resetForm()
  },
)
</script>
