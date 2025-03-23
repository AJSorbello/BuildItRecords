require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// Configure logger
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing required environment variables. Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY are set in your .env.supabase file.');
  process.exit(1);
}

// Set up Supabase client with service role key if available
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Log Supabase connection info (without exposing keys)
logger.info(`Using Supabase URL: ${supabaseUrl}`);
logger.info(`Using key type: ${process.env.SUPABASE_SERVICE_KEY ? 'service role key' : 'anon key'}`);

// Check if we have a user email and password for auth
if (process.env.SUPABASE_USER && process.env.SUPABASE_PASSWORD) {
  logger.info(`Will attempt to sign in as ${process.env.SUPABASE_USER}`);
}

// Label IDs
const LABEL_IDS = {
  'buildit-records': 1,
  'buildit-tech': 2,
  'buildit-deep': 3
};

// Process backup file
async function importFromBackup(labelSlug) {
  try {
    const labelId = LABEL_IDS[labelSlug];
    const backupFilePath = path.join(__dirname, '..', 'data', 'backup', `${labelSlug}-releases.json`);
    
    if (!fs.existsSync(backupFilePath)) {
      logger.error(`Backup file not found: ${backupFilePath}`);
      return;
    }
    
    const fileStats = fs.statSync(backupFilePath);
    logger.info(`Backup file size: ${fileStats.size} bytes`);
    
    // Read and parse the backup file
    const fileContents = fs.readFileSync(backupFilePath, 'utf8');
    let backupData;
    
    try {
      backupData = JSON.parse(fileContents);
    } catch (parseError) {
      logger.error('Error parsing JSON from backup file:', parseError);
      return;
    }
    
    // Determine the structure and extract releases array
    let releases = [];
    if (Array.isArray(backupData)) {
      logger.debug('Backup data is a direct array');
      releases = backupData;
    } else if (typeof backupData === 'object' && backupData !== null) {
      logger.debug('Backup data is an object, checking for arrays');
      // Check various possible structures
      if (backupData.items && Array.isArray(backupData.items)) {
        releases = backupData.items;
      } else if (backupData.releases && Array.isArray(backupData.releases)) {
        releases = backupData.releases;
      } else if (backupData.data && Array.isArray(backupData.data)) {
        releases = backupData.data;
      } else {
        // If we can't find an obvious array property, log the object keys
        logger.debug('No obvious array found, checking object keys:', Object.keys(backupData));
        
        // If there's a single album object
        if (backupData.name && (backupData.id || backupData.spotify_id)) {
          logger.debug('Found a single album object');
          releases = [backupData];
        } else {
          // Log a sample of the data to help debug
          logger.error('Unable to determine the structure of the backup data');
          logger.debug('First 500 chars of backup data:', fileContents.substring(0, 500));
          return;
        }
      }
    } else {
      logger.error('Backup data is not an array or object');
      logger.debug('Data type:', typeof backupData);
      return;
    }
    
    if (!releases || releases.length === 0) {
      logger.error('No releases found in backup file');
      return;
    }
    
    logger.info(`Found ${releases.length} releases in backup file`);
    
    // Log a sample release to understand its structure
    if (releases.length > 0) {
      const sampleRelease = releases[0];
      logger.debug('Sample release structure - keys:', Object.keys(sampleRelease));
      logger.debug('Sample release name:', sampleRelease.name);
      logger.debug('Sample release ID:', sampleRelease.id);
    }
    
    for (let i = 0; i < releases.length; i++) {
      const release = releases[i];
      
      if (i % 10 === 0) {
        logger.info(`Processing release ${i+1}/${releases.length}`);
      }
      
      if (!release || !release.name || !release.id) {
        logger.warn(`Invalid release data at index ${i}, skipping`);
        continue;
      }
      
      // First, check if release already exists by searching for the title
      const { data: existingRelease } = await supabase
        .from('releases')
        .select('id')
        .eq('title', release.name)
        .maybeSingle(); // Use maybeSingle to avoid errors if no record is found
      
      if (existingRelease) {
        logger.debug(`Release ${release.name} already exists, skipping`);
        continue;
      }
      
      // Map the Spotify data to our database schema
      const releaseData = {
        id: uuidv4(), // Generate UUID for the release
        title: release.name,
        release_date: release.release_date,
        artwork_url: release.images && release.images[0] ? release.images[0].url : null,
        spotify_url: release.external_urls ? release.external_urls.spotify : null,
        label_id: labelId,
        release_type: release.album_type || 'album',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert release
      const { data: insertedRelease, error: releaseError } = await supabase
        .from('releases')
        .insert(releaseData)
        .select('id')
        .single();
      
      if (releaseError) {
        logger.error(`Failed to insert release ${release.name}:`, releaseError);
        continue;
      }
      
      logger.info(`✅ Successfully inserted release: ${release.name}`);
      
      // Process artists
      if (release.artists && release.artists.length > 0) {
        const primaryArtist = await processArtists(release.artists, insertedRelease.id, labelId);
      }
      
      // Process tracks if available
      if (release.tracks && release.tracks.items && release.tracks.items.length > 0) {
        for (let trackIndex = 0; trackIndex < release.tracks.items.length; trackIndex++) {
          const track = release.tracks.items[trackIndex];
          
          // Insert track using the correct column names
          const trackData = {
            id: uuidv4(), // Generate UUID for track
            title: track.name,
            duration: track.duration_ms,
            track_number: track.track_number,
            disc_number: track.disc_number || 1,
            preview_url: track.preview_url,
            spotify_url: track.external_urls ? track.external_urls.spotify : null,
            release_id: insertedRelease.id,
            label_id: labelId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data: insertedTrack, error: trackError } = await supabase
            .from('tracks')
            .insert(trackData)
            .select('id')
            .single();
            
          if (trackError) {
            logger.error(`Failed to insert track ${track.name}:`, trackError);
            continue;
          }
          
          logger.debug(`✅ Inserted track: ${track.name}`);
        }
      }
    }
    
    logger.info(`✅ Successfully imported releases for ${labelSlug}`);
  } catch (error) {
    logger.error('Error importing from backup:', error);
  }
}

// Process artists and insert new ones
const processArtists = async (artists, releaseId, labelId) => {
  let primaryArtist = null;
  
  for (const artist of artists) {
    try {
      // Check if artist exists by name instead of spotify_id
      const { data: existingArtists, error: queryError } = await supabase
        .from('artists')
        .select('id')
        .eq('name', artist.name);
        
      if (queryError) {
        logger.error(`Failed to query artist ${artist.name}:`, queryError);
        continue;
      }
      
      let artistId;
      
      if (existingArtists && existingArtists.length > 0) {
        artistId = existingArtists[0].id;
        logger.debug(`Artist ${artist.name} already exists with ID ${artistId}`);
      } else {
        // Insert new artist with UUID (without spotify_id)
        const artistData = {
          id: uuidv4(), // Generate UUID for artist
          name: artist.name,
          spotify_url: artist.external_urls ? artist.external_urls.spotify : null,
          image_url: artist.images && artist.images.length > 0 ? artist.images[0].url : null,
          label_id: labelId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: insertedArtist, error: artistError } = await supabase
          .from('artists')
          .insert(artistData)
          .select('id')
          .single();
          
        if (artistError) {
          logger.error(`Failed to insert artist ${artist.name}:`, artistError);
          continue;
        }
        
        artistId = insertedArtist.id;
        logger.info(`✅ Successfully inserted artist: ${artist.name}`);
      }
      
      // Set the primary artist ID if this is the first artist
      if (!primaryArtist) {
        primaryArtist = artistId;
        
        // Update release with primary artist ID
        const { error: updateError } = await supabase
          .from('releases')
          .update({ primary_artist_id: primaryArtist })
          .eq('id', releaseId);
          
        if (updateError) {
          logger.error(`Failed to update release with primary artist:`, updateError);
        }
      }
      
      // Insert release_artists relation
      const { error: relationError } = await supabase
        .from('release_artists')
        .insert({
          release_id: releaseId,
          artist_id: artistId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (relationError) {
        logger.error(`Failed to insert release_artists relation:`, relationError);
      }
    } catch (error) {
      logger.error(`Error processing artist ${artist.name}:`, error);
    }
  }
  
  return primaryArtist;
};

// Main function
async function main() {
  const args = process.argv.slice(2);
  const labelSlug = args[0];
  const inspectOnly = args.includes('--inspect-schema');
  
  // Try to authenticate if credentials are provided
  if (process.env.SUPABASE_USER && process.env.SUPABASE_PASSWORD) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: process.env.SUPABASE_USER,
        password: process.env.SUPABASE_PASSWORD
      });
      
      if (authError) {
        logger.error('Authentication failed:', authError.message);
      } else {
        logger.info('Successfully authenticated as', process.env.SUPABASE_USER);
      }
    } catch (authError) {
      logger.error('Error during authentication:', authError);
    }
  } else if (process.env.SUPABASE_SERVICE_KEY) {
    logger.info('Using service role key - RLS policies will be bypassed');
  } else {
    logger.warn('No authentication credentials provided. Operations may fail due to RLS policies.');
  }
  
  if (inspectOnly || args.includes('--schema')) {
    logger.info('Inspecting database schema...');
    await discoverTableSchema();
    process.exit(0);
  }
  
  if (!labelSlug) {
    logger.error('Please provide a label slug (buildit-records, buildit-tech, or buildit-deep)');
    process.exit(1);
  }
  
  if (!LABEL_IDS[labelSlug]) {
    logger.error(`Invalid label slug: ${labelSlug}`);
    logger.info('Valid options: buildit-records, buildit-tech, buildit-deep');
    process.exit(1);
  }
  
  logger.info(`Starting import for label: ${labelSlug}`);
  await importFromBackup(labelSlug);
  logger.info('Import completed');
}

// Function to discover the actual table schema
async function discoverTableSchema() {
  try {
    // Get a list of tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');
      
    if (tablesError) {
      logger.error('Error fetching tables:', tablesError);
      
      // Alternative: Try to get specific tables we're interested in
      logger.info('Trying to access specific tables we know about...');
      
      // Check albums table exists
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('*')
        .limit(1);
        
      if (albumsError) {
        logger.error('Cannot access albums table:', albumsError);
      } else {
        logger.info('Albums table exists!');
        
        if (albumsData && albumsData.length > 0) {
          logger.info('Albums table schema (column names):', Object.keys(albumsData[0]));
        } else {
          logger.info('Albums table is empty');
        }
      }
      
      // Check artists table exists
      const { data: artistsData, error: artistsError } = await supabase
        .from('artists')
        .select('*')
        .limit(1);
        
      if (artistsError) {
        logger.error('Cannot access artists table:', artistsError);
      } else {
        logger.info('Artists table exists!');
        
        if (artistsData && artistsData.length > 0) {
          logger.info('Artists table schema (column names):', Object.keys(artistsData[0]));
        } else {
          logger.info('Artists table is empty');
        }
      }
      
      // Check album_artists table exists
      const { data: albumArtistsData, error: albumArtistsError } = await supabase
        .from('album_artists')
        .select('*')
        .limit(1);
        
      if (albumArtistsError) {
        logger.error('Cannot access album_artists table:', albumArtistsError);
      } else {
        logger.info('Album_artists table exists!');
        
        if (albumArtistsData && albumArtistsData.length > 0) {
          logger.info('Album_artists table schema (column names):', Object.keys(albumArtistsData[0]));
        } else {
          logger.info('Album_artists table is empty');
        }
      }
      
      // Try other possible table names
      const possibleTables = ['releases', 'tracks', 'labels', 'release_artists'];
      
      for (const tableName of possibleTables) {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (!error) {
          logger.info(`Table '${tableName}' exists!`);
          
          if (data && data.length > 0) {
            logger.info(`'${tableName}' table schema (column names):`, Object.keys(data[0]));
          } else {
            logger.info(`'${tableName}' table is empty`);
          }
        }
      }
    } else {
      logger.info('Available tables:', tables);
      
      // For each table, get its schema
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          logger.error(`Error accessing table ${table}:`, error);
        } else if (data && data.length > 0) {
          logger.info(`Table '${table}' schema (column names):`, Object.keys(data[0]));
        } else {
          logger.info(`Table '${table}' is empty`);
        }
      }
    }
  } catch (error) {
    logger.error('Error discovering schema:', error);
  }
}

main().catch(err => {
  logger.error('Unhandled error:', err);
  process.exit(1);
});
