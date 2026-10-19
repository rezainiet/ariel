import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // API de la boutique (server/index.mjs) en développement
  server: {
    proxy: { '/api': 'http://localhost:8787' },
  },
  build: {
    target: 'es2019',
    cssCodeSplit: true,
  },
})
