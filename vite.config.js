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
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/app-data': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/templates': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});

