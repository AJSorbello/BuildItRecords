// direct-api-test.js
import fetch from 'node-fetch';

// Labels to test
const labels = [
  { name: 'Build It Records', slug: 'buildit-records' },
  { name: 'Build It Tech', slug: 'buildit-tech' },
  { name: 'Build It Deep', slug: 'buildit-deep' }
];

// API endpoints to test (both serverless and traditional)
const endpoints = [
  { name: 'Traditional API', url: 'http://localhost:3001/api/releases' },
  { name: 'Express Route', url: 'http://localhost:3001/releases' },
  { name: 'Serverless API', url: 'http://localhost:3000/api/releases' }
];

// Helper to print response details
async function printResponseDetails(response) {
  console.log(`  Status: ${response.status} ${response.statusText}`);
  console.log('  Headers:');
  response.headers.forEach((value, name) => {
    console.log(`    ${name}: ${value}`);
  });
  
  try {
    const data = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(data);
      console.log('  Body (formatted):');
      console.log(JSON.stringify(parsed, null, 2).substring(0, 500) + (JSON.stringify(parsed, null, 2).length > 500 ? '...' : ''));
    } catch (e) {
      console.log('  Body (raw):');
      console.log(data.substring(0, 500) + (data.length > 500 ? '...' : ''));
    }
    
    if (parsed && parsed.error) {
      console.log('  Error details:');
      console.log(`    Message: ${parsed.error}`);
      if (parsed.details) {
        console.log(`    Stack: ${parsed.details.stack ? parsed.details.stack.split('\n')[0] : 'N/A'}`);
      }
    }
  } catch (e) {
    console.log('  Could not read response body:', e.message);
  }
}

async function testEndpoint(endpoint, label) {
  console.log(`\nTesting ${endpoint.name} for ${label.name} (${label.slug})...`);
  console.log(`Requesting: ${endpoint.url}?label=${label.slug}`);
  
  try {
    const response = await fetch(`${endpoint.url}?label=${label.slug}`);
    
    if (response.ok) {
      console.log(`✅ Success! Status: ${response.status}`);
      try {
        const data = await response.json();
        const releaseCount = data.releases ? data.releases.length : 0;
        console.log(`   Found ${releaseCount} releases`);
        
        if (releaseCount > 0) {
          const firstRelease = data.releases[0];
          console.log(`   First release: "${firstRelease.title}" by ${firstRelease.artistName || 'Unknown Artist'}`);
        }
      } catch (e) {
        console.log(`   Could not parse response: ${e.message}`);
      }
    } else {
      console.log(`❌ Request Failed: Status Code: ${response.status}`);
      await printResponseDetails(response);
    }
  } catch (error) {
    console.log(`❌ Fetch Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('===== API ENDPOINT TESTING =====\n');
  
  // First do a general connection test
  try {
    console.log('Checking server is up...');
    const healthCheck = await fetch('http://localhost:3001/health', { timeout: 5000 });
    console.log(`Server health check: ${healthCheck.status} ${healthCheck.statusText}`);
  } catch (e) {
    console.log(`WARNING: Server health check failed: ${e.message}`);
    console.log('Make sure your server is running on port 3001');
  }
  
  // Run specific tests for each label on each endpoint
  for (const endpoint of endpoints) {
    for (const label of labels) {
      await testEndpoint(endpoint, label);
    }
  }
  
  // Also test without label parameter
  for (const endpoint of endpoints) {
    console.log(`\nTesting ${endpoint.name} with no label parameter...`);
    console.log(`Requesting: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url);
      if (response.ok) {
        console.log(`✅ Success! Status: ${response.status}`);
        const data = await response.json();
        console.log(`   Found ${data.releases ? data.releases.length : 0} releases without label filter`);
      } else {
        console.log(`❌ Request Failed: Status Code: ${response.status}`);
        await printResponseDetails(response);
      }
    } catch (error) {
      console.log(`❌ Fetch Error: ${error.message}`);
    }
  }
}

runTests().catch(console.error);
