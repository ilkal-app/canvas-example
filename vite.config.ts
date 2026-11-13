import { cpSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Copies the SDK's own worker files into the build, under the names it publishes them with.
 *
 * @ilkal/sdk 0.1.3's engine worker starts its job workers by their published file names. Vite
 * gives the files it bundles new names, so without this copy those workers would not load in a
 * production build, and the board would draw no text. Not needed with `npm run dev`.
 */
function copySdkWorkers(): Plugin {
  let outDir = 'dist';
  return {
    name: 'copy-ilkal-sdk-workers',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir, config.build.assetsDir);
    },
    closeBundle() {
      cpSync(resolve('node_modules/@ilkal/sdk/dist/assets'), outDir, {
        recursive: true,
        force: false,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), copySdkWorkers()],
  // Relative asset paths, so the build works from any folder (a GitHub Pages project page too).
  base: './',
  // The SDK starts its workers from files beside its own modules. Vite's dev server pre-bundles
  // dependencies into one folder, where those files are not, so serve the SDK as published.
  optimizeDeps: { exclude: ['@ilkal/sdk'] },
  // The SDK's editor and its rendering engine are large chunks, as expected: don't warn about them.
  build: { chunkSizeWarningLimit: 3000 },
});
