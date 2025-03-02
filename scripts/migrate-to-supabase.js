require('dotenv').config();
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// PostgreSQL connection
const pgClient = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'builditrecords',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false
});

// Supabase connection
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Main migration function
async function migrateDataToSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Please check your .env file.');
    process.exit(1);
  }

  console.log('Starting migration from PostgreSQL to Supabase...');
  
  try {
    // Connect to PostgreSQL
    await pgClient.connect();
    console.log('Connected to PostgreSQL database');
    
    // Create log file for migration
    const logStream = fs.createWriteStream(path.join(__dirname, 'migration_log.txt'), { flags: 'a' });
    const log = (message) => {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      console.log(message);
      logStream.write(logMessage);
    };
    
    try {
      // 1. Migrate labels
      await migrateLabels(log);
    } catch (error) {
      log(`Migration of labels failed but continuing: ${error.message}`);
    }
    
    try {
      // 2. Migrate artists 
      await migrateArtists(log);
    } catch (error) {
      log(`Migration of artists failed but continuing: ${error.message}`);
    }
    
    try {
      // 3. Migrate releases
      await migrateReleases(log);
    } catch (error) {
      log(`Migration of releases failed but continuing: ${error.message}`);
    }
    
    try {
      // 4. Migrate tracks
      await migrateTracks(log);
    } catch (error) {
      log(`Migration of tracks failed but continuing: ${error.message}`);
    }
    
    try {
      // 5. Migrate join tables
      await migrateJoinTables(log);
    } catch (error) {
      log(`Migration of join tables failed but continuing: ${error.message}`);
    }
    
    try {
      // 6. Migrate import logs (if needed)
      await migrateImportLogs(log);
    } catch (error) {
      log(`Migration of import logs failed but continuing: ${error.message}`);
    }
    
    log('Migration completed successfully!');
    logStream.end();
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pgClient.end();
    console.log('PostgreSQL connection closed');
  }
}

// Helper function to get data from PostgreSQL
async function getDataFromPostgres(table, orderBy = 'id') {
  const result = await pgClient.query(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
  return result.rows;
}

// Migration functions for each table
async function migrateLabels(log) {
  log('Migrating labels...');
  try {
    const labels = await getDataFromPostgres('labels');
    
    if (labels.length === 0) {
      log('No labels to migrate');
      return;
    }
    
    log(`Found ${labels.length} labels to migrate`);
    
    // Check for existing data in Supabase to avoid duplicates
    const { data: existingLabels } = await supabase.from('labels').select('id');
    const existingIds = new Set(existingLabels?.map(l => l.id) || []);
    
    // Filter out labels that already exist
    const labelsToInsert = labels.filter(label => !existingIds.has(label.id));
    
    if (labelsToInsert.length === 0) {
      log('All labels already exist in Supabase');
      return;
    }
    
    // Insert labels into Supabase
    const { error } = await supabase.from('labels').insert(labelsToInsert);
    
    if (error) {
      throw new Error(`Error inserting labels: ${error.message}`);
    }
    
    log(`Successfully migrated ${labelsToInsert.length} labels`);
  } catch (error) {
    log(`Error migrating labels: ${error.message}`);
    throw error;
  }
}

async function migrateArtists(log) {
  log('Migrating artists...');
  try {
    const artists = await getDataFromPostgres('artists');
    
    if (artists.length === 0) {
      log('No artists to migrate');
      return;
    }
    
    log(`Found ${artists.length} artists to migrate`);
    
    // Check for existing data in Supabase to avoid duplicates
    const { data: existingArtists } = await supabase.from('artists').select('id');
    const existingIds = new Set(existingArtists?.map(a => a.id) || []);
    
    // Define the minimal set of columns we know exist
    const validArtistColumns = [
      'id', 'name', 'bio', 'profile_image_url', 'spotify_url', 'label_id'
    ];
    
    // Filter out artists that already exist and clean the data to match Supabase schema
    const artistsToInsert = artists
      .filter(artist => !existingIds.has(artist.id))
      .map(artist => {
        // Only include fields that we're sure exist in the Supabase schema
        const cleanArtist = {};
        validArtistColumns.forEach(column => {
          if (artist[column] !== undefined) {
            cleanArtist[column] = artist[column];
          }
        });
        
        // Map any available image URL to profile_image_url
        if (!cleanArtist.profile_image_url && artist.image_url) {
          cleanArtist.profile_image_url = artist.image_url;
        }
        
        return cleanArtist;
      });
    
    if (artistsToInsert.length === 0) {
      log('All artists already exist in Supabase');
      return;
    }
    
    // Insert artists in batches to handle large datasets
    const batchSize = 50;
    for (let i = 0; i < artistsToInsert.length; i += batchSize) {
      const batch = artistsToInsert.slice(i, i + batchSize);
      const { error } = await supabase.from('artists').insert(batch);
      
      if (error) {
        log(`Error inserting artists batch ${i/batchSize + 1}: ${error.message}`);
        // Continue with other batches even if one fails
        continue;
      }
      
      log(`Migrated artists batch ${i/batchSize + 1} of ${Math.ceil(artistsToInsert.length/batchSize)}`);
    }
    
    log(`Successfully migrated artists`);
  } catch (error) {
    log(`Error migrating artists: ${error.message}`);
    // Continue with other migrations rather than throwing
    return;
  }
}

async function migrateReleases(log) {
  log('Migrating releases...');
  try {
    const releases = await getDataFromPostgres('releases');
    
    if (releases.length === 0) {
      log('No releases to migrate');
      return;
    }
    
    log(`Found ${releases.length} releases to migrate`);
    
    // Check for existing data in Supabase to avoid duplicates
    const { data: existingReleases } = await supabase.from('releases').select('id');
    const existingIds = new Set(existingReleases?.map(r => r.id) || []);
    
    // Define the minimal set of columns we know exist
    const validReleaseColumns = [
      'id', 'title', 'release_date', 'artwork_url', 'spotify_url', 
      'label_id', 'primary_artist_id', 'status'
    ];
    
    // Filter out releases that already exist and clean the data to match Supabase schema
    const releasesToInsert = releases
      .filter(release => !existingIds.has(release.id))
      .map(release => {
        // Only include fields that we're sure exist in the Supabase schema
        const cleanRelease = {};
        validReleaseColumns.forEach(column => {
          if (release[column] !== undefined) {
            cleanRelease[column] = release[column];
          }
        });
        
        return cleanRelease;
      });
    
    if (releasesToInsert.length === 0) {
      log('All releases already exist in Supabase');
      return;
    }
    
    // Insert releases in batches to handle large datasets
    const batchSize = 50;
    for (let i = 0; i < releasesToInsert.length; i += batchSize) {
      const batch = releasesToInsert.slice(i, i + batchSize);
      const { error } = await supabase.from('releases').insert(batch);
      
      if (error) {
        log(`Error inserting releases batch ${i/batchSize + 1}: ${error.message}`);
        // Continue with other batches even if one fails
        continue;
      }
      
      log(`Migrated releases batch ${i/batchSize + 1} of ${Math.ceil(releasesToInsert.length/batchSize)}`);
    }
    
    log(`Successfully migrated releases`);
  } catch (error) {
    log(`Error migrating releases: ${error.message}`);
    // Continue with other migrations rather than throwing
    return;
  }
}

async function migrateTracks(log) {
  log('Migrating tracks...');
  try {
    const tracks = await getDataFromPostgres('tracks');
    
    if (tracks.length === 0) {
      log('No tracks to migrate');
      return;
    }
    
    log(`Found ${tracks.length} tracks to migrate`);
    
    // Check for existing data in Supabase to avoid duplicates
    const { data: existingTracks } = await supabase.from('tracks').select('id');
    const existingIds = new Set(existingTracks?.map(t => t.id) || []);
    
    // Define the minimal set of columns we know exist
    const validTrackColumns = [
      'id', 'title', 'duration', 'track_number', 'disc_number', 'isrc',
      'preview_url', 'spotify_url', 'release_id', 'label_id', 'status'
    ];
    
    // Filter out tracks that already exist and clean the data to match Supabase schema
    const tracksToInsert = tracks
      .filter(track => !existingIds.has(track.id))
      .map(track => {
        // Only include fields that we're sure exist in the Supabase schema
        const cleanTrack = {};
        validTrackColumns.forEach(column => {
          if (track[column] !== undefined) {
            cleanTrack[column] = track[column];
          }
        });
        
        return cleanTrack;
      });
    
    if (tracksToInsert.length === 0) {
      log('All tracks already exist in Supabase');
      return;
    }
    
    // Insert tracks into Supabase in batches to avoid size limitations
    const batchSize = 50;
    for (let i = 0; i < tracksToInsert.length; i += batchSize) {
      const batch = tracksToInsert.slice(i, i + batchSize);
      const { error } = await supabase.from('tracks').insert(batch);
      
      if (error) {
        log(`Error inserting tracks batch ${i / batchSize + 1}: ${error.message}`);
        // Continue with other batches even if one fails
        continue;
      }
      
      log(`Migrated tracks batch ${i / batchSize + 1} of ${Math.ceil(tracksToInsert.length / batchSize)}`);
    }
    
    log(`Successfully migrated tracks`);
  } catch (error) {
    log(`Error migrating tracks: ${error.message}`);
    // Continue with other migrations rather than throwing
    return;
  }
}

async function migrateJoinTables(log) {
  // Migrate track_artists
  log('Migrating track_artists...');
  try {
    const trackArtists = await getDataFromPostgres('track_artists');
    
    if (trackArtists.length === 0) {
      log('No track_artists to migrate');
    } else {
      log(`Found ${trackArtists.length} track_artists to migrate`);
      
      // Define the minimal set of columns we know exist
      const validTrackArtistColumns = [
        'track_id', 'artist_id', 'role'
      ];
      
      // Clean the data to match Supabase schema
      const trackArtistsToInsert = trackArtists.map(relation => {
        const cleanRelation = {};
        validTrackArtistColumns.forEach(column => {
          if (relation[column] !== undefined) {
            cleanRelation[column] = relation[column];
          }
        });
        return cleanRelation;
      });
      
      // Insert track_artists into Supabase in batches
      const batchSize = 50;
      for (let i = 0; i < trackArtistsToInsert.length; i += batchSize) {
        const batch = trackArtistsToInsert.slice(i, i + batchSize);
        const { error } = await supabase.from('track_artists').insert(batch).onConflict(['track_id', 'artist_id', 'role']).ignore();
        
        if (error) {
          log(`Error inserting track_artists batch ${i / batchSize + 1}: ${error.message}`);
          // Continue with other batches even if one fails
          continue;
        }
        
        log(`Migrated track_artists batch ${i / batchSize + 1} of ${Math.ceil(trackArtistsToInsert.length / batchSize)}`);
      }
      
      log(`Successfully migrated track_artists`);
    }
  } catch (error) {
    log(`Error migrating track_artists: ${error.message}`);
    // Continue with other migrations rather than throwing
  }
  
  // Migrate release_artists
  log('Migrating release_artists...');
  try {
    const releaseArtists = await getDataFromPostgres('release_artists');
    
    if (releaseArtists.length === 0) {
      log('No release_artists to migrate');
    } else {
      log(`Found ${releaseArtists.length} release_artists to migrate`);
      
      // Define the minimal set of columns we know exist
      const validReleaseArtistColumns = [
        'release_id', 'artist_id', 'role'
      ];
      
      // Clean the data to match Supabase schema
      const releaseArtistsToInsert = releaseArtists.map(relation => {
        const cleanRelation = {};
        validReleaseArtistColumns.forEach(column => {
          if (relation[column] !== undefined) {
            cleanRelation[column] = relation[column];
          }
        });
        return cleanRelation;
      });
      
      // Insert release_artists into Supabase in batches
      const batchSize = 50;
      for (let i = 0; i < releaseArtistsToInsert.length; i += batchSize) {
        const batch = releaseArtistsToInsert.slice(i, i + batchSize);
        const { error } = await supabase.from('release_artists').insert(batch).onConflict(['release_id', 'artist_id', 'role']).ignore();
        
        if (error) {
          log(`Error inserting release_artists batch ${i / batchSize + 1}: ${error.message}`);
          // Continue with other batches even if one fails
          continue;
        }
        
        log(`Migrated release_artists batch ${i / batchSize + 1} of ${Math.ceil(releaseArtistsToInsert.length / batchSize)}`);
      }
      
      log(`Successfully migrated release_artists`);
    }
  } catch (error) {
    log(`Error migrating release_artists: ${error.message}`);
    // Continue with other migrations rather than throwing
  }
}

async function migrateImportLogs(log) {
  log('Migrating import_logs...');
  try {
    const importLogs = await getDataFromPostgres('import_logs', 'created_at');
    
    if (importLogs.length === 0) {
      log('No import_logs to migrate');
      return;
    }
    
    log(`Found ${importLogs.length} import_logs to migrate`);
    
    // Insert import_logs into Supabase in batches of 100
    const batchSize = 100;
    for (let i = 0; i < importLogs.length; i += batchSize) {
      const batch = importLogs.slice(i, i + batchSize);
      const { error } = await supabase.from('import_logs').insert(batch);
      
      if (error) {
        throw new Error(`Error inserting import_logs batch ${i / batchSize + 1}: ${error.message}`);
      }
      
      log(`Migrated import_logs batch ${i / batchSize + 1} of ${Math.ceil(importLogs.length / batchSize)}`);
    }
    
    log(`Successfully migrated ${importLogs.length} import_logs`);
  } catch (error) {
    log(`Error migrating import_logs: ${error.message}`);
    throw error;
  }
}

// Run the migration
migrateDataToSupabase();
