/**
 * Simple test script for the top releases endpoint
 */
const http = require('http');

// Configuration
const API_BASE = 'http://localhost:3003/api';

// Make a request to the top releases endpoint
const url = `${API_BASE}/releases/top`;
console.log(`Making request to: ${url}`);

http.get(url, (res) => {
  console.log(`Status code: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let rawData = '';
  res.on('data', (chunk) => {
    rawData += chunk;
  });
  
  res.on('end', () => {
    console.log('-----RAW RESPONSE DATA-----');
    console.log(rawData);
    console.log('---------------------------');
    
    try {
      const parsedData = JSON.parse(rawData);
      console.log('Successfully parsed JSON:');
      console.log(JSON.stringify(parsedData, null, 2));
    } catch (error) {
      console.error(`Error parsing JSON: ${error.message}`);
    }
  });
}).on('error', (error) => {
  console.error(`Request error: ${error.message}`);
});
