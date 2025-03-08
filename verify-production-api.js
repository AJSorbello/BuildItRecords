const https = require('https') // eslint-disable-line @typescript-eslint/no-var-requires;
const http = require('http') // eslint-disable-line @typescript-eslint/no-var-requires;

// Base URL for API testing
// Choose which URL to test:
// Local API server
// const API_BASE_URL = 'http://localhost:3001';
// Preview deployment
// const API_BASE_URL = 'https://builditrecords-61370ydw7-ajsorbellos-projects.vercel.app';
// Production deployment
const API_BASE_URL = 'https://builditrecords-movqv37rr-ajsorbellos-projects.vercel.app';

// Test endpoints to verify
const ENDPOINTS = [
  { 
    name: 'Simple Test Endpoint',
    path: '/api/test'
  },
  { 
    name: 'Database Diagnostic',
    path: '/api/diagnostic'
  },
  { 
    name: 'Artists by Label',
    path: '/api/artists?label=buildit-records'
  },
  { 
    name: 'Releases by Label',
    path: '/api/releases?label=buildit-records'
  }
];

// Function to make a GET request and extract a sample of the data
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    console.log(`Testing endpoint: ${url}`);
    
    // Choose http or https based on URL
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      const { statusCode } = res;
      let rawData = '';
      
      // Handle HTTP errors
      if (statusCode !== 200) {
        console.error(`HTTP Error ${statusCode}`);
        // Consume response data to free up memory
        res.resume();
        return resolve({ 
          success: false, 
          status: statusCode,
          data: null,
          error: `HTTP Error ${statusCode}` 
        });
      }
      
      // Collect data chunks
      res.on('data', (chunk) => { rawData += chunk; });
      
      // Process complete response
      res.on('end', () => {
        try {
          const data = // eslint-disable-line @typescript-eslint/no-unused-vars JSON.parse(rawData);
          let summary = {};
          
          // Extract useful data for summary based on endpoint
          if (url.includes('/api/artists')) {
            summary = {
              count: Array.isArray(data.artists) ? data.artists.length : 0,
              totalCount: data.metadata?.totalCount || data.count || 'N/A',
              sampleArtists: Array.isArray(data.artists) && data.artists.length > 0 
                ? data.artists.slice(0, 3).map(a => a.name) 
                : []
            };
          } else if (url.includes('/api/releases')) {
            summary = {
              count: Array.isArray(data.releases) ? data.releases.length : 0,
              totalCount: data.metadata?.totalCount || data.count || 'N/A',
              sampleReleases: Array.isArray(data.releases) && data.releases.length > 0 
                ? data.releases.slice(0, 3).map(r => r.title) 
                : []
            };
          } else if (url.includes('/api/diagnostic')) {
            summary = {
              tables: Array.isArray(data.tables) ? data.tables.length : 0,
              tablesFound: data.tables || [],
              artistsCount: data.data?.artistsCount || data.artistsCount || 'N/A',
              releasesCount: data.data?.releasesCount || data.releasesCount || 'N/A',
              hasLabelsTable: (data.tables || []).includes('labels'),
              dbVersion: data.data?.dbVersion || 'N/A'
            };
          }
          
          resolve({ 
            success: true, 
            status: statusCode,
            summary,
            data
          });
        } catch (e) {
          console.error(`Error parsing JSON: ${e.message}`);
          resolve({ 
            success: false, 
            status: statusCode,
            data: null,
            error: `Error parsing JSON: ${e.message}`,
            rawData: rawData.substring(0, 200) + '...' // Show start of response 
          });
        }
      });
    }).on('error', (err) => {
      console.error(`Network error: ${err.message}`);
      resolve({ 
        success: false, 
        data: null,
        error: `Network error: ${err.message}` 
      });
    });
  });
}

// Main function to test all endpoints
async function testAllEndpoints() {
  console.log('Starting API verification...');
  console.log(`Testing against: ${API_BASE_URL}`);
  console.log('---------------------------------------');
  
  for (const endpoint of ENDPOINTS) {
    const fullUrl = `${API_BASE_URL}${endpoint.path}`;
    console.log(`\nTesting ${endpoint.name}...`);
    
    const result = await makeRequest(fullUrl);
    
    if (result.success) {
      console.log(`✅ ${endpoint.name}: Success (HTTP ${result.status})`);
      console.log('Data summary:', JSON.stringify(result.summary, null, 2));
    } else {
      console.log(`❌ ${endpoint.name}: Failed`);
      console.log('Error:', result.error);
      if (result.rawData) {
        console.log('Raw response:', result.rawData);
      }
    }
    console.log('---------------------------------------');
  }
  
  console.log('\nAPI verification complete!');
}

// Run the tests
testAllEndpoints().catch(err => {
  console.error('Test script error:', err);
});
