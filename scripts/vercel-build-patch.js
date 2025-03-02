#!/usr/bin/env node

/**
 * This script prepares the build environment for Vercel deployment
 * It handles PostgreSQL dependencies and creates mock implementations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log(' Running Vercel build patch script...');

// Create .npmrc file with proper node-linker setting
const npmrcPath = path.join(__dirname, '..', '.npmrc');
fs.writeFileSync(npmrcPath, 'node-linker=hoisted\npublic-hoist-pattern[]=*postgresql*\npublic-hoist-pattern[]=*pg*\npublic-hoist-pattern[]=*postgres*\nstrict-peer-dependencies=false\nauto-install-peers=true\ninclude-workspace-root=true\nprefer-workspace-packages=true\n');
console.log(' Created .npmrc file with proper settings');

// Get the paths
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const pgNativePath = path.join(__dirname, '..', 'node_modules', 'pg-native');
const pgPath = path.join(__dirname, '..', 'node_modules', 'pg');

try {
  // Create a mock pg-native implementation
  if (!fs.existsSync(path.dirname(pgNativePath))) {
    fs.mkdirSync(path.dirname(pgNativePath), { recursive: true });
  }
  
  if (!fs.existsSync(pgNativePath)) {
    fs.mkdirSync(pgNativePath, { recursive: true });
    
    // Create package.json for pg-native
    fs.writeFileSync(
      path.join(pgNativePath, 'package.json'),
      JSON.stringify({
        name: 'pg-native',
        version: '3.0.0',
        main: 'index.js'
      }, null, 2)
    );
    
    // Create mock index.js for pg-native
    fs.writeFileSync(
      path.join(pgNativePath, 'index.js'),
      `console.warn('Using mock pg-native implementation for Vercel deployment');
      
module.exports = class Client {
  constructor() {
    console.warn('Mock pg-native Client instantiated');
  }
  
  connectSync() {
    console.warn('Mock pg-native connectSync called');
    return this;
  }
  
  querySync() {
    console.warn('Mock pg-native querySync called');
    return [];
  }
  
  query(text, values, callback) {
    console.warn('Mock pg-native query called');
    if (typeof callback === 'function') {
      callback(null, { rows: [] });
    }
    return Promise.resolve({ rows: [] });
  }
  
  end() {
    console.warn('Mock pg-native end called');
  }
};`
    );
    
    console.log(' Created mock pg-native implementation');
  }
  
  // Create a similar mock for pg if needed
  if (!fs.existsSync(pgPath)) {
    fs.mkdirSync(pgPath, { recursive: true });
    
    // Create package.json for pg
    fs.writeFileSync(
      path.join(pgPath, 'package.json'),
      JSON.stringify({
        name: 'pg',
        version: '8.11.0',
        main: 'index.js'
      }, null, 2)
    );
    
    // Create mock index.js for pg
    fs.writeFileSync(
      path.join(pgPath, 'index.js'),
      `console.warn('Using mock pg implementation for Vercel deployment');
      
const Pool = class {
  constructor() {
    console.warn('Mock pg Pool instantiated');
  }
  
  connect() {
    console.warn('Mock pg Pool.connect called');
    return Promise.resolve({
      query: async () => ({ rows: [] }),
      release: () => {}
    });
  }
  
  query() {
    console.warn('Mock pg Pool.query called');
    return Promise.resolve({ rows: [] });
  }
  
  end() {
    console.warn('Mock pg Pool.end called');
    return Promise.resolve();
  }
};

const Client = class {
  constructor() {
    console.warn('Mock pg Client instantiated');
  }
  
  connect() {
    console.warn('Mock pg Client.connect called');
    return Promise.resolve(this);
  }
  
  query() {
    console.warn('Mock pg Client.query called');
    return Promise.resolve({ rows: [] });
  }
  
  end() {
    console.warn('Mock pg Client.end called');
    return Promise.resolve();
  }
};

module.exports = {
  Pool,
  Client
};`
    );
    
    console.log(' Created mock pg implementation');
  }
  
  // Update package.json with current timestamp to force rebuild
  const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add override for PostgreSQL dependencies
  if (!packageData.overrides) {
    packageData.overrides = {};
  }
  
  packageData.overrides['pg'] = '@vercel/noop';
  packageData.overrides['pg-native'] = '@vercel/noop';
  packageData.overrides['pg-hstore'] = '@vercel/noop';
  packageData.overrides['sequelize'] = 'sequelize';  // Keep sequelize but mock its pg dependencies
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2));
  console.log(' Updated package.json with dependency overrides');
  
  // Log current Git commit
  try {
    const commitHash = execSync('git rev-parse HEAD').toString().trim();
    console.log(` Current Git commit: ${commitHash}`);
  } catch (error) {
    console.warn(' Unable to get Git commit hash:', error.message);
  }
  
  console.log(' Vercel build patch completed successfully');
} catch (error) {
  console.error(' Error during Vercel build patch:', error);
  process.exit(1);
}
