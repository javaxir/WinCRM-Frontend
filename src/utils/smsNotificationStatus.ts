import type { DebtNotificationHistoryResponse } from '@/services/notifications'

export type SmsNotificationStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNKNOWN'

export function normalizeSmsStatus(item: DebtNotificationHistoryResponse): SmsNotificationStatus {
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

export function isSmsStatusSuccess(status: SmsNotificationStatus) {
  return status === 'SUCCESS'
}

export function getSmsDebtAmount(item: DebtNotificationHistoryResponse): number | undefined {
  return item.debtAmount ?? item.totalDebtAmount
}

export function getSmsDisplayMessage(item: DebtNotificationHistoryResponse): string {
  if (item.message?.trim()) return item.message.trim()
  if (item.errorMessage?.trim()) return item.errorMessage.trim()
  return '—'
}

export const SMS_STATUS_I18N_KEY: Record<SmsNotificationStatus, string> = {
  SUCCESS: 'sms.statusSuccess',
  FAILED: 'sms.statusFailed',
  PENDING: 'sms.statusPending',
  UNKNOWN: 'sms.statusUnknown',
}
