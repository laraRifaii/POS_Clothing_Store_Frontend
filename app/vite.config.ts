import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path/win32';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  base: './',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    open:false,
    port: 5173,
  },
});
