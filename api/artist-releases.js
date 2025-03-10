// Dedicated endpoint for artist releases to avoid the "JSON object requested, multiple rows returned" error
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

// Initialize middleware
const corsMiddleware = cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Handler for the API route
module.exports = async (req, res) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return corsMiddleware(req, res, () => {
      res.status(200).end();
    });
  }

  // Apply CORS headers for actual requests
  corsMiddleware(req, res, async () => {
    // Extract artist ID from URL path
    // The URL format would be /api/artist-releases/[artistId]
    const artistId = req.url.split('/').pop();
    
    if (!artistId) {
      return res.status(200).json({
        success: false,
        message: 'Artist ID is required',
        data: []
      });
    }
    
    console.log(`Processing artist releases request for artist ID: ${artistId}`);
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 
                        process.env.VITE_SUPABASE_URL || 
                        process.env.NEXT_PUBLIC_SUPABASE_URL;
                        
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                        process.env.VITE_SUPABASE_ANON_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({
        success: false,
        message: 'Supabase configuration missing',
        data: []
      });
    }
    
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const releases = [];
      
      // APPROACH 1: Try using the release_artists join table
      try {
        const { data: releaseLinks, error: linkError } = await supabase
          .from('release_artists')
          .select('release_id')
          .eq('artist_id', artistId);
          
        if (!linkError && releaseLinks && releaseLinks.length > 0) {
          console.log(`Found ${releaseLinks.length} release associations for artist ${artistId}`);
          
          // Get unique release IDs
          const releaseIds = [...new Set(releaseLinks.map(link => link.release_id))];
          
          // Get releases in batches to avoid query size limits
          for (let i = 0; i < releaseIds.length; i += 10) {
            const batch = releaseIds.slice(i, i + 10);
            const { data: batchData } = await supabase
              .from('releases')
              .select('*')
              .in('id', batch);
              
            if (batchData && batchData.length > 0) {
              releases.push(...batchData);
            }
          }
        }
      } catch (e) {
        console.error(`Error with release_artists approach: ${e.message}`);
      }
      
      // APPROACH 2: Try direct artist_id field on releases (if previous approach didn't find anything)
      if (releases.length === 0) {
        try {
          // Use the query builder for this straightforward query
          const { data: directReleases, error: directError } = await supabase
            .from('releases')
            .select('*')
            .eq('artist_id', artistId)
            .order('release_date', { ascending: false });
            
          if (!directError && directReleases && directReleases.length > 0) {
            releases.push(...directReleases);
          }
        } catch (e) {
          console.error(`Error with direct artist_id approach: ${e.message}`);
        }
      }
      
      console.log(`Found ${releases.length} releases for artist ${artistId}`);
      
      return res.status(200).json({
        success: true,
        message: `Found ${releases.length} releases for artist ${artistId}`,
        data: releases
      });
    } catch (error) {
      console.error(`Error in artist-releases endpoint: ${error.message}`);
      // Always return 200 with an empty array instead of a 500 error
      return res.status(200).json({
        success: false,
        message: `Error fetching artist releases: ${error.message}`,
        data: []
      });
    }
  });
};
