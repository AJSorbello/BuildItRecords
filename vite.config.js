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
  define: {
    // Explicitly define process.env to avoid "process is not defined" errors
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      REACT_APP_API_URL: JSON.stringify(process.env.REACT_APP_API_URL || ''),
    }
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
    port: 3000, // Set port to 3000 to match API expectations
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
    },
  },
});
