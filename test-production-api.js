const https = require('https');

// Production URL
const BASE_URL = 'https://build-it-records-784oy9vct-ajsorbellos-projects.vercel.app';

function testEndpoint(endpoint, name) {
  return new Promise((resolve) => {
    console.log(`\n---------------------------------------`);
    console.log(`Testing ${name}: ${endpoint}`);
    console.log(`---------------------------------------`);
    
    https.get(`${BASE_URL}${endpoint}`, (res) => {
      const { statusCode } = res;
      let data = '';
      
      console.log(`Status Code: ${statusCode}`);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          console.log('Response structure:', Object.keys(parsedData));
          
          if (endpoint.includes('releases')) {
            if (parsedData.releases) {
              console.log(`Found ${parsedData.releases.length} releases`);
              if (parsedData.releases.length > 0) {
                const sample = parsedData.releases[0];
                console.log('Sample release:', {
                  id: sample.id,
                  name: sample.name,
                  hasImages: Array.isArray(sample.images) && sample.images.length > 0,
                  imageUrls: Array.isArray(sample.images) ? sample.images.map(img => img.url) : []
                });
              }
            }
          } else if (endpoint.includes('artists')) {
            if (parsedData.artists) {
              console.log(`Found ${parsedData.artists.length} artists`);
              if (parsedData.artists.length > 0) {
                const sample = parsedData.artists[0];
                console.log('Sample artist:', {
                  id: sample.id,
                  name: sample.name,
                  imageUrl: sample.image_url || sample.images?.[0]?.url || 'No image URL',
                  hasImages: sample.images && Array.isArray(sample.images) && sample.images.length > 0
                });
              }
            }
          }
          
          console.log('Test passed for', name);
          resolve(true);
        } catch (e) {
          console.log('Error parsing response:', e.message);
          console.log('Raw response:', data.slice(0, 200) + '...');
          console.log('Test failed for', name);
          resolve(false);
        }
      });
    }).on('error', (e) => {
      console.log('Error with request:', e.message);
      console.log('Test failed for', name);
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('Starting Production API endpoint tests...');
  
  // Test health endpoint
  await testEndpoint('/api/health', 'Health Check');
  
  // Test artists endpoints
  await testEndpoint('/api/artists', 'All Artists');
  await testEndpoint('/api/artists?label=buildit-records', 'Artists by Label');
  
  // Test releases endpoints
  await testEndpoint('/api/releases', 'All Releases');
  await testEndpoint('/api/releases?label=buildit-records', 'Releases by Label');
  
  console.log('\nAll tests completed.');
}

runTests();
