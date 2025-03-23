// Script to check direct database access for debugging
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.development' });
require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

const fetch = require('node-fetch');

const checkDatabase = async () => {
  try {
    // Log all environment variables to help debug
    console.log('Current ENV variables:');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set (hidden)' : 'Not set');
    console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'Set (hidden)' : 'Not set');
    console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set (hidden)' : 'Not set');
    console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set');
    
    // Try to use the REST API directly with Supabase URL + API endpoints
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Required environment variables are missing.');
      return;
    }
    
    // Check release_artists table data (limited to 5 rows)
    const releaseArtistsUrl = `${supabaseUrl}/rest/v1/release_artists?select=*&limit=5`;
    const releaseArtistsResponse = await fetch(releaseArtistsUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    const releaseArtistsData = await releaseArtistsResponse.json();
    console.log('release_artists table sample data:');
    console.log(JSON.stringify(releaseArtistsData, null, 2));
    
    // Check artists table data (limited to 5 rows)
    const artistsUrl = `${supabaseUrl}/rest/v1/artists?select=*&limit=5`;
    const artistsResponse = await fetch(artistsUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    const artistsData = await artistsResponse.json();
    console.log('\nartists table sample data:');
    console.log(JSON.stringify(artistsData, null, 2));
    
    // Check specific release with joined artists (using a sample release ID)
    const releaseId = 'df940d13-2c5a-4ba4-8d79-3b39327b0d57'; // From the previous API call
    const releaseUrl = `${supabaseUrl}/rest/v1/releases?id=eq.${releaseId}&select=*,release_artists(artist_id,artist:artist_id(*))`;
    const releaseResponse = await fetch(releaseUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    const releaseData = await releaseResponse.json();
    console.log('\nRelease with joined artists data:');
    console.log(JSON.stringify(releaseData, null, 2));
    
  } catch (error) {
    console.error('Error checking database:', error);
  }
};

checkDatabase();
