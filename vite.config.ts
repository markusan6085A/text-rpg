import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Default Vite order prefers .js over .ts — stale emitted *.js next to *.ts (e.g. skills/index.js) breaks ESM named exports.
    extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'],
  },
  esbuild: {
    // Вирізає console.log, info, debug та warn у продакшен-білді, залишає console.error
    pure: ['console.log', 'console.debug', 'console.info', 'console.warn'],
  },
  build: {
    sourcemap: false, // Приховує оригінальний код і структуру папок у DevTools (Sources)
    minify: 'esbuild', // Стискає та мініфікує код (вже увімкнено за замовчуванням у Vite, але додаємо для певності)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/') || id.includes('scheduler')) return 'vendor-react'
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('zustand')) return 'vendor-zustand'
          }
          const norm = id.replace(/\\/g, '/')
          // persist / loadout / helpers / types are imported by heroStore and stats utils.
          // If they live in the `battle` chunk, Rollup loads: main → battle-helpers → battle store → heroStore
          // while heroStore is still initializing → "Cannot access … before initialization" in prod.
          if (
            norm.includes('/state/battle/helpers') ||
            norm.endsWith('/state/battle/persist.ts') ||
            norm.endsWith('/state/battle/loadout.ts') ||
            norm.endsWith('/state/battle/types.ts')
          ) {
            return undefined
          }
          if (norm.includes('/state/battle/') || norm.includes('/screens/Battle')) return 'battle'
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
