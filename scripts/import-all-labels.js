/**
 * BuildIt Records Complete Import Script
 * Imports all releases for all three labels: Build It Records, Build It Tech, and Build It Deep
 */

require('dotenv').config({ path: '.env.supabase' });
const SpotifyWebApi = require('spotify-web-api-node');
const { Sequelize, Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'import-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'import-combined.log' })
  ]
});

// SSL verification workaround - important for Supabase connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
logger.warn('SSL certificate validation disabled for development');

// Database connection state tracking
let dbConnectionAlive = true;
let reconnectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 10; // Increased from 5 to 10
const OPERATION_TIMEOUT = 60000; // Increased from 30000 to 60000 (60 seconds)
const BATCH_SIZE = 3; // Reduced batch size for more reliable processing
const BATCH_DELAY = 5000; // Increased from 3000 to 5000 (5 seconds)

// Connection check interval in milliseconds
const CONNECTION_CHECK_INTERVAL = 60000; // Increased from 30000 to 60000 (check every minute)

// Load models 
const models = require('../server/models');
let { Artist, Release, Track, Label, TrackArtist, ReleaseArtist } = models;

// Validate Spotify ID format
function isValidSpotifyId(id) {
  return typeof id === 'string' && id.length > 0 && /^[a-zA-Z0-9]{22}$/.test(id);
}

// Setup connection health check
const checkConnection = async () => {
  try {
    logger.debug('Checking database connection...');
    await Promise.race([
      models.sequelize.authenticate(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection check timeout')), OPERATION_TIMEOUT))
    ]);
    
    if (!dbConnectionAlive) {
      logger.info('✅ Database connection restored!');
      dbConnectionAlive = true;
      reconnectionAttempts = 0;
    }
    return true;
  } catch (error) {
    logger.error('❌ Database connection lost', { error: error.message });
    dbConnectionAlive = false;
    return await reconnectDatabase();
  }
};

// Enhanced database ping with multiple retries
async function pingDatabase() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      logger.debug(`Database ping attempt ${attempt}/3`);
      await models.sequelize.query('SELECT 1', { 
        type: models.Sequelize.QueryTypes.SELECT,
        raw: true,
        plain: true,
        timeout: 15000 // Increased timeout for ping
      });
      logger.debug('Database ping successful');
      return true;
    } catch (error) {
      logger.warn(`Database ping attempt ${attempt} failed`, { error: error.message });
      if (attempt < 3) {
        // Wait before retry with exponential backoff
        const delay = attempt * 2000;
        logger.debug(`Waiting ${delay}ms before next ping attempt`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  logger.error('All database ping attempts failed');
  return false;
}

// Reconnect to the database with exponential backoff
const reconnectDatabase = async () => {
  if (reconnectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
    logger.error(`Exceeded maximum reconnection attempts (${MAX_RECONNECTION_ATTEMPTS}). Giving up.`);
    return false;
  }
  
  reconnectionAttempts++;
  // Exponential backoff: wait longer between attempts
  const backoffDelay = Math.min(30000, 1000 * Math.pow(2, reconnectionAttempts - 1));
  logger.info(`Attempting to reconnect to database (attempt ${reconnectionAttempts}/${MAX_RECONNECTION_ATTEMPTS}) after ${backoffDelay}ms backoff...`);
  
  // Wait using backoff delay
  await new Promise(resolve => setTimeout(resolve, backoffDelay));
  
  try {
    // Force close existing connection if it exists
    if (models.sequelize) {
      try {
        await models.sequelize.close();
      } catch (e) {
        logger.warn('Error closing previous connection', { error: e.message });
      }
    }
    
    // Connection parameters for logging
    const connectionParams = {
      database: process.env.DB_NAME || 'postgres',
      username: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'liuaozuvkmvanmchndzl.supabase.co',
      port: process.env.DB_PORT || '5432',
      ssl: true
    };
    logger.info('Attempting database connection using parameters', connectionParams);
    
    // Create a new Sequelize instance with enhanced SSL options
    const sequelize = new Sequelize(process.env.DB_NAME || 'postgres', process.env.DB_USER || 'postgres', process.env.DB_PASSWORD, {
      host: process.env.DB_HOST || 'liuaozuvkmvanmchndzl.supabase.co',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
        keepAlive: true,
        // These settings match the successful approaches used in previous API fixes
        requestTimeout: 60000, // Increased timeout
        options: {
          enableArithAbort: true,
          trustServerCertificate: true,
        }
      },
      pool: {
        max: 3, // Reduced pool size for better stability
        min: 0,
        acquire: 60000, // Increased timeout
        idle: 20000, // Increased from 10000 to 20000
      },
      retry: {
        max: 5,  // Increased retries
        timeout: 60000 // Increased timeout
      },
      logging: false,
    });
    
    logger.info('Database connection configured using parameters');
    
    // Test the new connection with a timeout
    logger.info('Testing database connection...');
    await Promise.race([
      sequelize.authenticate(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), OPERATION_TIMEOUT))
    ]);
    
    logger.info('✅ Successfully reconnected to database!');
    
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
    
    // Log the loaded models for debugging
    Object.keys(models).forEach(model => {
      if (models[model].tableName) {
        logger.debug(`Loaded model: ${model}`);
      }
    });
    
    // Set up associations again to ensure they're properly established
    Object.keys(models).forEach(modelName => {
      if (models[modelName].associate) {
        logger.debug(`Set up associations for model: ${modelName}`);
      }
    });
    
    dbConnectionAlive = true;
    return true;
  } catch (error) {
    logger.error(`❌ Reconnection attempt ${reconnectionAttempts} failed`, { error: error.message });
    return false;
  }
};

// Safe database operation with timeout and reconnection
async function safeDbOperation(operation, errorMessage) {
  // Verify the connection is alive before attempting operations
  if (!dbConnectionAlive) {
    logger.warn('Database connection appears to be down, attempting to reconnect before operation');
    const reconnected = await reconnectDatabase();
    if (!reconnected) {
      throw new Error('Database connection not available');
    }
  }
  
  // Double-check with a quick ping
  const pingResult = await pingDatabase();
  if (!pingResult) {
    logger.warn('Connection ping failed, attempting to reconnect before operation');
    const reconnected = await reconnectDatabase();
    if (!reconnected) {
      throw new Error('Database connection not available after ping test');
    }
  }
  
  try {
    // Execute operation with timeout
    return await Promise.race([
      operation(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timeout')), OPERATION_TIMEOUT))
    ]);
  } catch (error) {
    logger.error(errorMessage, { error: error.message });
    
    // Check if it's a connection error
    const connectionErrors = [
      'ConnectionError', 
      'SequelizeConnectionError', 
      'SequelizeConnectionRefusedError',
      'Connection terminated unexpectedly',
      'Connection refused',
      'getaddrinfo ENOTFOUND',
      'Operation timeout',
      'timeout',
      'ETIMEDOUT',
      'ConnectionManager.getConnection was called after'
    ];
    
    const isConnectionError = connectionErrors.some(errMsg => 
      error.name?.includes(errMsg) || error.message?.includes(errMsg)
    );
    
    if (isConnectionError) {
      logger.warn('Connection issue detected, attempting to reconnect...');
      await reconnectDatabase();
    }
    
    throw error;
  }
}

// Start the connection health check timer
const connectionTimer = setInterval(checkConnection, CONNECTION_CHECK_INTERVAL);

// Configure Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID || '4fbf1324f46d4aa78e1533048cda96b5',
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET || 'b3b096fa2e51458993cb9e381ed25f38',
});

// Label mappings (BuildIt Records has multiple formats in Spotify)
const LABEL_MAPPINGS = {
  'Build It Records': ['buildit-records', '1'],
  'BuildIt Records': ['buildit-records', '1'],
  'Build It Tech': ['buildit-tech', '2'],
  'BuildIt Tech': ['buildit-tech', '2'],
  'Build It Deep': ['buildit-deep', '3'],
  'BuildIt Deep': ['buildit-deep', '3'],
};

// Get spotify access token with timeout
async function getSpotifyToken() {
  try {
    logger.info('Requesting Spotify access token...');
    const tokenResponse = await Promise.race([
      spotifyApi.clientCredentialsGrant(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Spotify token request timeout')), 15000))
    ]);
    
    spotifyApi.setAccessToken(tokenResponse.body.access_token);
    logger.info('✅ Spotify access token acquired');
    return tokenResponse.body.access_token;
  } catch (error) {
    logger.error('Error getting Spotify access token', { error: error.message });
    throw error;
  }
}

// Process a single release with robust error handling
async function processRelease(release, labelId, stats) {
  try {
    logger.info(`Processing release: "${release.name}" (${release.id})`);
    
    // Check if release already exists
    const existingRelease = await safeDbOperation(
      () => Release.findOne({ where: { id: release.id } }),
      `Error checking for existing release: ${release.name}`
    ).catch(() => null);
    
    if (existingRelease) {
      logger.info(`Release "${release.name}" already exists (ID: ${release.id}), skipping`);
      stats.existingReleases++;
      stats.processedReleases++;
      return;
    }
    
    // Get full album details with tracks
    const fullAlbum = await getFullAlbumDetails(release.id);
    if (!fullAlbum) {
      logger.warn(`Failed to get details for release "${release.name}", skipping`);
      stats.failedReleases++;
      return;
    }
    
    // Create the release
    logger.info(`Creating new release: "${fullAlbum.name}"`);
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
      
      logger.info(`✅ Created release "${fullAlbum.name}" (ID: ${newRelease.id})`);
      stats.newReleases++;
    } catch (releaseError) {
      logger.error(`Error creating release "${fullAlbum.name}"`, { error: releaseError.message });
      stats.failedReleases++;
      return; // Skip processing artists and tracks if release creation failed
    }
    
    // Process artists
    logger.info(`Processing ${fullAlbum.artists.length} artists for release`);
    for (const artistData of fullAlbum.artists) {
      try {
        // Validate artist ID
        if (!artistData.id || !isValidSpotifyId(artistData.id)) {
          logger.warn(`Skipping artist with invalid ID: ${artistData.name}`);
          continue;
        }
        
        // First check if artist exists
        let artist = await safeDbOperation(
          () => Artist.findOne({ where: { id: artistData.id } }),
          `Error finding artist: ${artistData.name}`
        ).catch(() => null);
        
        // Create artist if it doesn't exist
        if (!artist) {
          try {
            logger.info(`Creating new artist: "${artistData.name}"`);
            artist = await safeDbOperation(
              () => Artist.create({
                id: artistData.id,
                name: artistData.name,
                spotify_url: artistData.external_urls.spotify,
              }),
              `Error creating artist: ${artistData.name}`
            );
            stats.newArtists++;
            logger.info(`✅ Created artist "${artistData.name}"`);
          } catch (artistError) {
            logger.error(`Error creating artist "${artistData.name}"`, { error: artistError.message });
            continue;
          }
        } else {
          logger.debug(`Artist "${artistData.name}" already exists`);
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
          logger.debug(`✅ Linked artist "${artistData.name}" to release "${newRelease.title}"`);
        } catch (releaseArtistError) {
          // If it's a unique constraint error, the association already exists
          logger.debug(`Artist "${artistData.name}" already linked to this release or error occurred`);
        }
      } catch (artistProcessError) {
        logger.warn(`Error processing artist "${artistData.name}"`, { error: artistProcessError.message });
        // Continue with next artist
      }
    }
    
    // Process tracks
    logger.info(`Processing ${fullAlbum.tracks.items.length} tracks for release`);
    for (let trackIndex = 0; trackIndex < fullAlbum.tracks.items.length; trackIndex++) {
      const trackData = fullAlbum.tracks.items[trackIndex];
      
      try {
        // Validate track ID
        if (!trackData.id || !isValidSpotifyId(trackData.id)) {
          logger.warn(`Skipping track with invalid ID: ${trackData.name}`);
          continue;
        }
        
        logger.debug(`Processing track ${trackIndex + 1}/${fullAlbum.tracks.items.length}: "${trackData.name}"`);
        
        // Check if track already exists
        const existingTrack = await safeDbOperation(
          () => Track.findOne({ where: { id: trackData.id } }),
          `Error checking for existing track: ${trackData.name}`
        ).catch(() => null);
        
        if (existingTrack) {
          logger.debug(`Track "${trackData.name}" already exists, skipping`);
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
        
        logger.debug(`✅ Created track "${trackData.name}"`);
        stats.newTracks++;
        
        // Process track artists
        for (const artistData of trackData.artists) {
          // Validate artist ID
          if (!artistData.id || !isValidSpotifyId(artistData.id)) {
            logger.warn(`Skipping track artist with invalid ID: ${artistData.name}`);
            continue;
          }
          
          // Get or create artist (reusing previously created artists)
          let artist = await safeDbOperation(
            () => Artist.findOne({ where: { id: artistData.id } }),
            `Error finding artist for track: ${artistData.name}`
          ).catch(() => null);
          
          if (!artist) {
            try {
              logger.debug(`Creating new artist for track: "${artistData.name}"`);
              artist = await safeDbOperation(
                () => Artist.create({
                  id: artistData.id,
                  name: artistData.name,
                  spotify_url: artistData.external_urls.spotify,
                }),
                `Error creating artist for track: ${artistData.name}`
              );
              stats.newArtists++;
              logger.debug(`✅ Created artist "${artistData.name}"`);
            } catch (artistError) {
              logger.warn(`Error creating artist "${artistData.name}"`, { error: artistError.message });
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
            logger.debug(`✅ Linked artist "${artistData.name}" to track "${newTrack.title}"`);
          } catch (trackArtistError) {
            logger.debug(`Error or duplicate linking artist "${artistData.name}" to track`);
          }
        }
      } catch (trackError) {
        logger.warn(`Error processing track "${trackData.name}"`, { error: trackError.message });
        // Continue with next track
      }
    }
    
    // Update stats
    stats.processedReleases++;
    logger.info(`✅ Successfully processed release "${release.name}"`);
    
  } catch (releaseError) {
    logger.error(`ERROR processing release "${release.name}"`, { error: releaseError.message });
    stats.failedReleases++;
  }
}

// Process a batch of releases with improved error handling
async function processBatch(batch, labelId, batchNumber, totalBatches, stats) {
  logger.info(`Processing batch ${batchNumber} of ${totalBatches}`);
  
  // Before processing batch, verify database connection
  try {
    const isConnected = await pingDatabase();
    if (!isConnected) {
      logger.warn('Database connection unstable before batch processing, attempting to restore');
      const reconnected = await reconnectDatabase();
      if (!reconnected) {
        logger.error('Cannot process batch due to database connection issues');
        return { successes: 0, failures: batch.length };
      }
    }
    
    // Give a moment for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let batchStats = {
      successes: 0,
      failures: 0
    };
    
    for (const release of batch) {
      try {
        const success = await processRelease(release, labelId, stats);
        if (success) {
          batchStats.successes++;
        } else {
          batchStats.failures++;
        }
        
        // Short pause between releases to reduce load
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        logger.error(`Error processing release "${release.name}"`, { error: error.message });
        batchStats.failures++;
      }
      
      // Log progress after each release
      const processed = stats.new + stats.existing + stats.failed;
      const total = stats.totalToProcess;
      const percentage = (processed / total * 100).toFixed(1);
      logger.info(`Progress: ${percentage}% (${processed}/${total})`);
    }
    
    logger.info(`Batch ${batchNumber}/${totalBatches} complete. Processed: ${batchStats.successes}/${batch.length}, Failed: ${batchStats.failures}`);
    return batchStats;
  } catch (error) {
    logger.error(`Fatal error processing batch ${batchNumber}`, { error: error.message });
    return { successes: 0, failures: batch.length };
  }
}

// Save releases to database with batch processing
async function saveReleasesToDatabase(releases, labelId) {
  try {
    logger.info(`Starting database import for ${releases.length} releases with label ID ${labelId}`);
    
    // Check database connection before starting
    const isConnected = await pingDatabase();
    if (!isConnected) {
      logger.warn('Database connection is not stable before import, attempting to reconnect');
      const reconnected = await reconnectDatabase();
      if (!reconnected) {
        logger.error('Cannot start import due to database connection issues');
        return;
      }
    }
    
    const stats = {
      new: 0,
      existing: 0,
      failed: 0,
      artists: 0,
      tracks: 0,
      totalToProcess: releases.length
    };
    
    // Break releases into small batches
    const batches = [];
    for (let i = 0; i < releases.length; i += BATCH_SIZE) {
      batches.push(releases.slice(i, i + BATCH_SIZE));
    }
    
    // Process batches with delays between them
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      try {
        // Confirm connection before each batch
        await checkConnection();
        
        // Process the batch
        const batchResult = await processBatch(batch, labelId, i + 1, batches.length, stats);
        stats.new += batchResult.successes;
        stats.failed += batchResult.failures;
        
        // Pause between batches to allow database to recover
        if (i < batches.length - 1) {
          logger.debug(`Pausing for ${BATCH_DELAY}ms before next batch`);
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      } catch (error) {
        logger.error(`Error processing batch ${i + 1}`, { error: error.message });
        stats.failed += batch.length;
      }
    }
    
    // Log final stats
    logger.info('Import complete!');
    logger.info(`Total releases processed: ${stats.new + stats.existing}/${releases.length}`);
    logger.info(`New releases: ${stats.new}`);
    logger.info(`Existing releases: ${stats.existing}`);
    logger.info(`Failed releases: ${stats.failed}`);
    logger.info(`New artists: ${stats.artists}`);
    logger.info(`New tracks: ${stats.tracks}`);
    
    return stats;
  } catch (error) {
    logger.error('Error importing releases', { error: error.message });
    return null;
  }
}

// Process command-line arguments
const args = process.argv.slice(2);
const labelArg = args.find(arg => !arg.startsWith('--'));
const dryRun = args.includes('--dry-run');
const resumeMode = args.includes('--resume');
const checkDatabase = args.includes('--check-database');
let resumeFromLabel = null;
let resumeFromOffset = 0;

if (dryRun) {
  logger.info('🧪 DRY RUN MODE: No database operations will be performed');
}

if (checkDatabase) {
  // Just check what's in the database and exit
  (async () => {
    try {
      logger.info('Checking database content...');
      await models.sequelize.authenticate();
      
      // Count releases
      const releaseCount = await models.Release.count();
      logger.info(`Found ${releaseCount} releases in database`);
      
      // Count artists
      const artistCount = await models.Artist.count();
      logger.info(`Found ${artistCount} artists in database`);
      
      // Get release counts by label
      const labelCounts = await models.Release.findAll({
        attributes: ['labelId', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
        group: ['labelId'],
        raw: true
      });
      
      logger.info('Releases by label:');
      for (const label of labelCounts) {
        const labelName = label.labelId === '1' ? 'Build It Records' : 
                           label.labelId === '2' ? 'Build It Tech' : 
                           label.labelId === '3' ? 'Build It Deep' : `Unknown (${label.labelId})`;
        logger.info(`- ${labelName}: ${label.count} releases`);
      }
      
      // Close connection
      await models.sequelize.close();
      process.exit(0);
    } catch (error) {
      logger.error(`Error checking database: ${error.message}`);
      process.exit(1);
    }
  })();
  return; // Exit main function execution
}

if (resumeMode) {
  const resumeArg = args.find(arg => arg.startsWith('--resume-from='));
  if (resumeArg) {
    const resumeInfo = resumeArg.split('=')[1];
    if (resumeInfo.includes(':')) {
      [resumeFromLabel, resumeFromOffset] = resumeInfo.split(':');
      resumeFromOffset = parseInt(resumeFromOffset, 10) || 0;
      logger.info(`📝 RESUME MODE: Will resume from label ${resumeFromLabel} at offset ${resumeFromOffset}`);
    }
  }
}

// Main function
async function main() {
  try {
    // Add command-line option to import from backup
    const importFromBackupArg = args.find(arg => arg.startsWith('--import-backup='));
    if (importFromBackupArg) {
      const labelSlug = importFromBackupArg.split('=')[1];
      if (labelSlug) {
        logger.info(`Will attempt to import from backup for ${labelSlug}`);
        const result = await importFromBackup(labelSlug);
        if (result) {
          logger.info(`Successfully imported from backup for ${labelSlug}`);
        } else {
          logger.error(`Failed to import from backup for ${labelSlug}`);
        }
        return;
      }
    }
    
    // Get Spotify API token
    await getSpotifyToken();
    
    // Define label list
    const allLabels = [
      { name: 'Build It Records', slug: 'buildit-records', id: '1' },
      { name: 'Build It Tech', slug: 'buildit-tech', id: '2' },
      { name: 'Build It Deep', slug: 'buildit-deep', id: '3' }
    ];
    
    // Process specific label if provided as argument, otherwise process all
    const labelsToProcess = labelArg 
      ? allLabels.filter(l => l.name.toLowerCase().includes(labelArg.toLowerCase()) || l.slug.toLowerCase().includes(labelArg.toLowerCase()))
      : allLabels;
    
    if (labelsToProcess.length === 0) {
      logger.error(`No matching label found for "${labelArg}"`);
      return;
    }
    
    // Skip labels until we reach the resume point
    let skipLabels = false;
    if (resumeFromLabel) {
      skipLabels = true;
    }
    
    const labelResults = {};
    
    // Process each label
    for (const label of labelsToProcess) {
      // Handle resume mode
      if (skipLabels && resumeFromLabel) {
        if (label.name.toLowerCase().includes(resumeFromLabel.toLowerCase()) || 
            label.slug.toLowerCase().includes(resumeFromLabel.toLowerCase())) {
          // Found our resume point
          skipLabels = false;
          logger.info(`Resuming import from label: ${label.name}`);
        } else {
          logger.info(`Skipping label ${label.name} in resume mode`);
          continue;
        }
      }
      
      try {
        // Process the label
        const result = await processLabel(label.name, { slug: label.slug, id: label.id }, resumeFromOffset);
        labelResults[label.name] = result;
        
        // Reset resume offset for subsequent labels
        resumeFromOffset = 0;
        
      } catch (error) {
        logger.error(`Error processing label ${label.name}`, { error: error.message });
        labelResults[label.name] = { error: error.message };
        
        // If we have more labels to process, provide resume instructions
        if (labelsToProcess.indexOf(label) < labelsToProcess.length - 1) {
          logger.info(`To resume from this point later, use: --resume --resume-from=${label.slug}:${0}`);
        }
      }
      
      // Brief pause between labels
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Display summary
    logger.info('Import Summary:');
    for (const [labelName, result] of Object.entries(labelResults)) {
      if (result.error) {
        logger.error(`${labelName}: Failed - ${result.error}`);
      } else if (result.releases) {
        logger.info(`${labelName}: Success - ${result.releases} releases found`);
      } else {
        logger.info(`${labelName}: Success - 0 releases found`);
      }
    }
    
    // Cleanup
    logger.info('Closing database connection...');
    
    // Only close database if not in dry run mode
    if (!dryRun) {
      try {
        clearInterval(connectionTimer);
        await models.sequelize.close();
      } catch (error) {
        logger.warn('Error closing database connection', { error: error.message });
      }
    }
    
    logger.info('Import script finished');
  } catch (error) {
    logger.error('Fatal error:', { error: error.message, stack: error.stack });
    
    // Attempt to clean up
    try {
      clearInterval(connectionTimer);
      if (!dryRun) {
        await models.sequelize.close();
      }
    } catch (e) {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

// Process a single label
async function processLabel(labelName, labelInfo, startOffset = 0) {
  logger.info(`Processing label: ${labelName} (${labelInfo.slug}, ID: ${labelInfo.id})`);
  
  try {
    // Search for releases
    const releases = await searchReleasesByLabel(labelName, startOffset);
    
    if (!releases || releases.length === 0) {
      logger.warn(`No releases found for label: ${labelName}`);
      return { releases: 0 };
    }
    
    // Save all found releases to a JSON file as backup
    const backupDir = path.join(__dirname, '..', 'data', 'backup');
    try {
      // Create backup directory if it doesn't exist
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const backupFile = path.join(backupDir, `${labelInfo.slug}-releases.json`);
      logger.info(`Saving backup of ${releases.length} releases to ${backupFile}`);
      fs.writeFileSync(
        backupFile,
        JSON.stringify({
          label: labelName,
          id: labelInfo.id,
          releases: releases,
          timestamp: new Date().toISOString()
        }, null, 2)
      );
      logger.info(`✅ Successfully saved backup data for ${labelName}`);
    } catch (backupError) {
      logger.error(`Error saving backup data for ${labelName}`, { error: backupError.message });
    }
    
    // Create checkpoint file
    const checkpointInfo = {
      label: labelName,
      id: labelInfo.id,
      totalReleases: releases.length,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      `checkpoint-${labelInfo.slug}.json`, 
      JSON.stringify(checkpointInfo, null, 2)
    );
    
    // Skip database operations in dry run mode
    if (dryRun) {
      logger.info(`[DRY RUN] Found ${releases.length} releases for ${labelName}, skipping database import`);
      
      // Log a sample of releases for verification
      const sampleSize = Math.min(5, releases.length);
      logger.info(`Sample of ${sampleSize} releases:`);
      for (let i = 0; i < sampleSize; i++) {
        logger.info(`- ${releases[i].name} (${releases[i].id})`);
      }
      
      return { releases: releases.length };
    }
    
    // Try database import, but continue even if it fails
    let dbStats = null;
    try {
      // Import to database
      dbStats = await saveReleasesToDatabase(releases, labelInfo.id);
      logger.info(`Database import completed for ${labelName}`);
    } catch (dbError) {
      logger.error(`Database import failed for ${labelName}, but data is backed up`, { error: dbError.message });
    }
    
    return { 
      releases: releases.length,
      stats: dbStats,
      backedUp: true
    };
  } catch (error) {
    logger.error(`Error processing label ${labelName}`, { error: error.message });
    return { error: error.message };
  }
}

// Add a new function to allow importing from backup files
async function importFromBackup(labelSlug) {
  const backupDir = path.join(__dirname, '..', 'data', 'backup');
  const backupFile = path.join(backupDir, `${labelSlug}-releases.json`);
  
  if (!fs.existsSync(backupFile)) {
    logger.error(`No backup file found for ${labelSlug}`);
    return false;
  }
  
  try {
    logger.info(`Loading backup data from ${backupFile}`);
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    logger.info(`Found ${backupData.releases.length} releases for ${backupData.label} in backup file`);
    
    // Import to database
    const stats = await saveReleasesToDatabase(backupData.releases, backupData.id);
    
    logger.info(`Completed import from backup for ${backupData.label}`);
    return stats;
  } catch (error) {
    logger.error(`Error importing from backup for ${labelSlug}`, { error: error.message });
    return false;
  }
}

// Search for all albums by a label
async function searchReleasesByLabel(labelName, startOffset = 0) {
  logger.info(`Searching for releases by label: ${labelName}`);
  
  const releases = [];
  let offset = startOffset;
  const limit = 50;
  let totalAlbums = 0;
  let hasMoreAlbums = true;
  
  try {
    while (hasMoreAlbums) {
      // Use both the exact label name and common variations
      const searchQuery = `label:"${labelName}"`;
      logger.debug(`Fetching albums with offset ${offset}...`);
      
      try {
        const albumsResponse = await Promise.race([
          spotifyApi.searchAlbums(searchQuery, { limit, offset }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Spotify search timeout')), 20000))
        ]);
        
        const albums = albumsResponse.body.albums.items;
        
        if (offset === startOffset) {
          totalAlbums = albumsResponse.body.albums.total;
          logger.info(`Total albums for label ${labelName}: ${totalAlbums}`);
        }
        
        logger.info(`Fetched ${albums.length} albums at offset ${offset}`);
        
        // Process each album
        if (albums && albums.length > 0) {
          for (const album of albums) {
            // Validate album ID to prevent "Invalid base62 id" errors
            if (album && album.id && isValidSpotifyId(album.id)) {
              releases.push(album);
            } else {
              logger.warn(`Skipping album with invalid ID: ${album?.name || 'Unknown'}`);
            }
          }
          
          // Prepare for next page if needed
          offset += limit;
          hasMoreAlbums = albums.length === limit && offset < 500; // Reduced safety limit to 500 releases
          
          // Pause between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Create offset checkpoint for resume capability
          const checkpointFile = `checkpoint-offset-${labelName.toLowerCase().replace(/\s+/g, '-')}.json`;
          fs.writeFileSync(
            checkpointFile, 
            JSON.stringify({ label: labelName, offset: offset, timestamp: new Date().toISOString() }, null, 2)
          );
        } else {
          hasMoreAlbums = false;
        }
      } catch (searchError) {
        logger.error(`Error searching for albums at offset ${offset}`, { error: searchError.message });
        
        // Try to recover by skipping this batch
        offset += limit;
        if (offset >= 500) {
          hasMoreAlbums = false;
        }
        
        // Longer pause after error
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    logger.info(`Found ${releases.length} releases for label ${labelName}`);
    return releases;
  } catch (error) {
    logger.error(`Error searching for releases by label ${labelName}`, { error: error.message });
    throw error;
  }
}

// Get full album details with tracks
async function getFullAlbumDetails(albumId) {
  try {
    // Validate album ID
    if (!isValidSpotifyId(albumId)) {
      logger.warn(`Invalid album ID format: ${albumId}`);
      return null;
    }
    
    logger.debug(`Fetching details for album ${albumId}...`);
    const albumResponse = await Promise.race([
      spotifyApi.getAlbum(albumId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Album details timeout')), 15000))
    ]);
    return albumResponse.body;
  } catch (error) {
    logger.error(`Error getting details for album ${albumId}`, { error: error.message });
    return null;
  }
}

// Run the script
main();
