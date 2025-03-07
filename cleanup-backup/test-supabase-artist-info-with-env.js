/**
 * Direct test of the Supabase client functions with environment loading
 */
require('dotenv').config({ path: '.env.local' });
const { getReleases, getTopReleases, attachArtistInfoToReleases } = require('./api/utils/supabase-client');

// Log environment availability for debugging
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Available ✅' : 'Missing ❌');
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Available ✅' : 'Missing ❌');

async function testSupabaseFunctions() {
  console.log('\nTesting Supabase client functions for artist information...\n');
  
  try {
    // Test getReleases function
    console.log('Testing getReleases function:');
    const releases = await getReleases({});
    
    if (releases && Array.isArray(releases)) {
      console.log(`✅ Received ${releases.length} releases from getReleases`);
      
      // Check if releases have artist information
      const releaseWithArtist = releases.find(release => 
        release.artists && Array.isArray(release.artists) && release.artists.length > 0
      );
      
      if (releaseWithArtist) {
        console.log('\n✅ Success! Found release with artist information:');
        console.log('Release title:', releaseWithArtist.title);
        console.log('Artists:', releaseWithArtist.artists.map(artist => artist.name).join(', '));
        console.log('\nSample artist object:', JSON.stringify(releaseWithArtist.artists[0], null, 2));
      } else {
        console.error('\n❌ Error: No releases found with artist information');
        // Log a sample release to see its structure
        if (releases.length > 0) {
          console.log('Sample release structure:', JSON.stringify(releases[0], null, 2));
        }
      }
    } else {
      console.error('❌ Invalid response from getReleases');
      console.log('Response:', releases);
    }
    
    // Test getTopReleases function
    console.log('\nTesting getTopReleases function:');
    const topReleases = await getTopReleases({ limit: 5 });
    
    if (topReleases && Array.isArray(topReleases)) {
      console.log(`✅ Received ${topReleases.length} releases from getTopReleases`);
      
      // Check if top releases have artist information
      const topReleaseWithArtist = topReleases.find(release => 
        release.artists && Array.isArray(release.artists) && release.artists.length > 0
      );
      
      if (topReleaseWithArtist) {
        console.log('\n✅ Success! Found top release with artist information:');
        console.log('Release title:', topReleaseWithArtist.title);
        console.log('Artists:', topReleaseWithArtist.artists.map(artist => artist.name).join(', '));
        console.log('\nSample artist object:', JSON.stringify(topReleaseWithArtist.artists[0], null, 2));
      } else {
        console.error('\n❌ Error: No top releases found with artist information');
        // Log a sample release to see its structure
        if (topReleases.length > 0) {
          console.log('Sample top release structure:', JSON.stringify(topReleases[0], null, 2));
        }
      }
    } else {
      console.error('❌ Invalid response from getTopReleases');
      console.log('Response:', topReleases);
    }
    
  } catch (error) {
    console.error('Error testing Supabase functions:', error);
  }
}

testSupabaseFunctions();
