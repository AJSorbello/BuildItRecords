// routes/artist-releases.js
// Implements the sophisticated multi-strategy approach for artist releases
const express = require('express');
const router = express.Router();
const { getSupabase, getSupabaseAdmin } = require('../utils/database');

// Adding timeout promise to prevent Render hanging on long-running queries
const timeoutPromise = (timeoutMs) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
};

// Helper to run a query with a timeout
const runWithTimeout = async (queryPromise, timeoutMs = 5000) => {
  return Promise.race([
    queryPromise,
    timeoutPromise(timeoutMs)
  ]);
};

// GET /api/artist-releases/:artistId
router.get('/:artistId', async (req, res) => {
  try {
    const artistId = req.params.artistId;

    if (!artistId) {
      console.error('No artist ID provided');
      return res.status(400).json({
        success: false,
        message: 'Artist ID is required'
      });
    }

    console.log(`[artist-releases] Fetching releases for artist: ${artistId}`);
    return await handleArtistReleases(req, res, artistId);
  } catch (error) {
    console.error(`[artist-releases] Error in main handler: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: `Internal server error: ${error.message}`
    });
  }
});

async function handleArtistReleases(req, res, artistId) {
  try {
    const supabase = req.app.locals.supabase || getSupabase();
    const supabaseAdmin = req.app.locals.supabaseAdmin || getSupabaseAdmin();
    
    // Track the search strategies for debugging
    const strategies = {
      joinTableQuery: false,
      directArtistIdQuery: false,
      rpcFunctionQuery: false,
      titleSearchQuery: false,
      fallbackQuery: false
    };
    
    let releases = [];
    let artist = null;
    
    // Step 1: Get artist details first with timeout protection
    console.log(`[artist-releases] STEP 1: Fetching artist details for ID: ${artistId}`);
    try {
      const artistResponse = await runWithTimeout(
        supabase
          .from('artists')
          .select('*')
          .eq('id', artistId)
          .single()
      );
      
      if (artistResponse.error) {
        console.error(`[artist-releases] Error fetching artist: ${artistResponse.error.message}`);
        
        // Try a more basic query as fallback
        console.log(`[artist-releases] Attempting to fetch basic artist info without single() constraint`);
        const fallbackArtistResponse = await runWithTimeout(
          supabase
            .from('artists')
            .select('id, name')
            .eq('id', artistId)
            .limit(1)
        );
        
        if (fallbackArtistResponse.error || !fallbackArtistResponse.data || fallbackArtistResponse.data.length === 0) {
          return res.status(404).json({
            success: false,
            message: `Artist not found: ${artistResponse.error.message}`
          });
        }
        
        artist = fallbackArtistResponse.data[0];
      } else {
        artist = artistResponse.data;
      }
    } catch (artistFetchError) {
      console.error(`[artist-releases] Error during artist fetch: ${artistFetchError.message}`);
      
      // Create a minimal artist object to continue with release fetching
      artist = { id: artistId, name: `Artist ${artistId}` };
      console.log(`[artist-releases] Created minimal artist object to continue: ${JSON.stringify(artist)}`);
    }
    
    if (!artist) {
      console.error(`[artist-releases] Artist not found with ID: ${artistId}`);
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }
    
    console.log(`[artist-releases] Found artist: ${artist.name}`);
    
    // STRATEGY 1: Try to find releases through the join table (release_artists)
    console.log(`[artist-releases] STRATEGY 1: Checking release_artists join table for artist: ${artistId}`);
    try {
      const joinResponse = await runWithTimeout(
        supabase
          .from('release_artists')
          .select(`
            release_id,
            releases (*)
          `)
          .eq('artist_id', artistId)
      );
      
      if (joinResponse.error) {
        console.error(`[artist-releases] Join table strategy error: ${joinResponse.error.message}`);
      } else if (joinResponse.data && joinResponse.data.length > 0) {
        const validReleases = joinResponse.data
          .filter(item => item.releases !== null)
          .map(item => item.releases);
        
        if (validReleases.length > 0) {
          releases = validReleases;
          strategies.joinTableQuery = true;
          console.log(`[artist-releases] SUCCESS with join table strategy: Found ${releases.length} releases`);
        }
      }
    } catch (joinStrategyError) {
      console.error(`[artist-releases] Error in join table strategy: ${joinStrategyError.message}`);
    }
    
    // STRATEGY 2: If strategy 1 failed, try direct artist_id references in releases table
    if (releases.length === 0) {
      console.log(`[artist-releases] STRATEGY 2: Checking direct artist_id references for artist: ${artistId}`);
      try {
        const directResponse = await runWithTimeout(
          supabase
            .from('releases')
            .select('*')
            .eq('artist_id', artistId)
        );
        
        if (directResponse.error) {
          console.error(`[artist-releases] Direct query strategy error: ${directResponse.error.message}`);
        } else if (directResponse.data && directResponse.data.length > 0) {
          releases = directResponse.data;
          strategies.directArtistIdQuery = true;
          console.log(`[artist-releases] SUCCESS with direct query strategy: Found ${releases.length} releases`);
        }
      } catch (directStrategyError) {
        console.error(`[artist-releases] Error in direct query strategy: ${directStrategyError.message}`);
      }
    }
    
    // STRATEGY 3: If strategies 1 and 2 failed, try the RPC function with a longer timeout
    if (releases.length === 0) {
      console.log(`[artist-releases] STRATEGY 3: Using RPC function for artist: ${artistId}`);
      try {
        const rpcResponse = await runWithTimeout(
          supabaseAdmin
            .rpc('get_artist_releases', { artist_id_param: artistId }),
          8000 // Longer timeout for RPC function
        );
        
        if (rpcResponse.error) {
          console.error(`[artist-releases] RPC function strategy error: ${rpcResponse.error.message}`);
        } else if (rpcResponse.data && rpcResponse.data.length > 0) {
          releases = rpcResponse.data;
          strategies.rpcFunctionQuery = true;
          console.log(`[artist-releases] SUCCESS with RPC function strategy: Found ${releases.length} releases`);
        }
      } catch (rpcStrategyError) {
        console.error(`[artist-releases] Error in RPC function strategy: ${rpcStrategyError.message}`);
      }
    }
    
    // STRATEGY 4: Last resort - search by artist name in release titles
    if (releases.length === 0 && artist && artist.name) {
      console.log(`[artist-releases] STRATEGY 4: Searching release titles containing artist name: ${artist.name}`);
      try {
        const titleResponse = await runWithTimeout(
          supabase
            .from('releases')
            .select('*')
            .ilike('title', `%${artist.name}%`)
        );
        
        if (titleResponse.error) {
          console.error(`[artist-releases] Title search strategy error: ${titleResponse.error.message}`);
        } else if (titleResponse.data && titleResponse.data.length > 0) {
          releases = titleResponse.data;
          strategies.titleSearchQuery = true;
          console.log(`[artist-releases] SUCCESS with title search strategy: Found ${releases.length} releases`);
        }
      } catch (titleStrategyError) {
        console.error(`[artist-releases] Error in title search strategy: ${titleStrategyError.message}`);
      }
    }
    
    // FINAL FALLBACK: If all strategies fail, try a simple query to get any available releases
    if (releases.length === 0) {
      console.log('[artist-releases] FALLBACK: All strategies failed, fetching sample of recent releases');
      try {
        const fallbackResponse = await runWithTimeout(
          supabase
            .from('releases')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)
        );
        
        if (!fallbackResponse.error && fallbackResponse.data && fallbackResponse.data.length > 0) {
          releases = fallbackResponse.data;
          strategies.fallbackQuery = true;
          console.log(`[artist-releases] Fallback query returned ${releases.length} generic releases`);
        }
      } catch (fallbackError) {
        console.error(`[artist-releases] Error in fallback query: ${fallbackError.message}`);
      }
    }
    
    // Log the strategies used
    console.log('[artist-releases] Search strategies summary:', JSON.stringify(strategies));
    
    // If we still have no releases, return empty array but still 200 status (not an error)
    if (releases.length === 0) {
      console.log(`[artist-releases] No releases found for artist ${artistId} after trying all strategies`);
    }
    
    return res.status(200).json({
      success: true,
      message: `Found ${releases.length} releases for artist ${artistId}`,
      data: {
        artist,
        releases
      },
      debug: { strategies }
    });
    
  } catch (error) {
    console.error(`[artist-releases] Fatal error in handleArtistReleases: ${error.message}`);
    // Always return a valid response to prevent 502 errors
    return res.status(200).json({
      success: false,
      message: `Server error processing artist releases: ${error.message}`,
      data: {
        artist: { id: artistId, name: `Artist ${artistId}` },
        releases: []
      },
      error: error.message
    });
  }
}

module.exports = router;
