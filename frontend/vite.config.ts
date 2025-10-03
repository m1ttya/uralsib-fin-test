// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/uralsib-fin-test/',
  server: {
    host: '0.0.0.0',
    open: true,
    port: 5173
  }
});