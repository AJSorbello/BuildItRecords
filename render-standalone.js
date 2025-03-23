// Simplified standalone server for Render deployment
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { getSupabase, getSupabaseAdmin } = require('./utils/database');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Enhanced CORS configuration
const corsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Create Supabase client instances
let supabase, supabaseAdmin;
try {
  supabase = getSupabase();
  supabaseAdmin = getSupabaseAdmin();
  console.log('✅ Supabase client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error.message);
}

// Store Supabase clients in app.locals for access in route handlers
app.locals.supabase = supabase;
app.locals.supabaseAdmin = supabaseAdmin;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Request logging

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Timeout middleware for long-running queries
const timeoutMiddleware = (req, res, next) => {
  // Set a default timeout of 25 seconds
  const timeout = 25000;
  
  // Create a timeout that will send a 503 if the request takes too long
  const timeoutId = setTimeout(() => {
    console.error(`Request timeout for ${req.method} ${req.originalUrl}`);
    res.status(503).json({
      success: false,
      message: 'Request timed out',
      timeout: timeout,
      path: req.originalUrl
    });
  }, timeout);
  
  // Clear the timeout when the response is sent
  res.on('finish', () => {
    clearTimeout(timeoutId);
  });
  
  next();
};

// Apply timeout middleware to all API routes
app.use('/api', timeoutMiddleware);

// Health check endpoints (required by Render) - MUST BE DEFINED BEFORE ANY OTHER ROUTES
app.get('/health', (req, res) => {
  console.log('Health check received at /health');
  res.status(200).json({ 
    status: 'ok',
    time: new Date().toISOString(),
    message: 'BuildItRecords API is running'
  });
});

app.get('/healthz', (req, res) => {
  console.log('Health check received at /healthz');
  res.status(200).json({ 
    status: 'ok',
    time: new Date().toISOString(),
    message: 'BuildItRecords API is running'
  });
});

// Root path handler
app.get('/', (req, res) => {
  console.log('Request received at root path');
  res.status(200).json({
    status: 'online',
    message: 'BuildItRecords API is running',
    version: '0.1.1',
    endpoints: [
      '/health',
      '/healthz',
      '/api/supabase-status',
      '/api/artists', '/api/artist',
      '/api/artists/:id', '/api/artist/:id',
      '/api/releases', '/api/release',
      '/api/releases/:id', '/api/release/:id',
      '/api/artist-releases/:id'
    ]
  });
});

// Add Supabase status endpoint
app.get('/api/supabase-status', async (req, res) => {
  try {
    // Check if Supabase clients are initialized
    if (!supabase || !supabaseAdmin) {
      return res.status(500).json({
        success: false,
        message: 'Supabase clients not properly initialized',
        env: {
          SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Not set',
          SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set',
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'
        }
      });
    }

    // Test query - get a small sample of data
    const [artistsResponse, labelsResponse, releasesResponse] = await Promise.allSettled([
      supabase.from('artists').select('id, name').limit(1),
      supabase.from('labels').select('id, name').limit(1),
      supabase.from('releases').select('id, title').limit(1)
    ]);

    // Collect test results
    const testResults = {
      artists: artistsResponse.status === 'fulfilled' 
        ? (artistsResponse.value.error ? `Error: ${artistsResponse.value.error.message}` : 'Success') 
        : 'Failed',
      labels: labelsResponse.status === 'fulfilled' 
        ? (labelsResponse.value.error ? `Error: ${labelsResponse.value.error.message}` : 'Success') 
        : 'Failed',
      releases: releasesResponse.status === 'fulfilled' 
        ? (releasesResponse.value.error ? `Error: ${releasesResponse.value.error.message}` : 'Success') 
        : 'Failed'
    };

    // Include samples of data if successful
    const samples = {};
    if (artistsResponse.status === 'fulfilled' && !artistsResponse.value.error) {
      samples.artists = artistsResponse.value.data;
    }
    if (labelsResponse.status === 'fulfilled' && !labelsResponse.value.error) {
      samples.labels = labelsResponse.value.data;
    }
    if (releasesResponse.status === 'fulfilled' && !releasesResponse.value.error) {
      samples.releases = releasesResponse.value.data;
    }

    res.status(200).json({
      success: true,
      message: 'Supabase connection status',
      environment: process.env.NODE_ENV,
      testResults,
      samples
    });
  } catch (error) {
    console.error(`Error checking Supabase status: ${error.message}`);
    res.status(500).json({
      success: false,
      message: `Error checking Supabase status: ${error.message}`
    });
  }
});

// Import route modules
const artistReleasesRouter = require('./routes/artist-releases');

// Mount API routes
// 1. API Routes at /api path (for compatibility with frontend requests)
app.use('/api/artist-releases', artistReleasesRouter);

// Helper function for safe database queries
const safeDbQuery = async (queryFn, fallbackData = [], errorMessage = 'Database query error') => {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      console.error(`[SafeDbQuery] ${errorMessage}:`, error.message);
      return { success: false, data: fallbackData, error: error.message };
    }
    
    return { success: true, data, error: null };
  } catch (err) {
    console.error(`[SafeDbQuery] Exception in query:`, err.message);
    return { success: false, data: fallbackData, error: err.message };
  }
};

// Simplified API for common endpoints - SUPPORTING BOTH SINGULAR AND PLURAL FORMS

// Artists endpoints (both /api/artists and /api/artist)
const handleArtistsRequest = async (req, res) => {
  try {
    const labelId = req.query.label;
    let query = supabase.from('artists').select('*');
    
    // Filter by label if provided
    if (labelId) {
      query = query.eq('label_id', labelId);
    }
    
    const result = await safeDbQuery(
      () => query,
      [],
      `Error fetching artists${labelId ? ` for label ${labelId}` : ''}`
    );
    
    if (!result.success) {
      return res.status(200).json({
        success: false,
        message: result.error,
        data: []
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error(`Error in artists request handler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: error.message,
      data: []
    });
  }
};

// Artist by ID endpoints (both /api/artists/:id and /api/artist/:id)
const handleArtistByIdRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Fetching artist with ID: ${id}`);
    
    const result = await safeDbQuery(
      () => supabase.from('artists').select('*').eq('id', id).single(),
      null,
      `Error fetching artist with ID ${id}`
    );
    
    if (!result.success) {
      return res.status(200).json({
        success: false,
        message: result.error,
        data: null
      });
    }
    
    if (!result.data) {
      return res.status(200).json({
        success: false,
        message: `Artist with ID ${id} not found`,
        data: null
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error(`Error in artist-by-id request handler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// Releases endpoints (both /api/releases and /api/release)
const handleReleasesRequest = async (req, res) => {
  try {
    // Check if label parameter is present
    const { label } = req.query;
    
    // Create the base query for releases
    let query = supabase
      .from('releases')
      .select(`
        *,
        artist:release_artists(
          artist:artist_id(id, name, image_url, spotify_url)
        )
      `)
      .order('release_date', { ascending: false }); // Sort releases by date, newest first
    
    // Add label filter if the label parameter is present
    if (label) {
      console.log(`Filtering releases by label: ${label}`);
      
      // Handle different label name formats
      if (label === 'tech' || label === 'buildit-tech') {
        query = query.eq('label_id', 3);
      } else if (label === 'deep' || label === 'buildit-deep') {
        query = query.eq('label_id', 2);
      } else if (label === 'buildit-records' || label === 'records') {
        query = query.eq('label_id', 1);
      } else if (!isNaN(label)) {
        // If label is a number, use it directly
        query = query.eq('label_id', parseInt(label, 10));
      }
    }
    
    const result = await safeDbQuery(
      () => query,
      [],
      'Error fetching releases'
    );
    
    if (!result.success) {
      return res.status(200).json({
        success: false,
        message: result.error,
        data: []
      });
    }
    
    // Process the result to format artists correctly
    const processedReleases = result.data.map(release => {
      // Extract artists from the nested structure
      const artists = release.artist 
        ? release.artist.map(item => item.artist).filter(artist => artist !== null)
        : [];
      
      // Sort artists alphabetically by name
      const sortedArtists = artists.sort((a, b) => {
        if (a.name && b.name) {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
      
      // Return the release with artists in the expected format
      return {
        ...release,
        artists: sortedArtists
      };
    });
    
    return res.status(200).json({
      success: true,
      data: processedReleases
    });
  } catch (error) {
    console.error(`Error in releases request handler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: error.message,
      data: []
    });
  }
};

// Release by ID endpoints (both /api/releases/:id and /api/release/:id)
const handleReleaseByIdRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Fetching release with ID: ${id}`);
    
    // First get the release information with artists
    const releaseResult = await safeDbQuery(
      () => supabase
        .from('releases')
        .select(`
          *,
          artist:release_artists(
            artist:artist_id(id, name, image_url, spotify_url)
          )
        `)
        .eq('id', id)
        .single(),
      null,
      `Error fetching release with ID ${id}`
    );
    
    if (!releaseResult.success || !releaseResult.data) {
      return res.status(200).json({
        success: false,
        message: releaseResult.error || `Release with ID ${id} not found`,
        data: null
      });
    }
    
    // Process single release to sort artists alphabetically
    if (releaseResult.success && releaseResult.data && releaseResult.data.artist) {
      const artists = releaseResult.data.artist
        .map(item => item.artist)
        .filter(artist => artist !== null);
      
      // Sort artists alphabetically
      const sortedArtists = artists.sort((a, b) => {
        if (a.name && b.name) {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
      
      releaseResult.data.artists = sortedArtists;
    }
    
    // Get tracks for this release with their artists
    const tracksResult = await safeDbQuery(
      () => supabase
        .from('tracks')
        .select(`
          *,
          artist:track_artists(
            artist:artist_id(id, name, image_url, spotify_url)
          )
        `)
        .eq('release_id', id)
        .order('track_number', { ascending: true }),
      null,
      `Error fetching tracks for release ${id}`
    );
    
    // Process the result to format artists correctly for the release
    const processedRelease = {
      ...releaseResult.data,
      artists: releaseResult.data.artist 
        ? releaseResult.data.artist.map(item => item.artist).filter(artist => artist !== null)
        : []
    };
    
    // Process tracks to format their artists correctly
    const processedTracks = tracksResult.success 
      ? tracksResult.data.map(track => {
          return {
            ...track,
            artists: track.artist 
              ? track.artist.map(item => item.artist).filter(artist => artist !== null)
              : []
          };
        })
      : [];
    
    // Combine the data
    const releaseData = {
      ...processedRelease,
      tracks: processedTracks
    };
    
    return res.status(200).json({
      success: true,
      data: releaseData
    });
  } catch (error) {
    console.error(`Error in release-by-id request handler: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// Register routes for both plural and singular forms
app.get('/api/artists', handleArtistsRequest);
app.get('/api/artist', handleArtistsRequest);
app.get('/api/artists/:id', handleArtistByIdRequest);
app.get('/api/artist/:id', handleArtistByIdRequest);
app.get('/api/releases', handleReleasesRequest);
app.get('/api/release', handleReleasesRequest);
app.get('/api/releases/:id', handleReleaseByIdRequest);
app.get('/api/release/:id', handleReleaseByIdRequest);

// Enhanced diagnostic endpoint
app.get('/api/diagnostic', (req, res) => {
  const diagnosticInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    processUptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    platform: process.platform,
    hostname: require('os').hostname(),
    cpuInfo: require('os').cpus(),
    networkInterfaces: require('os').networkInterfaces(),
    envVars: {
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV,
      // Don't expose sensitive information
      SUPABASE_URL: process.env.SUPABASE_URL ? '[REDACTED]' : 'not set',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '[REDACTED]' : 'not set',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '[REDACTED]' : 'not set',
      CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
    }
  };
  
  res.status(200).json({
    success: true,
    message: 'API diagnostic information',
    data: diagnosticInfo
  });
});

// Handle 404 - Keep this as the last route
app.use((req, res) => {
  console.error(`404 - Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BuildItRecords API Server running on port ${PORT} and listening on all interfaces (0.0.0.0)`);
  console.log(`✅ Health check endpoints available at /health and /healthz`);
  console.log(`📝 API supports both singular and plural endpoints (e.g., /api/artist and /api/artists)`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error processing ${req.method} ${req.url}:`, err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
