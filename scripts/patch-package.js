/**
 * This script patches package.json files to remove problematic PostgreSQL dependencies
 * that can cause build failures in environments like Vercel where native modules
 * cannot be properly built.
 */

const fs = require('fs');
const path = require('path');

// Paths to package.json files
const mainPackageJsonPath = path.join(__dirname, '..', 'package.json');
const serverPackageJsonPath = path.join(__dirname, '..', 'server', 'package.json');

// Process the main package.json
try {
  const mainPackageJson = JSON.parse(fs.readFileSync(mainPackageJsonPath, 'utf8'));
  
  // Remove pg-hstore from dependencies if present
  if (mainPackageJson.dependencies && mainPackageJson.dependencies['pg-hstore']) {
    console.log('Removing pg-hstore from main package.json dependencies');
    delete mainPackageJson.dependencies['pg-hstore'];
  }
  
  // Remove pg-hstore from devDependencies if present
  if (mainPackageJson.devDependencies && mainPackageJson.devDependencies['pg-hstore']) {
    console.log('Removing pg-hstore from main package.json devDependencies');
    delete mainPackageJson.devDependencies['pg-hstore'];
  }
  
  // Write the updated package.json
  fs.writeFileSync(mainPackageJsonPath, JSON.stringify(mainPackageJson, null, 2));
  console.log('Main package.json has been updated');
} catch (error) {
  console.error('Error updating main package.json:', error);
}

// Process the server package.json
try {
  const serverPackageJson = JSON.parse(fs.readFileSync(serverPackageJsonPath, 'utf8'));
  
  // Remove pg and pg-native from dependencies if present
  if (serverPackageJson.dependencies) {
    if (serverPackageJson.dependencies.pg) {
      console.log('Removing pg from server package.json dependencies');
      delete serverPackageJson.dependencies.pg;
    }
    if (serverPackageJson.dependencies['pg-native']) {
      console.log('Removing pg-native from server package.json dependencies');
      delete serverPackageJson.dependencies['pg-native'];
    }
  }
  
  // Remove pg and pg-native from devDependencies if present
  if (serverPackageJson.devDependencies) {
    if (serverPackageJson.devDependencies.pg) {
      console.log('Removing pg from server package.json devDependencies');
      delete serverPackageJson.devDependencies.pg;
    }
    if (serverPackageJson.devDependencies['pg-native']) {
      console.log('Removing pg-native from server package.json devDependencies');
      delete serverPackageJson.devDependencies['pg-native'];
    }
  }
  
  // Write the updated package.json
  fs.writeFileSync(serverPackageJsonPath, JSON.stringify(serverPackageJson, null, 2));
  console.log('Server package.json has been updated');
} catch (error) {
  console.error('Error updating server package.json:', error);
}

console.log('Package.json files have been patched for deployment');
