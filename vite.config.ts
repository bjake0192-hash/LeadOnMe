import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/google-places': {
        target: 'https://places.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google-places/, '')
      },
      '/api/google-solar': {
        target: 'https://solar.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google-solar/, '')
      },
      '/api/google-maps': {
        target: 'https://maps.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google-maps/, '')
      },
      '/api/lusha': {
        target: 'https://api.lusha.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lusha/, '')
      },
      '/api/apollo': {
        target: 'https://api.apollo.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/apollo/, '')
      }
    }
  }
})
