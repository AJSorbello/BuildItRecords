/**
 * Script to find all PostgreSQL-related dependencies in node_modules
 * This helps identify what packages might be pulling in libpq or other PostgreSQL dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define PostgreSQL related keywords to search for
const pgKeywords = ['pg', 'postgres', 'postgresql', 'libpq'];

// Function to search for dependencies in package.json files
function searchPackageJson(packageJsonPath) {
  try {
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { 
      ...packageData.dependencies, 
      ...packageData.devDependencies,
      ...packageData.peerDependencies,
      ...packageData.optionalDependencies 
    };

    const pgDependencies = Object.keys(dependencies || {})
      .filter(dep => pgKeywords.some(keyword => dep.toLowerCase().includes(keyword)));

    if (pgDependencies.length > 0) {
      console.log(`Found PostgreSQL dependencies in ${packageJsonPath}:`);
      pgDependencies.forEach(dep => {
        console.log(`  - ${dep}: ${dependencies[dep]}`);
      });
    }
    
    return pgDependencies;
  } catch (error) {
    console.error(`Error reading ${packageJsonPath}:`, error.message);
    return [];
  }
}

// Main function to scan project
function scanProject() {
  console.log('Scanning for PostgreSQL-related dependencies...');
  
  // Check root package.json
  console.log('\n--- Checking root package.json ---');
  const rootPgDeps = searchPackageJson(path.join(__dirname, '..', 'package.json'));
  
  // Check server package.json
  console.log('\n--- Checking server package.json ---');
  const serverPgDeps = searchPackageJson(path.join(__dirname, '..', 'server', 'package.json'));
  
  // Check node_modules for transitive dependencies
  console.log('\n--- Checking node_modules for transitive dependencies ---');
  try {
    // Use npm list to find all dependencies that match the postgres keywords
    pgKeywords.forEach(keyword => {
      try {
        console.log(`\nSearching for dependencies containing "${keyword}":`);
        const output = execSync(`cd "${path.join(__dirname, '..')}" && npm list | grep -i ${keyword}`, { 
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr to prevent errors when grep finds nothing
        });
        
        if (output) {
          console.log(output);
        } else {
          console.log(`No dependencies found containing "${keyword}"`);
        }
      } catch (e) {
        // npm list or grep might exit with non-zero if nothing found
        console.log(`No dependencies found containing "${keyword}"`);
      }
    });
  } catch (error) {
    console.error('Error scanning node_modules:', error.message);
  }
  
  // Summary
  console.log('\n--- Summary ---');
  const allPgDeps = [...new Set([...rootPgDeps, ...serverPgDeps])];
  if (allPgDeps.length > 0) {
    console.log('Direct PostgreSQL dependencies found:');
    allPgDeps.forEach(dep => console.log(`  - ${dep}`));
    console.log('\nRecommendation: Remove these dependencies from package.json files and run npm install again.');
  } else {
    console.log('No direct PostgreSQL dependencies found in package.json files.');
    console.log('The issue may be related to transitive dependencies. Check the scans above for more details.');
  }
  
  console.log('\nTo resolve issues with libpq and other PostgreSQL native dependencies, consider:');
  console.log('1. Using --ignore-scripts during installation');
  console.log('2. Adding specific exclusions to your package.json:');
  console.log(`
  "overrides": {
    "libpq": "npm:@vercel/noop",
    "pg-native": "npm:@vercel/noop"
  }
  `);
}

// Run the scan
scanProject();
