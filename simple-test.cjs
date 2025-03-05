// Simple test script to check the API
const http = require('http');

// Function to make a GET request without external dependencies
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const { statusCode } = res;
      
      if (statusCode !== 200) {
        console.log(`Request Failed: Status Code: ${statusCode}`);
        // Consume response data to free up memory
        res.resume();
        reject(new Error(`Request Failed: Status Code: ${statusCode}`));
        return;
      }
      
      res.setEncoding('utf8');
      let rawData = '';
      
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
        } catch (e) {
          reject(new Error(`Error parsing response: ${e.message}`));
        }
      });
    }).on('error', (e) => {
      reject(new Error(`Request error: ${e.message}`));
    });
  });
}

async function testApi() {
  console.log('Testing API for each label...');
  
  const labels = [
    { id: 'buildit-records', name: 'Build It Records' },
    { id: 'buildit-tech', name: 'Build It Tech' },
    { id: 'buildit-deep', name: 'Build It Deep' }
  ];
  
  for (const label of labels) {
    try {
      console.log(`\nTesting API for ${label.name} (${label.id})...`);
      
      const url = `http://localhost:3001/api/releases?label=${label.id}`;
      console.log(`Requesting: ${url}`);
      
      const data = await httpGet(url);
      
      if (data && data.releases) {
        console.log(`✅ Successfully fetched ${data.releases.length} releases!`);
        
        if (data.releases.length > 0) {
          console.log('\nFirst 3 releases:');
          data.releases.slice(0, 3).forEach(release => {
            console.log(`- ${release.title} by ${release.artistName}`);
          });
        }
      } else {
        console.log('❌ No releases returned in the response');
      }
    } catch (error) {
      console.error(`❌ Error testing ${label.name}: ${error.message}`);
    }
  }
}

// Run the test
testApi().catch(err => {
  console.error('Fatal error:', err);
});
