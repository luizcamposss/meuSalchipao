import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Tudo sob /api vai para a API ASP.NET Core.
      // rewrite tira o prefixo /api (o backend serve em /auth, /orders, ...).
      '/api': {
        target: 'http://localhost:5029',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
        // O backend seta refresh_token com Path=/auth/refresh. Como o cliente
        // chama /api/auth/refresh, sem reescrever o Path o browser não devolve
        // o cookie. Reescreve o Path=/auth/refresh -> /api/auth/refresh.
        cookiePathRewrite: {
          '/auth/refresh': '/api/auth/refresh',
        },
      },
    },
  },
})
