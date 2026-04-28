import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
    headers: {
      'Content-Security-Policy': "frame-ancestors 'self' https://auth.privy.io https://embedded.privy.io",
      'X-Frame-Options': 'ALLOWALL',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy': "frame-ancestors 'self' https://auth.privy.io https://embedded.privy.io",
      'X-Frame-Options': 'ALLOWALL',
    },
  },
})
