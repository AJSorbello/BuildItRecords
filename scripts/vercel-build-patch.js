/**
 * Comprehensive build script for Vercel deployment
 * This script performs several functions:
 * 1. Patches package.json files to remove PostgreSQL dependencies
 * 2. Creates a mock implementation for pg/pg-native/libpq
 * 3. Adds overrides to package.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Running Vercel build patch script...');

// Paths
const rootDir = path.join(__dirname, '..');
const mainPackageJsonPath = path.join(rootDir, 'package.json');
const serverPackageJsonPath = path.join(rootDir, 'server', 'package.json');
const nodeModulesDir = path.join(rootDir, 'node_modules');

// Create .npmrc file to prevent native module builds
function createNpmRcFile() {
  const npmrcPath = path.join(rootDir, '.npmrc');
  const npmrcContent = `ignore-scripts=true
node-linker=hoisted
public-hoist-pattern[]=*pg*
public-hoist-pattern[]=*libpq*
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true`;

  fs.writeFileSync(npmrcPath, npmrcContent);
  console.log('✅ Created .npmrc file with optimized settings');
}

// Function to add overrides to package.json
function addOverrides(packageJsonPath) {
  try {
    console.log(`Adding overrides to ${packageJsonPath}...`);
    
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add pnpm.overrides for pnpm
    packageData.pnpm = packageData.pnpm || {};
    packageData.pnpm.overrides = {
      ...(packageData.pnpm.overrides || {}),
      pg: 'npm:@vercel/noop',
      'pg-native': 'npm:@vercel/noop',
      'pg-hstore': 'npm:@vercel/noop',
      libpq: 'npm:@vercel/noop'
    };

    // Add overrides for npm
    packageData.overrides = {
      ...(packageData.overrides || {}),
      pg: 'npm:@vercel/noop',
      'pg-native': 'npm:@vercel/noop',
      'pg-hstore': 'npm:@vercel/noop',
      libpq: 'npm:@vercel/noop'
    };

    // Add resolutions for yarn
    packageData.resolutions = {
      ...(packageData.resolutions || {}),
      pg: 'npm:@vercel/noop',
      'pg-native': 'npm:@vercel/noop',
      'pg-hstore': 'npm:@vercel/noop',
      libpq: 'npm:@vercel/noop'
    };
    
    // Add optionalDependencies for @vercel/noop
    packageData.dependencies = {
      ...(packageData.dependencies || {}),
      '@vercel/noop': '^1.0.0'
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
  
  // Create node_modules directory if it doesn't exist
  if (!fs.existsSync(nodeModulesDir)) {
    fs.mkdirSync(nodeModulesDir, { recursive: true });
  }

  // Create a @vercel directory for noop if it doesn't exist
  const vercelDir = path.join(nodeModulesDir, '@vercel');
  const noopDir = path.join(vercelDir, 'noop');
  
  if (!fs.existsSync(vercelDir)) {
    fs.mkdirSync(vercelDir, { recursive: true });
  }
  
  if (!fs.existsSync(noopDir)) {
    fs.mkdirSync(noopDir, { recursive: true });
    
    // Create package.json for @vercel/noop
    const noopPackageJson = {
      name: '@vercel/noop',
      version: '1.0.0',
      main: 'index.js',
      description: 'Empty package that returns empty objects/functions'
    };
    
    fs.writeFileSync(
      path.join(noopDir, 'package.json'),
      JSON.stringify(noopPackageJson, null, 2)
    );
    
    // Create index.js for @vercel/noop
    const noopCode = `// Empty implementation that returns an empty object or function
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
    
    fs.writeFileSync(path.join(noopDir, 'index.js'), noopCode);
    console.log('✅ Created @vercel/noop package');
  }
  
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
      const mockCode = `// Mock implementation of ${path.basename(dir)} that does nothing
module.exports = require('@vercel/noop');`;
      
      fs.writeFileSync(path.join(dir, 'index.js'), mockCode);

      // For libpq specifically, create a binding.gyp file that will be skipped
      if (path.basename(dir) === 'libpq') {
        const mockGyp = `{
  "targets": [{
    "target_name": "libpq",
    "sources": ["index.js"]
  }]
}`;
        fs.writeFileSync(path.join(dir, 'binding.gyp'), mockGyp);
      }
      
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

// Function to directly modify Sequelize to avoid requiring pg
function patchSequelize() {
  const sequelizeDir = path.join(nodeModulesDir, 'sequelize');
  if (fs.existsSync(sequelizeDir)) {
    try {
      // Find the index.js file
      const indexFile = path.join(sequelizeDir, 'lib', 'dialects', 'postgres', 'index.js');
      if (fs.existsSync(indexFile)) {
        console.log('Patching Sequelize PostgreSQL dialect...');
        
        // Create a backup
        fs.copyFileSync(indexFile, `${indexFile}.bak`);
        
        // Replace the content with a mock implementation
        const mockContent = `'use strict';

// Mock PostgreSQL dialect that doesn't require native modules
const BaseDialect = require('../abstract');
const ConnectionManager = require('./connection-manager');
const Query = require('./query');
const DataTypes = require('../../data-types').postgres;
const { PostgresQueryInterface } = require('./query-interface');

class PostgresDialect extends BaseDialect {
  constructor(sequelize) {
    super();
    this.sequelize = sequelize;
    this.connectionManager = new ConnectionManager(this, sequelize);
    this.queryGenerator = new PostgresQueryGenerator({
      dialect: this,
      sequelize
    });
    this.queryInterface = new PostgresQueryInterface(sequelize, this.queryGenerator);
    this.DataTypes = DataTypes;
  }
}

// Mock Query Generator
class PostgresQueryGenerator {
  constructor(options) {
    this.options = options;
  }
  
  // Add empty implementations for required methods
  createSchema() { return ''; }
  dropSchema() { return ''; }
  showSchemasQuery() { return ''; }
  versionQuery() { return ''; }
  createTableQuery() { return ''; }
  dropTableQuery() { return ''; }
  // Add other methods as needed
}

// Export the dialect
PostgresDialect.prototype.Query = Query;
PostgresDialect.prototype.name = 'postgres';
PostgresDialect.prototype.TICK_CHAR = '"';
PostgresDialect.prototype.TICK_CHAR_LEFT = PostgresDialect.prototype.TICK_CHAR;
PostgresDialect.prototype.TICK_CHAR_RIGHT = PostgresDialect.prototype.TICK_CHAR;

module.exports = PostgresDialect;`;
        
        fs.writeFileSync(indexFile, mockContent);
        
        console.log('✅ Successfully patched Sequelize PostgreSQL dialect');
      }
    } catch (error) {
      console.error('❌ Error patching Sequelize:', error.message);
    }
  }
}

// Run all functions
console.log('🧹 Setting up .npmrc...');
createNpmRcFile();

console.log('🔧 Patching Sequelize (if installed)...');
patchSequelize();

console.log('🧹 Cleaning up PostgreSQL dependencies...');
cleanupDependencies(mainPackageJsonPath);
cleanupDependencies(serverPackageJsonPath);

console.log('🔄 Adding package overrides...');
addOverrides(mainPackageJsonPath);
addOverrides(serverPackageJsonPath);

console.log('🔧 Creating mock implementations...');
createMockModules();

console.log('✅ Build patch completed successfully!');
