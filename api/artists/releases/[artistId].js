// Serverless API handler for fetching all releases by an artist
const { addCorsHeaders } = require('../../utils/db-utils');
const supabaseClient = require('../../utils/supabase-client');

module.exports = async (req, res) => {
  // Add CORS headers
  addCorsHeaders(res);
  
  // Get artist ID from the URL
  const { artistId } = req.query;
  
  if (!artistId) {
    return res.status(400).json({ error: 'Missing artist ID parameter' });
  }
  
  console.log(`Fetching releases for artist with ID: ${artistId}`);
  
  try {
    // Use getReleasesByArtist function from the supabase client
    const releases = await supabaseClient.getReleasesByArtist({ artistId });
    
    // Format and return the response
    const response = {
      releases: releases,
      meta: {
        count: releases.length,
        artist_id: artistId,
        timestamp: new Date().toISOString()
      }
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching releases for artist:', error);
    return res.status(500).json({
      error: 'Error fetching releases',
      details: error.message,
      artist_id: artistId
    });
  }
};
