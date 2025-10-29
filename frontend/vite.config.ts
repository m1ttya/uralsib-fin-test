// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: '0.0.0.0',
    open: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
      '/articles': {
        target: 'http://localhost:4001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
