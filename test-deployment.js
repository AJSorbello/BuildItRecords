// Deployment test script for Vercel
// Run this with Node.js after deployment to verify the API endpoints
const https = require('https');

// Configuration
const baseUrl = 'https://your-vercel-deployment-url.vercel.app'; // Replace with your actual Vercel URL
const endpoints = [
  {
    path: '/api/diagnostic',
    name: 'Database Diagnostic'
  },
  {
    path: '/api/artists?label=buildit-records',
    name: 'Artists by BuildIt Label'
  },
  {
    path: '/api/releases?label=buildit-records',
    name: 'Releases by BuildIt Label'
  },
  {
    path: '/api/health',
    name: 'Health Check'
  }
];

// Function to make an API request
function makeRequest(url, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n----- Testing ${description} -----`);
    console.log(`GET ${url}`);
    
    https.get(url, (res) => {
      const statusCode = res.statusCode;
      const contentType = res.headers['content-type'];
      
      console.log(`Status: ${statusCode}`);
      console.log(`Content-Type: ${contentType}`);
      
      let error;
      if (statusCode !== 200) {
        error = new Error(`Request Failed.\nStatus Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error(`Invalid content-type.\nExpected application/json but received ${contentType}`);
      }
      
      if (error) {
        console.error(error.message);
        // Consume response data to free up memory
        res.resume();
        reject(error);
        return;
      }
      
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          
          // API-specific result summaries
          if (url.includes('/diagnostic')) {
            console.log('\nDiagnostic Results:');
            if (parsedData.diagnosticResults) {
              console.log(`Environment: ${parsedData.diagnosticResults.environment}`);
              console.log(`Database: ${parsedData.diagnosticResults.database}`);
              console.log(`Tables count: ${parsedData.diagnosticResults.tables.length}`);
              console.log(`Available tables: ${parsedData.diagnosticResults.tables.join(', ')}`);
              
              // Artists info
              if (parsedData.diagnosticResults.artistsInfo) {
                const artistsInfo = parsedData.diagnosticResults.artistsInfo;
                console.log('\nArtists Info:');
                console.log(`Total artists: ${artistsInfo.totalCount || 'N/A'}`);
                console.log(`Artists with 'buildit-records' label: ${artistsInfo.builditRecordsCount || 'N/A'}`);
                console.log(`Artists with case-insensitive 'buildit-records' label: ${artistsInfo.caseInsensitiveCount || 'N/A'}`);
                
                if (artistsInfo.labelValues && artistsInfo.labelValues.length > 0) {
                  console.log('\nArtist label values:');
                  artistsInfo.labelValues.forEach(lv => {
                    console.log(`  ${lv.label_id}: ${lv.count} artists`);
                  });
                }
              }
              
              // Releases info
              if (parsedData.diagnosticResults.releasesInfo) {
                const releasesInfo = parsedData.diagnosticResults.releasesInfo;
                console.log('\nReleases Info:');
                console.log(`Total releases: ${releasesInfo.totalCount || 'N/A'}`);
                console.log(`Releases with 'buildit-records' label: ${releasesInfo.builditRecordsCount || 'N/A'}`);
                console.log(`Releases with case-insensitive 'buildit-records' label: ${releasesInfo.caseInsensitiveCount || 'N/A'}`);
                
                if (releasesInfo.labelValues && releasesInfo.labelValues.length > 0) {
                  console.log('\nRelease label values:');
                  releasesInfo.labelValues.forEach(lv => {
                    console.log(`  ${lv.label_id}: ${lv.count} releases`);
                  });
                }
                
                if (releasesInfo.likeBuilditCount && releasesInfo.likeBuilditCount.length > 0) {
                  console.log('\nReleases with labels like %buildit%:');
                  releasesInfo.likeBuilditCount.forEach(lv => {
                    console.log(`  ${lv.label_id}: ${lv.count} releases`);
                  });
                }
              }
              
              // Possible BuildIt label IDs
              if (parsedData.diagnosticResults.labelInfo && parsedData.diagnosticResults.labelInfo.possibleBuilditLabels) {
                console.log('\nPossible BuildIt label IDs:');
                parsedData.diagnosticResults.labelInfo.possibleBuilditLabels.forEach(label => {
                  console.log(`  ${label.label_id}`);
                });
              }
            }
          } else if (url.includes('/artists')) {
            console.log('\nArtists Results:');
            if (parsedData.data && parsedData.data.artists) {
              console.log(`Found ${parsedData.data.artists.length} artists`);
              if (parsedData.data.artists.length > 0) {
                console.log('\nFirst 5 artists:');
                parsedData.data.artists.slice(0, 5).forEach((artist, i) => {
                  console.log(`${i+1}. ${artist.name} (ID: ${artist.id}, Label: ${artist.label_id || 'N/A'})`);
                });
              }
            } else {
              console.log('No artists found in the response');
              console.log('Response structure:', Object.keys(parsedData).join(', '));
            }
          } else if (url.includes('/releases')) {
            console.log('\nReleases Results:');
            if (parsedData.releases) {
              console.log(`Found ${parsedData.releases.length} releases`);
              if (parsedData.releases.length > 0) {
                console.log('\nFirst 5 releases:');
                parsedData.releases.slice(0, 5).forEach((release, i) => {
                  console.log(`${i+1}. ${release.title} (ID: ${release.id}, Label: ${release.labelId || 'N/A'})`);
                  console.log(`   Artists: ${release.artists || 'N/A'}`);
                });
              }
            } else {
              console.log('No releases found in the response');
              console.log('Response structure:', Object.keys(parsedData).join(', '));
            }
          } else {
            console.log('\nResponse Summary:');
            console.log('Keys in response:', Object.keys(parsedData).join(', '));
          }
          
          resolve(parsedData);
        } catch (e) {
          console.error('Error parsing JSON response:', e.message);
          console.log('Raw response:', rawData.substring(0, 200) + '...');
          reject(e);
        }
      });
    }).on('error', (e) => {
      console.error(`Request Error: ${e.message}`);
      reject(e);
    });
  });
}

// Run all tests sequentially
async function runTests() {
  console.log('Starting API tests for Vercel deployment');
  console.log(`Base URL: ${baseUrl}`);
  console.log('----------------------------------------');
  
  for (const endpoint of endpoints) {
    try {
      await makeRequest(`${baseUrl}${endpoint.path}`, endpoint.name);
    } catch (error) {
      console.error(`Error testing ${endpoint.name}:`, error.message);
    }
  }
  
  console.log('\n----------------------------------------');
  console.log('Testing complete!');
}

// Start the tests
runTests();
