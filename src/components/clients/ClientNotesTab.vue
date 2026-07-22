<template>
  <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
      <h3 class="text-base font-medium text-gray-800 dark:text-white/90">{{ t('clientDetail.tabNotes') }}</h3>
      <p class="mt-1 text-sm text-gray-500">{{ t('clientDetail.notesHint') }}</p>
    </div>

    <form class="space-y-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800" @submit.prevent="submitNote">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label class="mb-1 block text-xs text-gray-500">{{ t('clientDetail.noteType') }}</label>
          <select v-model="form.type" required :class="inputClass">
            <option value="CALL">{{ t('clientDetail.noteTypes.CALL') }}</option>
            <option value="MEETING">{{ t('clientDetail.noteTypes.MEETING') }}</option>
            <option value="SMS">{{ t('clientDetail.noteTypes.SMS') }}</option>
            <option value="PAYMENT_PROMISE">{{ t('clientDetail.noteTypes.PAYMENT_PROMISE') }}</option>
            <option value="OTHER">{{ t('clientDetail.noteTypes.OTHER') }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs text-gray-500">{{ t('clientDetail.noteDueDate') }}</label>
          <input v-model="form.reminderDate" type="date" :class="inputClass" />
        </div>
      </div>
      <div v-if="form.type === 'PAYMENT_PROMISE'">
        <label class="mb-1 block text-xs text-gray-500">{{ t('clientDetail.promisedAmount') }}</label>
        <input v-model.number="form.promisedAmount" type="number" min="0" step="1" :class="inputClass" />
      </div>
      <textarea v-model="form.content" rows="3" required :placeholder="t('clientDetail.notePlaceholder')" :class="inputClass" />
      <div class="flex justify-end">
        <button type="submit" :disabled="saving" :class="btnPrimary">
          {{ saving ? t('common.saving') : t('clientDetail.addNote') }}
        </button>
      </div>
    </form>

    <ul v-if="notes.length === 0" class="px-6 py-12 text-center text-sm text-gray-500">{{ t('common.notFound') }}</ul>
    <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <li v-for="note in notes" :key="note.id" class="flex items-start justify-between gap-3 px-6 py-4">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
              {{ t(`clientDetail.noteTypes.${note.type}`) }}
            </span>
            <span
              v-if="note.reminderStatus && note.reminderStatus !== 'NONE'"
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="reminderClass(note.reminderStatus)"
            >
              {{ note.reminderStatus }}
            </span>
          </div>
          <p class="mt-2 text-sm text-gray-800 dark:text-white/90">{{ note.content }}</p>
          <p class="mt-1 text-xs text-gray-500">
            {{ formatDateTime(note.interactionDate || note.createdAt) }}
            <span v-if="note.reminderDate"> · {{ t('clientDetail.noteDueDate') }}: {{ note.reminderDate }}</span>
            <span v-if="note.promisedAmount"> · {{ formatMoney(note.promisedAmount) }}</span>
            <span v-if="note.createdUsername"> · {{ note.createdUsername }}</span>
          </p>
          <div v-if="note.reminderStatus === 'PENDING'" class="mt-2 flex flex-wrap gap-2">
            <button type="button" class="text-xs text-success-600 hover:underline" @click="$emit('reminder', note.id, 'DONE')">
              {{ t('clientDetail.reminderDone') }}
            </button>
            <button type="button" class="text-xs text-error-600 hover:underline" @click="$emit('reminder', note.id, 'BROKEN')">
              {{ t('clientDetail.reminderBroken') }}
            </button>
          </div>
        </div>
        <button type="button" class="text-xs text-error-600 hover:underline" @click="$emit('delete', note.id)">
          {{ t('common.delete') }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ClientNoteResponse, ClientNoteType, ClientNoteReminderStatus } from '@/services/clientNotes'

defineProps<{ notes: ClientNoteResponse[] }>()
const emit = defineEmits<{
  add: [payload: {
    type: ClientNoteType
    content: string
    reminderDate?: string | null
    promisedAmount?: number | null
  }]
  delete: [id: number]
  reminder: [id: number, status: ClientNoteReminderStatus]
}>()

const { t } = useI18n()
const saving = ref(false)

const form = reactive({
  type: 'CALL' as ClientNoteType,
  content: '',
  reminderDate: '',
  promisedAmount: 0,
})

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnPrimary =
  'inline-flex rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70'

const formatDateTime = (v: string) => new Date(v).toLocaleString('uz-UZ')
const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'

const reminderClass = (status: ClientNoteReminderStatus) => {
  if (status === 'PENDING') return 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400'
  if (status === 'DONE') return 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
  if (status === 'BROKEN') return 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500'
  return 'bg-gray-100 text-gray-600'
}

const submitNote = () => {
  if (!form.content.trim()) return
  saving.value = true
  emit('add', {
    type: form.type,
    content: form.content.trim(),
    reminderDate: form.reminderDate || null,
    promisedAmount: form.type === 'PAYMENT_PROMISE' ? form.promisedAmount || null : null,
  })
  form.content = ''
  form.reminderDate = ''
  form.promisedAmount = 0
  form.type = 'CALL'
  saving.value = false
}
</script>
