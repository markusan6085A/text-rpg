import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/') || id.includes('scheduler')) return 'vendor-react'
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('zustand')) return 'vendor-zustand'
          }
          if (id.includes('/state/battle/') || id.includes('/screens/Battle')) return 'battle'
          if (id.includes('/screens/admin/') || id.includes('AdminDashboard') || id.includes('AdminLogin') || id.includes('AdminItemPicker') || id.includes('PlayerAdminActions')) return 'admin'
          if (id.includes('/data/skills/')) return 'data-skills'
          if (id.includes('/data/items/')) return 'data-items'
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    chunkSizeWarningLimit: 1400,
  },
  server: { 
    host: '0.0.0.0', // Дозволяє підключення з VS Code preview
    port: 5173,
    open: true,
    hmr: {
      overlay: false // Відключено overlay помилок
    },
    // Proxy для API запитів (якщо потрібно)
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
