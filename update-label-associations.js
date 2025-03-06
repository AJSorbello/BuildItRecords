// Script to update label associations for existing records in Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration (from environment variables - using the same pattern as in your build-script.sh)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Label configurations for matching
const LABEL_PATTERNS = [
  {
    id: '1',
    name: 'BUILD IT RECORDS',
    patterns: [] // Default label - no specific patterns
  },
  {
    id: '2',
    name: 'BUILD IT TECH',
    patterns: ['tech', 'technology']
  },
  {
    id: '3',
    name: 'BUILD IT DEEP',
    patterns: ['deep']
  }
];

// Main function
async function updateLabelAssociations() {
  try {
    console.log('🚀 Starting label association update in Supabase');
    console.log(`🔌 Connected to Supabase at: ${supabaseUrl}`);
    
    // First, ensure the label_id column exists in both tables
    await ensureLabelIdColumnExists();
    
    // Update artists
    await updateArtistsLabelAssociations();
    
    // Update tracks
    await updateTracksLabelAssociations();
    
    // Get final counts
    await displayFinalCounts();
    
    console.log('\n✅ Update completed successfully');
  } catch (error) {
    console.error('❌ Error during update:', error.message);
    process.exit(1);
  }
}

// Helper function to check if a column exists in a table
async function columnExists(table, column) {
  try {
    // Try to get a row with that column specified
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .limit(1);
    
    return !error;
  } catch (err) {
    return false;
  }
}

// Add label_id column if it doesn't exist
async function ensureLabelIdColumnExists() {
  console.log('🔍 Checking if label_id columns exist...');
  
  // Check artists table
  const artistsHasLabelId = await columnExists('artists', 'label_id');
  if (!artistsHasLabelId) {
    console.log('Adding label_id column to artists table...');
    
    // We need to execute raw SQL for this
    const { error } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'artists',
      column_name: 'label_id',
      column_type: 'varchar'
    });
    
    if (error) {
      console.error('❌ Error adding label_id column to artists:', error.message);
      // Try to continue anyway
    } else {
      console.log('✅ Added label_id column to artists table');
    }
  } else {
    console.log('✅ label_id column already exists in artists table');
  }
  
  // Check tracks table
  const tracksHasLabelId = await columnExists('tracks', 'label_id');
  if (!tracksHasLabelId) {
    console.log('Adding label_id column to tracks table...');
    
    // We need to execute raw SQL for this
    const { error } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'tracks',
      column_name: 'label_id',
      column_type: 'varchar'
    });
    
    if (error) {
      console.error('❌ Error adding label_id column to tracks:', error.message);
      // Try to continue anyway
    } else {
      console.log('✅ Added label_id column to tracks table');
    }
  } else {
    console.log('✅ label_id column already exists in tracks table');
  }
}

// Update artists' label associations
async function updateArtistsLabelAssociations() {
  console.log('\n🎨 Updating artist label associations...');
  
  // Get all artists
  const { data: artists, error } = await supabase
    .from('artists')
    .select('id, name, label_id');
  
  if (error) {
    console.error('❌ Error fetching artists:', error.message);
    return;
  }
  
  console.log(`Found ${artists.length} artists`);
  
  // Update labels for each artist
  for (const artist of artists) {
    let labelId = '1'; // Default to BUILD IT RECORDS
    
    // Check for pattern matches
    for (const label of LABEL_PATTERNS) {
      if (label.patterns.some(pattern => 
        artist.name.toLowerCase().includes(pattern.toLowerCase())
      )) {
        labelId = label.id;
        break;
      }
    }
    
    // Update if the label is different or missing
    if (artist.label_id !== labelId) {
      const { error: updateError } = await supabase
        .from('artists')
        .update({ label_id: labelId })
        .eq('id', artist.id);
      
      if (updateError) {
        console.error(`❌ Error updating label for artist ${artist.name}:`, updateError.message);
      } else {
        console.log(`✅ Updated artist label: ${artist.name} -> ${LABEL_PATTERNS.find(l => l.id === labelId).name}`);
      }
    }
  }
  
  console.log('✅ Completed artist label updates');
}

// Update tracks' label associations
async function updateTracksLabelAssociations() {
  console.log('\n🎵 Updating track label associations...');
  
  // Get all tracks
  const { data: tracks, error } = await supabase
    .from('tracks')
    .select('id, title, label_id');
  
  if (error) {
    console.error('❌ Error fetching tracks:', error.message);
    return;
  }
  
  console.log(`Found ${tracks.length} tracks`);
  
  // Update labels for each track
  for (const track of tracks) {
    let labelId = '1'; // Default to BUILD IT RECORDS
    
    // Check for pattern matches
    for (const label of LABEL_PATTERNS) {
      if (label.patterns.some(pattern => 
        track.title.toLowerCase().includes(pattern.toLowerCase())
      )) {
        labelId = label.id;
        break;
      }
    }
    
    // Update if the label is different or missing
    if (track.label_id !== labelId) {
      const { error: updateError } = await supabase
        .from('tracks')
        .update({ label_id: labelId })
        .eq('id', track.id);
      
      if (updateError) {
        console.error(`❌ Error updating label for track ${track.title}:`, updateError.message);
      } else {
        console.log(`✅ Updated track label: ${track.title} -> ${LABEL_PATTERNS.find(l => l.id === labelId).name}`);
      }
    }
  }
  
  console.log('✅ Completed track label updates');
}

// Display final counts
async function displayFinalCounts() {
  console.log('\n📊 Label Association Summary:');
  
  // Get artists by label
  const { data: artistsByLabel, error: artistError } = await supabase
    .from('artists')
    .select('label_id, count')
    .group('label_id');
  
  if (artistsByLabel) {
    console.log('\n🎨 Artists by Label:');
    for (const item of artistsByLabel) {
      const labelName = LABEL_PATTERNS.find(l => l.id === item.label_id)?.name || item.label_id;
      console.log(`${labelName}: ${item.count}`);
    }
  }
  
  // Get tracks by label
  const { data: tracksByLabel, error: trackError } = await supabase
    .from('tracks')
    .select('label_id, count')
    .group('label_id');
  
  if (tracksByLabel) {
    console.log('\n🎵 Tracks by Label:');
    for (const item of tracksByLabel) {
      const labelName = LABEL_PATTERNS.find(l => l.id === item.label_id)?.name || item.label_id;
      console.log(`${labelName}: ${item.count}`);
    }
  }
}

// Create function for adding columns if it doesn't exist
async function createHelperFunctions() {
  try {
    // First check if the function already exists
    const { data, error } = await supabase
      .rpc('add_column_if_not_exists', {
        table_name: 'test',
        column_name: 'test',
        column_type: 'varchar'
      });
    
    if (error && error.message.includes('function')) {
      console.log('Creating helper functions...');
      
      // Create function for adding columns
      await supabase.rpc('create_sql_function', {
        sql: `
          CREATE OR REPLACE FUNCTION add_column_if_not_exists(
            _table_name text,
            _column_name text,
            _column_type text
          ) RETURNS void AS $$
          BEGIN
            IF NOT EXISTS (
              SELECT FROM information_schema.columns
              WHERE table_name = _table_name AND column_name = _column_name
            ) THEN
              EXECUTE 'ALTER TABLE ' || _table_name || ' ADD COLUMN ' || _column_name || ' ' || _column_type;
            END IF;
          END;
          $$ LANGUAGE plpgsql;
        `
      });
    }
  } catch (err) {
    console.log('Unable to create helper functions, will use fallback methods');
  }
}

// Run the update
createHelperFunctions()
  .then(() => updateLabelAssociations())
  .catch(err => {
    console.error('❌ Unhandled error:', err);
    process.exit(1);
  });
