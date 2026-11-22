import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the built files work from the app's local file origin as well as a web server.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { fs: { allow: ['../..'] } },
  // The real size limit is enforced by tools/budget-check.mjs (decision 0008); this only silences Vite's generic warning.
  build: { target: 'es2020', outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 800 },
});
