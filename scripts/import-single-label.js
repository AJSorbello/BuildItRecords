/**
 * BuildIt Records Single Label Import Script
 * This script imports releases for a single label with enhanced error handling
 * and connection management for reliable database operations.
 */

require('dotenv').config({ path: '.env.supabase' });
const SpotifyWebApi = require('spotify-web-api-node');
const { Sequelize, Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Set SSL verification mode to false for development - important for Supabase connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Debug mode flag - set to true for more verbose logging
const DEBUG = true;

// Configuration
const BATCH_SIZE = 5; // Reduced batch size for more reliable processing
const RECONNECTION_DELAY = 3000; // ms between reconnection attempts
const OPERATION_TIMEOUT = 30000; // ms timeout for database operations
const MAX_RECONNECTION_ATTEMPTS = 5;

// Load models 
const models = require('../server/models');
let { Artist, Release, Track, Label, TrackArtist, ReleaseArtist } = models;

// Connection state
let dbConnectionAlive = true;
let reconnectionAttempts = 0;

// Enhanced logging
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data
  };
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data && Object.keys(data).length ? data : '');
  
  // Optionally write to file for persistent logs
  if (DEBUG) {
    try {
      const logDir = path.join(__dirname, '../logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const logFile = path.join(logDir, 'import-log.txt');
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    } catch (e) {
      console.error('Error writing to log file:', e.message);
    }
  }
}

// Setup connection health check
const checkConnection = async () => {
  try {
    log('debug', 'Checking database connection...');
    await Promise.race([
      models.sequelize.authenticate(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection check timeout')), OPERATION_TIMEOUT))
    ]);
    
    if (!dbConnectionAlive) {
      log('info', '✅ Database connection restored!');
      dbConnectionAlive = true;
      reconnectionAttempts = 0;
    }
    return true;
  } catch (error) {
    log('error', '❌ Database connection lost', { error: error.message });
    dbConnectionAlive = false;
    return await reconnectDatabase();
  }
};

// Reconnect to the database
const reconnectDatabase = async () => {
  if (reconnectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
    log('error', `Exceeded maximum reconnection attempts (${MAX_RECONNECTION_ATTEMPTS}). Giving up.`);
    return false;
  }
  
  reconnectionAttempts++;
  log('info', `Attempting to reconnect to database (attempt ${reconnectionAttempts}/${MAX_RECONNECTION_ATTEMPTS})...`);
  
  try {
    // Force close existing connection if it exists
    if (models.sequelize) {
      try {
        await models.sequelize.close();
      } catch (e) {
        log('warn', 'Error closing previous connection', { error: e.message });
      }
    }
    
    // Create a new Sequelize instance with enhanced SSL options
    const sequelize = new Sequelize(process.env.DB_NAME || 'postgres', process.env.DB_USERNAME || 'postgres', process.env.DB_PASSWORD, {
      host: process.env.DB_HOST || 'liuaozuvkmvanmchndzl.supabase.co',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
        keepAlive: true,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 60000,
        idle: 10000,
      },
      logging: false,
      retry: {
        max: 3,
        timeout: 30000
      }
    });
    
    // Test the new connection with a timeout
    await Promise.race([
      sequelize.authenticate(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Reconnection timeout')), OPERATION_TIMEOUT))
    ]);
    
    log('info', '✅ Successfully reconnected to database!');
    
    // Re-initialize models with the new connection
    models.sequelize = sequelize;
    models.Sequelize = Sequelize;
    
    // Reinitialize model references
    Artist = models.Artist;
    Release = models.Release;
    Track = models.Track;
    Label = models.Label;
    TrackArtist = models.TrackArtist;
    ReleaseArtist = models.ReleaseArtist;
    
    dbConnectionAlive = true;
    return true;
  } catch (error) {
    log('error', `❌ Reconnection attempt ${reconnectionAttempts} failed`, { error: error.message });
    // Wait before trying again
    await new Promise(resolve => setTimeout(resolve, RECONNECTION_DELAY));
    return false;
  }
};

// Configure Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID || '4fbf1324f46d4aa78e1533048cda96b5',
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET || 'b3b096fa2e51458993cb9e381ed25f38',
});

// Get spotify access token with timeout
async function getSpotifyToken() {
  try {
    log('info', 'Requesting Spotify access token...');
    const tokenResponse = await Promise.race([
      spotifyApi.clientCredentialsGrant(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Spotify token request timeout')), 15000))
    ]);
    spotifyApi.setAccessToken(tokenResponse.body.access_token);
    log('info', '✅ Spotify access token acquired');
    return tokenResponse.body.access_token;
  } catch (error) {
    log('error', 'Error getting Spotify access token', { error: error.message });
    throw error;
  }
}

// Search for all albums by a label
async function searchReleasesByLabel(labelName) {
  log('info', `Searching for releases by label: ${labelName}`);
  
  const releases = [];
  let offset = 0;
  const limit = 50;
  let totalAlbums = 0;
  let hasMoreAlbums = true;
  
  try {
    while (hasMoreAlbums) {
      // Use both the exact label name and common variations
      const searchQuery = `label:"${labelName}"`;
      log('debug', `Fetching albums with offset ${offset}...`);
      
      const albumsResponse = await Promise.race([
        spotifyApi.searchAlbums(searchQuery, { limit, offset }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Spotify search timeout')), 20000))
      ]);
      
      const albums = albumsResponse.body.albums.items;
      
      if (offset === 0) {
        totalAlbums = albumsResponse.body.albums.total;
        log('info', `Total albums for label ${labelName}: ${totalAlbums}`);
      }
      
      log('info', `Fetched ${albums.length} albums at offset ${offset}`);
      
      // Process each album
      if (albums && albums.length > 0) {
        for (const album of albums) {
          releases.push(album);
        }
        
        // Prepare for next page if needed
        offset += limit;
        hasMoreAlbums = albums.length === limit && offset < 500; // Safety limit of 500 releases
      } else {
        hasMoreAlbums = false;
      }
    }
    
    log('info', `Found ${releases.length} releases for label ${labelName}`);
    return releases;
  } catch (error) {
    log('error', `Error searching for releases by label ${labelName}`, { error: error.message });
    throw error;
  }
}

// Get full album details with tracks
async function getFullAlbumDetails(albumId) {
  try {
    log('debug', `Fetching details for album ${albumId}...`);
    const albumResponse = await Promise.race([
      spotifyApi.getAlbum(albumId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Album details timeout')), 15000))
    ]);
    return albumResponse.body;
  } catch (error) {
    log('error', `Error getting details for album ${albumId}`, { error: error.message });
    return null;
  }
}

// Safe database operation with timeout and reconnection
async function safeDbOperation(operation, errorMessage) {
  try {
    if (!dbConnectionAlive) {
      const reconnected = await reconnectDatabase();
      if (!reconnected) {
        throw new Error('Database connection not available');
      }
    }
    
    // Execute with timeout
    return await Promise.race([
      operation(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database operation timeout')), OPERATION_TIMEOUT))
    ]);
  } catch (error) {
    log('error', errorMessage, { error: error.message });
    
    // Check if it's a connection issue and try to reconnect
    if (error.name === 'SequelizeConnectionError' || error.message.includes('timeout') || error.message.includes('connection')) {
      log('warn', 'Connection issue detected, attempting to reconnect...');
      await reconnectDatabase();
    }
    
    throw error;
  }
}

// Process a single release
async function processRelease(release, labelId, stats) {
  try {
    log('info', `Processing release: "${release.name}" (${release.id})`);
    
    // Check if release already exists
    const existingRelease = await safeDbOperation(
      () => Release.findOne({ where: { id: release.id } }),
      `Error checking for existing release: ${release.name}`
    ).catch(() => null);
    
    if (existingRelease) {
      log('info', `Release "${release.name}" already exists (ID: ${release.id}), skipping`);
      stats.existingReleases++;
      stats.processedReleases++;
      return;
    }
    
    // Get full album details with tracks
    const fullAlbum = await getFullAlbumDetails(release.id);
    if (!fullAlbum) {
      log('warn', `Failed to get details for release "${release.name}", skipping`);
      stats.failedReleases++;
      return;
    }
    
    // Create the release
    log('info', `Creating new release: "${fullAlbum.name}"`);
    let newRelease;
    
    try {
      newRelease = await safeDbOperation(
        () => Release.create({
          id: fullAlbum.id,
          title: fullAlbum.name,
          release_date: fullAlbum.release_date,
          release_type: fullAlbum.album_type,
          artwork_url: fullAlbum.images[0]?.url || null,
          spotify_url: fullAlbum.external_urls.spotify,
          label_id: labelId
        }),
        `Error creating release: ${fullAlbum.name}`
      );
      
      log('info', `✅ Created release "${fullAlbum.name}" (ID: ${newRelease.id})`);
      stats.newReleases++;
    } catch (releaseError) {
      log('error', `Error creating release "${fullAlbum.name}"`, { error: releaseError.message });
      stats.failedReleases++;
      return; // Skip processing artists and tracks if release creation failed
    }
    
    // Process artists
    log('info', `Processing ${fullAlbum.artists.length} artists for release`);
    for (const artistData of fullAlbum.artists) {
      try {
        // First check if artist exists
        let artist = await safeDbOperation(
          () => Artist.findOne({ where: { id: artistData.id } }),
          `Error finding artist: ${artistData.name}`
        ).catch(() => null);
        
        // Create artist if it doesn't exist
        if (!artist) {
          try {
            log('info', `Creating new artist: "${artistData.name}"`);
            artist = await safeDbOperation(
              () => Artist.create({
                id: artistData.id,
                name: artistData.name,
                spotify_url: artistData.external_urls.spotify,
              }),
              `Error creating artist: ${artistData.name}`
            );
            stats.newArtists++;
            log('info', `✅ Created artist "${artistData.name}"`);
          } catch (artistError) {
            log('error', `Error creating artist "${artistData.name}"`, { error: artistError.message });
            continue;
          }
        } else {
          log('debug', `Artist "${artistData.name}" already exists`);
        }
        
        // Create release-artist association
        try {
          await safeDbOperation(
            () => ReleaseArtist.create({
              release_id: newRelease.id,
              artist_id: artist.id
            }),
            `Error linking artist to release: ${artistData.name}`
          );
          log('debug', `✅ Linked artist "${artistData.name}" to release "${newRelease.title}"`);
        } catch (releaseArtistError) {
          // If it's a unique constraint error, the association already exists
          log('debug', `Artist "${artistData.name}" already linked to this release`);
        }
      } catch (artistProcessError) {
        log('warn', `Error processing artist "${artistData.name}"`, { error: artistProcessError.message });
        // Continue with next artist
      }
    }
    
    // Process tracks
    log('info', `Processing ${fullAlbum.tracks.items.length} tracks for release`);
    for (let trackIndex = 0; trackIndex < fullAlbum.tracks.items.length; trackIndex++) {
      const trackData = fullAlbum.tracks.items[trackIndex];
      
      try {
        log('debug', `Creating track ${trackIndex + 1}/${fullAlbum.tracks.items.length}: "${trackData.name}"`);
        
        // Check if track already exists
        const existingTrack = await safeDbOperation(
          () => Track.findOne({ where: { id: trackData.id } }),
          `Error checking for existing track: ${trackData.name}`
        ).catch(() => null);
        
        if (existingTrack) {
          log('debug', `Track "${trackData.name}" already exists, skipping`);
          continue;
        }
        
        // Create the track
        const newTrack = await safeDbOperation(
          () => Track.create({
            id: trackData.id,
            title: trackData.name,
            duration_ms: trackData.duration_ms,
            track_number: trackData.track_number,
            disc_number: trackData.disc_number,
            spotify_url: trackData.external_urls.spotify,
            preview_url: trackData.preview_url,
            release_id: newRelease.id
          }),
          `Error creating track: ${trackData.name}`
        );
        
        log('debug', `✅ Created track "${trackData.name}"`);
        stats.newTracks++;
        
        // Process track artists
        for (const artistData of trackData.artists) {
          // Get or create artist (reusing previously created artists)
          let artist = await safeDbOperation(
            () => Artist.findOne({ where: { id: artistData.id } }),
            `Error finding artist for track: ${artistData.name}`
          ).catch(() => null);
          
          if (!artist) {
            try {
              log('debug', `Creating new artist for track: "${artistData.name}"`);
              artist = await safeDbOperation(
                () => Artist.create({
                  id: artistData.id,
                  name: artistData.name,
                  spotify_url: artistData.external_urls.spotify,
                }),
                `Error creating artist for track: ${artistData.name}`
              );
              stats.newArtists++;
              log('debug', `✅ Created artist "${artistData.name}"`);
            } catch (artistError) {
              log('warn', `Error creating artist "${artistData.name}"`, { error: artistError.message });
              continue;
            }
          }
          
          // Create track-artist association
          try {
            await safeDbOperation(
              () => TrackArtist.create({
                track_id: newTrack.id,
                artist_id: artist.id
              }),
              `Error linking artist to track: ${artistData.name}`
            );
            log('debug', `✅ Linked artist "${artistData.name}" to track "${newTrack.title}"`);
          } catch (trackArtistError) {
            log('debug', `Artist "${artistData.name}" already linked to this track`);
          }
        }
      } catch (trackError) {
        log('warn', `Error processing track "${trackData.name}"`, { error: trackError.message });
        // Continue with next track
      }
    }
    
    // Update stats
    stats.processedReleases++;
    log('info', `✅ Successfully processed release "${release.name}"`);
    
  } catch (releaseError) {
    log('error', `ERROR processing release "${release.name}"`, { error: releaseError.message });
    stats.failedReleases++;
  }
}

// Import releases from a single label
async function importSingleLabel(labelName, labelSlug, labelId) {
  log('info', `Starting import for label: ${labelName} (${labelSlug}, ID: ${labelId})`);
  
  // Initialize import stats
  const stats = {
    labelName,
    labelSlug,
    labelId,
    processedReleases: 0,
    newReleases: 0,
    existingReleases: 0,
    failedReleases: 0,
    newArtists: 0,
    newTracks: 0,
    startTime: new Date(),
    endTime: null,
    success: false
  };
  
  try {
    // Ensure database connection is active
    await checkConnection();
    
    // Get releases for this label
    const releases = await searchReleasesByLabel(labelName);
    
    if (releases.length === 0) {
      log('warn', `No releases found for label ${labelName}`);
      stats.success = true;
      stats.endTime = new Date();
      return stats;
    }
    
    log('info', `\n========== IMPORTING ${releases.length} RELEASES FOR ${labelSlug} ==========\n`);
    
    // Process releases in smaller batches
    const totalBatches = Math.ceil(releases.length / BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * BATCH_SIZE;
      const endIndex = Math.min((batchIndex + 1) * BATCH_SIZE, releases.length);
      const batchReleases = releases.slice(startIndex, endIndex);
      
      log('info', `\n----- PROCESSING BATCH ${batchIndex + 1}/${totalBatches} (Releases ${startIndex + 1}-${endIndex}/${releases.length}) -----\n`);
      
      // Check connection before processing batch
      await checkConnection();
      
      // Process each release in the batch sequentially
      for (let i = 0; i < batchReleases.length; i++) {
        const release = batchReleases[i];
        const overallIndex = startIndex + i;
        const progress = ((overallIndex + 1) / releases.length * 100).toFixed(1);
        
        log('info', `[${progress}%] Processing release ${overallIndex + 1}/${releases.length}: "${release.name}"`);
        
        await processRelease(release, labelId, stats);
        
        // Output progress after each release
        log('info', `\n----- IMPORT PROGRESS (${progress}%) -----`);
        log('info', `Processed releases: ${stats.processedReleases}/${releases.length}`);
        log('info', `New releases: ${stats.newReleases}`);
        log('info', `Existing releases: ${stats.existingReleases}`);
        log('info', `Failed releases: ${stats.failedReleases}`);
        log('info', `New artists: ${stats.newArtists}`);
        log('info', `New tracks: ${stats.newTracks}`);
        log('info', `----------------------------------`);
      }
      
      // Brief pause between batches to allow connections to reset
      if (batchIndex < totalBatches - 1) {
        log('info', '\n⏳ Pausing briefly between batches to reset connections...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Final stats
    log('info', `\n========== IMPORT COMPLETE FOR ${labelSlug} ==========`);
    log('info', `Total releases processed: ${stats.processedReleases}/${releases.length}`);
    log('info', `New releases: ${stats.newReleases}`);
    log('info', `Existing releases: ${stats.existingReleases}`);
    log('info', `Failed releases: ${stats.failedReleases}`);
    log('info', `New artists: ${stats.newArtists}`);
    log('info', `New tracks: ${stats.newTracks}`);
    log('info', `====================================================`);
    
    stats.success = true;
  } catch (error) {
    log('error', `Error importing label ${labelName}`, { error: error.message, stack: error.stack });
    stats.success = false;
    stats.error = error.message;
  } finally {
    stats.endTime = new Date();
    return stats;
  }
}

// Command line argument processing
async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  // Default label to import if none specified
  let labelToImport = 'Build It Records';
  let labelSlug = 'buildit-records';
  let labelId = '1';
  
  // Parse command line arguments
  if (args.length >= 1) {
    // Label name can be "Build It Records", "Build It Tech", or "Build It Deep"
    labelToImport = args[0];
    
    // Map to slug and ID
    if (labelToImport.toLowerCase().includes('tech')) {
      labelSlug = 'buildit-tech';
      labelId = '2';
    } else if (labelToImport.toLowerCase().includes('deep')) {
      labelSlug = 'buildit-deep';
      labelId = '3';
    }
  }
  
  log('info', `Starting import script for label: ${labelToImport} (${labelSlug}, ID: ${labelId})`);
  
  try {
    // Get Spotify token
    await getSpotifyToken();
    
    // Import the specified label
    const result = await importSingleLabel(labelToImport, labelSlug, labelId);
    
    // Write summary to file
    const summaryPath = path.join(__dirname, `../logs/import-summary-${labelSlug}-${Date.now()}.json`);
    try {
      const logDir = path.join(__dirname, '../logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.writeFileSync(summaryPath, JSON.stringify(result, null, 2));
      log('info', `Summary saved to: ${summaryPath}`);
    } catch (e) {
      log('error', 'Error writing summary file', { error: e.message });
    }
    
    log('info', `Import ${result.success ? 'completed successfully' : 'failed'} for label: ${labelToImport}`);
    log('info', `Duration: ${(result.endTime - result.startTime) / 1000} seconds`);
  } catch (error) {
    log('error', 'Main process error', { error: error.message, stack: error.stack });
  } finally {
    // Close database connection
    if (models.sequelize) {
      log('info', 'Closing database connection...');
      await models.sequelize.close().catch(err => {
        log('error', 'Error closing database connection', { error: err.message });
      });
    }
    
    log('info', 'Import script finished.');
  }
}

// Run the script
main().catch(err => {
  log('error', 'Fatal error in import script', { error: err.message, stack: err.stack });
  process.exit(1);
});
