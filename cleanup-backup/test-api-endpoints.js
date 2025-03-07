// Test script to validate API endpoints
const http = require('http');

// Configuration
const hostname = 'localhost';
const port = 3003; // Updated to match the local API server port instead of Vite
const label = 'buildit-records';
const sampleArtistId = '1'; // Sample artist ID to test with - will need to be adjusted
const sampleSpotifyId = 'spotify-id'; // Sample Spotify ID to test with - will need to be adjusted

// Define all endpoints to test
const endpoints = [
  {
    path: `/api/health`,
    name: 'Health Check'
  },
  {
    path: `/api/artists?label=${label}`,
    name: 'Artists by Label'
  },
  {
    path: `/api/releases?label=${label}`,
    name: 'Releases by Label'
  },
  {
    path: `/api/releases`, 
    name: 'All Releases'
  },
  {
    path: `/api/releases/top`,
    name: 'Top Releases (Fixed)',
    expectedResponse: (data) => {
      // Updated to match the new response format { success, count, data }
      console.log(`  Found ${data.data ? data.data.length : 0} top releases`);
      if (data.data && data.data.length > 0) {
        const firstRelease = data.data[0];
        console.log(`  First release: ${firstRelease.title || firstRelease.name}`);
        
        if (firstRelease.artists && firstRelease.artists.length > 0) {
          console.log(`  First release has ${firstRelease.artists.length} artists`);
          console.log(`  First artist: ${firstRelease.artists[0].name}`);
        } else {
          console.log(`  First release has no artists`);
        }
      }
      return data.success === true && typeof data.count === 'number' && Array.isArray(data.data);
    }
  },
  {
    path: `/api/releases/top?label=${label}`,
    name: 'Top Releases by Label (Fixed)',
    expectedResponse: (data) => {
      // Updated to match the new response format { success, count, data }
      console.log(`  Found ${data.data ? data.data.length : 0} top releases for label`);
      return data.success === true && typeof data.count === 'number' && Array.isArray(data.data);
    }
  },
  {
    path: `/api/artists/releases/${sampleArtistId}`, 
    name: 'Releases by Artist ID (Fixed)',
    expectedResponse: (data) => {
      console.log(`  Found ${data.releases ? data.releases.length : 0} releases for artist ID ${sampleArtistId}`);
      return data.releases && Array.isArray(data.releases);
    }
  },
  {
    path: `/api/artists/releases/${sampleSpotifyId}`,
    name: 'Releases by Artist Spotify ID (Fixed)',
    expectedResponse: (data) => {
      console.log(`  Found ${data.releases ? data.releases.length : 0} releases for Spotify ID ${sampleSpotifyId}`);
      return data.releases && Array.isArray(data.releases);
    }
  }
];

// Function to make an API request
async function makeApiRequest(endpoint) {
  return new Promise((resolve, reject) => {
    console.log(`\n---------------------------------------`);
    console.log(`Testing ${endpoint.name}: ${endpoint.path}`);
    console.log(`---------------------------------------`);
    
    const options = {
      hostname,
      port,
      path: endpoint.path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      const statusCode = res.statusCode;
      console.log(`Status Code: ${statusCode}`);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Check if there's actually data to parse
          if (data.trim()) {
            const responseData = JSON.parse(data);
            console.log(`Response received (${Buffer.byteLength(data, 'utf8')} bytes)`);
            
            // Check expectations if defined
            if (endpoint.expectedResponse && typeof endpoint.expectedResponse === 'function') {
              const expectationMet = endpoint.expectedResponse(responseData);
              if (expectationMet) {
                console.log(` Response matches expected format`);
              } else {
                console.log(` Response does not match expected format`);
              }
            }
            
            // Print the first artist or release for debugging
            if (responseData.artists && responseData.artists.length > 0) {
              console.log(`Found ${responseData.artists.length} artists`);
              console.log(`First artist: ${JSON.stringify(responseData.artists[0], null, 2)}`);
            }
            
            if (responseData.releases && responseData.releases.length > 0) {
              console.log(`Found ${responseData.releases.length} releases`);
              
              // Log if any releases are missing artist information
              const releasesWithoutArtists = responseData.releases.filter(r => 
                !r.artists || r.artists.length === 0
              );
              
              if (releasesWithoutArtists.length > 0) {
                console.log(` WARNING: ${releasesWithoutArtists.length} releases are missing artist information`);
                const firstMissing = releasesWithoutArtists[0];
                console.log(`Example missing artist release: ${firstMissing.title || firstMissing.name}`);
              } else {
                console.log(` All releases have artist information`);
              }
            }
            
            resolve({
              status: 'success',
              statusCode,
              data: responseData
            });
          } else {
            console.log('Empty response received');
            resolve({
              status: 'success',
              statusCode,
              data: 'No content'
            });
          }
        } catch (error) {
          console.error(`Error parsing response: ${error.message}`);
          console.log(`Raw response: ${data.substring(0, 200)}...`);
          resolve({
            status: 'error',
            statusCode,
            error: error.message,
            rawData: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Error making request: ${error.message}`);
      resolve({
        status: 'error',
        error: error.message
      });
    });
    
    req.end();
  });
}

// Execute all tests sequentially
async function runTests() {
  console.log('Starting API endpoint tests...');
  console.log(`Server: ${hostname}:${port}`);
  
  let results = {
    total: endpoints.length,
    successful: 0,
    failed: 0
  };
  
  // Run each test in sequence
  for (const endpoint of endpoints) {
    try {
      const result = await makeApiRequest(endpoint);
      if (result.status === 'success' && result.statusCode >= 200 && result.statusCode < 300) {
        results.successful++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error(`Fatal error testing ${endpoint.name}: ${error.message}`);
      results.failed++;
    }
  }
  
  // Print summary
  console.log('\n=======================================');
  console.log('TEST SUMMARY');
  console.log('=======================================');
  console.log(`Total endpoints tested: ${results.total}`);
  console.log(`Successful: ${results.successful}`);
  console.log(`Failed: ${results.failed}`);
  console.log('=======================================');
  
  if (results.failed === 0) {
    console.log(' All tests passed successfully!');
  } else {
    console.log(` ${results.failed} tests failed`);
  }
}

// Find a valid artist ID for testing
async function findValidArtistId() {
  console.log('Looking for a valid artist ID for testing...');
  
  const options = {
    hostname,
    port,
    path: '/api/artists',
    method: 'GET'
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = JSON.parse(data);
          if (responseData.artists && responseData.artists.length > 0) {
            const artist = responseData.artists[0];
            console.log(`Found artist for testing: ${artist.name} (ID: ${artist.id})`);
            resolve(artist.id);
          } else {
            console.log('No artists found, using default ID');
            resolve('1');
          }
        } catch (error) {
          console.error('Error finding artist:', error);
          resolve('1');
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Error finding artist:', error);
      resolve('1');
    });
    
    req.end();
  });
}

// Start the tests
async function init() {
  try {
    // First find a valid artist ID to use in testing
    const artistId = await findValidArtistId();
    
    // Update the artist ID in the test endpoints
    endpoints.forEach(endpoint => {
      if (endpoint.path.includes('/artists/releases/')) {
        endpoint.path = endpoint.path.replace(sampleArtistId, artistId);
      }
    });
    
    // Now run all the tests
    await runTests();
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

init();
