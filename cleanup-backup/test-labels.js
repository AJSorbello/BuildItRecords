// Test script to fetch data for each label from the BuildIt API
const http = require('http');

// Define the API Base URL
const API_BASE = 'http://localhost:3003/api';

// Define the labels to test
const labels = [
  { id: 'buildit-records', name: 'Build It Records' },
  { id: 'buildit-tech', name: 'Build It Tech' },
  { id: 'buildit-deep', name: 'Build It Deep' }
];

// Helper function to make HTTP requests
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const requestUrl = `${API_BASE}${endpoint}`;
    console.log(`Making request to: ${requestUrl}`);
    
    const req = http.get(requestUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        } catch (error) {
          console.error(`Error parsing response JSON: ${error.message}`);
          console.log(`Raw response data: ${data.substring(0, 200)}...`);
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Test all endpoints for each label
async function testAllLabels() {
  console.log('==============================================');
  console.log('Testing BuildIt Records API for all labels');
  console.log('==============================================\n');
  
  for (const label of labels) {
    console.log(`\n=== Testing label: ${label.name} (${label.id}) ===\n`);
    
    try {
      // 1. Test artists by label
      await testArtistsByLabel(label);
      
      // 2. Test releases by label
      await testReleasesByLabel(label);
      
      // 3. Test top releases by label
      await testTopReleasesByLabel(label);
      
      // 4. Test tracks by label
      await testTracksByLabel(label);
      
    } catch (error) {
      console.error(`Error testing ${label.name}: ${error.message}`);
    }
    
    console.log('\n----------------------------------------------\n');
  }
  
  console.log('Tests completed!');
}

// Test artists by label
async function testArtistsByLabel(label) {
  try {
    console.log(`Testing artists for ${label.name}...`);
    const response = await makeRequest(`/artists/label/${label.id}`);
    
    if (response.statusCode === 200) {
      const artists = response.data.artists || [];
      console.log(`✅ Found ${artists.length} artists for ${label.name}`);
      
      if (artists.length > 0) {
        console.log('\nSample artists:');
        artists.slice(0, 3).forEach((artist, index) => {
          console.log(`${index + 1}. ${artist.name || 'Unknown'} (ID: ${artist.id})`);
        });
      }
      
      // Check for errors in the metadata
      if (response.data.metadata && response.data.metadata.error) {
        console.log(`⚠️  Warning: ${response.data.metadata.error}`);
        console.log(`Source: ${response.data.metadata.source}`);
      }
    } else {
      console.log(`❌ Error: Status ${response.statusCode}`);
    }
  } catch (error) {
    console.error(`❌ Error testing artists for ${label.name}: ${error.message}`);
  }
}

// Test releases by label
async function testReleasesByLabel(label) {
  try {
    console.log(`\nTesting releases for ${label.name}...`);
    const response = await makeRequest(`/releases?label=${label.id}`);
    
    if (response.statusCode === 200) {
      const releases = response.data.releases || [];
      console.log(`✅ Found ${releases.length} releases for ${label.name}`);
      
      if (releases.length > 0) {
        console.log('\nSample releases:');
        releases.slice(0, 3).forEach((release, index) => {
          console.log(`${index + 1}. ${release.title || release.name || 'Unknown'} (Type: ${release.type || 'Unknown'}, Date: ${release.release_date || 'Unknown'})`);
        });
      }
      
      // Check for errors in the metadata
      if (response.data.metadata && response.data.metadata.error) {
        console.log(`⚠️  Warning: ${response.data.metadata.error}`);
        console.log(`Source: ${response.data.metadata.source}`);
      }
    } else {
      console.log(`❌ Error: Status ${response.statusCode}`);
    }
  } catch (error) {
    console.error(`❌ Error testing releases for ${label.name}: ${error.message}`);
  }
}

// Test top releases by label
async function testTopReleasesByLabel(label) {
  try {
    console.log(`\nTesting top releases for ${label.name}...`);
    const response = await makeRequest(`/releases/top?label=${label.id}`);
    
    if (response.statusCode === 200) {
      const releases = response.data.releases || [];
      console.log(`✅ Found ${releases.length} top releases for ${label.name}`);
      
      if (releases.length > 0) {
        console.log('\nSample top releases:');
        releases.slice(0, 3).forEach((release, index) => {
          console.log(`${index + 1}. ${release.title || release.name || 'Unknown'} (Popularity: ${release.popularity || 'Unknown'})`);
        });
      }
      
      // Check for errors in the metadata
      if (response.data.metadata && response.data.metadata.error) {
        console.log(`⚠️  Warning: ${response.data.metadata.error}`);
        console.log(`Source: ${response.data.metadata.source}`);
      }
    } else {
      console.log(`❌ Error: Status ${response.statusCode}`);
    }
  } catch (error) {
    console.error(`❌ Error testing top releases for ${label.name}: ${error.message}`);
  }
}

// Test tracks by label
async function testTracksByLabel(label) {
  try {
    console.log(`\nTesting tracks for ${label.name}...`);
    const response = await makeRequest(`/tracks?label=${label.id}`);
    
    if (response.statusCode === 200) {
      const tracks = response.data.tracks || [];
      console.log(`✅ Found ${tracks.length} tracks for ${label.name}`);
      
      if (tracks.length > 0) {
        console.log('\nSample tracks:');
        tracks.slice(0, 3).forEach((track, index) => {
          console.log(`${index + 1}. ${track.title || 'Unknown'} (Artist: ${track.artist_name || 'Unknown'}, Release: ${track.release_title || 'Unknown'})`);
        });
      }
      
      // Check for errors in the metadata
      if (response.data.metadata && response.data.metadata.error) {
        console.log(`⚠️  Warning: ${response.data.metadata.error}`);
        console.log(`Source: ${response.data.metadata.source}`);
      }
    } else {
      console.log(`❌ Error: Status ${response.statusCode}`);
    }
  } catch (error) {
    console.error(`❌ Error testing tracks for ${label.name}: ${error.message}`);
  }
}

// Run the tests
testAllLabels().catch(error => {
  console.error('Fatal error:', error);
});
