/**
 * Test script to verify artist information in release API responses
 */
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5173';
const LABEL_ID = '1'; // Use an existing label ID from your database

async function testApiEndpoints() {
  console.log('Testing API endpoints for artist information...\n');
  
  try {
    // Test getting all releases
    console.log('Testing /api/releases endpoint:');
    const releasesResponse = await axios.get(`${API_BASE_URL}/api/releases`);
    
    if (!releasesResponse.data || !Array.isArray(releasesResponse.data)) {
      console.error('Error: Invalid response from /api/releases');
      console.log('Response:', JSON.stringify(releasesResponse.data, null, 2));
      return;
    }
    
    console.log(`Received ${releasesResponse.data.length} releases from /api/releases`);
    
    // Check if at least one release has artist information
    const releaseWithArtist = releasesResponse.data.find(release => 
      release.artists && Array.isArray(release.artists) && release.artists.length > 0
    );
    
    if (releaseWithArtist) {
      console.log('\nSuccess! Found release with artist information:');
      console.log('Release title:', releaseWithArtist.title);
      console.log('Artists:', releaseWithArtist.artists.map(artist => artist.name).join(', '));
    } else {
      console.error('\nError: No releases found with artist information');
    }
    
    // Test getting top releases
    console.log('\nTesting /api/releases/top endpoint:');
    const topReleasesResponse = await axios.get(`${API_BASE_URL}/api/releases/top`);
    
    if (!topReleasesResponse.data || !Array.isArray(topReleasesResponse.data)) {
      console.error('Error: Invalid response from /api/releases/top');
      console.log('Response:', JSON.stringify(topReleasesResponse.data, null, 2));
      return;
    }
    
    console.log(`Received ${topReleasesResponse.data.length} releases from /api/releases/top`);
    
    // Check if at least one top release has artist information
    const topReleaseWithArtist = topReleasesResponse.data.find(release => 
      release.artists && Array.isArray(release.artists) && release.artists.length > 0
    );
    
    if (topReleaseWithArtist) {
      console.log('\nSuccess! Found top release with artist information:');
      console.log('Release title:', topReleaseWithArtist.title);
      console.log('Artists:', topReleaseWithArtist.artists.map(artist => artist.name).join(', '));
    } else {
      console.error('\nError: No top releases found with artist information');
    }
    
  } catch (error) {
    console.error('Error testing API endpoints:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testApiEndpoints();
