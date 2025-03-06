// Script to check the current state of label associations in Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration (from environment variables)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Label names for display
const LABEL_NAMES = {
  '1': 'BUILD IT RECORDS',
  '2': 'BUILD IT TECH',
  '3': 'BUILD IT DEEP'
};

// Main function
async function checkLabelAssociations() {
  try {
    console.log('🔍 Checking label associations in Supabase');
    console.log(`🔌 Connected to Supabase at: ${supabaseUrl}`);
    
    // Check table structures
    await checkTableStructures();
    
    // Check label associations
    await checkArtistLabels();
    await checkTrackLabels();
    await checkAlbumLabels();
    
    console.log('\n✅ Check completed successfully');
  } catch (error) {
    console.error('❌ Error during check:', error.message);
    process.exit(1);
  }
}

// Check if tables exist and if they have label_id columns
async function checkTableStructures() {
  console.log('\n📊 Checking table structures:');
  
  // Check artists table
  const { data: artistsData, error: artistsError } = await supabase
    .from('artists')
    .select('count', { count: 'exact', head: true });
  
  if (artistsError) {
    console.log('❌ artists table not found or not accessible');
  } else {
    const { count } = artistsData[0] || { count: 0 };
    console.log(`✅ artists table exists with ${count} records`);
    
    // Check if label_id column exists
    const hasLabelId = await columnExists('artists', 'label_id');
    console.log(`${hasLabelId ? '✅' : '❌'} artists table ${hasLabelId ? 'has' : 'does not have'} label_id column`);
  }
  
  // Check tracks table
  const { data: tracksData, error: tracksError } = await supabase
    .from('tracks')
    .select('count', { count: 'exact', head: true });
  
  if (tracksError) {
    console.log('❌ tracks table not found or not accessible');
  } else {
    const { count } = tracksData[0] || { count: 0 };
    console.log(`✅ tracks table exists with ${count} records`);
    
    // Check if label_id column exists
    const hasLabelId = await columnExists('tracks', 'label_id');
    console.log(`${hasLabelId ? '✅' : '❌'} tracks table ${hasLabelId ? 'has' : 'does not have'} label_id column`);
  }
  
  // Check albums table
  const { data: albumsData, error: albumsError } = await supabase
    .from('albums')
    .select('count', { count: 'exact', head: true });
  
  if (albumsError) {
    console.log('❌ albums table not found or not accessible');
  } else {
    const { count } = albumsData[0] || { count: 0 };
    console.log(`✅ albums table exists with ${count} records`);
    
    // Check if label_id column exists
    const hasLabelId = await columnExists('albums', 'label_id');
    console.log(`${hasLabelId ? '✅' : '❌'} albums table ${hasLabelId ? 'has' : 'does not have'} label_id column`);
  }
}

// Check if a column exists in a table
async function columnExists(table, column) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .limit(1);
    
    return !error;
  } catch (err) {
    return false;
  }
}

// Check artist label associations
async function checkArtistLabels() {
  console.log('\n👨‍🎤 Checking artist label associations:');
  
  try {
    // Get counts by label
    const { data: artists, error } = await supabase.rpc('get_artist_label_counts');
    
    if (error) {
      console.error('❌ Error getting artist label counts:', error.message);
      
      // Fallback: Get some artists with their label_id
      const { data: sampleArtists, error: sampleError } = await supabase
        .from('artists')
        .select('id, name, label_id')
        .limit(10);
      
      if (!sampleError && sampleArtists.length > 0) {
        console.log('\nSample artists with their label_id:');
        sampleArtists.forEach(artist => {
          const labelName = LABEL_NAMES[artist.label_id] || `Unknown (${artist.label_id})`;
          console.log(`- ${artist.name}: ${labelName}`);
        });
      }
    } else {
      // Display counts by label
      console.log('Artists by label:');
      artists.forEach(item => {
        const labelName = LABEL_NAMES[item.label_id] || `Unknown (${item.label_id})`;
        console.log(`- ${labelName}: ${item.count} artists`);
      });
      
      // Check for missing label associations
      const { data: missingLabels, error: missingError } = await supabase
        .from('artists')
        .select('count', { count: 'exact', head: true })
        .is('label_id', null);
      
      if (!missingError) {
        console.log(`\nArtists without label: ${missingLabels[0]?.count || 0}`);
      }
    }
  } catch (err) {
    console.error('❌ Error checking artist labels:', err.message);
  }
}

// Check track label associations
async function checkTrackLabels() {
  console.log('\n🎵 Checking track label associations:');
  
  try {
    // Get counts by label
    const { data: tracks, error } = await supabase.rpc('get_track_label_counts');
    
    if (error) {
      console.error('❌ Error getting track label counts:', error.message);
      
      // Fallback: Get some tracks with their label_id
      const { data: sampleTracks, error: sampleError } = await supabase
        .from('tracks')
        .select('id, title, label_id')
        .limit(10);
      
      if (!sampleError && sampleTracks.length > 0) {
        console.log('\nSample tracks with their label_id:');
        sampleTracks.forEach(track => {
          const labelName = LABEL_NAMES[track.label_id] || `Unknown (${track.label_id})`;
          console.log(`- ${track.title}: ${labelName}`);
        });
      }
    } else {
      // Display counts by label
      console.log('Tracks by label:');
      tracks.forEach(item => {
        const labelName = LABEL_NAMES[item.label_id] || `Unknown (${item.label_id})`;
        console.log(`- ${labelName}: ${item.count} tracks`);
      });
      
      // Check for missing label associations
      const { data: missingLabels, error: missingError } = await supabase
        .from('tracks')
        .select('count', { count: 'exact', head: true })
        .is('label_id', null);
      
      if (!missingError) {
        console.log(`\nTracks without label: ${missingLabels[0]?.count || 0}`);
      }
    }
  } catch (err) {
    console.error('❌ Error checking track labels:', err.message);
  }
}

// Check album label associations
async function checkAlbumLabels() {
  console.log('\n💿 Checking album label associations:');
  
  try {
    // First check if the albums table exists
    const { data, error } = await supabase
      .from('albums')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ albums table not found or not accessible');
      return;
    }
    
    // Get counts by label
    const { data: albums, error: labelError } = await supabase.rpc('get_album_label_counts');
    
    if (labelError) {
      console.error('❌ Error getting album label counts:', labelError.message);
      
      // Fallback: Get some albums with their label_id
      const { data: sampleAlbums, error: sampleError } = await supabase
        .from('albums')
        .select('id, name, label_id')
        .limit(10);
      
      if (!sampleError && sampleAlbums.length > 0) {
        console.log('\nSample albums with their label_id:');
        sampleAlbums.forEach(album => {
          const labelName = LABEL_NAMES[album.label_id] || `Unknown (${album.label_id})`;
          console.log(`- ${album.name}: ${labelName}`);
        });
      }
    } else {
      // Display counts by label
      console.log('Albums by label:');
      albums.forEach(item => {
        const labelName = LABEL_NAMES[item.label_id] || `Unknown (${item.label_id})`;
        console.log(`- ${labelName}: ${item.count} albums`);
      });
      
      // Check for missing label associations
      const { data: missingLabels, error: missingError } = await supabase
        .from('albums')
        .select('count', { count: 'exact', head: true })
        .is('label_id', null);
      
      if (!missingError) {
        console.log(`\nAlbums without label: ${missingLabels[0]?.count || 0}`);
      }
    }
  } catch (err) {
    console.error('❌ Error checking album labels:', err.message);
  }
}

// Create SQL functions to count by label
async function createSqlFunctions() {
  try {
    // Create function for artist counts
    await supabase.rpc('create_sql_function', {
      sql: `
        CREATE OR REPLACE FUNCTION get_artist_label_counts()
        RETURNS TABLE(label_id text, count bigint) AS $$
        BEGIN
          RETURN QUERY
          SELECT a.label_id::text, COUNT(*)::bigint
          FROM artists a
          GROUP BY a.label_id;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    // Create function for track counts
    await supabase.rpc('create_sql_function', {
      sql: `
        CREATE OR REPLACE FUNCTION get_track_label_counts()
        RETURNS TABLE(label_id text, count bigint) AS $$
        BEGIN
          RETURN QUERY
          SELECT t.label_id::text, COUNT(*)::bigint
          FROM tracks t
          GROUP BY t.label_id;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    // Create function for album counts
    await supabase.rpc('create_sql_function', {
      sql: `
        CREATE OR REPLACE FUNCTION get_album_label_counts()
        RETURNS TABLE(label_id text, count bigint) AS $$
        BEGIN
          RETURN QUERY
          SELECT a.label_id::text, COUNT(*)::bigint
          FROM albums a
          GROUP BY a.label_id;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
  } catch (err) {
    console.log('Unable to create SQL functions, will use fallback methods for checks');
  }
}

// First create the SQL functions, then run the checks
createSqlFunctions()
  .then(() => checkLabelAssociations())
  .catch(err => {
    console.error('❌ Unhandled error:', err);
    process.exit(1);
  });
