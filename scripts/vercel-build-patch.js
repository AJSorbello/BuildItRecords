/**
 * Comprehensive build script for Vercel deployment
 * This script performs several functions:
 * 1. Patches package.json files to remove PostgreSQL dependencies
 * 2. Creates a mock implementation for pg/pg-native/libpq
 * 3. Adds overrides to package.json
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Running Vercel build patch script...');

// Paths
const rootDir = path.join(__dirname, '..');
const mainPackageJsonPath = path.join(rootDir, 'package.json');
const serverPackageJsonPath = path.join(rootDir, 'server', 'package.json');
const nodeModulesDir = path.join(rootDir, 'node_modules');

// Function to add overrides to package.json
function addOverrides(packageJsonPath) {
  try {
    console.log(`Adding overrides to ${packageJsonPath}...`);
    
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add overrides
    packageData.overrides = {
      ...(packageData.overrides || {}),
      pg: 'npm:@vercel/noop',
      'pg-native': 'npm:@vercel/noop',
      'pg-hstore': 'npm:@vercel/noop',
      libpq: 'npm:@vercel/noop'
    };
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2));
    console.log(`✅ Successfully updated ${packageJsonPath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${packageJsonPath}:`, error.message);
    return false;
  }
}

// Function to create mock implementations for pg/pg-native
function createMockModules() {
  const mockDirs = [
    path.join(nodeModulesDir, 'pg'),
    path.join(nodeModulesDir, 'pg-native'),
    path.join(nodeModulesDir, 'pg-hstore'),
    path.join(nodeModulesDir, 'libpq')
  ];
  
  mockDirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Create a mock package.json
      const mockPackageJson = {
        name: path.basename(dir),
        version: '0.0.1',
        main: 'index.js'
      };
      
      fs.writeFileSync(
        path.join(dir, 'package.json'), 
        JSON.stringify(mockPackageJson, null, 2)
      );
      
      // Create a mock index.js
      const mockCode = `// Mock implementation of ${path.basename(dir)}
module.exports = new Proxy({}, {
  get: function(target, prop) {
    if (typeof prop === 'string' && prop !== 'then') {
      return function(...args) {
        const callback = args[args.length - 1];
        if (typeof callback === 'function') {
          callback(null, {});
        }
        return Promise.resolve({});
      };
    }
    return function(){};
  }
});`;
      
      fs.writeFileSync(path.join(dir, 'index.js'), mockCode);
      console.log(`✅ Created mock implementation for ${path.basename(dir)}`);
    } catch (error) {
      console.error(`❌ Error creating mock implementation for ${path.basename(dir)}:`, error.message);
    }
  });
}

// Function to clean up all PostgreSQL-related dependencies
function cleanupDependencies(packageJsonPath) {
  try {
    console.log(`Cleaning up PostgreSQL dependencies in ${packageJsonPath}...`);
    
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const pgKeywords = ['pg', 'postgres', 'postgresql', 'libpq'];
    
    // Clean dependencies
    if (packageData.dependencies) {
      Object.keys(packageData.dependencies).forEach(dep => {
        if (pgKeywords.some(keyword => dep.toLowerCase().includes(keyword))) {
          console.log(`Removing ${dep} from dependencies`);
          delete packageData.dependencies[dep];
        }
      });
    }
    
    // Clean devDependencies
    if (packageData.devDependencies) {
      Object.keys(packageData.devDependencies).forEach(dep => {
        if (pgKeywords.some(keyword => dep.toLowerCase().includes(keyword))) {
          console.log(`Removing ${dep} from devDependencies`);
          delete packageData.devDependencies[dep];
        }
      });
    }
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2));
    console.log(`✅ Successfully cleaned up ${packageJsonPath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error cleaning up ${packageJsonPath}:`, error.message);
    return false;
  }
}

// Run all functions
console.log('🧹 Cleaning up PostgreSQL dependencies...');
cleanupDependencies(mainPackageJsonPath);
cleanupDependencies(serverPackageJsonPath);

console.log('🔄 Adding package overrides...');
addOverrides(mainPackageJsonPath);
addOverrides(serverPackageJsonPath);

console.log('🔧 Creating mock implementations...');
createMockModules();

console.log('✅ Build patch completed successfully!');
