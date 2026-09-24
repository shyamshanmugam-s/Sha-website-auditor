import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/screenshots': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/pdfs': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
