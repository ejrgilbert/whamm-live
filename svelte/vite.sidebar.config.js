import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte(
    {emitCss: false}
  )],
  build: {
    emptyOutDir: false,
    lib: {
      entry: './src/sidebar.ts',
      formats: ['iife'],
      name: 'sidebar',
      fileName: () => `sidebar.js`
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined
      }
    }
  }
});
