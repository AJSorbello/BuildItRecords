const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Add CORS and security headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
      ? 'https://builditrecords.com'
      : 'http://localhost:3000'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "connect-src 'self' http://localhost:3000 http://localhost:3001 https://api.spotify.com https://accounts.spotify.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "frame-src 'self' https://accounts.spotify.com; " +
      "form-action 'self';"
    );
    next();
  });

  // Proxy middleware configuration
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    pathRewrite: {
      '^/api': '', // Remove /api prefix when forwarding to the target
    },
    onError: (err, req, res) => {
      console.error('Proxy Error:', err);
      res.writeHead(500, {
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify({ error: 'Proxy Error', details: err.message }));
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log('Proxying request:', {
        method: req.method,
        path: req.path,
        targetUrl: `${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
      });
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('Proxy response:', {
        status: proxyRes.statusCode,
        headers: proxyRes.headers,
        path: req.path,
      });
    },
  });

  // Apply proxy middleware to /api routes
  app.use('/api', apiProxy);
};
