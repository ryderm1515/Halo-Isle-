import { defineConfig } from 'vite';
export default defineConfig({ root: new URL('..', import.meta.url).pathname, base: './', publicDir: false, build: { outDir: '/tmp/single', emptyOutDir: true, target: 'es2022', cssCodeSplit: false, rollupOptions: { output: { inlineDynamicImports: true } } } });
