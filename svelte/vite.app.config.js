import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    emptyOutDir: false,
    lib: {
      entry: './src/App.ts',
      formats: ['iife'],
      name: 'App',
      fileName: () => `App.js`
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined
      }
    }
  }
});
