import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: 'src',
  publicDir: false,
  plugins: [
    handlebars({
      partialDirectory: [
        resolve(__dirname, 'src/components'),
        resolve(__dirname, 'src/layouts'),
      ],
    }),
  ],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/pages/index.html'),
        about: resolve(__dirname, 'src/pages/about.html'),
      },
    },
  },
  server: {
    open: '/pages/index.html',
  },
});
