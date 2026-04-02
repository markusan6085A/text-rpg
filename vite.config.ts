import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    // Default Vite order prefers .js over .ts — stale emitted *.js next to *.ts (e.g. skills/index.js) breaks ESM named exports.
    extensions: ['.ts', '.tsx', '.mts', '.mjs', '.js', '.jsx', '.json'],
  },
  esbuild: {
    // Production: прибираємо всі виклики console.* і debugger — у DevTools (Console) не видно діагностичних логів із коду.
    // У dev (`vite`) логи лишаються для розробки.
    drop: mode === 'production' ? (['console', 'debugger'] as const) : [],
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
          // Do NOT split `state/battle` or `screens/Battle` into a separate chunk.
          // App.tsx imports Battle before useHeroStore; a `battle` chunk that imports heroStore causes Rollup
          // to execute modules in an order where live bindings hit the TDZ ("Cannot access … before initialization").
          //
          // MYSTIC_SPELLBOOK_TIERS is consumed by itemsDB_spellbooks (data-items). If it lands in the admin
          // chunk (admin UI imports spellbook helpers), Rollup can emit data-items ↔ admin mutual imports → TDZ / black screen.
          if (id.includes('mysticSpellbookTiers.ts')) return 'data-items'
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
}))
