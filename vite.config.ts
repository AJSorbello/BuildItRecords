import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url';
import { spaFallbackPlugin } from './src/vite-fallback-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    spaFallbackPlugin()
  ],
  define: {
    // Provide process.env to the browser environment
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      REACT_APP_API_URL: JSON.stringify(process.env.REACT_APP_API_URL || ''),
      REACT_APP_SPOTIFY_CLIENT_ID: JSON.stringify(process.env.REACT_APP_SPOTIFY_CLIENT_ID || 'spotify-client-id'),
      REACT_APP_SPOTIFY_CLIENT_SECRET: JSON.stringify(process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || 'spotify-client-secret'),
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  base: '/',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react', 
            'react-dom', 
            'react-router-dom',
            '@mui/material',
            '@emotion/react',
            '@emotion/styled'
          ],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['pg', 'pg-native', 'pg-hstore', 'libpq']
  }
});
