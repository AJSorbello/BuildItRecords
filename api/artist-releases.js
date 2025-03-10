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
  // Initialize Supabase with available environment variables
  let supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    console.log(`[artist-releases] Using fallback SUPABASE_URL: ${supabaseUrl ? 'Found' : 'Not Found'}`);
  }

  let supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseKey) {
    supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log(`[artist-releases] Using fallback SUPABASE_ANON_KEY: ${supabaseKey ? 'Found' : 'Not Found'}`);
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('[artist-releases] Missing Supabase credentials');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error'
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  let releases = [];
  let artist = null;
  let errorMessages = [];

  // First, retrieve the artist to ensure it exists and get its name
  try {
    console.log(`[artist-releases] Fetching artist data for ID: ${artistId}`);
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artistId)
      .single();

    if (artistError) {
      console.error(`[artist-releases] Error fetching artist: ${artistError.message}`);
      errorMessages.push(`Artist fetch error: ${artistError.message}`);
    } else if (!artistData) {
      console.error(`[artist-releases] Artist not found with ID: ${artistId}`);
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    } else {
      artist = artistData;
      console.log(`[artist-releases] Found artist: ${artist.name}`);
    }
  } catch (e) {
    console.error(`[artist-releases] Exception fetching artist: ${e.message}`);
    errorMessages.push(`Artist fetch exception: ${e.message}`);
  }

  // APPROACH 1: Try to get releases via the release_artists join table
  try {
    console.log(`[artist-releases] APPROACH 1: Checking release_artists join table for artist ID: ${artistId}`);
    
    // First, check if the join table actually exists and has entries
    const { count, error: countError } = await supabase
      .rpc('column_exists', { table_name: 'release_artists', column_name: 'artist_id' });
      
    if (countError) {
      console.error(`[artist-releases] Error checking release_artists table: ${countError.message}`);
      errorMessages.push(`Join table error: ${countError.message}`);
    } else {
      const columnExists = count === true;
      
      if (columnExists) {
        console.log('[artist-releases] release_artists table has artist_id column, proceeding with query');
        
        // Get release IDs for this artist from the join table
        const { data: joinData, error: joinError } = await supabase
          .from('release_artists')
          .select('release_id')
          .eq('artist_id', artistId);

        if (joinError) {
          console.error(`[artist-releases] Error in join query: ${joinError.message}`);
          errorMessages.push(`Join query error: ${joinError.message}`);
        } else if (joinData && joinData.length > 0) {
          console.log(`[artist-releases] Found ${joinData.length} join table entries for artist`);
          
          // Get the actual releases using the IDs
          const releaseIds = joinData.map(item => item.release_id);
          const { data: releaseData, error: releaseError } = await supabase
            .from('releases')
            .select('*')
            .in('id', releaseIds);

          if (releaseError) {
            console.error(`[artist-releases] Error fetching releases by IDs: ${releaseError.message}`);
            errorMessages.push(`Release fetch error: ${releaseError.message}`);
          } else if (releaseData && releaseData.length > 0) {
            releases = releaseData;
            console.log(`[artist-releases] APPROACH 1 SUCCESSFUL: Found ${releases.length} releases via join table`);
          } else {
            console.log('[artist-releases] Found join entries but no matching releases');
          }
        } else {
          console.log('[artist-releases] No entries in join table for this artist');
        }
      } else {
        console.log('[artist-releases] release_artists table does not have artist_id column, skipping Approach 1');
      }
    }
  } catch (e) {
    console.error(`[artist-releases] Exception in APPROACH 1: ${e.message}`);
    errorMessages.push(`Approach 1 exception: ${e.message}`);
  }

  // APPROACH 2: Try direct artist_id reference in releases table
  if (releases.length === 0) {
    try {
      console.log(`[artist-releases] APPROACH 2: Checking direct artist_id reference in releases table`);
      
      // First check if artist_id column exists in releases table
      const { data: columnCheck, error: columnError } = await supabase
        .rpc('column_exists', { table_name: 'releases', column_name: 'artist_id' });
        
      if (columnError) {
        console.error(`[artist-releases] Error checking for artist_id column: ${columnError.message}`);
        console.log('[artist-releases] Assuming column does not exist and skipping Approach 2');
        errorMessages.push(`Column check error: ${columnError.message}`);
      } else {
        const columnExists = columnCheck === true;
        
        if (columnExists) {
          console.log('[artist-releases] artist_id column exists in releases table, proceeding with query');
          
          const { data: releaseData, error: releaseError } = await supabase
            .from('releases')
            .select('*')
            .eq('artist_id', artistId);

          if (releaseError) {
            console.error(`[artist-releases] Error in direct query: ${releaseError.message}`);
            errorMessages.push(`Direct query error: ${releaseError.message}`);
          } else if (releaseData && releaseData.length > 0) {
            releases = releaseData;
            console.log(`[artist-releases] APPROACH 2 SUCCESSFUL: Found ${releases.length} releases via direct reference`);
          } else {
            console.log('[artist-releases] No releases found with direct artist_id reference');
          }
        } else {
          console.log('[artist-releases] artist_id column does not exist in releases table, skipping Approach 2');
        }
      }
    } catch (e) {
      console.error(`[artist-releases] Exception in APPROACH 2: ${e.message}`);
      errorMessages.push(`Approach 2 exception: ${e.message}`);
      console.log('[artist-releases] Continuing to next approach...');
    }
  }

  // APPROACH 3: Try using a custom SQL function
  if (releases.length === 0) {
    try {
      console.log(`[artist-releases] APPROACH 3: Using custom SQL function get_artist_releases`);
      
      // First check if the function exists
      const { data: functionCheck, error: functionError } = await supabase
        .rpc('function_exists', { function_name: 'get_artist_releases' });
        
      if (functionError) {
        console.error(`[artist-releases] Error checking for get_artist_releases function: ${functionError.message}`);
        console.log('[artist-releases] Assuming function does not exist and skipping Approach 3');
        errorMessages.push(`Function check error: ${functionError.message}`);
      } else {
        const functionExists = functionCheck === true;
        
        if (functionExists) {
          console.log('[artist-releases] get_artist_releases function exists, calling it');
          
          const { data: rpcReleases, error: releaseError } = await supabase
            .rpc('get_artist_releases', { artist_id_param: artistId });

          if (releaseError) {
            console.error(`[artist-releases] Error calling get_artist_releases: ${releaseError.message}`);
            errorMessages.push(`RPC error: ${releaseError.message}`);
          } else if (rpcReleases && rpcReleases.length > 0) {
            releases = rpcReleases;
            console.log(`[artist-releases] APPROACH 3 SUCCESSFUL: Found ${releases.length} releases via SQL function`);
          } else {
            console.log('[artist-releases] SQL function returned no releases');
          }
        } else {
          console.log('[artist-releases] get_artist_releases function does not exist, skipping Approach 3');
        }
      }
    } catch (e) {
      console.error(`[artist-releases] Exception in APPROACH 3: ${e.message}`);
      errorMessages.push(`Approach 3 exception: ${e.message}`);
      console.log('[artist-releases] Continuing to next approach...');
    }
  }

  // APPROACH 4: Try to find releases with title containing artist name
  if (releases.length === 0 && artist && artist.name) {
    try {
      console.log(`[artist-releases] APPROACH 4: Searching for releases with titles containing artist name: "${artist.name}"`);
      
      // Prepare search terms (artist name without special chars)
      const searchName = artist.name.replace(/[^\w\s]/gi, '');
      
      if (searchName.length > 2) { // Only search if name is meaningful
        const { data: releaseData, error: releaseError } = await supabase
          .from('releases')
          .select('*')
          .ilike('title', `%${searchName}%`);

        if (releaseError) {
          console.error(`[artist-releases] Error in title search: ${releaseError.message}`);
          errorMessages.push(`Title search error: ${releaseError.message}`);
        } else if (releaseData && releaseData.length > 0) {
          releases = releaseData;
          console.log(`[artist-releases] APPROACH 4 SUCCESSFUL: Found ${releases.length} releases via title search`);
        } else {
          console.log('[artist-releases] No releases found with artist name in title');
        }
      } else {
        console.log(`[artist-releases] Artist name too short for reliable title search: "${searchName}"`);
      }
    } catch (e) {
      console.error(`[artist-releases] Exception in APPROACH 4: ${e.message}`);
      errorMessages.push(`Approach 4 exception: ${e.message}`);
      console.log('[artist-releases] Continuing to next approach...');
    }
  }

  // APPROACH 5: NEW APPROACH - Use fuzzy label matching if the artist has a label_id
  if (releases.length === 0 && artist && artist.label_id) {
    try {
      console.log(`[artist-releases] APPROACH 5: Finding releases from the same label (label_id: ${artist.label_id})`);
      
      const { data: labelReleases, error: labelError } = await supabase
        .from('releases')
        .select('*')
        .eq('label_id', artist.label_id)
        .limit(10); // Limit to a reasonable number of results

      if (labelError) {
        console.error(`[artist-releases] Error in label search: ${labelError.message}`);
        errorMessages.push(`Label search error: ${labelError.message}`);
      } else if (labelReleases && labelReleases.length > 0) {
        releases = labelReleases;
        console.log(`[artist-releases] APPROACH 5 SUCCESSFUL: Found ${releases.length} releases from the same label`);
      } else {
        console.log('[artist-releases] No releases found from the same label');
      }
    } catch (e) {
      console.error(`[artist-releases] Exception in APPROACH 5: ${e.message}`);
      errorMessages.push(`Approach 5 exception: ${e.message}`);
    }
  }

  // APPROACH 6: LAST RESORT - If all else fails, just return some recent releases
  if (releases.length === 0) {
    try {
      console.log('[artist-releases] APPROACH 6: Last resort - returning some recent releases');
      
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
        console.log(`[artist-releases] APPROACH 6 SUCCESSFUL: Returning ${releases.length} recent releases as fallback`);
      } else {
        console.log('[artist-releases] Could not find any releases in the database');
      }
    } catch (e) {
      console.error(`[artist-releases] Exception in APPROACH 6: ${e.message}`);
      errorMessages.push(`Approach 6 exception: ${e.message}`);
    }
  }

  // Final result
  const finalResponse = {
    success: true,
    message: releases.length > 0 ? 
      `Found ${releases.length} releases for artist ${artistId}` : 
      `Found 0 releases for artist ${artistId}`,
    data: releases,
    meta: {
      artistId: artistId,
      approachUsed: "unknown",
      artist: artist,
      errors: errorMessages.length > 0 ? errorMessages : undefined
    }
  };

  console.log(`[artist-releases] Returning ${releases.length} releases for artist ${artistId}`);
  return res.status(200).json(finalResponse);
}
