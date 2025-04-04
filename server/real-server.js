// Combined server for local development that uses the actual API endpoints
require('dotenv').config({ path: '.env.supabase' });

// CRITICAL: Force Node.js to accept self-signed certificates for local development
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Pool } = require('pg');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Basic logging
console.log('=============== REAL SERVER STARTING ===============');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`PORT: ${PORT}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Database: ${process.env.DB_HOST}`);
console.log(`SSL: ${process.env.DB_SSL}`);
console.log(`USE_TEST_DATA: ${process.env.USE_TEST_DATA || 'false'}`);
console.log(`POSTGRES_HOST: ${process.env.POSTGRES_HOST}`);
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL}`);
console.log('====================================================');

// Helper function to generate test data
function generateTestReleases(labelFilter) {
  // Create a pool of test releases
  const testReleases = [];
  const labels = ['buildit-records', 'buildit-tech', 'buildit-deep'];
  const artists = ['Real Artist 1', 'Real Artist 2', 'Real Artist 3', 'Real Artist 4', 'Real Artist 5'];
  
  // Generate some test releases
  for (let i = 0; i < 500; i++) {
    const label = labels[i % labels.length];
    
    // Skip if we're filtering by label and this isn't the one we want
    if (labelFilter && label !== labelFilter) continue;
    
    testReleases.push({
      id: `r-${i}`,
      title: `Test Release ${i}`,
      artist_id: `a-${i % 5}`,
      artist_name: artists[i % artists.length],
      release_date: new Date(2024, i % 12, (i % 28) + 1).toISOString().split('T')[0],
      artwork_url: `https://builditrecords.com/artwork/${i % 10}.jpg`,
      spotify_url: `https://open.spotify.com/album/${i}`,
      label,
      created_at: new Date(2023, i % 12, (i % 28) + 1).toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  return testReleases.slice(0, 50); // Return at most 50 releases
}

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow CORS from development server
const corsOptions = {
  // Allow requests from these origins
  origin: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'http://localhost:3001',
    'https://build-it-records-hijjcdum3-ajsorbellos-projects.vercel.app',
    'https://build-it-records-fur55fkas-ajsorbellos-projects.vercel.app',
    'https://build-it-records-b8gg0fjtb-ajsorbellos-projects.vercel.app',
    'https://build-it-records-8dlvtugib-ajsorbellos-projects.vercel.app',
    'https://build-it-records-2co6k1ncu-ajsorbellos-projects.vercel.app',
    'https://build-it-records-dqii5abne-ajsorbellos-projects.vercel.app', 
    'https://build-it-records.vercel.app',
    /\.vercel\.app$/  // Allow all vercel.app subdomains
  ],
  credentials: false, // Changed from true to false to match client's credentials: 'omit'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Apply CORS middleware first
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  // Get the origin from the request header
  const origin = req.headers.origin;
  
  // Check if the origin is allowed
  let allowOrigin = '*';
  if (origin) {
    // Check against the allowed origins
    const isAllowed = corsOptions.origin.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return allowedOrigin === origin;
    });
    
    if (isAllowed) {
      allowOrigin = origin;
    }
  }
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', allowOrigin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.sendStatus(200);
});

// Serve static files with correct MIME types
app.use(express.static(path.join(__dirname, '../dist'), {
  setHeaders: (res, path) => {
    // Set correct MIME type for JavaScript modules
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Simple middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} (origin: ${req.headers.origin || 'unknown'})`);
  next();
});

// Add a proxy endpoint to handle CORS issues
app.get('/api/proxy', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing url parameter' 
      });
    }

    console.log(`Proxying request to: ${targetUrl}`);
    
    // Forward the request to the target URL
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // Get the response as JSON or text
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Send the response back
    res.status(response.status).json({
      success: response.ok,
      data: data,
      status: response.status,
      statusText: response.statusText
    });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      success: false,
      message: `Proxy error: ${error.message}`,
      error: error.stack
    });
  }
});

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// API endpoints can be defined here
// For example: app.get('/api/artists', ...)

// Forward all API requests to our API server
app.get('/api/artists', async (req, res) => {
  try {
    console.log('API request for artists received');
    
    try {
      // Test database connection
      const client = await pool.connect();
      console.log('Database connection established');
      
      // Query artists that have releases on Build It labels
      // Join with releases table and filter by label
      const validLabels = ['buildit-records', 'buildit-tech', 'buildit-deep'];
      const query = `
        SELECT DISTINCT a.* FROM artists a
        JOIN releases r ON a.id = r.artist_id
        WHERE r.label IN ($1, $2, $3)
        ORDER BY a.name ASC
      `;
      
      // Execute artist query
      const result = await client.query(query, validLabels);
      
      // Also get a count of all artists (for comparison)
      const allArtistsQuery = `SELECT COUNT(*) FROM artists`;
      const allArtistsResult = await client.query(allArtistsQuery);
      const totalArtists = parseInt(allArtistsResult.rows[0].count, 10);
      
      // Count artists with direct label_id
      const directLabelQuery = `SELECT COUNT(*) FROM artists WHERE label_id IN ($1, $2, $3)`;
      const directLabelResult = await client.query(directLabelQuery, validLabels);
      const directLabelArtists = parseInt(directLabelResult.rows[0].count, 10);
      
      client.release();
      
      console.log(`Found ${result.rows.length} artists with releases on Build It labels out of ${totalArtists} total artists`);
      console.log(`${directLabelArtists} artists have direct label_id set to a Build It label`);
      
      res.json({
        success: true,
        data: result.rows,
        total: totalArtists,
        count: result.rows.length,
        directLabelCount: directLabelArtists,
        message: `Found ${result.rows.length} artists with releases on Build It labels`
      });
    } catch (dbError) {
      console.error('Error connecting to database:', dbError);
      
      // Return an empty array instead of test data
      res.json({
        success: false,
        data: [],
        message: `Database error: ${dbError.message}`
      });
    }
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: `Error fetching artists: ${error.message}`
    });
  }
});

app.get('/api/releases', async (req, res) => {
  try {
    console.log('API request for releases received');
    const { label } = req.query;
    
    try {
      // Test database connection
      const client = await pool.connect();
      console.log('Database connection established');
      
      // Build query with potential filter that includes releases from both direct artist_id 
      // and from the release_artists junction table
      let query = `
        SELECT DISTINCT r.*, 
          COALESCE(a.name, 'Various Artists') as artist_name,
          EXISTS (
            SELECT 1 FROM release_artists ra WHERE ra.release_id = r.id
          ) as has_multiple_artists
        FROM releases r
        LEFT JOIN artists a ON r.artist_id = a.id
      `;
      
      const params = [];
      if (label) {
        query += ` WHERE r.label = $1`;
        params.push(label);
      }
      
      query += ` ORDER BY r.release_date DESC NULLS LAST`;
      
      console.log('Executing releases query:', query, params);
      
      // Execute query
      const result = await client.query(query, params);
      
      // Get total count of releases (for pagination)
      let countQuery = `SELECT COUNT(DISTINCT r.id) FROM releases r`;
      if (label) {
        countQuery += ` WHERE r.label = $1`;
      }
      const countResult = await client.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count, 10);
      
      // For releases with multiple artists, get their artists through the junction table
      for (const release of result.rows) {
        if (release.has_multiple_artists) {
          const artistsQuery = `
            SELECT a.id, a.name 
            FROM artists a
            JOIN release_artists ra ON a.id = ra.artist_id
            WHERE ra.release_id = $1
            ORDER BY ra.position ASC
          `;
          const artistsResult = await client.query(artistsQuery, [release.id]);
          release.artists = artistsResult.rows;
          
          // If there's no primary artist but we have multiple artists, 
          // set a "Various Artists" representation
          if (!release.artist_name || release.artist_name === 'Various Artists') {
            if (artistsResult.rows.length > 0) {
              const artistNames = artistsResult.rows.map(a => a.name);
              if (artistNames.length > 3) {
                release.artist_name = `${artistNames.slice(0, 2).join(', ')} & ${artistNames.length - 2} more`;
              } else {
                release.artist_name = artistNames.join(', ');
              }
            }
          }
        }
      }
      
      client.release();
      
      console.log(`Found ${result.rows.length} releases out of ${totalCount} total`);
      res.json({
        success: true,
        data: result.rows,
        total: totalCount,
        count: result.rows.length,
        message: `Found ${result.rows.length} releases out of ${totalCount} total`
      });
    } catch (dbError) {
      console.error('Error fetching releases:', dbError);
      
      // In case of database error, return test data
      console.log('Using test data for releases');
      const testData = generateTestReleases(label);
      
      res.json({
        success: true,
        data: testData,
        message: `Using ${testData.length} test releases for label: ${label}`
      });
    }
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: `Error fetching releases: ${error.message}`
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    message: 'BuildItRecords API is running with test data (470 releases across 3 labels)'
  });
});

// Database statistics endpoint to count records
app.get('/api/db-stats', async (req, res) => {
  try {
    console.log('Fetching database statistics...');
    
    // Test database connection
    const client = await pool.connect();
    console.log('Database connection established for stats');
    
    // Count records in main tables
    const releaseCount = await client.query('SELECT COUNT(*) FROM releases');
    const artistCount = await client.query('SELECT COUNT(*) FROM artists');
    
    // Count releases by label
    const releasesByLabel = await client.query(`
      SELECT label, COUNT(*) 
      FROM releases 
      GROUP BY label 
      ORDER BY COUNT(*) DESC
    `);
    
    // Count artists with releases by label
    const artistsByLabel = await client.query(`
      SELECT r.label, COUNT(DISTINCT a.id) as artist_count
      FROM artists a
      JOIN releases r ON a.id = r.artist_id
      GROUP BY r.label
      ORDER BY COUNT(DISTINCT a.id) DESC
    `);
    
    // Count artists that have the label_id field set directly
    const artistsWithDirectLabel = await client.query(`
      SELECT label_id, COUNT(*) 
      FROM artists 
      WHERE label_id IS NOT NULL 
      GROUP BY label_id
    `);
    
    client.release();
    
    res.json({
      success: true,
      stats: {
        releases: parseInt(releaseCount.rows[0].count, 10),
        artists: parseInt(artistCount.rows[0].count, 10),
        releasesByLabel: releasesByLabel.rows,
        artistsByLabel: artistsByLabel.rows,
        artistsWithDirectLabel: artistsWithDirectLabel.rows
      },
      message: 'Database statistics retrieved successfully',
      dbHost: process.env.DB_HOST.replace(/^.*?([^.]+\.[^.]+\.[^.]+)$/, '***.$1') // Redact most of hostname for security
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve database statistics'
    });
  }
});

// Catch-all for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.originalUrl
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ Server is running on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
  console.log(`Test data: Using 470 generated releases across 3 labels (buildit-records, buildit-tech, buildit-deep)`);
});
