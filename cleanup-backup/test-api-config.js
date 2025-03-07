// Test script to check API config settings
require('dotenv').config(); // Load environment variables
const path = require('path');
const fs = require('fs');

console.log('Testing API configuration settings:');
console.log('---------------------------------');

// Environment variables
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('PORT:', process.env.PORT);

// Check .env files
const envFiles = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.supabase'
];

console.log('\nChecking .env files:');
envFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // Only check for presence of API URL variable, don't expose values
      const hasApiUrl = content.includes('REACT_APP_API_URL');
      console.log(`  - Contains REACT_APP_API_URL: ${hasApiUrl ? 'Yes' : 'No'}`);
    } catch (err) {
      console.log(`  - Error reading ${file}: ${err.message}`);
    }
  } else {
    console.log(`❌ ${file} does not exist`);
  }
});

// Check the package.json scripts
console.log('\nChecking package.json scripts:');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = require(packageJsonPath);
    const scripts = packageJson.scripts || {};
    console.log('Available scripts:', Object.keys(scripts).join(', '));
    
    // Check if any scripts set the API URL
    Object.entries(scripts).forEach(([name, script]) => {
      if (script.includes('REACT_APP_API_URL')) {
        console.log(`  - Script '${name}' sets REACT_APP_API_URL`);
        console.log(`    ${script}`);
      }
    });
  } catch (err) {
    console.log(`Error reading package.json: ${err.message}`);
  }
} else {
  console.log('❌ package.json does not exist');
}

// Summary
console.log('\nSummary:');
console.log(`Default API URL would be: ${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}`);
console.log('---------------------------------');
