import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Explicitly require all PostCSS-related packages
const postcss = require('postcss');
const postcssImport = require('postcss-import');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const postcssUrl = require('postcss-url');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    postcss: './postcss.config.cjs',
    preprocessorOptions: {
      // Ensure that custom loaders are explicitly available
      loaderOptions: {
        postcss: {
          implementation: postcss,
          postcssOptions: {
            plugins: [
              postcssImport,
              tailwindcss,
              autoprefixer,
              postcssUrl,
            ],
          },
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: process.env.NODE_ENV === 'production',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
