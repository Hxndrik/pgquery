import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 28000,
    proxy: {
      '/api': {
        target: 'http://localhost:28001',
        changeOrigin: true,
      },
    },
  },
})
