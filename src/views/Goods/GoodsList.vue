<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ pageHeading }}</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ pageSubtitle }}</p>
          </div>
          <div class="flex items-center gap-3">
            <TableColumnToggle :columns="TABLE_COLUMNS" :visible="visible" @toggle="toggleColumn" />
            <router-link v-if="isInactivePage" to="/goods" :class="navBtnClass">
              Aktiv mahsulotlar
            </router-link>
            <router-link v-else to="/goods/inactive" :class="navBtnClass">
              Nofaol mahsulotlar
            </router-link>
            <ActionIconButton action="refresh" @click="loadAll" />
            <ActionIconButton v-if="!isInactivePage" action="create" :title="t('actions.newGoods')" @click="openCreate" />
          </div>
        </div>
        <div v-if="errorMessage" class="px-6 pb-4">
          <div class="p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">{{ errorMessage }}</div>
        </div>
        <div class="px-6 pb-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <input v-model="search" type="text" placeholder="Nom, shtrix-kod, guruh bo‘yicha qidirish..." :class="inputClass + ' max-w-md'" />
        </div>
        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <SortableTh v-if="isVisible('id')" label="ID" sortable :active="sortKey === 'id'" :direction="sortKey === 'id' ? sortDir : null" @sort="toggleSort('id')" />
                  <th v-if="isVisible('photo')" class="px-5 py-3 text-left sm:px-6"><span class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Rasm</span></th>
                  <SortableTh v-if="isVisible('name')" label="Nomi" sortable :active="sortKey === 'name'" :direction="sortKey === 'name' ? sortDir : null" @sort="toggleSort('name')" />
                  <SortableTh v-if="isVisible('goodsGroupName')" label="Guruh" sortable :active="sortKey === 'goodsGroupName'" :direction="sortKey === 'goodsGroupName' ? sortDir : null" @sort="toggleSort('goodsGroupName')" />
                  <SortableTh v-if="isVisible('unitTypeName')" label="Birlik" sortable :active="sortKey === 'unitTypeName'" :direction="sortKey === 'unitTypeName' ? sortDir : null" @sort="toggleSort('unitTypeName')" />
                  <SortableTh v-if="isVisible('typeLabel')" label="Turi" sortable :active="sortKey === 'typeLabel'" :direction="sortKey === 'typeLabel' ? sortDir : null" @sort="toggleSort('typeLabel')" />
                  <SortableTh v-if="isVisible('priceCost')" label="Tannarx" sortable :active="sortKey === 'priceCost'" :direction="sortKey === 'priceCost' ? sortDir : null" @sort="toggleSort('priceCost')" />
                  <SortableTh v-if="isVisible('priceSelling')" label="Sotuv narxi" sortable :active="sortKey === 'priceSelling'" :direction="sortKey === 'priceSelling' ? sortDir : null" @sort="toggleSort('priceSelling')" />
                  <SortableTh v-if="isVisible('markupPercent')" :label="t('goods.markupPercent')" sortable :active="sortKey === 'markupPercent'" :direction="sortKey === 'markupPercent' ? sortDir : null" @sort="toggleSort('markupPercent')" />
                  <SortableTh v-if="isVisible('barcode')" label="Shtrix-kod" sortable :active="sortKey === 'barcode'" :direction="sortKey === 'barcode' ? sortDir : null" @sort="toggleSort('barcode')" />
                  <SortableTh :label="t('common.actions')" align="right" />
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="loading"><td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">Yuklanmoqda...</td></tr>
                <tr v-else-if="displayGoods.length === 0"><td :colspan="colCount + 1" class="px-5 py-8 text-center text-gray-500">{{ emptyText }}</td></tr>
                <tr v-for="item in displayGoods" :key="item.id" class="border-t border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]" @click="openGoodsDetail(item)">
                  <td v-if="isVisible('id')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.id }}</span></td>
                  <td v-if="isVisible('photo')" class="px-5 py-4 sm:px-6"><GoodsPhoto :photo="item.photo" :alt="item.name" size="md" /></td>
                  <td v-if="isVisible('name')" class="px-5 py-4 sm:px-6">
                    <router-link :to="`/goods/${item.id}/stock`" class="font-medium text-brand-600 text-theme-sm hover:underline dark:text-brand-400" @click.stop>
                      {{ item.name }}
                    </router-link>
                  </td>
                  <td v-if="isVisible('goodsGroupName')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.goodsGroupName }}</span></td>
                  <td v-if="isVisible('unitTypeName')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.unitTypeName }}</span></td>
                  <td v-if="isVisible('typeLabel')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.typeLabel || goodsTypeLabel(item.type) }}</span></td>
                  <td v-if="isVisible('priceCost')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatMoney(item.priceCost) }}</span></td>
                  <td v-if="isVisible('priceSelling')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ formatMoney(item.priceSelling) }}</span></td>
                  <td v-if="isVisible('markupPercent')" class="px-5 py-4 sm:px-6"><span class="text-gray-800 text-theme-sm font-medium dark:text-white/90">{{ formatMarkupPercent(item.priceCost, item.priceSelling) }}</span></td>
                  <td v-if="isVisible('barcode')" class="px-5 py-4 sm:px-6"><span class="text-gray-500 text-theme-sm">{{ item.barcode || '—' }}</span></td>
                  <td class="px-5 py-4 sm:px-6" @click.stop>
                    <div class="flex items-center justify-end gap-2">
                      <ActionIconButton action="edit" size="sm" @click="openEdit(item)" />
                      <ActionIconButton action="delete" size="sm" @click="confirmDelete(item)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <Modal v-if="showFormModal" @close="closeForm">
      <template #body>
        <div class="relative w-full max-w-2xl p-6 bg-white rounded-3xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ editing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot' }}</h4>
          <div v-if="formError" class="mb-4 p-3 text-sm text-red-700 border border-red-200 rounded-lg bg-red-50 dark:text-red-400">{{ formError }}</div>
          <form @submit.prevent="submitForm" class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="h-20 w-20 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <img v-if="photoPreview" :src="photoPreview" alt="Preview" class="object-cover w-full h-full" />
                <GoodsPhoto v-else :photo="editing?.photo" :alt="form.name" size="lg" />
              </div>
              <div>
                <input ref="photoInputRef" type="file" accept="image/*" class="hidden" @change="onPhotoChange" />
                <button type="button" @click="photoInputRef?.click()" :class="btnOutline">Rasm tanlash</button>
                <button v-if="photoPreview || selectedPhoto" type="button" @click="clearPhoto" class="ml-2 text-sm text-gray-500 hover:text-gray-700">Tozalash</button>
                <p v-if="!editing" class="mt-1 text-xs text-gray-400">Yaratishda rasm majburiy</p>
              </div>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Nomi<span class="text-error-500">*</span></label>
                <input v-model="form.name" type="text" required :class="inputClass" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Guruh<span class="text-error-500">*</span></label>
                <select v-model.number="form.goodsGroupId" required :class="inputClass">
                  <option :value="0" disabled>Guruhni tanlang</option>
                  <option v-for="g in goodsGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">O‘lchov birligi<span class="text-error-500">*</span></label>
                <select v-model.number="form.unitTypeId" required :class="inputClass">
                  <option :value="0" disabled>Birlikni tanlang</option>
                  <option v-for="u in unitTypes" :key="u.id" :value="u.id">{{ u.name }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Turi<span class="text-error-500">*</span></label>
                <select v-model="form.type" required :class="inputClass">
                  <option v-for="opt in GOODS_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Tannarx<span class="text-error-500">*</span></label>
                <input v-model.number="form.priceCost" type="number" min="0" step="1" required :class="inputClass" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Sotuv narxi<span class="text-error-500">*</span></label>
                <input v-model.number="form.priceSelling" type="number" min="0" step="1" required :class="inputClass" />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Shtrix-kod</label>
                <input v-model="form.barcode" type="text" :class="inputClass" />
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" @click="closeForm" :class="btnOutline">Bekor qilish</button>
              <button type="submit" :disabled="saving" :class="btnPrimary">{{ saving ? 'Saqlanmoqda...' : 'Saqlash' }}</button>
            </div>
          </form>
        </div>
      </template>
    </Modal>

    <Modal v-if="showDeleteModal" @close="showDeleteModal = false">
      <template #body>
        <div class="relative w-full max-w-md p-6 bg-white rounded-3xl dark:bg-gray-900">
          <h4 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Mahsulotni o‘chirish</h4>
          <p class="mb-6 text-sm text-gray-500"><span class="font-medium text-gray-700 dark:text-gray-300">{{ itemToDelete?.name }}</span> ni o‘chirmoqchimisiz?</p>
          <div class="flex justify-end gap-3">
            <button @click="showDeleteModal = false" :class="btnOutline">Bekor qilish</button>
            <button @click="doDelete" :disabled="deleting" class="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70">{{ deleting ? 'O‘chirilmoqda...' : 'O‘chirish' }}</button>
          </div>
        </div>
      </template>
    </Modal>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import Modal from '@/components/ui/Modal.vue'
import SortableTh from '@/components/common/SortableTh.vue'
import TableColumnToggle from '@/components/common/TableColumnToggle.vue'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import GoodsPhoto from '@/components/common/GoodsPhoto.vue'
import { useTableSort, useColumnVisibility, type TableColumnDef } from '@/composables/useTableControls'
import { fetchAllGoods, createGoods, updateGoods, deleteGoods, type GoodsResponse, type GoodsType } from '@/services/goods'
import { fetchAllGoodsGroups, type GoodsGroupResponse } from '@/services/goodsGroups'
import { fetchAllUnitTypes, type UnitTypeResponse } from '@/services/unitTypes'
import { formatMarkupPercent, calcMarkupPercent } from '@/utils/markupPercent'
import type { Status } from '@/services/roles'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const listStatus = computed(() => (route.meta.goodsStatus as Status) || 'ACTIVE')
const isInactivePage = computed(() => listStatus.value === 'DISABLED')

const GOODS_TYPE_OPTIONS: { value: GoodsType; label: string }[] = [
  { value: 'PRODUCT', label: 'Mahsulot' },
  { value: 'SERVICE', label: 'Xizmat' },
  { value: 'WINDOW', label: 'Oyna' },
]

const TABLE_COLUMNS: TableColumnDef[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'photo', label: 'Rasm', sortable: false },
  { key: 'name', label: 'Nomi', sortable: true },
  { key: 'goodsGroupName', label: 'Guruh', sortable: true },
  { key: 'unitTypeName', label: 'Birlik', sortable: true },
  { key: 'typeLabel', label: 'Turi', sortable: true },
  { key: 'priceCost', label: 'Tannarx', sortable: true },
  { key: 'priceSelling', label: 'Sotuv narxi', sortable: true },
  { key: 'markupPercent', label: 'Ustama foiz', sortable: true },
  { key: 'barcode', label: 'Shtrix-kod', sortable: true },
]

const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'
const navBtnClass = btnOutline + ' h-11 whitespace-nowrap'

const currentPageTitle = computed(() => (isInactivePage.value ? t('routes.inactiveGoods') : t('routes.goods')))
const pageHeading = computed(() => (isInactivePage.value ? 'Nofaol mahsulotlar' : 'Mahsulotlar'))
const pageSubtitle = computed(() =>
  isInactivePage.value
    ? 'Holati nofaol bo‘lgan mahsulotlar ro‘yxati'
    : 'Mahsulotlar katalogi — yaratish, tahrirlash, rasm bilan',
)
const emptyText = computed(() =>
  isInactivePage.value ? 'Nofaol mahsulotlar topilmadi' : 'Mahsulotlar topilmadi',
)

const activeColumns = useColumnVisibility(TABLE_COLUMNS, 'goods-table-cols')
const inactiveColumns = useColumnVisibility(TABLE_COLUMNS, 'goods-inactive-table-cols')
const columnControls = computed(() => (isInactivePage.value ? inactiveColumns : activeColumns))
const visible = computed(() => columnControls.value.visible.value)
const toggleColumn = (key: string) => columnControls.value.toggleColumn(key)
const isVisible = (key: string) => columnControls.value.isVisible(key)
const goods = ref<GoodsResponse[]>([])
const goodsGroups = ref<GoodsGroupResponse[]>([])
const unitTypes = ref<UnitTypeResponse[]>([])
const loading = ref(false)
const errorMessage = ref('')
const search = ref('')

const { sortKey, sortDir, toggleSort, applySort } = useTableSort<GoodsResponse>((row, key) => {
  if (key === 'markupPercent') return calcMarkupPercent(row.priceCost, row.priceSelling)
  return row[key as keyof GoodsResponse]
})
const colCount = computed(() => TABLE_COLUMNS.filter((c) => isVisible(c.key)).length)

const filteredGoods = computed(() => {
  const q = search.value.trim().toLowerCase()
  let result = goods.value.filter((item) => item.status === listStatus.value)
  if (!q) return result
  return result.filter(
    (g) =>
      g.name.toLowerCase().includes(q) ||
      (g.barcode || '').toLowerCase().includes(q) ||
      g.goodsGroupName.toLowerCase().includes(q),
  )
})

const displayGoods = computed(() => applySort(filteredGoods.value))

const showFormModal = ref(false)
const editing = ref<GoodsResponse | null>(null)
const form = ref({ name: '', goodsGroupId: 0, unitTypeId: 0, type: 'PRODUCT' as GoodsType, priceCost: 0, priceSelling: 0, barcode: '' })
const formError = ref('')
const saving = ref(false)
const photoInputRef = ref<HTMLInputElement | null>(null)
const selectedPhoto = ref<File | null>(null)
const photoPreview = ref<string | null>(null)

const showDeleteModal = ref(false)
const itemToDelete = ref<GoodsResponse | null>(null)
const deleting = ref(false)

const goodsTypeLabel = (type?: GoodsType) => GOODS_TYPE_OPTIONS.find((o) => o.value === type)?.label || type || '—'
const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'

const openGoodsDetail = (item: GoodsResponse) => {
  router.push(`/goods/${item.id}/stock`)
}

const loadRefs = async () => {
  const [groups, units] = await Promise.all([fetchAllGoodsGroups(), fetchAllUnitTypes()])
  goodsGroups.value = groups.filter((g) => g.status === 'ACTIVE')
  unitTypes.value = units.filter((u) => u.status === 'ACTIVE')
}

const loadAll = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    await loadRefs()
    goods.value = await fetchAllGoods()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'Yuklashda xatolik'
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = { name: '', goodsGroupId: 0, unitTypeId: 0, type: 'PRODUCT', priceCost: 0, priceSelling: 0, barcode: '' }
  clearPhoto()
}

const openCreate = async () => {
  editing.value = null
  resetForm()
  formError.value = ''
  if (goodsGroups.value.length === 0 || unitTypes.value.length === 0) await loadRefs()
  showFormModal.value = true
}

const openEdit = async (item: GoodsResponse) => {
  editing.value = item
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
  if (goodsGroups.value.length === 0 || unitTypes.value.length === 0) await loadRefs()
  showFormModal.value = true
}

const closeForm = () => { showFormModal.value = false }

const onPhotoChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  selectedPhoto.value = file
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoPreview.value = URL.createObjectURL(file)
}

const clearPhoto = () => {
  selectedPhoto.value = null
  if (photoPreview.value) { URL.revokeObjectURL(photoPreview.value); photoPreview.value = null }
  if (photoInputRef.value) photoInputRef.value.value = ''
}

const submitForm = async () => {
  formError.value = ''
  if (!form.value.goodsGroupId || !form.value.unitTypeId) {
    formError.value = 'Guruh va o‘lchov birligini tanlang'
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
    if (editing.value) await updateGoods(editing.value.id, payload)
    else await createGoods(payload)
    showFormModal.value = false
    await loadAll()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : 'Saqlashda xatolik'
  } finally {
    saving.value = false
  }
}

const confirmDelete = (item: GoodsResponse) => { itemToDelete.value = item; showDeleteModal.value = true }
const doDelete = async () => {
  if (!itemToDelete.value) return
  deleting.value = true
  try {
    await deleteGoods(itemToDelete.value.id)
    showDeleteModal.value = false
    await loadAll()
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : 'O‘chirishda xatolik'
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

onMounted(loadAll)
watch(() => route.path, () => {
  search.value = ''
})
</script>
