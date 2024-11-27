require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const tracksRouter = require('./server/routes/tracks');
const { router: adminRouter } = require('./server/routes/admin');
const trackManagementRouter = require('./server/routes/trackManagement');

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://builditrecords.com',
      'https://www.builditrecords.com',
      'https://admin.builditrecords.com'
    ];
    
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Helmet CSP
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://cdn.emailjs.com",
        "http://localhost:3000",
        "ws://localhost:3000",
        "https://open.spotify.com",
        "https://api.spotify.com"
      ],
      connectSrc: [
        "'self'",
        "http://localhost:3000",
        "ws://localhost:3000",
        "https://api.spotify.com"
      ],
      imgSrc: [
        "'self'",
        "https://i.scdn.co",
        "data:",
        "blob:"
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
      mediaSrc: ["'self'", "https://p.scdn.co"],
      frameSrc: ["'self'", "https://open.spotify.com"]
    }
  })
);

// Domain-based routing
app.use((req, res, next) => {
  const host = req.get('host');
  
  // Local development
  if (host.includes('localhost')) {
    next();
    return;
  }
  
  // Admin subdomain
  if (host.startsWith('admin.')) {
    // Only allow admin routes on admin subdomain
    if (!req.path.startsWith('/api/admin') && !req.path.startsWith('/api/track-management')) {
      res.sendFile(path.join(__dirname, 'build', 'index.html'));
      return;
    }
  }
  
  next();
});

// API routes
app.use('/api/tracks', tracksRouter);
app.use('/api/admin', adminRouter);
app.use('/api/track-management', trackManagementRouter);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
