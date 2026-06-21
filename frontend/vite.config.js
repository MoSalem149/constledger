import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Keep sourcemaps in production builds. Without this, any runtime error
    // in the deployed bundle shows up as e.g. "e is not a function" with no
    // way to trace it back to real file/line/variable names.
    sourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Core backend (auth + users + finance + reports)
      '/api/auth': 'http://localhost:3000',
      '/api/users': 'http://localhost:3000',
      '/api/finance': 'http://localhost:3000',
      '/api/reports': 'http://localhost:3000',
      // AI backend (contracts, uploads)
      '/api/contracts': 'http://localhost:5000',
      '/api/uploads': 'http://localhost:5000',
    },
  },
  preview: {
    port: 5173,
  },
});
