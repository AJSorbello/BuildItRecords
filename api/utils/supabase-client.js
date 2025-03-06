const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL and key available:', !!supabaseUrl, !!supabaseAnonKey);

// Initialize the client
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
}

/**
 * Fetch artists by label from Supabase
 * @param {Object} options Query options
 * @param {string} options.labelId Label ID to filter by
 * @param {number} options.limit Maximum number of artists to return
 * @param {number} options.page Page number for pagination
 * @returns {Promise<Array>} Array of artists
 */
async function getArtistsByLabel({ labelId, limit = 100, page = 1 }) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  console.log(`Fetching artists with label ID: ${labelId} using Supabase client`);
  const offset = (page - 1) * limit;
  
  try {
    // Check for a label ID mapping based on what we've learned from the database
    let databaseLabelId = labelId;
    if (labelId === 'buildit-records') {
      console.log('Mapping "buildit-records" label ID to "1" based on database structure');
      databaseLabelId = "1";
    }
    
    // Approach 1: Try to get artists directly by label_id
    console.log(`First approach: Get artists directly with label_id=${databaseLabelId}`);
    const { data: directArtists, error: directError } = await supabase
      .from('artists')
      .select('*')
      .eq('label_id', databaseLabelId)
      .order('name')
      .limit(limit);
      
    if (directError) {
      console.error('Error with direct artist query:', directError);
    } else if (directArtists && directArtists.length > 0) {
      console.log(`Found ${directArtists.length} artists directly with label_id=${databaseLabelId}`);
      
      return directArtists.map(artist => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.image_url || 
                 artist.profile_image_url || 
                 artist.profile_image_small_url || 
                 artist.profile_image_large_url,
        bio: artist.bio,
        spotifyUrl: artist.spotify_url
      }));
    } else {
      console.log(`No artists found directly with label_id=${databaseLabelId}`);
    }
    
    // Approach 2: Try to get all artists and identify the ones from this label's releases
    console.log('Second approach: Get all artists, then find which ones belong to this label');
    
    // Get releases first
    console.log(`Getting releases for label ${labelId} / ${databaseLabelId}`);
    
    // Try to get releases by label, using our existing function
    let labelReleases = await getReleases({ labelId, limit: 100 });
    
    // If that failed, try with the mapped database label ID
    if (!labelReleases || labelReleases.length === 0) {
      console.log(`No releases found with labelId=${labelId}, trying with databaseLabelId=${databaseLabelId}`);
      labelReleases = await getReleases({ labelId: databaseLabelId, limit: 100 });
    }
    
    if (!labelReleases || labelReleases.length === 0) {
      console.log('No releases found for this label, trying direct query for all recent releases');
      
      // Try a direct query for all releases (no label filter) as a fallback
      const { data: allReleases, error: allReleasesError } = await supabase
        .from('releases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (allReleasesError) {
        console.error('Error fetching all releases:', allReleasesError);
      } else {
        labelReleases = allReleases;
        console.log(`Using ${allReleases ? allReleases.length : 0} most recent releases as fallback`);
      }
    }
    
    if (!labelReleases || labelReleases.length === 0) {
      console.log('No releases found with any approach, cannot extract artists');
      
      // Last fallback: just get some recent artists
      console.log('Final fallback: returning recent artists without label filtering');
      const { data: recentArtists, error: recentError } = await supabase
        .from('artists')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (recentError) {
        console.error('Error fetching recent artists:', recentError);
        return [];
      }
      
      return (recentArtists || []).map(artist => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.image_url || artist.profile_image_url,
        bio: artist.bio,
        spotifyUrl: artist.spotify_url
      }));
    }
    
    console.log(`Found ${labelReleases.length} releases to extract artists from`);
    
    // Strategy 1: Check if releases already have artists array populated
    const artistsFromReleases = new Map();
    let foundArtistsInReleases = false;
    
    labelReleases.forEach(release => {
      if (release.artists && release.artists.length > 0) {
        foundArtistsInReleases = true;
        release.artists.forEach(artist => {
          if (artist.id) {
            artistsFromReleases.set(artist.id, artist);
          }
        });
      }
      
      // Check for primary_artist_id as well
      if (release.primary_artist_id) {
        artistsFromReleases.set(release.primary_artist_id, { id: release.primary_artist_id });
      }
    });
    
    if (foundArtistsInReleases) {
      console.log(`Found ${artistsFromReleases.size} artists directly in release objects`);
      
      // If we have artist IDs but not full data, fetch the full artist data
      if (artistsFromReleases.size > 0) {
        const artistIds = Array.from(artistsFromReleases.keys());
        
        const { data: artistDetails, error: artistDetailsError } = await supabase
          .from('artists')
          .select('*')
          .in('id', artistIds);
          
        if (artistDetailsError) {
          console.error('Error fetching artist details:', artistDetailsError);
        } else if (artistDetails && artistDetails.length > 0) {
          console.log(`Fetched details for ${artistDetails.length} artists`);
          
          return artistDetails.map(artist => ({
            id: artist.id,
            name: artist.name,
            imageUrl: artist.image_url || artist.profile_image_url,
            bio: artist.bio,
            spotifyUrl: artist.spotify_url
          }));
        }
      }
    } else {
      console.log('No artists found directly in release objects');
    }
    
    // Strategy 2: Check the release_artists junction table
    console.log('Checking release_artists junction table');
    const releaseIds = labelReleases.map(release => release.id);
    
    // Split into manageable batches
    const batchSize = 20;
    const artistMap = new Map();
    
    for (let i = 0; i < releaseIds.length; i += batchSize) {
      const batchIds = releaseIds.slice(i, i + batchSize);
      
      console.log(`Checking release_artists for batch ${Math.floor(i/batchSize) + 1} with ${batchIds.length} releases`);
      
      const { data: junctionData, error: junctionError } = await supabase
        .from('release_artists')
        .select('artist_id, release_id')
        .in('release_id', batchIds);
        
      if (junctionError) {
        console.error(`Error checking release_artists for batch ${Math.floor(i/batchSize) + 1}:`, junctionError);
        continue;
      }
      
      if (junctionData && junctionData.length > 0) {
        console.log(`Found ${junctionData.length} artist-release relationships in batch ${Math.floor(i/batchSize) + 1}`);
        
        // Extract unique artist IDs
        const artistIds = [...new Set(junctionData.map(rel => rel.artist_id))];
        
        // Fetch artist details
        const { data: artistDetails, error: artistDetailsError } = await supabase
          .from('artists')
          .select('*')
          .in('id', artistIds);
          
        if (artistDetailsError) {
          console.error(`Error fetching artist details for batch ${Math.floor(i/batchSize) + 1}:`, artistDetailsError);
        } else if (artistDetails && artistDetails.length > 0) {
          console.log(`Found ${artistDetails.length} artists in batch ${Math.floor(i/batchSize) + 1}`);
          
          // Add to map to deduplicate
          artistDetails.forEach(artist => {
            artistMap.set(artist.id, artist);
          });
        }
      } else {
        console.log(`No artist-release relationships found in batch ${Math.floor(i/batchSize) + 1}`);
      }
    }
    
    if (artistMap.size > 0) {
      console.log(`Found ${artistMap.size} total artists from release_artists junction table`);
      
      const artists = Array.from(artistMap.values());
      return artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.image_url || artist.profile_image_url,
        bio: artist.bio,
        spotifyUrl: artist.spotify_url
      }));
    }
    
    // Strategy 3: Try to infer artists from release titles
    console.log('Inferring artists from release titles as final attempt');
    
    // Get all artists first
    const { data: allArtists, error: allArtistsError } = await supabase
      .from('artists')
      .select('*')
      .order('name')
      .limit(200);  // Get a larger sample to increase chance of matches
      
    if (allArtistsError) {
      console.error('Error fetching all artists for name matching:', allArtistsError);
      return [];
    }
    
    if (!allArtists || allArtists.length === 0) {
      console.log('No artists found in database for name matching');
      return [];
    }
    
    console.log(`Found ${allArtists.length} artists for potential name matching`);
    
    // Map for storing matches
    const titleMatchedArtists = new Map();
    
    // For each release, try to find artist names in the title
    labelReleases.forEach(release => {
      if (!release.title) return;
      
      const releaseTitle = release.title.toLowerCase();
      
      // Try to match artist names in the release title
      allArtists.forEach(artist => {
        if (!artist.name) return;
        
        const artistName = artist.name.toLowerCase();
        
        // Skip very short artist names to avoid false positives
        if (artistName.length < 4) return;
        
        // Check if artist name appears in release title
        if (releaseTitle.includes(artistName)) {
          titleMatchedArtists.set(artist.id, artist);
        }
      });
    });
    
    if (titleMatchedArtists.size > 0) {
      console.log(`Found ${titleMatchedArtists.size} artists by matching names in release titles`);
      
      const artists = Array.from(titleMatchedArtists.values());
      return artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.image_url || artist.profile_image_url,
        bio: artist.bio,
        spotifyUrl: artist.spotify_url
      }));
    }
    
    // Final fallback: just get some artists from the database, but prioritize common compilation artists first
    console.log('No artists found with any strategy, returning default artists');
    
    // Check for "Various Artists" first, which is common for compilations
    const { data: variousArtists, error: variousArtistsError } = await supabase
      .from('artists')
      .select('*')
      .ilike('name', '%various%')
      .limit(5);
      
    if (!variousArtistsError && variousArtists && variousArtists.length > 0) {
      console.log(`Found ${variousArtists.length} "Various Artists" entries to use`);
      
      return variousArtists.map(artist => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.image_url || artist.profile_image_url,
        bio: artist.bio,
        spotifyUrl: artist.spotify_url
      }));
    }
    
    // Still nothing? Just get the first few artists in the database
    const { data: defaultArtists, error: defaultError } = await supabase
      .from('artists')
      .select('*')
      .limit(limit);
      
    if (defaultError) {
      console.error('Error fetching default artists:', defaultError);
      return [];
    }
    
    console.log(`Returning ${defaultArtists ? defaultArtists.length : 0} default artists as last resort`);
    
    return (defaultArtists || []).map(artist => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.image_url || artist.profile_image_url,
      bio: artist.bio,
      spotifyUrl: artist.spotify_url
    }));
    
  } catch (error) {
    console.error('Error in getArtistsByLabel:', error);
    throw error;
  }
}

/**
 * Fetch releases from Supabase
 * @param {Object} options Query options
 * @param {string} options.labelId Optional label ID to filter by
 * @param {number} options.limit Maximum number of releases to return
 * @param {number} options.page Page number for pagination
 * @returns {Promise<Array>} Array of releases
 */
async function getReleases({ labelId, limit = 100, page = 1 }) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  console.log(`Fetching releases${labelId ? ` with label ID: ${labelId}` : ''} using Supabase client`);
  const offset = (page - 1) * limit;
  
  try {
    // Get database schema information for debugging
    try {
      console.log('Inspecting database structure to help debug...');
      
      // Check if release_artists table exists by getting a sample
      const { data: raSample, error: raSampleError } = await supabase
        .from('release_artists')
        .select('*')
        .limit(1);
        
      if (raSampleError) {
        console.error('Error checking release_artists sample:', raSampleError);
        console.log('The release_artists table might not exist or have permission issues');
      } else {
        console.log(`Found release_artists sample: ${JSON.stringify(raSample || [])}`);
        
        if (raSample && raSample.length > 0) {
          console.log('Keys in release_artists table:', Object.keys(raSample[0]).join(', '));
        } else {
          console.log('release_artists table appears to be empty');
          
          // Try to examine structure by looking at empty query
          const { data: structData, error: structError } = await supabase
            .from('release_artists')
            .select('*')
            .limit(0);
            
          if (structError) {
            console.error('Error examining release_artists structure:', structError);
          } else {
            console.log('release_artists structure:', structData);
          }
        }
      }
      
      // Check for release table structure
      const { data: releasesSample, error: releasesSampleError } = await supabase
        .from('releases')
        .select('*')
        .limit(1);
        
      if (releasesSampleError) {
        console.error('Error checking releases sample:', releasesSampleError);
      } else if (releasesSample && releasesSample.length > 0) {
        console.log('Found release sample with keys:', Object.keys(releasesSample[0]).join(', '));
        console.log(`Sample release: ${JSON.stringify(releasesSample[0])}`);
      }
      
      // Check for artists table structure
      const { data: artistsSample, error: artistsSampleError } = await supabase
        .from('artists')
        .select('*')
        .limit(1);
        
      if (artistsSampleError) {
        console.error('Error checking artists sample:', artistsSampleError);
      } else if (artistsSample && artistsSample.length > 0) {
        console.log('Found artist sample with keys:', Object.keys(artistsSample[0]).join(', '));
        console.log(`Sample artist: ${JSON.stringify(artistsSample[0])}`);
      }
      
      // Try to get all tables
      try {
        // This special query should work in Supabase
        const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
        
        if (tablesError) {
          console.error('Error querying tables with RPC:', tablesError);
        } else if (tables) {
          console.log('Tables found in database:', tables);
        }
      } catch (tablesError) {
        console.error('Exception querying tables:', tablesError);
      }
    } catch (schemaError) {
      console.error('Schema inspection error:', schemaError);
    }
  
    // Attempt #1: Try a flexible label matching approach
    try {
      console.log('Attempting flexible label query');
      
      // Create a query with flexible label handling
      let query = supabase
        .from('releases')
        .select('*')
        .order('release_date', { ascending: false })
        .limit(limit);
      
      // Handle label filtering with multiple approaches based on previous findings
      if (labelId) {
        // For BuildIt Records specifically, use a more flexible approach
        if (labelId === 'buildit-records') {
          query = query.or(`label_id.eq.${labelId},label_id.ilike.%buildit%,label_id.ilike.%build it%`);
        } else {
          // For other labels, try the standard exact match
          query = query.eq('label_id', labelId);
        }
      }
      
      const { data: flexibleReleases, error: flexibleError } = await query;
      
      if (flexibleError) {
        console.error('Flexible label query failed:', flexibleError);
        throw flexibleError;
      }
      
      if (!flexibleReleases || flexibleReleases.length === 0) {
        console.log('No releases found with flexible label query');
        
        // Try a different approach - use the 'id' column instead of 'label_id'
        const { data: idReleases, error: idError } = await supabase
          .from('releases')
          .select('*')
          .eq('id', labelId)
          .order('release_date', { ascending: false })
          .limit(limit);
        
        if (idError) {
          console.error('ID-based query failed:', idError);
        } else if (idReleases && idReleases.length > 0) {
          console.log(`Found ${idReleases.length} releases using 'id' column`);
          
          // Get artist information using our fetch artist relations helper
          const releasesWithArtists = await attachArtistInfoToReleases(idReleases);
          
          return releasesWithArtists;
        }
        
        // Try one more catch-all approach - get all releases without filtering
        console.log('Trying catch-all approach - retrieving all recent releases');
        const { data: allReleases, error: allError } = await supabase
          .from('releases')
          .select('*')
          .order('release_date', { ascending: false })
          .limit(limit);
        
        if (allError) {
          console.error('Catch-all query failed:', allError);
          throw allError;
        }
        
        if (!allReleases || allReleases.length === 0) {
          console.log('No releases found with any query approach');
          return [];
        }
        
        console.log(`Found ${allReleases.length} releases using catch-all approach`);
        
        // Filter locally for potential label matches if possible
        const filteredReleases = labelId
          ? allReleases.filter(r => {
              // Try to match label in various ways
              if (!r.label_id) return false;
              const labelLower = labelId.toLowerCase();
              const rLabelLower = r.label_id.toLowerCase();
              return rLabelLower === labelLower || 
                     rLabelLower.includes(labelLower.replace(/-/g, '')) ||
                     rLabelLower.includes(labelLower.replace(/-/g, ' '));
            })
          : allReleases;
        
        // Use filtered if we found matches, otherwise use all
        const resultReleases = filteredReleases.length > 0 ? filteredReleases : allReleases;
        
        // Get artist information using our fetch artist relations helper
        const releasesWithArtists = await attachArtistInfoToReleases(resultReleases);
        
        return releasesWithArtists;
      }
      
      console.log(`Found ${flexibleReleases.length} releases with flexible query`);
      
      // Get artist information using our fetch artist relations helper
      const releasesWithArtists = await attachArtistInfoToReleases(flexibleReleases);
      
      return releasesWithArtists;
      
    } catch (complexError) {
      console.error('Error with complex query approach:', complexError);
      
      // Fall back to a very simple approach, just getting releases without any joins
      console.log('Falling back to basic query without any joins');
      const { data: basicReleases, error: basicError } = await supabase
        .from('releases')
        .select('id, title, name, release_date, artwork_url, cover_art_url, spotify_id')
        .order('release_date', { ascending: false })
        .limit(limit);
      
      if (basicError) {
        console.error('Basic fallback query failed:', basicError);
        throw basicError;
      }
      
      console.log(`Found ${basicReleases ? basicReleases.length : 0} releases with basic query`);
      
      // Even in the basic case, try to get artist information
      if (basicReleases && basicReleases.length > 0) {
        return await attachArtistInfoToReleases(basicReleases);
      }
      
      return (basicReleases || []).map(release => ({
        id: release.id,
        title: release.title || release.name,
        artists: [], // No artist info in basic query
        releaseDate: release.release_date,
        artworkUrl: release.artwork_url || release.cover_art_url,
        spotifyId: release.spotify_id
      }));
    }
    
  } catch (error) {
    console.error('Error fetching releases from Supabase:', error);
    throw error;
  }
}

/**
 * Helper function to attach artist information to releases
 * @param {Array} releases Array of release objects
 * @returns {Promise<Array>} Releases with artist information attached
 */
async function attachArtistInfoToReleases(releases) {
  if (!releases || releases.length === 0) {
    return [];
  }
  
  // Extract release IDs
  const releaseIds = releases.map(release => release.id);
  console.log(`Attempting to fetch artist information for ${releaseIds.length} releases`);
  
  // Try multiple approaches to get artist information
  
  // Approach 1: Direct query using release_artists junction table
  try {
    console.log('Approach 1: Querying release_artists junction table...');
    
    const { data: junctionData, error: junctionError } = await supabase
      .from('release_artists')
      .select('*')
      .in('release_id', releaseIds);
    
    if (junctionError) {
      console.error('Error querying release_artists junction:', junctionError);
    } else if (junctionData && junctionData.length > 0) {
      console.log(`Found ${junctionData.length} artist relationships in release_artists table`);
      
      // Get all artist IDs
      const artistIds = [...new Set(junctionData.map(junction => junction.artist_id))];
      console.log(`Found ${artistIds.length} unique artist IDs`);
      
      // Fetch artist details
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .in('id', artistIds);
      
      if (artistError) {
        console.error('Error fetching artist details:', artistError);
      } else if (artistData && artistData.length > 0) {
        console.log(`Found ${artistData.length} artists`);
        
        // Create a map of artists by ID
        const artistMap = {};
        artistData.forEach(artist => {
          artistMap[artist.id] = artist;
        });
        
        // Create a map of release to artists
        const releaseArtistsMap = {};
        junctionData.forEach(junction => {
          if (!releaseArtistsMap[junction.release_id]) {
            releaseArtistsMap[junction.release_id] = [];
          }
          
          const artist = artistMap[junction.artist_id];
          if (artist) {
            releaseArtistsMap[junction.release_id].push({
              id: artist.id,
              name: artist.name,
              imageUrl: artist.profile_image_url || 
                      artist.profile_image_small_url || 
                      artist.profile_image_large_url
            });
          }
        });
        
        // Return formatted releases with artist info
        return releases.map(release => ({
          id: release.id,
          title: release.title || release.name,
          artists: releaseArtistsMap[release.id] || [],
          releaseDate: release.release_date,
          artworkUrl: release.artwork_url || release.cover_art_url,
          spotifyId: release.spotify_id
        }));
      }
    } else {
      console.log('No artist relationships found in release_artists table');
    }
  } catch (approach1Error) {
    console.error('Error in approach 1:', approach1Error);
  }
  
  // Approach 2: Try using 'artists' field if it exists in releases
  try {
    console.log('Approach 2: Checking for embedded artist data in releases...');
    
    // Check if any release has artist data directly embedded
    const hasEmbeddedArtists = releases.some(r => r.artists && Array.isArray(r.artists) && r.artists.length > 0);
    
    if (hasEmbeddedArtists) {
      console.log('Found embedded artist data in releases');
      
      return releases.map(release => {
        const artists = Array.isArray(release.artists) ? release.artists : [];
        
        return {
          id: release.id,
          title: release.title || release.name,
          artists: artists.map(artist => ({
            id: artist.id,
            name: artist.name,
            imageUrl: artist.imageUrl || artist.profile_image_url || artist.image_url
          })),
          releaseDate: release.release_date,
          artworkUrl: release.artwork_url || release.cover_art_url,
          spotifyId: release.spotify_id
        };
      });
    } else {
      console.log('No embedded artist data found in releases');
    }
  } catch (approach2Error) {
    console.error('Error in approach 2:', approach2Error);
  }
  
  // If all approaches fail, just return releases with empty artists arrays
  console.log('All artist lookup approaches failed, returning releases without artist data');
  
  return releases.map(release => ({
    id: release.id,
    title: release.title || release.name,
    artists: [], // No artist info could be found
    releaseDate: release.release_date,
    artworkUrl: release.artwork_url || release.cover_art_url,
    spotifyId: release.spotify_id
  }));
}

/**
 * Fetch top releases from Supabase
 * @param {Object} options Query options
 * @param {string} options.labelId Optional label ID to filter by
 * @param {number} options.limit Maximum number of releases to return
 * @returns {Promise<Array>} Array of top releases
 */
async function getTopReleases({ labelId, limit = 10 }) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  console.log(`Fetching top releases${labelId ? ` for label ID: ${labelId}` : ''} using Supabase client`);
  
  try {
    // Initial approach - get all fields with nested artist data
    try {
      console.log('Attempting comprehensive query with artist details');
      // Strategy: Get releases sorted by popularity metrics (play count, etc.)
      let query = supabase
        .from('releases')
        .select(`
          *,
          artists:release_artists(
            artist_id,
            artists(*)
          )
        `)
        .limit(limit);
      
      // Apply label filter if provided
      if (labelId) {
        // Map label ID based on database structure
        let databaseLabelId = labelId;
        if (labelId === 'buildit-records') {
          console.log('Mapping "buildit-records" label ID to "1" based on database structure');
          databaseLabelId = "1";
        }
        query = query.eq('label_id', databaseLabelId);
      }
      
      // Order by play_count if the column exists
      query = query.order('play_count', { ascending: false });
      
      const { data: releases, error } = await query;
      
      if (error) {
        console.error('Error fetching top releases with comprehensive query:', error);
        throw error;
      }
      
      if (!releases || releases.length === 0) {
        console.log('No top releases found with comprehensive query');
        // Don't return yet, try the fallback approach
      } else {
        // Process releases to extract artist information
        const processedReleases = releases.map(release => {
          const artists = release.artists?.map(ra => {
            return ra.artists || null;
          }).filter(a => a !== null) || [];
          
          return {
            ...release,
            artists,
            artists_array: artists
          };
        });
        
        console.log(`Retrieved ${processedReleases.length} top releases with comprehensive query`);
        return processedReleases;
      }
    } catch (comprehensiveError) {
      console.error('Comprehensive query approach failed:', comprehensiveError);
      console.log('Falling back to simpler query approach');
      // Continue to fallback approach
    }
    
    // Fallback approach - get only basic release data without joins
    console.log('Using fallback approach with simpler query');
    let fallbackQuery = supabase
      .from('releases')
      .select('*')
      .limit(limit);
    
    // Apply label filter if provided
    if (labelId) {
      let databaseLabelId = labelId;
      if (labelId === 'buildit-records') {
        console.log('Mapping "buildit-records" label ID to "1" for fallback query');
        databaseLabelId = "1";
      }
      fallbackQuery = fallbackQuery.eq('label_id', databaseLabelId);
    }
    
    // Try to order by created_at as a fallback sorting criterion
    fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
    
    const { data: basicReleases, error: fallbackError } = await fallbackQuery;
    
    if (fallbackError) {
      console.error('Error in fallback query approach:', fallbackError);
      throw fallbackError;
    }
    
    if (!basicReleases || basicReleases.length === 0) {
      console.log('No releases found with fallback query');
      return []; // Return empty array as a last resort
    }
    
    console.log(`Retrieved ${basicReleases.length} basic releases with fallback query`);
    
    // Add placeholder for artists since we don't have the join data
    return basicReleases.map(release => ({
      ...release,
      artists: [],
      artists_array: []
    }));
    
  } catch (error) {
    console.error('Final error in getTopReleases:', error);
    throw new Error(`Failed to fetch top releases: ${error.message}`);
  }
}

module.exports = {
  getArtistsByLabel,
  getReleases,
  getTopReleases,
  supabase
};
