import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// Single source of truth for the app version: read it from package.json and inject it at build time
// as the global `__APP_VERSION__` (see src/vite-env.d.ts).
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
  base: './',
  build: { outDir: 'dist' },
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
});
