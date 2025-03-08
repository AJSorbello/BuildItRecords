// Direct script to import data from Spotify API directly to Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js') // eslint-disable-line @typescript-eslint/no-var-requires;
const axios = require('axios') // eslint-disable-line @typescript-eslint/no-var-requires;
const SpotifyWebApi = require('spotify-web-api-node') // eslint-disable-line @typescript-eslint/no-var-requires;

// Supabase configuration (from .env file)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Spotify API configuration
const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: 'http://localhost:3000/callback'
};

// Label configurations
const LABELS = [
  {
    id: '1',
    name: 'BUILD IT RECORDS',
    spotifySearchTerms: [
      'Build It Records',
      'Build-It Records',
      'BuildIt Records'
    ]
  },
  {
    id: '2',
    name: 'BUILD IT TECH',
    spotifySearchTerms: [
      'Build It Tech',
      'Build-It Tech',
      'BuildIt Tech',
      'Build It Technology'
    ]
  },
  {
    id: '3',
    name: 'BUILD IT DEEP',
    spotifySearchTerms: [
      'Build It Deep',
      'Build-It Deep',
      'BuildIt Deep'
    ]
  }
];

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Spotify API client
const spotifyApi = new SpotifyWebApi(spotifyConfig);

// Main function
async function importDataToSupabase() {
  try {
    console.log('🚀 Starting direct import from Spotify to Supabase');
    console.log(`🔌 Connected to Supabase at: ${supabaseUrl}`);
    
    // Get Spotify access token
    console.log('🎵 Authenticating with Spotify API...');
    await authenticateSpotify();
    console.log('✅ Spotify authentication successful');
    
    // Check if albums table exists
    const { data: albumsTableCheck, error: albumsTableError } = await supabase
      .from('albums')
      .select('id')
      .limit(1);
    
    const hasAlbumsTable = !albumsTableError;
    
    if (!hasAlbumsTable) {
      console.log('⚠️ Albums table not found in Supabase. Will skip album imports.');
    }
    
    // Process each label
    for (const label of LABELS) {
      console.log(`\n📝 Processing label: ${label.name} (ID: ${label.id})`);
      
      // Verify label exists in Supabase
      await ensureLabelExists(label);
      
      // Import artists and albums for this label by searching
      for (const searchTerm of label.spotifySearchTerms) {
        console.log(`\n🔍 Searching for "${searchTerm}"...`);
        
        // Search for albums by label
        const albums = await searchAlbumsByLabel(searchTerm);
        console.log(`📀 Found ${albums.length} albums for search term: ${searchTerm}`);
        
        // Process each album
        for (const album of albums) {
          await processAlbum(album, label.id, hasAlbumsTable);
          // Add a small delay to avoid rate limiting
          await delay(500);
        }
      }
    }
    
    // Get final counts
    await displayFinalCounts();
    
    console.log('\n✅ Import completed successfully');
  } catch (error) {
    console.error('❌ Error during import:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Helper functions
async function authenticateSpotify() {
  // Get credentials from client credentials flow
  const authResponse = await axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    params: {
      grant_type: 'client_credentials'
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(spotifyConfig.clientId + ':' + spotifyConfig.clientSecret).toString('base64')
    }
  });
  
  // Set the access token
  spotifyApi.setAccessToken(authResponse.data.access_token);
  console.log(`Token expires in ${authResponse.data.expires_in} seconds`);
}

async function ensureLabelExists(label) {
  // Check if label exists
  const { data: existingLabel } = await supabase
    .from('labels')
    .select('*')
    .eq('id', label.id)
    .single();
  
  if (!existingLabel) {
    // Insert label if it doesn't exist
    const { data, error } = await supabase
      .from('labels')
      .insert([{ id: label.id, name: label.name }]);
    
    if (error) {
      console.error(`❌ Error creating label ${label.name}:`, error.message);
      throw error;
    }
    
    console.log(`✅ Created label: ${label.name}`);
  } else {
    console.log(`✅ Found existing label: ${label.name}`);
  }
}

async function searchAlbumsByLabel(labelName) {
  try {
    // Search for albums
    const response = await spotifyApi.searchAlbums(`label:"${labelName}"`, { limit: 50 });
    
    if (response.body.albums && response.body.albums.items) {
      return response.body.albums.items;
    }
    
    return [];
  } catch (error) {
    console.error(`❌ Error searching for albums with label ${labelName}:`, error.message);
    if (error.statusCode === 429) {
      console.log('⏳ Rate limited by Spotify. Waiting before retrying...');
      await delay(parseInt(error.headers['retry-after'] || 3) * 1000);
      return searchAlbumsByLabel(labelName);
    }
    return [];
  }
}

async function processAlbum(album, labelId, hasAlbumsTable) {
  try {
    console.log(`📀 Processing album: ${album.name} (ID: ${album.id})`);
    
    // Get full album details
    const albumDetails = await getAlbumDetails(album.id);
    
    // Process artists
    for (const artist of albumDetails.artists) {
      await processArtist(artist, labelId);
    }
    
    // Process tracks
    for (const track of albumDetails.tracks.items) {
      await processTrack(track, album.id, labelId);
    }
    
    // Record the release if albums table exists
    if (hasAlbumsTable) {
      await recordRelease(albumDetails, labelId);
    }
    
    console.log(`✅ Processed album: ${album.name}`);
  } catch (error) {
    console.error(`❌ Error processing album ${album.name}:`, error.message);
  }
}

async function getAlbumDetails(albumId) {
  try {
    const response = await spotifyApi.getAlbum(albumId);
    return response.body;
  } catch (error) {
    console.error(`❌ Error getting album details for ${albumId}:`, error.message);
    if (error.statusCode === 429) {
      console.log('⏳ Rate limited by Spotify. Waiting before retrying...');
      await delay(parseInt(error.headers['retry-after'] || 3) * 1000);
      return getAlbumDetails(albumId);
    }
    throw error;
  }
}

async function processArtist(artist, labelId) {
  try {
    // Check if artist already exists
    const { data: existingArtist } = await supabase
      .from('artists')
      .select('*')
      .eq('id', artist.id)
      .single();
    
    if (!existingArtist) {
      // Get more artist details from Spotify
      const artistDetails = await getArtistDetails(artist.id);
      
      // Prepare artist object based on schema
      const artistObj = {
        id: artist.id,
        name: artist.name,
        // Only add fields that exist in your schema
        spotify_url: artist.external_urls?.spotify,
        spotify_uri: artist.uri,
        label_id: labelId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Only add image if it exists
      if (artistDetails.images && artistDetails.images.length > 0) {
        // Use the correct field name based on your schema
        if (existingArtist && 'profile_image_url' in existingArtist) {
          artistObj.profile_image_url = artistDetails.images[0].url;
        } else if (existingArtist && 'image_url' in existingArtist) {
          artistObj.image_url = artistDetails.images[0].url;
        }
        // Add additional image fields if they exist in your schema
        if (existingArtist && 'profile_image_small_url' in existingArtist && artistDetails.images.length > 2) {
          artistObj.profile_image_small_url = artistDetails.images[2].url;
        }
        if (existingArtist && 'profile_image_large_url' in existingArtist && artistDetails.images.length > 0) {
          artistObj.profile_image_large_url = artistDetails.images[0].url;
        }
      }
      
      // Insert artist into Supabase
      const { data, error } = await supabase
        .from('artists')
        .insert([artistObj]);
      
      if (error) {
        console.error(`❌ Error inserting artist ${artist.name}:`, error.message);
      } else {
        console.log(`✅ Added artist: ${artist.name}`);
      }
    } else {
      // Ensure label_id is set
      if (!existingArtist.label_id) {
        const { data, error } = await supabase
          .from('artists')
          .update({ label_id: labelId, updated_at: new Date().toISOString() })
          .eq('id', artist.id);
        
        if (error) {
          console.error(`❌ Error updating artist ${artist.name} label:`, error.message);
        } else {
          console.log(`✅ Updated artist label: ${artist.name}`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error processing artist ${artist.name}:`, error.message);
  }
}

async function getArtistDetails(artistId) {
  try {
    const response = await spotifyApi.getArtist(artistId);
    return response.body;
  } catch (error) {
    console.error(`❌ Error getting artist details for ${artistId}:`, error.message);
    if (error.statusCode === 429) {
      console.log('⏳ Rate limited by Spotify. Waiting before retrying...');
      await delay(parseInt(error.headers['retry-after'] || 3) * 1000);
      return getArtistDetails(artistId);
    }
    return { images: [] }; // Return empty object to avoid failures
  }
}

async function processTrack(track, releaseId, labelId) {
  try {
    // Check if track already exists
    const { data: existingTrack } = await supabase
      .from('tracks')
      .select('*')
      .eq('id', track.id)
      .single();
    
    if (!existingTrack) {
      // Prepare track object based on schema
      const trackObj = {
        id: track.id,
        title: track.name,
        name: track.name,
        duration: Math.floor(track.duration_ms / 1000), // Convert to seconds
        track_number: track.track_number,
        disc_number: track.disc_number,
        preview_url: track.preview_url,
        release_id: releaseId,
        spotify_url: track.external_urls?.spotify,
        spotify_uri: track.uri,
        label_id: labelId,
        isrc: track.external_ids?.isrc || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert track into Supabase
      const { data, error } = await supabase
        .from('tracks')
        .insert([trackObj]);
      
      if (error) {
        console.error(`❌ Error inserting track ${track.name}:`, error.message);
      } else {
        console.log(`✅ Added track: ${track.name}`);
      }
    } else {
      // Ensure label_id is set
      if (!existingTrack.label_id) {
        const { data, error } = await supabase
          .from('tracks')
          .update({ label_id: labelId, updated_at: new Date().toISOString() })
          .eq('id', track.id);
        
        if (error) {
          console.error(`❌ Error updating track ${track.name} label:`, error.message);
        } else {
          console.log(`✅ Updated track label: ${track.name}`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error processing track ${track.name}:`, error.message);
  }
}

async function recordRelease(album, labelId) {
  try {
    // Check if release already exists in 'albums' table
    const { data: existingRelease } = await supabase
      .from('albums')
      .select('*')
      .eq('id', album.id)
      .single();
    
    if (!existingRelease) {
      // Prepare album object based on schema
      const albumObj = {
        id: album.id,
        name: album.name,
        title: album.name,
        release_date: album.release_date,
        total_tracks: album.total_tracks,
        spotify_url: album.external_urls?.spotify,
        spotify_uri: album.uri,
        label_id: labelId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Only add artwork if it exists
      if (album.images && album.images.length > 0) {
        // Use the correct field name based on your schema
        albumObj.artwork_url = album.images[0].url;
      }
      
      // Insert release into Supabase
      const { data, error } = await supabase
        .from('albums')
        .insert([albumObj]);
      
      if (error) {
        console.error(`❌ Error inserting release ${album.name}:`, error.message);
      } else {
        console.log(`✅ Added release: ${album.name}`);
        
        // Create album-artist associations
        for (const artist of album.artists) {
          try {
            const { data: artistAlbumData, error: artistAlbumError } = await supabase
              .from('album_artists')
              .insert([{
                album_id: album.id,
                artist_id: artist.id
              }]);
            
            if (artistAlbumError) {
              console.error(`❌ Error creating album-artist association:`, artistAlbumError.message);
            }
          } catch (linkError) {
            console.error(`❌ Error linking album and artist:`, linkError.message);
          }
        }
      }
    } else {
      // Ensure label_id is set
      if (!existingRelease.label_id) {
        const { data, error } = await supabase
          .from('albums')
          .update({ label_id: labelId, updated_at: new Date().toISOString() })
          .eq('id', album.id);
        
        if (error) {
          console.error(`❌ Error updating release ${album.name} label:`, error.message);
        } else {
          console.log(`✅ Updated release label: ${album.name}`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error recording release ${album.name}:`, error.message);
  }
}

async function displayFinalCounts() {
  // Get counts from Supabase
  const { data: labelCounts, error: labelError } = await supabase
    .from('labels')
    .select('*');
  
  const { data: artistCount, error: artistError } = await supabase
    .from('artists')
    .select('count', { count: 'exact', head: true });
  
  const { data: trackCount, error: trackError } = await supabase
    .from('tracks')
    .select('count', { count: 'exact', head: true });
  
  const { data: albumCount, error: albumError } = await supabase
    .from('albums')
    .select('count', { count: 'exact', head: true });
  
  // Get counts by label
  const { data: artistsByLabel, error: artistsLabelError } = await supabase
    .from('artists')
    .select('label_id, count')
    .group('label_id');
  
  const { data: tracksByLabel, error: tracksLabelError } = await supabase
    .from('tracks')
    .select('label_id, count')
    .group('label_id');
  
  console.log('\n📊 Final Counts in Supabase:');
  console.log(`Labels: ${labelCounts?.length || 0}`);
  console.log(`Artists: ${artistCount?.[0]?.count || 0}`);
  console.log(`Tracks: ${trackCount?.[0]?.count || 0}`);
  console.log(`Albums: ${albumCount?.[0]?.count || 0}`);
  
  console.log('\n📊 Artists by Label:');
  if (artistsByLabel) {
    artistsByLabel.forEach(item => {
      const labelName = LABELS.find(l => l.id === item.label_id)?.name || item.label_id;
      console.log(`${labelName}: ${item.count}`);
    });
  }
  
  console.log('\n📊 Tracks by Label:');
  if (tracksByLabel) {
    tracksByLabel.forEach(item => {
      const labelName = LABELS.find(l => l.id === item.label_id)?.name || item.label_id;
      console.log(`${labelName}: ${item.count}`);
    });
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the import
importDataToSupabase().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
