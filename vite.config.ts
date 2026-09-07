import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'https://test.urspi.uz',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://test.urspi.uz',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
