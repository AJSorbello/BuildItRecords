import { Plugin } from 'vite';

/**
 * Custom Vite plugin to handle SPA fallback for client-side routing
 * This ensures that all routes are handled by the SPA router instead of returning 404
 */
export function spaFallbackPlugin(): Plugin {
  return {
    name: 'spa-fallback-plugin',
    configureServer(server) {
      // Return index.html for all HTML requests that would otherwise 404
      return () => {
        server.middlewares.use((req, res, next) => {
          // If the request is for a static asset (e.g., .js, .css, .png), let Vite handle it
          if (req.url && !req.url.includes('.')) {
            console.log(`[SPA Fallback] Redirecting ${req.url} to index.html`);
            req.url = '/index.html';
          }
          next();
        });
      };
    }
  };
}
