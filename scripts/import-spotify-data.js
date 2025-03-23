/**
 * BuildIt Records Spotify Import Script
 * 
 * This script imports all releases and artists from Spotify for BuildIt Records labels
 * It populates the database with complete release data, fixing the issue of only compilation albums showing
 */

const { Pool } = require('pg');
const SpotifyWebApi = require('spotify-web-api-node');
const { databaseConfig, spotifyConfig, LABEL_MAPPINGS } = require('./import-config');

// Configure database connection from config
const pool = new Pool({
  host: databaseConfig.host,
  port: databaseConfig.port,
  database: databaseConfig.database,
  user: databaseConfig.user,
  password: databaseConfig.password,
  ssl: databaseConfig.ssl
});

// Configure Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: spotifyConfig.clientId,
  clientSecret: spotifyConfig.clientSecret,
});

// Get spotify access token
async function getSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);
    console.log('Spotify access token acquired');
    return data.body.access_token;
  } catch (error) {
    console.error('Error getting Spotify access token:', error.message);
    throw error;
  }
}

// Search for all albums by a label
async function searchReleasesByLabel(labelName) {
  console.log(`Searching for releases by label: ${labelName}`);
  
  const releases = [];
  let offset = 0;
  const limit = 50; // Spotify's maximum limit
  let hasMore = true;
  let totalAlbums = 0;

  while (hasMore) {
    try {
      // Use exact label match with quotes
      const searchQuery = `label:"${labelName}"`;
      const result = await spotifyApi.searchAlbums(searchQuery, { limit, offset });
      
      if (!result.body.albums || !result.body.albums.items || result.body.albums.items.length === 0) {
        console.log(`No more albums found for label: ${labelName} at offset ${offset}`);
        hasMore = false;
        continue;
      }

      const albums = result.body.albums.items;
      console.log(`Fetched ${albums.length} albums at offset ${offset}`);
      
      // Update total on first request
      if (offset === 0) {
        totalAlbums = result.body.albums.total;
        console.log(`Total albums for label ${labelName}: ${totalAlbums}`);
      }

      // Get detailed album info for each result
      for (const album of albums) {
        try {
          const albumDetails = await spotifyApi.getAlbum(album.id);
          releases.push(albumDetails.body);
          
          // Add a small delay to prevent hitting rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error fetching details for album ${album.id}:`, error.message);
        }
      }

      offset += albums.length;
      hasMore = offset < totalAlbums;

      // Add delay between batches
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error searching albums for label ${labelName}:`, error.message);
      
      // If rate limited, wait and try again
      if (error.statusCode === 429 && error.headers && error.headers['retry-after']) {
        const retryAfter = parseInt(error.headers['retry-after'], 10) * 1000;
        console.log(`Rate limited, waiting ${retryAfter/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
      } else {
        // For other errors, break the loop
        hasMore = false;
      }
    }
  }

  return releases;
}

// Save releases to database
async function saveReleasesToDatabase(releases, labelSlug, labelId) {
  console.log(`Saving ${releases.length} releases for label: ${labelSlug}`);
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const release of releases) {
      try {
        // Try to find existing release by spotify_id
        const existingRelease = await client.query(
          'SELECT id FROM releases WHERE id = $1 OR spotify_url = $2',
          [release.id, release.external_urls?.spotify]
        );
        
        let releaseId;
        
        if (existingRelease.rows.length === 0) {
          // Create new release
          const result = await client.query(`
            INSERT INTO releases (
              id, title, release_type, release_date, artwork_url, 
              spotify_url, label_id, images, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            RETURNING id
          `, [
            release.id,
            release.name,
            release.album_type || 'album',
            release.release_date || new Date().toISOString().split('T')[0],
            release.images && release.images.length > 0 ? release.images[0].url : null,
            release.external_urls?.spotify,
            labelId,
            JSON.stringify(release.images || [])
          ]);
          
          releaseId = result.rows[0].id;
          console.log(`Created new release: ${release.name} (${releaseId})`);
        } else {
          releaseId = existingRelease.rows[0].id;
          console.log(`Release already exists: ${release.name} (${releaseId})`);
          
          // Update existing release
          await client.query(`
            UPDATE releases SET 
              title = $1, release_type = $2, release_date = $3, artwork_url = $4,
              spotify_url = $5, label_id = $6, images = $7, updated_at = NOW()
            WHERE id = $8
          `, [
            release.name,
            release.album_type || 'album',
            release.release_date || new Date().toISOString().split('T')[0],
            release.images && release.images.length > 0 ? release.images[0].url : null,
            release.external_urls?.spotify,
            labelId,
            JSON.stringify(release.images || []),
            releaseId
          ]);
        }
        
        // Process artists for this release
        for (const artist of release.artists) {
          // Find or create artist
          let artistId;
          const existingArtist = await client.query(
            'SELECT id FROM artists WHERE id = $1 OR spotify_url = $2',
            [artist.id, artist.external_urls?.spotify]
          );
          
          if (existingArtist.rows.length === 0) {
            // Get full artist details from Spotify
            const artistDetails = await spotifyApi.getArtist(artist.id);
            const fullArtist = artistDetails.body;
            
            // Create new artist
            const result = await client.query(`
              INSERT INTO artists (
                id, name, spotify_url, image_url, images, 
                label_id, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
              RETURNING id
            `, [
              artist.id,
              artist.name,
              artist.external_urls?.spotify,
              fullArtist.images && fullArtist.images.length > 0 ? fullArtist.images[0].url : null,
              JSON.stringify(fullArtist.images || []),
              labelId
            ]);
            
            artistId = result.rows[0].id;
            console.log(`Created new artist: ${artist.name} (${artistId})`);
          } else {
            artistId = existingArtist.rows[0].id;
            console.log(`Artist already exists: ${artist.name} (${artistId})`);
          }
          
          // Create release_artists junction record
          try {
            await client.query(`
              INSERT INTO release_artists (release_id, artist_id, created_at, updated_at)
              VALUES ($1, $2, NOW(), NOW())
              ON CONFLICT (release_id, artist_id) DO NOTHING
            `, [releaseId, artistId]);
            console.log(`Associated artist ${artistId} with release ${releaseId}`);
          } catch (error) {
            console.error(`Error creating release-artist association: ${error.message}`);
          }
        }
        
        // Process tracks for this release
        if (release.tracks && release.tracks.items) {
          for (const track of release.tracks.items) {
            try {
              // Find or create track
              const existingTrack = await client.query(
                'SELECT id FROM tracks WHERE id = $1 OR spotify_url = $2',
                [track.id, track.external_urls?.spotify]
              );
              
              let trackId;
              
              if (existingTrack.rows.length === 0) {
                // Create new track
                const result = await client.query(`
                  INSERT INTO tracks (
                    id, title, duration_ms, track_number, disc_number,
                    preview_url, spotify_url, release_id, created_at, updated_at
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                  RETURNING id
                `, [
                  track.id,
                  track.name,
                  track.duration_ms,
                  track.track_number,
                  track.disc_number || 1,
                  track.preview_url,
                  track.external_urls?.spotify,
                  releaseId
                ]);
                
                trackId = result.rows[0].id;
                console.log(`Created new track: ${track.name} (${trackId})`);
              } else {
                trackId = existingTrack.rows[0].id;
                console.log(`Track already exists: ${track.name} (${trackId})`);
              }
              
              // Process track artists
              for (const artist of track.artists) {
                // Find or create artist (similar to above)
                let artistId;
                const existingArtist = await client.query(
                  'SELECT id FROM artists WHERE id = $1 OR spotify_url = $2',
                  [artist.id, artist.external_urls?.spotify]
                );
                
                if (existingArtist.rows.length === 0) {
                  // Create new artist (abbreviated version)
                  const result = await client.query(`
                    INSERT INTO artists (id, name, spotify_url, created_at, updated_at)
                    VALUES ($1, $2, $3, NOW(), NOW())
                    RETURNING id
                  `, [
                    artist.id,
                    artist.name,
                    artist.external_urls?.spotify
                  ]);
                  
                  artistId = result.rows[0].id;
                } else {
                  artistId = existingArtist.rows[0].id;
                }
                
                // Create track_artists junction record
                try {
                  await client.query(`
                    INSERT INTO track_artists (track_id, artist_id, created_at, updated_at)
                    VALUES ($1, $2, NOW(), NOW())
                    ON CONFLICT (track_id, artist_id) DO NOTHING
                  `, [trackId, artistId]);
                } catch (error) {
                  console.error(`Error creating track-artist association: ${error.message}`);
                }
              }
            } catch (error) {
              console.error(`Error processing track ${track.name}: ${error.message}`);
            }
          }
        }
        
      } catch (releaseError) {
        console.error(`Error processing release ${release.name}:`, releaseError.message);
        // Continue with next release
      }
    }
    
    await client.query('COMMIT');
    console.log(`Successfully saved ${releases.length} releases to database`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving releases to database:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Main function
async function main() {
  try {
    // Get Spotify access token
    await getSpotifyToken();
    
    // Process each label
    for (const [labelName, [labelSlug, labelId]] of Object.entries(LABEL_MAPPINGS)) {
      console.log(`Processing label: ${labelName} (${labelSlug}, ID: ${labelId})`);
      
      // Search for releases
      const releases = await searchReleasesByLabel(labelName);
      console.log(`Found ${releases.length} releases for label ${labelName}`);
      
      // Save releases to database
      await saveReleasesToDatabase(releases, labelSlug, labelId);
    }
    
    console.log('Import completed successfully');
  } catch (error) {
    console.error('Import failed:', error.message);
  } finally {
    // Close database connection
    pool.end();
  }
}

// Run the script
main();
