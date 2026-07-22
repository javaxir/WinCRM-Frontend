import i18n from '@/i18n'

const ACCESS_DENIED_PATTERNS = [
  /^access denied$/i,
  /^forbidden$/i,
  /^permission denied$/i,
  /^insufficient permissions?$/i,
  /^you do not have (the )?required permission(s)?$/i,
]

export function translateApiError(message: string, status?: number): string {
  if (status === 403) {
    return i18n.global.t('common.accessDenied')
  }

  const trimmed = message.trim()
  if (ACCESS_DENIED_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return i18n.global.t('common.accessDenied')
  }

  return message
}
