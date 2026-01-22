import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
  },
  define: {
    'import.meta.env.BACKEND_URL': JSON.stringify(process.env.BACKEND_URL || 'http://localhost:3000')
  }
});
