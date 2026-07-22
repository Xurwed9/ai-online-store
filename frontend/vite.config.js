import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/categories': 'http://127.0.0.1:8000',
      '/products': 'http://127.0.0.1:8000',
      '/cart': 'http://127.0.0.1:8000',
      '/orders': 'http://127.0.0.1:8000',
      '/payments': 'http://127.0.0.1:8000',
      '/chat': 'http://127.0.0.1:8000',
    }
  }
})
