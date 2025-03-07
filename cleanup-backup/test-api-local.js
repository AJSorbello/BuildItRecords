/**
 * Simple script to test the artists API endpoint locally
 */
const http = require('http');
const url = require('url');

// Configure the API endpoint
const apiPath = '/api/artists';
const queryParams = { label: 'buildit-records' };
const port = process.env.PORT || 3000;

// Construct the full URL
const fullUrl = url.format({
  protocol: 'http',
  hostname: 'localhost',
  port,
  pathname: apiPath,
  query: queryParams
});

console.log(`🔍 Testing API endpoint: ${fullUrl}`);

// Make the HTTP request
http.get(fullUrl, (res) => {
  console.log(`🔄 Response Status: ${res.statusCode} ${res.statusMessage}`);
  console.log(`🔤 Content-Type: ${res.headers['content-type']}`);
  
  let data = '';
  
  // Collect data chunks
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // Process the complete response
  res.on('end', () => {
    console.log('📊 Response Data:');
    try {
      const parsedData = JSON.parse(data);
      console.log(`✅ Success: ${parsedData.success ? 'true' : 'false'}`);
      
      if (parsedData.data?.artists) {
        console.log(`👥 Artists found: ${parsedData.data.artists.length}`);
        console.log(`🔍 First 3 artists:`);
        parsedData.data.artists.slice(0, 3).forEach((artist, index) => {
          console.log(`  ${index + 1}. ${artist.name} (ID: ${artist.id})`);
        });
      } else {
        console.log('❌ No artists data in response');
      }
      
      console.log('\n📝 Full JSON response:');
      console.log(JSON.stringify(parsedData, null, 2).substring(0, 1000) + '... (truncated)');
    } catch (error) {
      console.error('❌ Error parsing JSON response:', error.message);
      console.log('Raw response:', data);
    }
  });
}).on('error', (error) => {
  console.error(`❌ Request Error: ${error.message}`);
});
