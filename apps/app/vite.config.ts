import { defineConfig } from 'vite';

// Relative base so the built files work from the app's local file origin as well as a web server.
export default defineConfig({
  base: './',
  server: { fs: { allow: ['../..'] } },
  build: { target: 'es2020', outDir: 'dist', emptyOutDir: true },
});
