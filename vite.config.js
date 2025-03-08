const { defineConfig } = require('vite') // eslint-disable-line @typescript-eslint/no-var-requires;
const react = require('@vitejs/plugin-react') // eslint-disable-line @typescript-eslint/no-var-requires;
const path = require('path') // eslint-disable-line @typescript-eslint/no-var-requires;

// https://vitejs.dev/config/
module.exports = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    minify: true,
    target: 'es2015', // Ensure good compatibility
    sourcemap: true,
    rollupOptions: {
      external: ['pg-native'] // Explicitly mark as external to avoid Vercel issues
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
    },
  },
});
