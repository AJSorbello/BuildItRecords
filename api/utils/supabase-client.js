const { createClient } = require('@supabase/supabase-js');

// Create a Supabase client with support for multiple environment variable naming conventions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   process.env.SUPABASE_URL || 
                   process.env.VITE_SUPABASE_URL;

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        process.env.SUPABASE_ANON_KEY ||
                        process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL and key available:', !!supabaseUrl, !!supabaseAnonKey);
console.log('Environment variables check:',
  'NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  'SUPABASE_URL:', !!process.env.SUPABASE_URL,
  'VITE_SUPABASE_URL:', !!process.env.VITE_SUPABASE_URL
);

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
      
      // Get sample release to understand structure
      const { data: sampleRelease, error: sampleError } = await supabase
        .from('releases')
        .select('*')
        .limit(1)
        .single();
        
      if (sampleError) {
        console.error('Error getting sample release:', sampleError);
      } else if (sampleRelease) {
        console.log('Sample release keys:', Object.keys(sampleRelease).join(', '));
      }
    } catch (schemaError) {
      console.error('Error examining database schema:', schemaError);
    }
    
    // Construct query based on whether we have a label ID
    let query = supabase
      .from('releases')
      .select('*');
      
    // Apply label filter if provided
    if (labelId) {
      query = query.eq('label_id', labelId);
    }
    
    // Apply pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('release_date', { ascending: false });
      
    // Execute query  
    const { data: releases, error } = await query;
    
    if (error) {
      console.error('Error fetching releases:', error);
      throw error;
    }
    
    if (!releases || releases.length === 0) {
      console.log('No releases found in Supabase');
      return [];
    }
    
    console.log(`Found ${releases.length} releases in Supabase, attaching artist info...`);
    
    // Use helper function to attach artist information to releases
    const releasesWithArtists = await attachArtistInfoToReleases(releases);
    
    // Log results for debugging
    console.log(`Processed ${releasesWithArtists.length} releases with artist information`);
    const artistCounts = releasesWithArtists.map(r => ({
      id: r.id,
      title: r.title,
      artistCount: r.artists && r.artists.length || 0
    }));
    console.log('Artist counts per release:', JSON.stringify(artistCounts, null, 2));
    
    return releasesWithArtists;
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
              imageUrl: artist.image_url || 
                      artist.profile_image_url || 
                      artist.profile_image_small_url || 
                      artist.profile_image_large_url
            });
          }
        });
        
        // Return formatted releases with artist info
        return releases.map(release => ({
          ...release,
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
          ...release,
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
  
  // Approach 3: Get "Various Artists" as a fallback
  try {
    console.log('Approach 3: Looking for Various Artists as fallback...');
    
    const { data: variousArtistsData, error: variousArtistsError } = await supabase
      .from('artists')
      .select('*')
      .or('name.ilike.%various artists%,name.ilike.%compilation%')
      .limit(1);
      
    if (variousArtistsError) {
      console.error('Error finding Various Artists:', variousArtistsError);
    } else if (variousArtistsData && variousArtistsData.length > 0) {
      console.log('Found Various Artists as fallback');
      
      const variousArtist = variousArtistsData[0];
      const fallbackArtist = {
        id: variousArtist.id,
        name: variousArtist.name,
        imageUrl: variousArtist.image_url || 
                 variousArtist.profile_image_url || 
                 variousArtist.profile_image_small_url
      };
      
      return releases.map(release => ({
        ...release,
        title: release.title || release.name,
        artists: [fallbackArtist], // Use Various Artists as fallback
        releaseDate: release.release_date,
        artworkUrl: release.artwork_url || release.cover_art_url,
        spotifyId: release.spotify_id
      }));
    } else {
      console.log('No Various Artists found for fallback');
    }
  } catch (approach3Error) {
    console.error('Error in approach 3:', approach3Error);
  }
  
  // If all approaches fail, create a default artist
  console.log('All artist lookup approaches failed, creating default artist');
  
  const defaultArtist = {
    id: 'default',
    name: 'Build It Records',
    imageUrl: '/images/placeholder-artist.jpg' // Standard placeholder
  };
  
  return releases.map(release => ({
    ...release,
    title: release.title || release.name,
    artists: [defaultArtist], // Use default artist
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
    // Construct the query
    let query = supabase
      .from('releases')
      .select('*');
      
    // Add label filter if provided
    if (labelId) {
      query = query.eq('label_id', labelId);
    }
    
    // Apply order and limit
    query = query
      .order('release_date', { ascending: false })
      .limit(limit);
      
    // Execute the query
    const { data: releases, error } = await query;
    
    if (error) {
      console.error('Error fetching top releases:', error);
      throw error;
    }
    
    if (!releases || releases.length === 0) {
      console.log('No top releases found');
      return [];
    }
    
    console.log(`Found ${releases.length} top releases in Supabase, attaching artist info...`);
    
    // Use helper function to attach artist information to releases
    const releasesWithArtists = await attachArtistInfoToReleases(releases);
    
    return releasesWithArtists;
  } catch (error) {
    console.error('Error fetching top releases from Supabase:', error);
    throw error;
  }
}

/**
 * Get a single release by ID
 * @param {string} releaseId - Release ID to fetch
 * @returns {Promise<Object>} Release object
 */
async function getRelease(releaseId) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  console.log(`Fetching single release with ID: ${releaseId}`);
  
  try {
    // First, get the basic release data
    const { data: release, error } = await supabase
      .from('releases')
      .select('*')
      .eq('id', releaseId)
      .single();
    
    if (error) {
      console.error('Error fetching release:', error);
      
      // Try alternate ID formats
      console.log('Trying to fetch release by spotify_id...');
      const { data: spotifyRelease, error: spotifyError } = await supabase
        .from('releases')
        .select('*')
        .eq('spotify_id', releaseId)
        .single();
      
      if (spotifyError) {
        console.error('Error fetching release by spotify_id:', spotifyError);
        return null;
      }
      
      if (spotifyRelease) {
        // Found by Spotify ID, now fetch the artists
        console.log(`Found release by spotify_id: ${releaseId}`);
        return await attachArtistInfoToReleases([spotifyRelease]).then(releases => releases[0]);
      }
      
      return null;
    }
    
    if (!release) {
      console.log(`No release found with ID: ${releaseId}`);
      return null;
    }
    
    // Fetch the artists associated with this release
    return await attachArtistInfoToReleases([release]).then(releases => releases[0]);
  } catch (error) {
    console.error('Error in getRelease function:', error);
    return null;
  }
}

/**
 * Fetch all releases associated with an artist
 * @param {Object} options Query options
 * @param {string} options.artistId Artist ID to filter releases by
 * @returns {Promise<Array>} Array of releases
 */
async function getReleasesByArtist({ artistId }) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  console.log(`Fetching releases for artist with ID: ${artistId}`);

  try {
    // First try the direct query using artist_id from the junction table
    let { data: releases, error } = await supabase
      .from('release_artists')
      .select(`
        release_id,
        releases:release_id (*)
      `)
      .eq('artist_id', artistId);

    // Process the nested results to get just the releases
    if (releases && releases.length > 0) {
      console.log(`Found ${releases.length} releases for artist ${artistId} via junction table`);
      // Extract actual release objects and filter out any nulls
      releases = releases
        .map(item => item.releases)
        .filter(release => release !== null);
      
      return releases;
    }

    // If no results, try using Spotify ID
    console.log('No releases found with artist ID, trying with Spotify ID...');
    
    // Find the artist by Spotify ID
    const { data: artists, error: artistError } = await supabase
      .from('artists')
      .select('id')
      .eq('spotify_id', artistId)
      .limit(1);
    
    if (artistError) {
      console.error('Error finding artist by Spotify ID:', artistError);
    }
    
    if (artists && artists.length > 0) {
      const internalArtistId = artists[0].id;
      console.log(`Found internal artist ID ${internalArtistId} for Spotify ID ${artistId}`);
      
      // Try the query again with internal ID
      const { data: retryReleases, error: retryError } = await supabase
        .from('release_artists')
        .select(`
          release_id,
          releases:release_id (*)
        `)
        .eq('artist_id', internalArtistId);
      
      if (retryError) {
        console.error('Error fetching releases with internal artist ID:', retryError);
      }
      
      if (retryReleases && retryReleases.length > 0) {
        console.log(`Found ${retryReleases.length} releases for artist with internal ID ${internalArtistId}`);
        // Extract actual release objects and filter out any nulls
        const processedReleases = retryReleases
          .map(item => item.releases)
          .filter(release => release !== null);
        
        return processedReleases;
      }
    }
    
    // If we still haven't found anything, return an empty array
    console.log(`No releases found for artist ID ${artistId}`);
    return [];
  } catch (error) {
    console.error('Error fetching releases for artist:', error);
    throw error;
  }
}

module.exports = {
  getArtistsByLabel,
  getReleases,
  getTopReleases,
  getReleasesByArtist,
  getRelease,
  attachArtistInfoToReleases
};
