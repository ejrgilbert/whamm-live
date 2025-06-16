import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte(
    {emitCss: false}
  )],
  build: {
    emptyOutDir: false,
    lib: {
      entry: './src/webview.ts',
      formats: ['iife'],
      name: 'webview',
      fileName: () => `webview.js`
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined
      }
    }
  }
});
