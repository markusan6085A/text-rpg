import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { 
    open: true,
    hmr: {
      overlay: false // Відключено overlay помилок (кеш буде очищено після перезапуску)
    }
  }
})
