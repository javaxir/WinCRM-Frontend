const PREFIX = '+998 '

export function formatPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('998')) digits = digits.slice(3)
  digits = digits.slice(0, 9)

  if (!digits.length) return PREFIX

  let result = PREFIX + digits.slice(0, 2)
  if (digits.length > 2) result += ' ' + digits.slice(2, 5)
  if (digits.length > 5) result += ' ' + digits.slice(5, 7)
  if (digits.length > 7) result += ' ' + digits.slice(7, 9)
  return result
}

export function phoneToStorage(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('998')) return digits.slice(0, 12)
  return `998${digits.slice(0, 9)}`
}

export function phoneFromStorage(value?: string | null): string {
  if (!value) return PREFIX
  const digits = value.replace(/\D/g, '')
  const local = digits.startsWith('998') ? digits.slice(3) : digits
  return formatPhoneInput(local)
}

export function isPhoneComplete(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  const local = digits.startsWith('998') ? digits.slice(3) : digits
  return local.length === 9
}
