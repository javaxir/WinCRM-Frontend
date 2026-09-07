<template>
  <div>
    <!-- Payments -->
    <div v-if="panel === 'payments'">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{{ t('saleOrderItems.paymentsHint') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="order.clientId"
            type="button"
            :class="btnSuccess"
            @click="emit('add-payment')"
          >
            <CreditCard class="h-4 w-4" />
            {{ t('actions.newPayment') }}
          </button>
          <ActionIconButton action="refresh" @click="loadPayments" />
        </div>
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
          <p class="text-xs font-medium text-gray-500">{{ t('clientDetail.paymentsTotal') }}</p>
          <p class="mt-1 text-lg font-semibold text-brand-600">{{ formatMoney(paymentsTotal) }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
          <p class="text-xs font-medium text-gray-500">{{ t('saleOrderItems.tabPayments') }}</p>
          <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{{ orderPayments.length }} ta</p>
        </div>
      </div>
      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">ID</th>
              <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('clientDetail.paymentDate') }}</th>
              <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('clientDetail.paymentType') }}</th>
              <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('clientDetail.paymentAmount') }}</th>
              <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('saleOrderItems.comment') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="paymentsLoading"><td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.loading') }}</td></tr>
            <tr v-else-if="orderPayments.length === 0"><td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td></tr>
            <tr v-for="payment in orderPayments" :key="payment.id">
              <td class="px-5 py-4 text-sm text-gray-500">#{{ payment.id }}</td>
              <td class="px-5 py-4 text-sm text-gray-500">{{ formatDateTime(payment.paymentDate) }}</td>
              <td class="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{{ payment.paymentTypeName }}</td>
              <td class="px-5 py-4 text-right text-sm font-medium text-success-600">{{ formatMoney(payment.paymentAmount) }}</td>
              <td class="px-5 py-4 text-sm text-gray-500">{{ payment.comment || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Timeline -->
    <div v-else-if="panel === 'timeline'">
      <div v-if="timelineEntries.length === 0" class="py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</div>
      <ol v-else class="space-y-4">
        <li
          v-for="entry in timelineEntries"
          :key="entry.id"
          class="relative flex gap-3 border-l-2 border-brand-200 pl-4 dark:border-brand-500/30"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm text-gray-800 dark:text-white/90">{{ entry.message }}</p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ formatDateTime(entry.at) }}
              <span v-if="entry.by"> · {{ entry.by }}</span>
            </p>
          </div>
        </li>
      </ol>
    </div>

    <!-- Images (sale-order-image-controller) -->
    <div v-else-if="panel === 'files'">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('saleOrderItems.filesHint') }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <div class="min-w-[160px]">
              <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('saleOrderItems.imageType') }}</label>
              <select v-model="uploadImageType" :class="inputClass">
                <option value="OBJECT">{{ t('saleOrderItems.imageTypes.OBJECT') }}</option>
                <option value="PROJECT">{{ t('saleOrderItems.imageTypes.PROJECT') }}</option>
                <option value="OTHER">{{ t('saleOrderItems.imageTypes.OTHER') }}</option>
              </select>
            </div>
            <label :class="btnPrimary + ' cursor-pointer'">
              <input
                type="file"
                class="hidden"
                accept="image/*"
                multiple
                :disabled="uploading"
                @change="onFileSelect"
              />
              <Plus class="h-4 w-4" />
              {{ uploading ? t('common.saving') : t('saleOrderItems.uploadFile') }}
            </label>
            <ActionIconButton action="refresh" @click="loadImages" />
          </div>
        </div>
      </div>
      <div v-if="fileError" class="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
        {{ fileError }}
      </div>
      <div v-if="imagesLoading" class="py-8 text-center text-sm text-gray-500">{{ t('common.loading') }}</div>
      <div v-else-if="images.length === 0" class="py-8 text-center text-sm text-gray-500">{{ t('saleOrderItems.noFiles') }}</div>
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="image in images"
          :key="image.id"
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]"
        >
          <a
            :href="resolveSaleOrderImageUrl(image)"
            target="_blank"
            rel="noopener"
            class="block aspect-[4/3] bg-gray-50 dark:bg-gray-900"
          >
            <img
              :src="resolveSaleOrderImageUrl(image)"
              :alt="image.originalFileName || image.fileName"
              class="h-full w-full object-cover"
              loading="lazy"
            />
          </a>
          <div class="space-y-2 p-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                {{ imageTypeLabel(image.imageType) }}
              </span>
              <span v-if="image.size" class="text-xs text-gray-500">{{ formatBytes(image.size) }}</span>
            </div>
            <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">
              {{ image.originalFileName || image.fileName }}
            </p>
            <p class="text-xs text-gray-500">{{ formatDateTime(image.createdAt) }}</p>
            <div class="flex flex-wrap gap-2 pt-1">
              <a
                :href="resolveSaleOrderImageUrl(image)"
                target="_blank"
                rel="noopener"
                :class="btnOutline + ' !py-2 !text-xs'"
              >
                {{ t('saleOrderItems.openFile') }}
              </a>
              <button
                type="button"
                :disabled="deletingImageId === image.id"
                :class="btnOutline + ' !py-2 !text-xs text-red-600'"
                @click="removeImage(image)"
              >
                {{ deletingImageId === image.id ? t('common.deleting') : t('common.delete') }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>

    <!-- Waste (sale-order-wastes) -->
    <div v-else-if="panel === 'waste'">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('saleOrderWaste.orderHint') }}</p>
          <p class="mt-1 text-xs text-gray-400">{{ t('saleOrderWaste.infoOnly') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" :class="btnPrimary" @click="openWasteForm()">
            <Plus class="h-4 w-4" />
            {{ t('saleOrderWaste.add') }}
          </button>
          <ActionIconButton action="refresh" @click="loadWastes" />
        </div>
      </div>

      <div v-if="wasteError" class="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
        {{ wasteError }}
      </div>
      <div v-if="wasteSuccess" class="mb-3 rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
        {{ wasteSuccess }}
      </div>

      <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
          <p class="text-xs font-medium text-gray-500">{{ t('saleOrderWaste.totalQuantity') }}</p>
          <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{{ formatQty(wasteTotal) }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-white/5">
          <p class="text-xs font-medium text-gray-500">{{ t('saleOrderWaste.records') }}</p>
          <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{{ wastes.length }}</p>
        </div>
      </div>

      <div v-if="wasteSummary.length" class="mb-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <div class="border-b border-gray-100 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800">
          {{ t('saleOrderWaste.byGoods') }}
        </div>
        <ul class="divide-y divide-gray-100 dark:divide-gray-800">
          <li
            v-for="row in wasteSummary"
            :key="row.goodsId"
            class="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
          >
            <span class="text-gray-800 dark:text-white/90">{{ row.goodsName || `#${row.goodsId}` }}</span>
            <span class="font-medium tabular-nums text-gray-600 dark:text-gray-300">{{ formatQty(row.totalQuantity) }}</span>
          </li>
        </ul>
      </div>

      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">ID</th>
              <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('saleOrderWaste.goods') }}</th>
              <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('saleOrderWaste.quantity') }}</th>
              <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('saleOrderWaste.size') }}</th>
              <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('saleOrderWaste.comment') }}</th>
              <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('saleOrderWaste.createdAt') }}</th>
              <th class="px-5 py-3 text-right text-xs font-medium text-gray-500">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="wastesLoading">
              <td colspan="7" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.loading') }}</td>
            </tr>
            <tr v-else-if="wastes.length === 0">
              <td colspan="7" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('saleOrderWaste.empty') }}</td>
            </tr>
            <tr v-for="row in wastes" :key="row.id">
              <td class="px-5 py-4 text-sm text-gray-500">#{{ row.id }}</td>
              <td class="px-5 py-4 text-sm text-gray-800 dark:text-white/90">
                {{ row.goodsName || `#${row.goodsId}` }}
                <span v-if="row.unitName" class="ml-1 text-xs text-gray-400">({{ row.unitName }})</span>
              </td>
              <td class="px-5 py-4 text-right text-sm font-medium tabular-nums text-gray-800 dark:text-white/90">
                {{ formatQty(row.quantity) }}
              </td>
              <td class="px-5 py-4 text-sm text-gray-500">{{ formatWasteSize(row) }}</td>
              <td class="px-5 py-4 text-sm text-gray-500">{{ row.comment || '—' }}</td>
              <td class="px-5 py-4 text-sm text-gray-500">{{ formatDateTime(row.createdAt) }}</td>
              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-2">
                  <ActionIconButton action="edit" size="sm" @click="openWasteForm(row)" />
                  <ActionIconButton
                    action="delete"
                    size="sm"
                    :disabled="deletingWasteId === row.id"
                    @click="removeWaste(row)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Modal v-if="showWasteModal" @close="showWasteModal = false">
        <template #body>
          <div class="relative w-full max-w-lg rounded-3xl bg-white p-6 dark:bg-gray-900">
            <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              {{ editingWasteId ? t('saleOrderWaste.edit') : t('saleOrderWaste.add') }}
            </h4>
            <div v-if="wasteFormError" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:text-red-400">
              {{ wasteFormError }}
            </div>
            <form class="space-y-4" @submit.prevent="submitWaste">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('saleOrderWaste.goods') }}<span class="text-error-500">*</span>
                </label>
                <select v-model.number="wasteForm.goodsId" required :class="inputClass">
                  <option :value="0" disabled>{{ t('saleOrderWaste.selectGoods') }}</option>
                  <option v-for="g in goodsOptions" :key="g.id" :value="g.id">
                    {{ g.name }} <template v-if="g.unitTypeName">({{ g.unitTypeName }})</template>
                  </option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  {{ t('saleOrderWaste.quantity') }}<span class="text-error-500">*</span>
                </label>
                <input v-model.number="wasteForm.quantity" type="number" min="0.001" step="any" required :class="inputClass" />
              </div>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrderWaste.width') }}</label>
                  <input v-model.number="wasteForm.width" type="number" min="0" step="any" :class="inputClass" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrderWaste.height') }}</label>
                  <input v-model.number="wasteForm.height" type="number" min="0" step="any" :class="inputClass" />
                </div>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{{ t('saleOrderWaste.comment') }}</label>
                <textarea v-model="wasteForm.comment" rows="2" :class="inputClass" />
              </div>
              <div class="flex justify-end gap-3 pt-2">
                <button type="button" :class="btnOutline" @click="showWasteModal = false">{{ t('common.cancel') }}</button>
                <button type="submit" :disabled="savingWaste" :class="btnPrimary">
                  {{ savingWaste ? t('common.saving') : t('common.save') }}
                </button>
              </div>
            </form>
          </div>
        </template>
      </Modal>
    </div>

    <!-- Notifications -->
    <div v-else-if="panel === 'notify'">
      <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">{{ t('saleOrderItems.notifyHint') }}</p>

      <div v-if="notifyError" class="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
        {{ notifyError }}
      </div>
      <div v-if="notifySuccess" class="mb-3 rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
        {{ notifySuccess }}
      </div>

      <div class="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <!-- SMS -->
        <div class="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <div class="mb-3 flex items-center gap-2">
            <MessageSquare class="h-4 w-4 text-brand-500" />
            <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('saleOrderItems.channelSms') }}</h4>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('saleOrderItems.notifyPreview') }}</p>
          <p class="mt-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            {{ debtSmsPreview }}
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <button type="button" :disabled="notifySending === 'sms-order'" :class="btnPrimary" @click="sendOrderDebtSms">
              {{ notifySending === 'sms-order' ? t('common.saving') : t('saleOrderItems.sendOrderDebtSms') }}
            </button>
            <button
              v-if="order.clientId"
              type="button"
              :disabled="notifySending === 'sms-client'"
              :class="btnOutline"
              @click="sendClientDebtSms"
            >
              {{ notifySending === 'sms-client' ? t('common.saving') : t('saleOrderItems.sendClientDebtSms') }}
            </button>
          </div>
        </div>

        <!-- Telegram -->
        <div class="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <Send class="h-4 w-4 text-brand-500" />
              <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('saleOrderItems.channelTelegram') }}</h4>
            </div>
            <span v-if="botSettings" :class="botStatusClass">
              {{ botSettings.botConnected ? t('telegramBot.connectedYes') : t('telegramBot.connectedNo') }}
            </span>
          </div>

          <div v-if="!order.clientId" class="rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
            {{ t('saleOrderItems.noClientForTelegram') }}
          </div>
          <template v-else>
            <div v-if="botSettings && !botSettings.botConnected" class="mb-3 rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
              {{ t('saleOrderItems.botNotConnectedWarning') }}
            </div>
            <div class="space-y-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('saleOrderItems.notifyTemplate') }}</label>
                <select v-model="notifyTemplate" :class="inputClass">
                  <option value="ready">{{ t('saleOrderItems.templateReady') }}</option>
                  <option value="confirmed">{{ t('saleOrderItems.templateConfirmed') }}</option>
                  <option value="debt">{{ t('saleOrderItems.templateDebt') }}</option>
                  <option value="custom">{{ t('saleOrderItems.templateCustom') }}</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-500">{{ t('saleOrderItems.notifyMessage') }}</label>
                <textarea
                  v-model="telegramMessage"
                  rows="4"
                  :class="inputClass + ' min-h-[96px] resize-y'"
                  :placeholder="t('saleOrderItems.notifyMessage')"
                />
              </div>
            </div>
            <div class="mt-4">
              <button
                type="button"
                :disabled="notifySending === 'telegram' || !telegramMessage.trim()"
                :class="btnPrimary"
                @click="sendTelegramMessage"
              >
                {{ notifySending === 'telegram' ? t('common.saving') : t('saleOrderItems.sendTelegram') }}
              </button>
            </div>
          </template>
        </div>
      </div>

      <!-- History -->
      <div class="mt-6 rounded-xl border border-gray-200 dark:border-gray-800">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ t('saleOrderItems.notifyHistory') }}</h4>
          <div class="flex items-center gap-2">
            <div class="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-900">
              <button
                type="button"
                :class="historyTabBtnClass('sms')"
                @click="historyTab = 'sms'"
              >
                SMS
              </button>
              <button
                type="button"
                :class="historyTabBtnClass('telegram')"
                @click="historyTab = 'telegram'"
              >
                Telegram
              </button>
            </div>
            <ActionIconButton action="refresh" @click="loadNotifyHistory" />
          </div>
        </div>

        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">ID</th>
                <th v-if="historyTab === 'sms'" class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('clientDetail.smsPhone') }}</th>
                <th v-else class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('saleOrderItems.telegramChat') }}</th>
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('common.status') }}</th>
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('sms.message') }}</th>
                <th class="px-5 py-3 text-left text-xs font-medium text-gray-500">{{ t('clientDetail.smsDate') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="historyLoading"><td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.loading') }}</td></tr>
              <tr v-else-if="historyTab === 'sms' && smsHistory.length === 0"><td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td></tr>
              <tr v-else-if="historyTab === 'telegram' && telegramHistory.length === 0"><td colspan="5" class="px-5 py-8 text-center text-sm text-gray-500">{{ t('common.notFound') }}</td></tr>
              <template v-else-if="historyTab === 'sms'">
                <tr v-for="item in smsHistory" :key="item.id">
                  <td class="px-5 py-4 text-sm text-gray-500">#{{ item.id }}</td>
                  <td class="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{{ item.phone || '—' }}</td>
                  <td class="px-5 py-4 text-sm"><span :class="smsStatusClass(item)">{{ smsStatusLabel(item) }}</span></td>
                  <td class="px-5 py-4 text-sm text-gray-500">{{ getSmsDisplayMessage(item) }}</td>
                  <td class="px-5 py-4 text-sm text-gray-500">{{ formatDateTime(item.sentAt || item.createdAt) }}</td>
                </tr>
              </template>
              <template v-else>
                <tr v-for="item in telegramHistory" :key="item.id">
                  <td class="px-5 py-4 text-sm text-gray-500">#{{ item.id }}</td>
                  <td class="px-5 py-4 text-sm text-gray-800 dark:text-white/90">{{ item.chatId || '—' }}</td>
                  <td class="px-5 py-4 text-sm"><span :class="telegramStatusClass(item)">{{ telegramStatusLabel(item) }}</span></td>
                  <td class="px-5 py-4 text-sm text-gray-500">{{ getTelegramDisplayMessage(item) }}</td>
                  <td class="px-5 py-4 text-sm text-gray-500">{{ formatDateTime(item.sentAt || item.createdAt) }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, CreditCard, MessageSquare, Send } from 'lucide-vue-next'
import ActionIconButton from '@/components/common/ActionIconButton.vue'
import Modal from '@/components/ui/Modal.vue'
import { fetchPaymentsBySaleOrder, type PaymentResponse } from '@/services/payments'
import {
  sendDebtSmsForOrder,
  sendDebtSmsToClient,
  sendTelegramForOrder,
  fetchDebtNotificationHistoryByClient,
  fetchTelegramHistoryByOrder,
  type DebtNotificationHistoryResponse,
  type TelegramNotificationHistoryResponse,
} from '@/services/notifications'
import { fetchTelegramBotSettings, type TelegramBotSettingsResponse } from '@/services/telegramBotSettings'
import {
  fetchSaleOrderImages,
  uploadSaleOrderImages,
  deleteSaleOrderImage,
  resolveSaleOrderImageUrl,
  type SaleOrderImageResponse,
  type SaleOrderImageType,
} from '@/services/saleOrderImages'
import {
  fetchSaleOrderWastesByOrder,
  fetchSaleOrderWasteTotal,
  fetchSaleOrderWasteSummaryByOrder,
  createSaleOrderWaste,
  updateSaleOrderWaste,
  deleteSaleOrderWaste,
  type SaleOrderWasteResponse,
  type SaleOrderWasteSummaryResponse,
} from '@/services/saleOrderWastes'
import { fetchAllGoods, type GoodsResponse } from '@/services/goods'
import type { SaleOrderResponse } from '@/services/saleOrders'
import type { SaleOrderActivityEntry } from '@/utils/saleOrderMeta'
import {
  normalizeSmsStatus,
  isSmsStatusSuccess,
  getSmsDisplayMessage,
  SMS_STATUS_I18N_KEY,
} from '@/utils/smsNotificationStatus'
import {
  normalizeTelegramStatus,
  isTelegramStatusSuccess,
  getTelegramDisplayMessage,
  TELEGRAM_STATUS_I18N_KEY,
} from '@/utils/telegramNotificationStatus'

export type SaleOrderExtraPanel = 'payments' | 'timeline' | 'files' | 'waste' | 'notify'

const props = defineProps<{
  order: SaleOrderResponse
  panel: SaleOrderExtraPanel
}>()

const emit = defineEmits<{
  refresh: []
  'log-activity': [Omit<SaleOrderActivityEntry, 'id'>]
  'add-payment': []
  'payments-loaded': [number]
  'images-loaded': [number]
  'wastes-loaded': [number]
}>()

const { t } = useI18n()

const inputClass = 'h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'
const btnOutline = 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
const btnPrimary = 'inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-70'
const btnSuccess = 'inline-flex items-center gap-2 rounded-lg bg-success-600 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-success-700 disabled:opacity-70'

const orderPayments = ref<PaymentResponse[]>([])
const paymentsLoading = ref(false)
const images = ref<SaleOrderImageResponse[]>([])
const imagesLoading = ref(false)
const uploadImageType = ref<SaleOrderImageType>('OBJECT')
const deletingImageId = ref<number | null>(null)
const fileError = ref('')
const uploading = ref(false)

const wastes = ref<SaleOrderWasteResponse[]>([])
const wasteSummary = ref<SaleOrderWasteSummaryResponse[]>([])
const wasteTotal = ref(0)
const wastesLoading = ref(false)
const wasteError = ref('')
const wasteSuccess = ref('')
const wasteFormError = ref('')
const showWasteModal = ref(false)
const savingWaste = ref(false)
const editingWasteId = ref<number | null>(null)
const deletingWasteId = ref<number | null>(null)
const goodsOptions = ref<GoodsResponse[]>([])
const wasteForm = ref({
  goodsId: 0,
  quantity: 0,
  width: null as number | null,
  height: null as number | null,
  comment: '',
})
const notifySending = ref<'sms-order' | 'sms-client' | 'telegram' | null>(null)
const notifyError = ref('')
const notifySuccess = ref('')
const notifyTemplate = ref<'ready' | 'confirmed' | 'debt' | 'custom'>('ready')
const telegramMessage = ref('')
const botSettings = ref<TelegramBotSettingsResponse | null>(null)
const historyTab = ref<'sms' | 'telegram'>('sms')
const historyLoading = ref(false)
const smsHistory = ref<DebtNotificationHistoryResponse[]>([])
const telegramHistory = ref<TelegramNotificationHistoryResponse[]>([])

const debtSmsPreview = computed(() =>
  t('saleOrderItems.msgDebt', {
    id: props.order.id,
    client: props.order.clientFullName || t('saleOrderItems.noClient'),
    debt: formatMoney(props.order.debtSum),
  }),
)

const templateMessage = computed(() => {
  const client = props.order.clientFullName || t('saleOrderItems.noClient')
  if (notifyTemplate.value === 'ready') {
    return t('saleOrderItems.msgReady', { client, id: props.order.id })
  }
  if (notifyTemplate.value === 'confirmed') {
    return t('saleOrderItems.msgConfirmed', { client, id: props.order.id })
  }
  if (notifyTemplate.value === 'debt') {
    return t('saleOrderItems.msgDebt', { client, id: props.order.id, debt: formatMoney(props.order.debtSum) })
  }
  return telegramMessage.value
})

const botStatusClass = computed(() =>
  botSettings.value?.botConnected
    ? 'inline-flex rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400'
    : 'inline-flex rounded-full bg-warning-50 px-2.5 py-1 text-xs font-medium text-warning-700 dark:bg-warning-500/10 dark:text-warning-400',
)

const historyTabBtnClass = (tab: 'sms' | 'telegram') =>
  [
    'rounded-md px-3 py-1.5 text-xs font-medium transition',
    historyTab.value === tab
      ? 'bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white'
      : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white',
  ].join(' ')

const smsStatusLabel = (item: DebtNotificationHistoryResponse) => t(SMS_STATUS_I18N_KEY[normalizeSmsStatus(item)])
const smsStatusClass = (item: DebtNotificationHistoryResponse) => {
  const ok = isSmsStatusSuccess(normalizeSmsStatus(item))
  return ok
    ? 'inline-flex rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400'
    : 'inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400'
}

const telegramStatusLabel = (item: TelegramNotificationHistoryResponse) =>
  t(TELEGRAM_STATUS_I18N_KEY[normalizeTelegramStatus(item)])
const telegramStatusClass = (item: TelegramNotificationHistoryResponse) => {
  const ok = isTelegramStatusSuccess(normalizeTelegramStatus(item))
  return ok
    ? 'inline-flex rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400'
    : 'inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400'
}

const paymentsTotal = computed(() =>
  orderPayments.value.reduce((sum, payment) => sum + payment.paymentAmount, 0),
)

const formatMoney = (v: number) => new Intl.NumberFormat('uz-UZ').format(v) + ' so‘m'
const formatDateTime = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString('uz-UZ')
}
const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
const formatQty = (v: number) => new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 3 }).format(v || 0)
const formatWasteSize = (row: SaleOrderWasteResponse) => {
  if (row.width == null && row.height == null) return '—'
  return `${row.width ?? '—'} × ${row.height ?? '—'}`
}
const imageTypeLabel = (type: SaleOrderImageType | null | undefined) => {
  if (!type) return t('saleOrderItems.imageTypes.OTHER')
  return t(`saleOrderItems.imageTypes.${type}`)
}

const timelineEntries = computed(() => {
  const entries: SaleOrderActivityEntry[] = []

  entries.push({
    id: 'created',
    type: 'created',
    message: t('saleOrderItems.activityCreated', { id: props.order.id }),
    at: props.order.createdAt,
    by: props.order.createdUsername,
  })

  for (const payment of orderPayments.value) {
    entries.push({
      id: `payment-${payment.id}`,
      type: 'payment',
      message: t('saleOrderItems.activityPayment', {
        amount: formatMoney(payment.paymentAmount),
        type: payment.paymentTypeName,
      }),
      at: payment.paymentDate,
      by: payment.createdUsername,
    })
  }

  for (const item of props.order.activityLog ?? []) {
    entries.push(item)
  }

  if (props.order.cancelReason) {
    entries.push({
      id: 'cancel-reason',
      type: 'cancelled',
      message: t('saleOrderItems.activityCancelled', { reason: props.order.cancelReason }),
      at: props.order.updatedAt,
      by: null,
    })
  }

  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
})

const loadPayments = async () => {
  paymentsLoading.value = true
  try {
    const rows = await fetchPaymentsBySaleOrder(props.order.id)
    orderPayments.value = rows.filter((p) => p.status === 'ACTIVE').sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
    )
    emit('payments-loaded', orderPayments.value.length)
  } catch {
    orderPayments.value = []
    emit('payments-loaded', 0)
  } finally {
    paymentsLoading.value = false
  }
}

const loadBotSettings = async () => {
  try {
    botSettings.value = await fetchTelegramBotSettings()
  } catch {
    botSettings.value = null
  }
}

const loadNotifyHistory = async () => {
  historyLoading.value = true
  try {
    const tasks: Promise<void>[] = []

    if (props.order.clientId) {
      tasks.push(
        fetchDebtNotificationHistoryByClient(props.order.clientId)
          .then((rows) => {
            smsHistory.value = rows.sort(
              (a, b) =>
                new Date(b.sentAt || b.createdAt || 0).getTime() -
                new Date(a.sentAt || a.createdAt || 0).getTime(),
            )
          })
          .catch(() => {
            smsHistory.value = []
          }),
      )
    } else {
      smsHistory.value = []
    }

    tasks.push(
      fetchTelegramHistoryByOrder(props.order.id)
        .then((rows) => {
          telegramHistory.value = rows.sort(
            (a, b) =>
              new Date(b.sentAt || b.createdAt || 0).getTime() -
              new Date(a.sentAt || a.createdAt || 0).getTime(),
          )
        })
        .catch(() => {
          telegramHistory.value = []
        }),
    )

    await Promise.all(tasks)
  } finally {
    historyLoading.value = false
  }
}

const sendOrderDebtSms = async () => {
  notifyError.value = ''
  notifySuccess.value = ''
  notifySending.value = 'sms-order'
  try {
    await sendDebtSmsForOrder(props.order.id)
    notifySuccess.value = t('saleOrderItems.debtSmsSent')
    emit('log-activity', {
      type: 'message',
      message: t('saleOrderItems.activityDebtSms'),
      at: new Date().toISOString(),
      by: null,
    })
    await loadNotifyHistory()
  } catch (e) {
    notifyError.value = e instanceof Error ? e.message : t('saleOrderItems.notifyFailed')
  } finally {
    notifySending.value = null
  }
}

const sendClientDebtSms = async () => {
  if (!props.order.clientId) return
  notifyError.value = ''
  notifySuccess.value = ''
  notifySending.value = 'sms-client'
  try {
    await sendDebtSmsToClient(props.order.clientId)
    notifySuccess.value = t('saleOrderItems.clientDebtSmsSent')
    emit('log-activity', {
      type: 'message',
      message: t('saleOrderItems.activityClientDebtSms'),
      at: new Date().toISOString(),
      by: null,
    })
    await loadNotifyHistory()
  } catch (e) {
    notifyError.value = e instanceof Error ? e.message : t('saleOrderItems.notifyFailed')
  } finally {
    notifySending.value = null
  }
}

const sendTelegramMessage = async () => {
  const message = telegramMessage.value.trim()
  if (!message) {
    notifyError.value = t('saleOrderItems.notifyMessageRequired')
    return
  }
  notifyError.value = ''
  notifySuccess.value = ''
  notifySending.value = 'telegram'
  try {
    await sendTelegramForOrder(props.order.id, { message })
    notifySuccess.value = t('saleOrderItems.telegramSent')
    emit('log-activity', {
      type: 'message',
      message: t('saleOrderItems.activityTelegram'),
      at: new Date().toISOString(),
      by: null,
    })
    await loadNotifyHistory()
  } catch (e) {
    notifyError.value = e instanceof Error ? e.message : t('saleOrderItems.notifyFailed')
  } finally {
    notifySending.value = null
  }
}

const loadImages = async () => {
  imagesLoading.value = true
  fileError.value = ''
  try {
    images.value = (await fetchSaleOrderImages(props.order.id)).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    emit('images-loaded', images.value.length)
  } catch (e) {
    images.value = []
    emit('images-loaded', 0)
    fileError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    imagesLoading.value = false
  }
}

const onFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return
  fileError.value = ''
  uploading.value = true
  try {
    await uploadSaleOrderImages(props.order.id, Array.from(files), uploadImageType.value)
    emit('log-activity', {
      type: 'file',
      message: t('saleOrderItems.activityFileUploaded', { count: files.length }),
      at: new Date().toISOString(),
      by: null,
    })
    await loadImages()
  } catch (e) {
    fileError.value = e instanceof Error ? e.message : t('saleOrderItems.uploadFailed')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

const removeImage = async (image: SaleOrderImageResponse) => {
  deletingImageId.value = image.id
  fileError.value = ''
  try {
    await deleteSaleOrderImage(props.order.id, image.id)
    emit('log-activity', {
      type: 'file',
      message: t('saleOrderItems.activityFileDeleted', {
        name: image.originalFileName || image.fileName,
      }),
      at: new Date().toISOString(),
      by: null,
    })
    await loadImages()
  } catch (e) {
    fileError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    deletingImageId.value = null
  }
}

const ensureGoodsLoaded = async () => {
  if (goodsOptions.value.length) return
  try {
    const rows = await fetchAllGoods()
    goodsOptions.value = rows.filter((g) => g.status === 'ACTIVE')
  } catch {
    goodsOptions.value = []
  }
}

const loadWastes = async () => {
  wastesLoading.value = true
  wasteError.value = ''
  try {
    const [rows, total, summary] = await Promise.all([
      fetchSaleOrderWastesByOrder(props.order.id),
      fetchSaleOrderWasteTotal(props.order.id),
      fetchSaleOrderWasteSummaryByOrder(props.order.id),
    ])
    wastes.value = rows.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    wasteTotal.value = total
    wasteSummary.value = summary
    emit('wastes-loaded', wastes.value.length)
  } catch (e) {
    wastes.value = []
    wasteTotal.value = 0
    wasteSummary.value = []
    emit('wastes-loaded', 0)
    wasteError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    wastesLoading.value = false
  }
}

const openWasteForm = async (row?: SaleOrderWasteResponse) => {
  await ensureGoodsLoaded()
  wasteFormError.value = ''
  wasteSuccess.value = ''
  if (row) {
    editingWasteId.value = row.id
    wasteForm.value = {
      goodsId: row.goodsId,
      quantity: row.quantity,
      width: row.width,
      height: row.height,
      comment: row.comment || '',
    }
  } else {
    editingWasteId.value = null
    wasteForm.value = {
      goodsId: 0,
      quantity: 0,
      width: null,
      height: null,
      comment: '',
    }
  }
  showWasteModal.value = true
}

const submitWaste = async () => {
  wasteFormError.value = ''
  if (!wasteForm.value.goodsId || !wasteForm.value.quantity || wasteForm.value.quantity <= 0) {
    wasteFormError.value = t('saleOrderWaste.required')
    return
  }
  savingWaste.value = true
  try {
    const payload = {
      saleOrderId: props.order.id,
      goodsId: Number(wasteForm.value.goodsId),
      quantity: Number(wasteForm.value.quantity),
      width: wasteForm.value.width != null && wasteForm.value.width > 0 ? Number(wasteForm.value.width) : undefined,
      height: wasteForm.value.height != null && wasteForm.value.height > 0 ? Number(wasteForm.value.height) : undefined,
      comment: wasteForm.value.comment.trim() || undefined,
    }
    if (editingWasteId.value) {
      await updateSaleOrderWaste(editingWasteId.value, payload)
      wasteSuccess.value = t('saleOrderWaste.updated')
    } else {
      await createSaleOrderWaste(payload)
      wasteSuccess.value = t('saleOrderWaste.created')
    }
    showWasteModal.value = false
    emit('log-activity', {
      type: 'updated',
      message: editingWasteId.value
        ? t('saleOrderWaste.activityUpdated')
        : t('saleOrderWaste.activityCreated'),
      at: new Date().toISOString(),
      by: null,
    })
    await loadWastes()
  } catch (e) {
    wasteFormError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    savingWaste.value = false
  }
}

const removeWaste = async (row: SaleOrderWasteResponse) => {
  deletingWasteId.value = row.id
  wasteError.value = ''
  try {
    await deleteSaleOrderWaste(row.id)
    wasteSuccess.value = t('saleOrderWaste.deleted')
    emit('log-activity', {
      type: 'updated',
      message: t('saleOrderWaste.activityDeleted', { name: row.goodsName || `#${row.goodsId}` }),
      at: new Date().toISOString(),
      by: null,
    })
    await loadWastes()
  } catch (e) {
    wasteError.value = e instanceof Error ? e.message : t('common.error')
  } finally {
    deletingWasteId.value = null
  }
}

watch(
  () => props.order.id,
  () => {
    loadPayments()
    loadImages()
    loadWastes()
  },
  { immediate: true },
)

watch(
  () => [props.panel, props.order.id] as const,
  ([panel]) => {
    if (panel === 'files') loadImages()
    if (panel === 'waste') loadWastes()
    if (panel !== 'notify') return
    loadBotSettings()
    loadNotifyHistory()
  },
  { immediate: true },
)

watch(notifyTemplate, (template) => {
  if (template !== 'custom') {
    telegramMessage.value = templateMessage.value
  }
})

watch(templateMessage, (message) => {
  if (notifyTemplate.value !== 'custom') {
    telegramMessage.value = message
  }
}, { immediate: true })

defineExpose({ loadPayments, timelineCount: computed(() => timelineEntries.value.length) })
</script>
