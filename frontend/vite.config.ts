import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sitePlugin } from './site/plugin'

export default defineConfig({
  plugins: [react(), sitePlugin()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app/index.html'),
      },
    },
  },
  server: {
    port: 28000,
    proxy: {
      '/api': {
        target: 'http://localhost:54280',
        changeOrigin: true,
      },
    },
  },
})
