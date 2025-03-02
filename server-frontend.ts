/// <reference types="bun-types" />
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { join } from "path";
import { logger } from 'hono/logger';
import fs from 'fs';

const app = new Hono();
const projectRoot = process.cwd();
const distDir = join(projectRoot, 'dist');
const publicDir = join(projectRoot, 'public');
const port = 3000; // Frontend runs on port 3000

console.log('Frontend server starting');
console.log('Project root:', projectRoot);
console.log('Dist dir:', distDir);
console.log('Public dir:', publicDir);

// Enable logger
app.use('*', logger());

// Serve favicon.ico
app.use('/favicon.ico', serveStatic(join(distDir, 'favicon.ico')));

// Serve manifest.json with proper Content-Type
app.get('/manifest.json', (c) => {
  try {
    const manifestPath = join(distDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      console.log('Serving manifest.json with correct content type');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      
      // Validate the JSON to ensure it's properly formatted
      try {
        JSON.parse(manifestContent);
      } catch (jsonError) {
        console.error('Invalid JSON in manifest.json:', jsonError);
        return c.text('Error: Invalid JSON in manifest.json', 500);
      }
      
      return c.body(manifestContent, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    } else {
      console.error('manifest.json not found in dist directory');
      return c.text('Error: manifest.json not found', 404);
    }
  } catch (error) {
    console.error('Error serving manifest.json:', error);
    return c.text('Server Error', 500);
  }
});

// Set proper content type for JavaScript files
app.get('/index.js', (c) => {
  try {
    const jsPath = join(distDir, 'index.js');
    if (fs.existsSync(jsPath)) {
      console.log('Serving index.js with correct content type');
      return c.body(Bun.file(jsPath), {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-cache'
        }
      });
    } else {
      console.error('index.js not found in dist directory');
      return c.text('Error: index.js not found', 404);
    }
  } catch (error) {
    console.error('Error serving index.js:', error);
    return c.text('Server Error', 500);
  }
});

// Serve CSS files with the correct content type
app.get('*.css', (c) => {
  try {
    const path = join(distDir, c.req.path);
    if (fs.existsSync(path)) {
      return c.body(Bun.file(path), {
        headers: {
          'Content-Type': 'text/css',
          'Cache-Control': 'no-cache'
        }
      });
    }
    return c.notFound();
  } catch (error) {
    console.error(`Error serving CSS file ${c.req.path}:`, error);
    return c.text('Server Error', 500);
  }
});

// Serve other static assets from the dist directory
app.use('/*.(png|jpg|jpeg|gif|svg|ico|webp)', (c) => {
  try {
    const path = join(distDir, c.req.path);
    if (fs.existsSync(path)) {
      const mimeType = getMimeType(path);
      return c.body(Bun.file(path), {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'max-age=86400'
        }
      });
    }
    return c.notFound();
  } catch (error) {
    console.error(`Error serving static file ${c.req.path}:`, error);
    return c.text('Server Error', 500);
  }
});

// Helper function to determine MIME type
function getMimeType(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    case 'ico': return 'image/x-icon';
    case 'webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

// Serve debug file only if specifically requested
app.get('/debug.html', (c) => {
  const publicDebugPath = join(publicDir, 'debug.html');
  if (fs.existsSync(publicDebugPath)) {
    return c.body(Bun.file(publicDebugPath), {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    });
  }
  return c.notFound();
});

// Serve static assets from the dist directory first (built files)
app.get('/static/*', async (c) => {
  try {
    const path = c.req.path;
    const filePath = join(distDir, path);
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return c.body(Bun.file(filePath));
    }
    
    // Fallback to public directory
    const publicFilePath = join(publicDir, path);
    if (fs.existsSync(publicFilePath) && fs.statSync(publicFilePath).isFile()) {
      return c.body(Bun.file(publicFilePath));
    }
    
    return c.notFound();
  } catch (error) {
    console.error('Error serving static asset:', error);
    return c.notFound();
  }
});

// For any other routes, serve the index.html for client-side routing
app.get('*', (c) => {
  try {
    // For all other routes, serve index.html for client-side routing
    const indexPath = join(distDir, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      console.log(`Serving index.html for path: ${c.req.path}`);
      
      // Read the HTML content
      let htmlContent = fs.readFileSync(indexPath, 'utf-8');
      
      // Add the script tag if it doesn't exist
      if (!htmlContent.includes('<script src="/index.js"></script>')) {
        htmlContent = htmlContent.replace('</body>', '<script src="/index.js"></script>\n</body>');
      }
      
      return c.body(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        }
      });
    } else {
      console.error('index.html not found in dist directory');
      return c.text('Error: index.html not found', 500);
    }
  } catch (error) {
    console.error('Error serving index.html:', error);
    return c.text('Server Error', 500);
  }
});

console.log(`Frontend server starting on port ${port}...`);

export default {
  port,
  fetch: app.fetch
};
