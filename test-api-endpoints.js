// Test script to validate API endpoints
const http = require('http');

// Configuration
const hostname = 'localhost';
const port = 3000; // Update this to match your API server port
const label = 'buildit-records';

const endpoints = [
  {
    path: `/api/diagnostic`,
    name: 'Database Diagnostic'
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
    path: `/api/artists`,
    name: 'All Artists'
  },
  {
    path: `/api/releases`,
    name: 'All Releases'
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
      
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = JSON.parse(responseData);
          if (endpoint.path.includes('diagnostic')) {
            // For diagnostic endpoint, print a summary
            console.log('Diagnostic Results:');
            if (data.diagnosticResults) {
              console.log(`- Environment: ${data.diagnosticResults.environment}`);
              console.log(`- Tables found: ${data.diagnosticResults.tables.length}`);
              
              if (data.diagnosticResults.artistsInfo) {
                console.log(`- Artists total: ${data.diagnosticResults.artistsInfo.totalCount || 'N/A'}`);
                console.log(`- Artists with buildit-records label: ${data.diagnosticResults.artistsInfo.builditRecordsCount || 'N/A'}`);
              }
              
              if (data.diagnosticResults.releasesInfo) {
                console.log(`- Releases total: ${data.diagnosticResults.releasesInfo.totalCount || 'N/A'}`);
                console.log(`- Releases with buildit-records label: ${data.diagnosticResults.releasesInfo.builditRecordsCount || 'N/A'}`);
              }
              
              if (data.diagnosticResults.labelInfo && data.diagnosticResults.labelInfo.topLabels) {
                console.log('- Top label IDs:');
                data.diagnosticResults.labelInfo.topLabels.forEach(label => {
                  console.log(`  * ${label.label_id}: ${label.release_count} releases`);
                });
              }
              
              if (data.diagnosticResults.labelInfo && data.diagnosticResults.labelInfo.possibleBuilditLabels) {
                console.log('- Possible BuildIt label IDs:');
                data.diagnosticResults.labelInfo.possibleBuilditLabels.forEach(label => {
                  console.log(`  * ${label.label_id}`);
                });
              }
            }
          } else if (endpoint.path.includes('artists')) {
            // For artists endpoint
            if (data.data && data.data.artists) {
              console.log(`Found ${data.data.artists.length} artists`);
              if (data.data.artists.length > 0) {
                console.log('Sample artist:');
                const artist = data.data.artists[0];
                console.log(`- ID: ${artist.id}`);
                console.log(`- Name: ${artist.name}`);
                console.log(`- Label ID: ${artist.label_id}`);
              }
            } else if (data.artists) {
              console.log(`Found ${data.artists.length} artists`);
            } else {
              console.log('No artists data found in response');
            }
          } else if (endpoint.path.includes('releases')) {
            // For releases endpoint
            if (data.releases) {
              console.log(`Found ${data.releases.length} releases`);
              if (data.releases.length > 0) {
                console.log('Sample release:');
                const release = data.releases[0];
                console.log(`- ID: ${release.id}`);
                console.log(`- Title: ${release.title}`);
                console.log(`- Label ID: ${release.labelId}`);
                console.log(`- Artists: ${release.artists}`);
              }
            } else {
              console.log('No releases data found in response');
            }
          }
          resolve(data);
        } catch (error) {
          console.error('Error parsing response:', error);
          console.log('Raw response:', responseData);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Error with request: ${error.message}`);
      reject(error);
    });
    
    req.end();
  });
}

// Run all API tests
async function runTests() {
  console.log('Starting API endpoint tests...');
  
  for (const endpoint of endpoints) {
    try {
      await makeApiRequest(endpoint);
    } catch (error) {
      console.error(`Test failed for ${endpoint.name}:`, error);
    }
  }
  
  console.log('\nAll tests completed.');
}

// Start the tests
runTests();
