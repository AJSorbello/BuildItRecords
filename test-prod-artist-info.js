/**
 * Test script to verify artist information in production API release responses
 */
const axios = require('axios');

// Use the production URL from the Vercel deployment
const API_BASE_URL = 'https://build-it-records-hwd7q60pp-ajsorbellos-projects.vercel.app';

async function testProductionApi() {
  console.log('Testing production API endpoints for artist information...\n');
  
  try {
    // Test the regular releases endpoint
    console.log('Testing /api/releases endpoint:');
    const releasesResponse = await axios.get(`${API_BASE_URL}/api/releases`);
    
    console.log(`Response status: ${releasesResponse.status}`);
    
    if (releasesResponse.data && Array.isArray(releasesResponse.data.releases)) {
      console.log(`✅ Received ${releasesResponse.data.releases.length} releases from /api/releases`);
      
      // Check if releases have artist information
      const releaseWithArtist = releasesResponse.data.releases.find(release => 
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
        if (releasesResponse.data.releases.length > 0) {
          console.log('Sample release structure:', JSON.stringify(releasesResponse.data.releases[0], null, 2));
        }
      }
    } else {
      console.error('❌ Invalid response format from /api/releases');
      console.log('Response data:', JSON.stringify(releasesResponse.data, null, 2));
    }
    
    // Test the top releases endpoint
    console.log('\nTesting /api/releases/top endpoint:');
    const topReleasesResponse = await axios.get(`${API_BASE_URL}/api/releases/top`);
    
    console.log(`Response status: ${topReleasesResponse.status}`);
    
    if (topReleasesResponse.data && Array.isArray(topReleasesResponse.data)) {
      console.log(`✅ Received ${topReleasesResponse.data.length} releases from /api/releases/top`);
      
      // Check if top releases have artist information
      const topReleaseWithArtist = topReleasesResponse.data.find(release => 
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
        if (topReleasesResponse.data.length > 0) {
          console.log('Sample top release structure:', JSON.stringify(topReleasesResponse.data[0], null, 2));
        }
      }
    } else {
      console.error('❌ Invalid response format from /api/releases/top');
      console.log('Response data:', JSON.stringify(topReleasesResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('Error testing API endpoints:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testProductionApi();
