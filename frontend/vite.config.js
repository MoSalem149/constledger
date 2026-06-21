import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Core backend (auth + users)
      '/api/auth': 'http://localhost:3000',
      '/api/users': 'http://localhost:3000',
      // AI backend (contracts, uploads, finance, reports)
      '/api/contracts': 'http://localhost:5000',
      '/api/uploads': 'http://localhost:5000',
      '/api/finance': 'http://localhost:3000',
      '/api/reports': 'http://localhost:5000',
    },
  },
  preview: {
    port: 5173,
  },
});