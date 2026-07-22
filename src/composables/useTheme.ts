import { inject, type ComputedRef, type Ref } from 'vue'

export type Theme = 'light' | 'dark'

export interface ThemeContext {
  theme: Ref<Theme>
  isDarkMode: ComputedRef<boolean>
  toggleTheme: () => void
  setTheme: (value: Theme) => void
}

export function useTheme(): ThemeContext {
  const theme = inject<ThemeContext>('theme')
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return theme
}
