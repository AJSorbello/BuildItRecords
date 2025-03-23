// Database check utility
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.supabase' });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check .env.supabase file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const checkTables = async () => {
  try {
    // Check if release_artists table exists and has data
    console.log('Checking release_artists table...');
    const { data: releaseArtists, error: releaseArtistsError } = await supabase
      .from('release_artists')
      .select('*')
      .limit(5);
    
    if (releaseArtistsError) {
      console.error('Error querying release_artists:', releaseArtistsError);
    } else {
      console.log('Sample release_artists data:', releaseArtists);
    }
    
    // Check a specific release with joined artist data
    console.log('\nChecking a specific release with artist data...');
    const { data: release, error: releaseError } = await supabase
      .from('releases')
      .select(`
        *,
        artists:release_artists(
          artist_id,
          artists:artist_id(id, name)
        )
      `)
      .eq('id', 'df940d13-2c5a-4ba4-8d79-3b39327b0d57')
      .single();
    
    if (releaseError) {
      console.error('Error querying release with artists:', releaseError);
    } else {
      console.log('Release with artists data:', JSON.stringify(release, null, 2));
    }
    
    // Check artists table
    console.log('\nChecking artists table...');
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('*')
      .limit(5);
    
    if (artistsError) {
      console.error('Error querying artists:', artistsError);
    } else {
      console.log('Sample artists data:', artists);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

checkTables();
