// routes/artist-releases.js
// Implements the sophisticated multi-strategy approach for artist releases
const express = require('express');
const router = express.Router();
const { getSupabase, getSupabaseAdmin } = require('../utils/database');

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
      titleSearchQuery: false
    };
    
    let releases = [];
    let artist = null;
    
    // Step 1: Get artist details first
    console.log(`[artist-releases] STEP 1: Fetching artist details for ID: ${artistId}`);
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single();
    
    if (artistError) {
      console.error(`[artist-releases] Error fetching artist: ${artistError.message}`);
      return res.status(404).json({
        success: false,
        message: `Artist not found: ${artistError.message}`
      });
    }
    
    if (!artistData) {
      console.error(`[artist-releases] Artist not found with ID: ${artistId}`);
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }
    
    artist = artistData;
    console.log(`[artist-releases] Found artist: ${artist.name}`);
    
    // STRATEGY 1: Try to find releases through the join table (release_artists)
    console.log(`[artist-releases] STRATEGY 1: Checking release_artists join table for artist: ${artistId}`);
    try {
      const { data: joinData, error: joinError } = await supabase
        .from('release_artists')
        .select(`
          release_id,
          releases (*)
        `)
        .eq('artist_id', artistId);
      
      if (joinError) {
        console.error(`[artist-releases] Join table strategy error: ${joinError.message}`);
      } else if (joinData && joinData.length > 0) {
        const validReleases = joinData
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
        const { data: directData, error: directError } = await supabase
          .from('releases')
          .select('*')
          .eq('artist_id', artistId);
        
        if (directError) {
          console.error(`[artist-releases] Direct query strategy error: ${directError.message}`);
        } else if (directData && directData.length > 0) {
          releases = directData;
          strategies.directArtistIdQuery = true;
          console.log(`[artist-releases] SUCCESS with direct query strategy: Found ${releases.length} releases`);
        }
      } catch (directStrategyError) {
        console.error(`[artist-releases] Error in direct query strategy: ${directStrategyError.message}`);
      }
    }
    
    // STRATEGY 3: If strategies 1 and 2 failed, try the RPC function
    if (releases.length === 0) {
      console.log(`[artist-releases] STRATEGY 3: Using RPC function for artist: ${artistId}`);
      try {
        const { data: rpcData, error: rpcError } = await supabaseAdmin
          .rpc('get_artist_releases', { artist_id_param: artistId });
        
        if (rpcError) {
          console.error(`[artist-releases] RPC function strategy error: ${rpcError.message}`);
        } else if (rpcData && rpcData.length > 0) {
          releases = rpcData;
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
        const { data: titleData, error: titleError } = await supabase
          .from('releases')
          .select('*')
          .ilike('title', `%${artist.name}%`);
        
        if (titleError) {
          console.error(`[artist-releases] Title search strategy error: ${titleError.message}`);
        } else if (titleData && titleData.length > 0) {
          releases = titleData;
          strategies.titleSearchQuery = true;
          console.log(`[artist-releases] SUCCESS with title search strategy: Found ${releases.length} releases`);
        }
      } catch (titleStrategyError) {
        console.error(`[artist-releases] Error in title search strategy: ${titleStrategyError.message}`);
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
    return res.status(500).json({
      success: false,
      message: `Server error processing artist releases: ${error.message}`
    });
  }
}

module.exports = router;
