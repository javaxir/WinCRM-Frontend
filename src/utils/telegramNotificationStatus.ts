import type { TelegramNotificationHistoryResponse } from '@/services/notifications'

export type TelegramNotificationStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNKNOWN'

export function normalizeTelegramStatus(item: TelegramNotificationHistoryResponse): TelegramNotificationStatus {
  if (item.status) {
    const s = item.status.toUpperCase()
    if (s === 'SUCCESS' || s === 'SENT' || s === 'OK' || s === 'DELIVERED') return 'SUCCESS'
    if (s === 'FAILED' || s === 'FAIL' || s === 'ERROR') return 'FAILED'
    if (s === 'PENDING' || s === 'QUEUED') return 'PENDING'
  }
  if (item.success === true) return 'SUCCESS'
  if (item.success === false) return 'FAILED'
  return 'UNKNOWN'
}

export function isTelegramStatusSuccess(status: TelegramNotificationStatus) {
  return status === 'SUCCESS'
}

export function getTelegramDisplayMessage(item: TelegramNotificationHistoryResponse): string {
  if (item.message?.trim()) return item.message.trim()
  if (item.errorMessage?.trim()) return item.errorMessage.trim()
  return '—'
}

export const TELEGRAM_STATUS_I18N_KEY: Record<TelegramNotificationStatus, string> = {
  SUCCESS: 'sms.statusSuccess',
  FAILED: 'sms.statusFailed',
  PENDING: 'sms.statusPending',
  UNKNOWN: 'sms.statusUnknown',
}
