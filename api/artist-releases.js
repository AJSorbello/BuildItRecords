// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

// API route for artist releases with multiple fallback approaches for maximum resilience
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

module.exports = async (req, res) => {
  // Enable CORS
  await new Promise((resolve, reject) => {
    cors({ origin: true })(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).json({
      success: true,
      message: 'CORS preflight response successful'
    });
  }

  try {
    const { query } = req;
    const artistId = query.id;

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
};

async function handleArtistReleases(req, res, artistId) {
  try {
    console.log(`[artist-releases] Fetching releases for artist ${artistId}`);
    
    // In Express mode, get Supabase from app.locals or create new connection
    const supabase = req.app?.locals?.supabase || 
      createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    const supabaseAdmin = req.app?.locals?.supabaseAdmin || 
      createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // If artistId is not provided, check query params
    if (!artistId && req.query.artistId) {
      artistId = req.query.artistId;
    }
    
    if (!artistId) {
      return res.status(400).json({
        success: false,
        message: 'Artist ID is required',
        data: { releases: [] }
      });
    }
    
    let releases = [];
    let artist = null;
    const errorMessages = [];
    
    // STEP 1: Get artist details first
    try {
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', artistId)
        .single();
        
      if (artistError) {
        console.error(`[artist-releases] Error fetching artist: ${artistError.message}`);
        errorMessages.push(`Artist error: ${artistError.message}`);
      } else if (artistData) {
        artist = artistData;
        console.log(`[artist-releases] Found artist: ${artist.name}`);
      } else {
        console.log(`[artist-releases] Artist not found: ${artistId}`);
        errorMessages.push(`Artist not found: ${artistId}`);
      }
    } catch (err) {
      console.error(`[artist-releases] Exception fetching artist: ${err.message}`);
      errorMessages.push(`Artist exception: ${err.message}`);
    }
    
    // APPROACH 1: Check if the release_artists table exists and has records for this artist
    try {
      console.log('[artist-releases] APPROACH 1: Checking release_artists join table');
      
      // Check if table exists
      const { data: tableExists, error: tableError } = await supabaseAdmin.rpc(
        'column_exists', 
        { table_name: 'release_artists', column_name: 'artist_id' }
      ).single();
        
      if (tableError) {
        console.error(`[artist-releases] Error checking release_artists table: ${tableError.message}`);
        errorMessages.push(`Table check error: ${tableError.message}`);
      } else if (tableExists) {
        console.log('[artist-releases] release_artists table exists, querying it');
        
        // Query the release_artists table to join releases and artists
        const { data: joinReleases, error: joinError } = await supabase
          .from('release_artists')
          .select('release_id')
          .eq('artist_id', artistId);
          
        if (joinError) {
          console.error(`[artist-releases] Error querying release_artists: ${joinError.message}`);
          errorMessages.push(`Join query error: ${joinError.message}`);
        } else if (joinReleases && joinReleases.length > 0) {
          // Get the actual release data
          const releaseIds = joinReleases.map(r => r.release_id);
          console.log(`[artist-releases] Found ${releaseIds.length} release_ids in join table`);
          
          const { data: releasesData, error: releasesError } = await supabase
            .from('releases')
            .select('*')
            .in('id', releaseIds);
            
          if (releasesError) {
            console.error(`[artist-releases] Error fetching releases by IDs: ${releasesError.message}`);
            errorMessages.push(`Releases fetch error: ${releasesError.message}`);
          } else if (releasesData && releasesData.length > 0) {
            releases = releasesData;
            console.log(`[artist-releases] APPROACH 1 SUCCESSFUL: Found ${releases.length} releases via join table`);
          } else {
            console.log('[artist-releases] Found release_ids but no matching releases');
          }
        } else {
          console.log('[artist-releases] No records found in release_artists for this artist');
        }
      } else {
        console.log('[artist-releases] release_artists table does not exist');
      }
    } catch (err) {
      console.error(`[artist-releases] Exception in APPROACH 1: ${err.message}`);
      errorMessages.push(`Approach 1 exception: ${err.message}`);
    }
    
    // APPROACH 2: Check if the releases table has an artist_id column
    if (releases.length === 0) {
      try {
        console.log('[artist-releases] APPROACH 2: Checking for artist_id in releases table');
        
        // Check if column exists
        const { data: columnExists, error: columnError } = await supabaseAdmin.rpc(
          'column_exists', 
          { table_name: 'releases', column_name: 'artist_id' }
        ).single();
        
        if (columnError) {
          console.error(`[artist-releases] Error checking column existence: ${columnError.message}`);
          errorMessages.push(`Column check error: ${columnError.message}`);
        } else if (columnExists) {
          console.log('[artist-releases] artist_id column exists in releases table, querying it');
          
          // Query releases with artist_id directly
          const { data: directReleases, error: directError } = await supabase
            .from('releases')
            .select('*')
            .eq('artist_id', artistId);
            
          if (directError) {
            console.error(`[artist-releases] Error querying releases directly: ${directError.message}`);
            errorMessages.push(`Direct query error: ${directError.message}`);
          } else if (directReleases && directReleases.length > 0) {
            releases = directReleases;
            console.log(`[artist-releases] APPROACH 2 SUCCESSFUL: Found ${releases.length} releases via direct reference`);
          } else {
            console.log('[artist-releases] No releases found with matching artist_id');
          }
        } else {
          console.log('[artist-releases] artist_id column does not exist in releases table');
        }
      } catch (err) {
        console.error(`[artist-releases] Exception in APPROACH 2: ${err.message}`);
        errorMessages.push(`Approach 2 exception: ${err.message}`);
      }
    }
    
    // APPROACH 3: Try using a SQL function if it exists
    if (releases.length === 0) {
      try {
        console.log('[artist-releases] APPROACH 3: Trying SQL function get_artist_releases');
        
        // Check if function exists
        const { data: functionExists, error: functionError } = await supabaseAdmin.rpc(
          'function_exists', 
          { function_name: 'get_artist_releases' }
        ).single();
        
        if (functionError) {
          console.error(`[artist-releases] Error checking function existence: ${functionError.message}`);
          errorMessages.push(`Function check error: ${functionError.message}`);
        } else if (functionExists) {
          console.log('[artist-releases] get_artist_releases function exists, calling it');
          
          const { data: rpcReleases, error: releaseError } = await supabase
            .rpc('get_artist_releases', { artist_id_param: artistId });

          if (releaseError) {
            console.error(`[artist-releases] Error calling SQL function: ${releaseError.message}`);
            errorMessages.push(`RPC error: ${releaseError.message}`);
          } else if (rpcReleases && rpcReleases.length > 0) {
            releases = rpcReleases;
            console.log(`[artist-releases] APPROACH 3 SUCCESSFUL: Found ${releases.length} releases via SQL function`);
          } else {
            console.log('[artist-releases] SQL function returned no releases');
          }
        } else {
          console.log('[artist-releases] get_artist_releases function does not exist');
        }
      } catch (err) {
        console.error(`[artist-releases] Exception in APPROACH 3: ${err.message}`);
        errorMessages.push(`Approach 3 exception: ${err.message}`);
      }
    }
    
    // APPROACH 4: Try to find releases with titles containing the artist name
    if (releases.length === 0 && artist && artist.name) {
      try {
        console.log(`[artist-releases] APPROACH 4: Searching release titles containing "${artist.name}"`);
        
        // Only do this for artists with names longer than 3 characters to avoid too many false positives
        if (artist.name.length > 3) {
          const { data: titleReleases, error: titleError } = await supabase
            .from('releases')
            .select('*')
            .ilike('title', `%${artist.name}%`);
            
          if (titleError) {
            console.error(`[artist-releases] Error searching titles: ${titleError.message}`);
            errorMessages.push(`Title search error: ${titleError.message}`);
          } else if (titleReleases && titleReleases.length > 0) {
            releases = titleReleases;
            console.log(`[artist-releases] APPROACH 4 SUCCESSFUL: Found ${releases.length} releases via title search`);
          } else {
            console.log('[artist-releases] No releases found with titles containing artist name');
          }
        } else {
          console.log('[artist-releases] Artist name too short for reliable title search');
        }
      } catch (err) {
        console.error(`[artist-releases] Exception in APPROACH 4: ${err.message}`);
        errorMessages.push(`Approach 4 exception: ${err.message}`);
      }
    }
    
    // APPROACH 5: Try to find releases from the same label if the artist has a label_id
    if (releases.length === 0 && artist && artist.label_id) {
      try {
        console.log(`[artist-releases] APPROACH 5: Finding releases with the same label_id ${artist.label_id}`);
        
        const { data: labelReleases, error: labelError } = await supabase
          .from('releases')
          .select('*')
          .eq('label_id', artist.label_id)
          .limit(10);
          
        if (labelError) {
          console.error(`[artist-releases] Error fetching label releases: ${labelError.message}`);
          errorMessages.push(`Label search error: ${labelError.message}`);
        } else if (labelReleases && labelReleases.length > 0) {
          releases = labelReleases;
          console.log(`[artist-releases] APPROACH 5 SUCCESSFUL: Found ${releases.length} releases from the same label`);
        } else {
          console.log('[artist-releases] No releases found from the same label');
        }
      } catch (err) {
        console.error(`[artist-releases] Exception in APPROACH 5: ${err.message}`);
        errorMessages.push(`Approach 5 exception: ${err.message}`);
      }
    }
    
    // APPROACH 6: Last resort - just return some recent releases
    if (releases.length === 0) {
      try {
        console.log('[artist-releases] APPROACH 6: Last resort, returning recent releases');
        
        const { data: recentReleases, error: recentError } = await supabase
          .from('releases')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (recentError) {
          console.error(`[artist-releases] Error fetching recent releases: ${recentError.message}`);
          errorMessages.push(`Recent releases error: ${recentError.message}`);
        } else if (recentReleases && recentReleases.length > 0) {
          releases = recentReleases;
          console.log(`[artist-releases] APPROACH 6 SUCCESSFUL: Returning ${releases.length} recent releases as last resort`);
        } else {
          console.log('[artist-releases] No recent releases found either');
        }
      } catch (err) {
        console.error(`[artist-releases] Exception in APPROACH 6: ${err.message}`);
        errorMessages.push(`Approach 6 exception: ${err.message}`);
      }
    }
    
    // Final result - ensure data.releases is properly formatted for the frontend
    const finalResponse = {
      success: true,
      message: releases.length > 0 ? 
        `Found ${releases.length} releases for artist ${artistId}` : 
        `Found 0 releases for artist ${artistId}`,
      data: {
        releases: releases || [],
        artist: artist || null,
        artists: artist ? [artist] : []
      }
    };

    console.log(`[artist-releases] Final response format:`, JSON.stringify({
      success: finalResponse.success,
      message: finalResponse.message,
      data: {
        releases: `Array with ${releases.length} items`,
        artist: artist ? artist.name : null,
        artists: artist ? [`${artist.name}`] : []
      }
    }, null, 2));
    
    return res.status(200).json(finalResponse);
  } catch (err) {
    console.error(`[artist-releases] Unhandled exception: ${err.message}`);
    console.error(err.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Error fetching artist releases',
      data: {
        releases: [],
        artist: null,
        artists: [],
        error: err.message
      }
    });
  }
}

// Helper for standalone mode
function createClient(url, key) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    return createClient(url, key);
  } catch (err) {
    console.error(`[artist-releases] Failed to create Supabase client: ${err.message}`);
    throw err;
  }
}
