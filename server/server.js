// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const models = require('./models');
const SpotifyService = require('./services/SpotifyService');
const apiRoutes = require('./routes/api.routes');
const healthCheckRoutes = require('./routes/health-check');

const app = express();
const PORT = process.env.PORT || 3001;

// Debug logging for Vercel environment
console.log('Starting server with environment configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  hasDbConnectionString: !!process.env.POSTGRES_URL,
  hasDbCredentials: !!(process.env.DB_USER && process.env.DB_PASSWORD),
  host: process.env.DB_HOST || process.env.POSTGRES_HOST,
  port: process.env.DB_PORT || '(using connection string)',
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://builditrecords.com', 'https://www.builditrecords.com', /.vercel\.app$/] 
    : '*',
  credentials: true,
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health Check Route - must be before API routes
app.use('/api', healthCheckRoutes);

// API Routes
app.use('/api', apiRoutes);

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  // Serve static assets from /dist directory for Vite builds
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
} else {
  app.use(express.static(path.join(__dirname, '../build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Error handling middleware - enhanced with more details
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  console.error('Error stack:', err.stack);
  console.error('Request information:', {
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
  });
  
  res.status(500).json({ 
    success: false,
    message: 'Something broke!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Connect to database and start server
try {
  console.log('Starting server...');
  // Check if we're in Vercel environment
  if (process.env.VERCEL) {
    console.log('Running in Vercel environment, skipping Sequelize sync');
    // Test DB connection explicitly
    models.sequelize.authenticate()
      .then(() => {
        console.log('Database connection successful in Vercel environment');
        app.listen(PORT, () => {
          console.log(`Server is running on port ${PORT}`);
        });
      })
      .catch(err => {
        console.error('Database connection failed in Vercel environment:', err);
        // Start server anyway so we can serve error responses
        app.listen(PORT, () => {
          console.log(`Server is running on port ${PORT} (without database)`);
        });
      });
  } else {
    // Regular database initialization
    models.sequelize.sync()
      .then(() => {
        app.listen(PORT, () => {
          console.log(`Server is running on port ${PORT}`);
        });
      })
      .catch(err => {
        console.error('Unable to connect to the database:', err);
      });
  }
} catch (error) {
  console.error('Server initialization error:', error);
}
