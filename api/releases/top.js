// Serverless API handler for fetching top releases
const { addCorsHeaders, logResponse } = require('../utils/db-utils');
const { getTopReleases } = require('../utils/supabase-client');

// Handler for GET /api/releases/top
async function getTopReleasesHandler(req, res) {
  // Add CORS headers
  addCorsHeaders(res);

  // Get query parameters
  const { label, limit = 10 } = req.query;
  const labelId = label; // For clarity
  
  // Log the request
  console.log(`[/api/releases/top] Fetching top releases with params: label=${labelId}, limit=${limit}`);
  
  try {
    // Try using Supabase client to fetch top releases
    console.log('[/api/releases/top] Using Supabase client for fetching top releases');
    
    const topReleases = await getTopReleases({ labelId, limit: parseInt(limit) });
    
    const response = {
      releases: topReleases || [],
      meta: {
        count: topReleases ? topReleases.length : 0,
        source: 'supabase-client',
        timestamp: new Date().toISOString(),
        params: { label: labelId, limit }
      }
    };
    
    logResponse(response, '/api/releases/top');
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('[/api/releases/top] Error fetching top releases:', error);
    
    // Return a 500 error with detailed information
    return res.status(500).json({
      error: 'Failed to fetch top releases',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Export the handler
module.exports = getTopReleasesHandler;
