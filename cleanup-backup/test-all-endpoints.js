/**
 * Comprehensive test script for BuildItRecords API endpoints
 * 
 * This script tests all API endpoints and validates their responses,
 * particularly focusing on error handling and fallback strategies.
 */

const http = require('http');
const url = require('url');

// Configuration
const API_BASE = 'http://localhost:3003/api';
const TEST_LABEL_ID = 'buildit-records';
const TEST_ARTIST_ID = '1'; // A valid artist ID for testing
const TEST_ARTIST_SPOTIFY_ID = '1WgXqy2Dd70QQOU7Cv3vep'; // A valid Spotify ID for testing
const TEST_RELEASE_ID = '1'; // A valid release ID for testing

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0
};

/**
 * Make an HTTP request to the API
 * @param {string} endpoint - API endpoint path
 * @returns {Promise<Object>} - Response data
 */
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const requestUrl = `${API_BASE}${endpoint}`;
    console.log(`${colors.blue}Making request to: ${requestUrl}${colors.reset}`);
    
    const options = url.parse(requestUrl);
    
    const req = http.get(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseData = JSON.parse(data);
          console.log(`${colors.cyan}Response status code: ${res.statusCode}${colors.reset}`);
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        } catch (error) {
          console.error(`${colors.red}Error parsing response JSON: ${error.message}${colors.reset}`);
          console.log(`${colors.yellow}Raw response data: ${data.substring(0, 200)}...${colors.reset}`);
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`${colors.red}Request error: ${error.message}${colors.reset}`);
      reject(error);
    });
    
    req.end();
  });
}

/**
 * Test and validate an API endpoint
 * @param {string} name - Test name
 * @param {string} endpoint - API endpoint to test
 * @param {Function} validator - Function to validate the response
 */
async function testEndpoint(name, endpoint, validator) {
  console.log(`\n${colors.magenta}=== Testing: ${name} ===${colors.reset}`);
  
  try {
    const response = await makeRequest(endpoint);
    
    if (validator(response)) {
      console.log(`${colors.green}✓ PASSED: ${name}${colors.reset}`);
      results.passed++;
    } else {
      console.log(`${colors.red}✗ FAILED: ${name}${colors.reset}`);
      results.failed++;
    }
  } catch (error) {
    console.error(`${colors.red}✗ ERROR: ${name} - ${error.message}${colors.reset}`);
    results.failed++;
  }
}

/**
 * Run all API endpoint tests
 */
async function runTests() {
  console.log(`${colors.cyan}Starting BuildItRecords API tests...${colors.reset}`);
  
  // 1. Test Health Endpoint
  await testEndpoint('Health Check', '/health', (response) => {
    console.log('Health response:', response.data);
    return response.statusCode === 200 && response.data.status === 'healthy';
  });
  
  // 2. Test Artists Endpoint (with no parameters)
  await testEndpoint('All Artists', '/artists', (response) => {
    const valid = response.statusCode === 200 && 
                 Array.isArray(response.data.artists) && 
                 response.data.artists.length > 0;
    
    if (valid) {
      console.log(`Found ${response.data.artists.length} artists`);
      console.log('Sample artist:', response.data.artists[0]);
    }
    
    return valid;
  });
  
  // 3. Test Artists by Label Endpoint
  await testEndpoint(`Artists by Label (${TEST_LABEL_ID})`, `/artists/label/${TEST_LABEL_ID}`, (response) => {
    const valid = response.statusCode === 200 && 
                 Array.isArray(response.data.artists) && 
                 response.data.metadata && 
                 response.data.metadata.label === TEST_LABEL_ID;
    
    if (valid) {
      console.log(`Found ${response.data.artists.length} artists for label ${TEST_LABEL_ID}`);
      if (response.data.artists.length > 0) {
        console.log('Sample artist:', response.data.artists[0]);
      }
      
      // Check for any error information in the response
      if (response.data.metadata.error) {
        console.log(`${colors.yellow}NOTE: Response includes error info: ${response.data.metadata.error}${colors.reset}`);
        console.log(`Source: ${response.data.metadata.source}`);
      }
    }
    
    return valid;
  });
  
  // 4. Test Single Artist by ID Endpoint
  await testEndpoint(`Single Artist by ID (${TEST_ARTIST_ID})`, `/artist/${TEST_ARTIST_ID}`, (response) => {
    const valid = response.statusCode === 200 && 
                 response.data.artist && 
                 response.data.artist.id;
    
    if (valid) {
      console.log('Artist details:', response.data.artist);
    }
    
    return valid;
  });
  
  // 5. Test Single Artist by Spotify ID Endpoint
  await testEndpoint(`Single Artist by Spotify ID (${TEST_ARTIST_SPOTIFY_ID})`, `/artist/${TEST_ARTIST_SPOTIFY_ID}`, (response) => {
    const valid = response.statusCode === 200 && 
                 response.data.artist && 
                 (response.data.artist.id || response.data.artist.spotify_id);
    
    if (valid) {
      console.log('Artist details (via Spotify ID):', response.data.artist);
    }
    
    return valid;
  });
  
  // 6. Test Artist Releases Endpoint
  await testEndpoint(`Artist Releases (for artist ${TEST_ARTIST_ID})`, `/artists/releases/${TEST_ARTIST_ID}`, (response) => {
    const valid = response.statusCode === 200 && 
                 Array.isArray(response.data.releases);
    
    if (valid) {
      console.log(`Found ${response.data.releases.length} releases for artist ${TEST_ARTIST_ID}`);
      if (response.data.releases.length > 0) {
        console.log('Sample release:', response.data.releases[0]);
      }
    }
    
    return valid;
  });
  
  // 7. Test All Releases Endpoint
  await testEndpoint('All Releases', '/releases', (response) => {
    const valid = response.statusCode === 200 && 
                 Array.isArray(response.data.releases);
    
    if (valid) {
      console.log(`Found ${response.data.releases.length} releases`);
      if (response.data.releases.length > 0) {
        console.log('Sample release:', response.data.releases[0]);
      }
    }
    
    return valid;
  });
  
  // 8. Test Releases by Label Endpoint
  await testEndpoint(`Releases by Label (${TEST_LABEL_ID})`, `/releases?label=${TEST_LABEL_ID}`, (response) => {
    const valid = response.statusCode === 200 && 
                 Array.isArray(response.data.releases) && 
                 response.data.metadata && 
                 response.data.metadata.label === TEST_LABEL_ID;
    
    if (valid) {
      console.log(`Found ${response.data.releases.length} releases for label ${TEST_LABEL_ID}`);
      if (response.data.releases.length > 0) {
        console.log('Sample release:', response.data.releases[0]);
      }
      
      // Check for any error information in the response
      if (response.data.metadata.error) {
        console.log(`${colors.yellow}NOTE: Response includes error info: ${response.data.metadata.error}${colors.reset}`);
        console.log(`Source: ${response.data.metadata.source}`);
      }
    }
    
    return valid;
  });
  
  // 9. Test Single Release by ID Endpoint
  await testEndpoint(`Single Release (${TEST_RELEASE_ID})`, `/releases/${TEST_RELEASE_ID}`, (response) => {
    const valid = response.statusCode === 200 && 
                 response.data.release && 
                 response.data.release.id;
    
    if (valid) {
      console.log('Release details:', response.data.release);
    }
    
    return valid;
  });
  
  // 10. Test Top Releases Endpoint
  await testEndpoint('Top Releases', '/releases/top', (response) => {
    const valid = response.statusCode === 200 && 
                 Array.isArray(response.data.releases);
    
    if (valid) {
      console.log(`Found ${response.data.releases.length} top releases`);
      if (response.data.releases.length > 0) {
        console.log('Sample top release:', response.data.releases[0]);
      }
    }
    
    return valid;
  });
  
  // 11. Test Top Releases by Label Endpoint
  await testEndpoint(`Top Releases by Label (${TEST_LABEL_ID})`, `/releases/top?label=${TEST_LABEL_ID}`, (response) => {
    const valid = response.statusCode === 200 && 
                 Array.isArray(response.data.releases) && 
                 response.data.metadata && 
                 response.data.metadata.label === TEST_LABEL_ID;
    
    if (valid) {
      console.log(`Found ${response.data.releases.length} top releases for label ${TEST_LABEL_ID}`);
      if (response.data.releases.length > 0) {
        console.log('Sample top release:', response.data.releases[0]);
      }
    }
    
    return valid;
  });
  
  // 12. Test Tracks Endpoint
  await testEndpoint('All Tracks', '/tracks', (response) => {
    const valid = response.statusCode === 200 && 
                 Array.isArray(response.data.tracks);
    
    if (valid) {
      console.log(`Found ${response.data.tracks.length} tracks`);
      if (response.data.tracks.length > 0) {
        console.log('Sample track:', response.data.tracks[0]);
      }
    }
    
    return valid;
  });
  
  // 13. Test Tracks by Label Endpoint
  await testEndpoint(`Tracks by Label (${TEST_LABEL_ID})`, `/tracks?label=${TEST_LABEL_ID}`, (response) => {
    const valid = response.statusCode === 200 && 
                 Array.isArray(response.data.tracks) && 
                 response.data.meta && 
                 (response.data.meta.label === TEST_LABEL_ID || 
                  response.data.meta.labelId === TEST_LABEL_ID);
    
    if (valid) {
      console.log(`Found ${response.data.tracks.length} tracks for label ${TEST_LABEL_ID}`);
      if (response.data.tracks.length > 0) {
        console.log('Sample track:', response.data.tracks[0]);
      }
    }
    
    return valid;
  });
  
  // Print summary
  console.log(`\n${colors.magenta}=== Test Summary ====${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${results.skipped}${colors.reset}`);
  console.log(`${colors.magenta}====================${colors.reset}\n`);
  
  if (results.failed === 0) {
    console.log(`${colors.green}All tests passed! The API is ready for deployment.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Some tests failed. Please review the errors before deploying.${colors.reset}`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Test runner error: ${error.message}${colors.reset}`);
});
