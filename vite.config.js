import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'background.js'),
      output: {
        entryFileNames: 'background.js',
        format: 'iife',
        name: 'FUBackground',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
  },
});