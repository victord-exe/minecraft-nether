import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true, // Abre el navegador automáticamente
  },
  publicDir: 'public', // Carpeta para archivos estáticos
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
