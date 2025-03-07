/**
 * Direct test of the Supabase client functions to verify artist information attachment
 */
const { getReleases, getTopReleases, attachArtistInfoToReleases } = require('./api/utils/supabase-client');

async function testSupabaseFunctions() {
  console.log('Testing Supabase client functions for artist information...\n');
  
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
    
    // Test manual attachment to verify the logic works
    console.log('\nTesting attachArtistInfoToReleases function directly:');
    // Create a test release without artist info
    const testReleases = [
      {
        id: 'test-release-id',
        title: 'Test Release',
        release_date: '2023-01-01'
      }
    ];
    
    const releasesWithArtists = await attachArtistInfoToReleases(testReleases);
    
    if (releasesWithArtists && Array.isArray(releasesWithArtists)) {
      console.log(`✅ Received ${releasesWithArtists.length} releases from attachArtistInfoToReleases`);
      
      // Check if the test release got artists attached
      const testReleaseWithArtist = releasesWithArtists[0];
      if (testReleaseWithArtist.artists && Array.isArray(testReleaseWithArtist.artists)) {
        console.log('\n✅ Success! Attached artists to test release:');
        console.log('Artists array length:', testReleaseWithArtist.artists.length);
        if (testReleaseWithArtist.artists.length > 0) {
          console.log('Sample artist:', JSON.stringify(testReleaseWithArtist.artists[0], null, 2));
        } else {
          console.log('Note: No specific artists attached, but the array was created properly');
        }
      } else {
        console.error('\n❌ Error: Artists not properly attached to test release');
        console.log('Test release after attachment:', JSON.stringify(testReleaseWithArtist, null, 2));
      }
    } else {
      console.error('❌ Invalid response from attachArtistInfoToReleases');
      console.log('Response:', releasesWithArtists);
    }
    
  } catch (error) {
    console.error('Error testing Supabase functions:', error);
  }
}

testSupabaseFunctions();
