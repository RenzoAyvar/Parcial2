import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api/tasks': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/projects': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.js'], globals: true },
})
