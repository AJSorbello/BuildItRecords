// API Verification Script - Tests all serverless API endpoints
// Run this script to verify API endpoints are working correctly before deployment

// Using dynamic import for node-fetch (ESM module)
const path = require('path');
const fs = require('fs');

// Get directory name
const rootDir = process.cwd(); // Use current working directory as root

// Configuration
const API_BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api` 
  : 'http://localhost:3003/api'; // Updated to match our new port

const TEST_LABEL = 'buildit-records';
const TEST_ARTIST_ID = '123'; // Replace with a real artist ID from your database if needed
const TEST_RELEASE_ID = '476be2ec-e026-4634-b1ad-f044a95bb927'; // Replace with a real release ID

// Color formatting for console output
const colors = {
  reset: "\x1b[0m",
  fg: {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m"
  },
  bg: {
    red: "\x1b[41m",
    green: "\x1b[42m"
  }
};

// Test parameters
const endpoints = [
  { url: `/health`, name: 'Health Check' },
  { url: `/test-db-connection`, name: 'Database Connection Test' },
  { url: `/releases?limit=5`, name: 'Releases List' },
  { url: `/releases?label=${TEST_LABEL}&limit=5`, name: 'Releases by Label' },
  { url: `/releases/${TEST_RELEASE_ID}`, name: 'Release by ID' },
  { url: `/tracks?limit=5`, name: 'Tracks List' },
  { url: `/tracks?release=${TEST_RELEASE_ID}&limit=5`, name: 'Tracks by Release' }
];

// Helper to format and log API responses
function logResponse(endpoint, response, data) {
  const statusColor = response.ok ? colors.fg.green : colors.fg.red;
  const statusText = response.ok ? 'OK' : 'FAILED';
  
  console.log(`${colors.fg.blue}[${endpoint.name}]${colors.reset} - Status: ${statusColor}${response.status} ${statusText}${colors.reset}`);
  
  if (!response.ok) {
    console.log(`${colors.fg.red}Error:${colors.reset}`, data.error || data.message || 'Unknown error');
    return;
  }
  
  // Log a summary of the data
  if (data) {
    if (Array.isArray(data)) {
      console.log(`  Returned ${data.length} items`);
      if (data.length > 0) {
        console.log(`  First item: ${JSON.stringify(data[0], null, 2).slice(0, 150)}...`);
      }
    } else if (typeof data === 'object') {
      if (data.database) {
        console.log(`  Database: ${JSON.stringify(data.database, null, 2)}`);
      } else {
        const keys = Object.keys(data);
        console.log(`  Response keys: ${keys.join(', ')}`);
        
        // Show first few properties
        const sample = {};
        keys.slice(0, 3).forEach(key => {
          sample[key] = data[key];
        });
        console.log(`  Sample data: ${JSON.stringify(sample, null, 2)}`);
      }
    }
  }
}

// Generic function to test an API endpoint
async function testEndpoint(endpoint, options = {}) {
  console.log(`${colors.fg.cyan}Testing endpoint:${colors.reset} ${endpoint.url}`);
  
  try {
    const url = `${API_BASE_URL}${endpoint.url}`;
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    logResponse(endpoint, response, data);
    return { success: response.ok, data };
  } catch (err) {
    console.error(`${colors.fg.red}Error testing ${endpoint.url}:${colors.reset}`, err.message);
    return { success: false, error: err.message };
  }
}

// Main test function
async function runTests() {
  console.log(`
${colors.fg.magenta}==================================================${colors.reset}
${colors.fg.magenta}    BuildIt Records API Verification Script      ${colors.reset}
${colors.fg.magenta}==================================================${colors.reset}
Testing API endpoints at: ${API_BASE_URL}
  `);

  const results = {
    total: endpoints.length,
    passed: 0,
    failed: 0,
    endpoints: {}
  };

  // Import fetch dynamically
  const { default: fetch } = await import('node-fetch');
  global.fetch = fetch;

  // Test all endpoints sequentially
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.endpoints[endpoint.name] = result.success;
    
    if (result.success) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Add some spacing between endpoint tests
    console.log();
  }

  // Print summary
  console.log(`
${colors.fg.magenta}==================================================${colors.reset}
${colors.fg.magenta}                 Test Summary                    ${colors.reset}
${colors.fg.magenta}==================================================${colors.reset}
Total Tests: ${results.total}
Passed: ${colors.fg.green}${results.passed}${colors.reset}
Failed: ${results.failed === 0 ? colors.fg.green : colors.fg.red}${results.failed}${colors.reset}
  `);
  
  // Detailed results
  console.log(`${colors.fg.magenta}Detailed Results:${colors.reset}`);
  for (const [name, success] of Object.entries(results.endpoints)) {
    const statusColor = success ? colors.fg.green : colors.fg.red;
    const statusText = success ? 'PASS' : 'FAIL';
    console.log(`  ${statusColor}[${statusText}]${colors.reset} ${name}`);
  }
  
  // Success/failure message
  if (results.failed === 0) {
    console.log(`
${colors.bg.green}${colors.fg.black} SUCCESS: All API endpoints are working correctly! ${colors.reset}
    `);
    return true;
  } else {
    console.log(`
${colors.bg.red} ERROR: ${results.failed} API endpoint(s) failed verification. ${colors.reset}
Please fix the issues before deploying.
    `);
    throw new Error('API verification failed');
  }
}

// Run the tests
(async () => {
  try {
    await runTests();
  } catch (err) {
    console.error(`${colors.fg.red}Fatal error during API verification:${colors.reset}`, err);
    process.exit(1);
  }
})();
