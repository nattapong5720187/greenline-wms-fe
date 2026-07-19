import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: parseInt(process.env.PORT) || 5173,
    strictPort: false,
  },
  preview: {
    // Render injects PORT and requires binding to 0.0.0.0
    host: '0.0.0.0',
    port: parseInt(process.env.PORT) || 4173,
    strictPort: false,
    // Vite blocks requests with an unknown Host header; allow the Render domain
    allowedHosts: ['.onrender.com'],
  }
})
