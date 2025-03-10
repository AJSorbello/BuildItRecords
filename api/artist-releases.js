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
    // Extract artist ID from URL path or query parameters
    // The URL format would be /api/artist-releases/[artistId] or with a query param ?id=[artistId]
    let artistId;
    
    // First check if we have it in the query parameters
    if (req.query && req.query.id) {
      artistId = req.query.id;
    } else {
      // Otherwise extract from the URL path
      const pathParts = req.url.split('/');
      const lastSegment = pathParts.pop() || '';
      // Remove any query string that might be attached
      artistId = lastSegment.split('?')[0];
    }
    
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
        console.log(`[artist-releases] Approach 1: Checking release_artists join table for artist ${artistId}`);
        const { data: releaseLinks, error: linkError } = await supabase
          .from('release_artists')
          .select('release_id')
          .eq('artist_id', artistId);
          
        if (linkError) {
          console.error(`[artist-releases] Error in release_artists query: ${linkError.message}`);
        }
          
        if (!linkError && releaseLinks && releaseLinks.length > 0) {
          console.log(`[artist-releases] Found ${releaseLinks.length} release associations for artist ${artistId}`);
          
          // Get unique release IDs
          const releaseIds = [...new Set(releaseLinks.map(link => link.release_id))];
          
          // Get releases in batches to avoid query size limits
          for (let i = 0; i < releaseIds.length; i += 10) {
            const batch = releaseIds.slice(i, i + 10);
            const { data: batchData, error: batchError } = await supabase
              .from('releases')
              .select('*')
              .in('id', batch);
              
            if (batchError) {
              console.error(`[artist-releases] Error in batch releases query: ${batchError.message}`);
            }
              
            if (batchData && batchData.length > 0) {
              releases.push(...batchData);
            }
          }
        } else {
          console.log(`[artist-releases] No release associations found in release_artists for artist ${artistId}`);
        }
      } catch (e) {
        console.error(`[artist-releases] Error with release_artists approach: ${e.message}`);
      }
      
      // APPROACH 2: Try direct artist_id field on releases (if previous approach didn't find anything)
      if (releases.length === 0) {
        try {
          console.log(`[artist-releases] Approach 2: Checking releases.artist_id for artist ${artistId}`);
          // Use the query builder for this straightforward query
          const { data: directReleases, error: directError } = await supabase
            .from('releases')
            .select('*')
            .eq('artist_id', artistId)
            .order('release_date', { ascending: false });
            
          if (directError) {
            console.error(`[artist-releases] Error in direct releases query: ${directError.message}`);
          }
            
          if (!directError && directReleases && directReleases.length > 0) {
            console.log(`[artist-releases] Found ${directReleases.length} releases directly for artist ${artistId}`);
            releases.push(...directReleases);
          } else {
            console.log(`[artist-releases] No releases found directly for artist ${artistId}`);
          }
        } catch (e) {
          console.error(`[artist-releases] Error with direct artist_id approach: ${e.message}`);
        }
      }
      
      // APPROACH 3: Try using an RPC function call
      if (releases.length === 0) {
        try {
          console.log(`[artist-releases] Approach 3: Using RPC function for artist ${artistId}`);
          
          // Try to call a stored function - this requires the function to be created in Supabase
          const { data: rpcReleases, error: rpcError } = await supabase
            .rpc('get_artist_releases', { artist_id_param: artistId });
            
          if (rpcError) {
            console.error(`[artist-releases] Error in RPC call: ${rpcError.message}`);
          }
            
          if (!rpcError && rpcReleases && rpcReleases.length > 0) {
            console.log(`[artist-releases] Found ${rpcReleases.length} releases via RPC for artist ${artistId}`);
            releases.push(...rpcReleases);
          } else {
            console.log(`[artist-releases] No releases found via RPC for artist ${artistId}`);
          }
        } catch (e) {
          console.error(`[artist-releases] Error with RPC approach: ${e.message}`);
        }
      }
      
      // APPROACH 4: Manual LIKE query as a last resort
      if (releases.length === 0) {
        try {
          console.log(`[artist-releases] Approach 4: Using LIKE query on releases.title for artist name`);
          
          // Get the artist name first
          const { data: artistData, error: artistError } = await supabase
            .from('artists')
            .select('name')
            .eq('id', artistId)
            .single();
            
          if (artistError) {
            console.error(`[artist-releases] Error getting artist name: ${artistError.message}`);
          }
          
          if (artistData && artistData.name) {
            // Try to find releases that have the artist's name in the title
            const { data: namedReleases, error: namedError } = await supabase
              .from('releases')
              .select('*')
              .ilike('title', `%${artistData.name}%`);
              
            if (namedError) {
              console.error(`[artist-releases] Error in name LIKE query: ${namedError.message}`);
            }
            
            if (!namedError && namedReleases && namedReleases.length > 0) {
              console.log(`[artist-releases] Found ${namedReleases.length} releases via name LIKE for artist ${artistId}`);
              releases.push(...namedReleases);
            } else {
              console.log(`[artist-releases] No releases found via name LIKE for artist ${artistId}`);
            }
          }
        } catch (e) {
          console.error(`[artist-releases] Error with name LIKE approach: ${e.message}`);
        }
      }
      
      console.log(`[artist-releases] Final result: Found ${releases.length} releases for artist ${artistId}`);
      
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
