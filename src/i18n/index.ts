import { createI18n } from 'vue-i18n'
import uz from './locales/uz'
import ru from './locales/ru'

export type AppLocale = 'uz' | 'ru'

const savedLocale = (localStorage.getItem('locale') as AppLocale | null) || 'uz'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'uz',
  messages: { uz, ru },
})

export function setAppLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
  document.documentElement.lang = locale
}

document.documentElement.lang = savedLocale

export default i18n
