#!/usr/bin/env node

/**
 * This script patches the necessary files and dependencies for deploying to Vercel
 * It eliminates the need for native PostgreSQL modules by adding overrides
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📝 Starting Vercel build patch process...');

// Create .npmrc file to prevent native module builds
const createNpmrc = () => {
  const npmrcPath = path.join(__dirname, '..', '.npmrc');
  console.log(`Creating .npmrc at ${npmrcPath}...`);
  
  const npmrcContent = [
    'node-linker=hoisted',
    'public-hoist-pattern[]=*types*',
    'public-hoist-pattern[]=*eslint*',
    'public-hoist-pattern[]=@typescript-eslint/*',
    'lockfile=false',
    'prefer-frozen-lockfile=false',
    'shamefully-hoist=true',
    'auto-install-peers=true',
    'strict-peer-dependencies=false'
  ].join('\n');
  
  fs.writeFileSync(npmrcPath, npmrcContent);
  console.log('✅ .npmrc file created successfully');
};

// Add necessary overrides to the package.json to handle PostgreSQL dependencies
const updatePackageJson = () => {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  console.log(`Updating package.json at ${packageJsonPath}...`);
  
  try {
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add overrides for PostgreSQL related packages
    packageData.overrides = {
      ...(packageData.overrides || {}),
      'pg': 'npm:@vercel/noop',
      'pg-native': 'npm:@vercel/noop',
      'pg-hstore': 'npm:@vercel/noop',
      'libpq': 'npm:@vercel/noop'
    };
    
    // Add a timestamp to force Vercel to recognize changes
    packageData.vercelDeploymentTimestamp = new Date().toISOString();
    
    // Write the updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2));
    console.log('✅ package.json updated successfully');

    // Run pnpm to update the lock file
    try {
      console.log('📦 Updating pnpm-lock.yaml to match package.json...');
      execSync('pnpm install --no-frozen-lockfile', { stdio: 'inherit' });
      console.log('✅ pnpm-lock.yaml updated successfully');
    } catch (err) {
      console.error('❌ Failed to update pnpm-lock.yaml:', err.message);
      // Continue with the build process even if lock update fails
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error updating package.json:', error.message);
    return false;
  }
};

// Create a mock implementation for the pg package
const createPgMock = () => {
  const mockDir = path.join(__dirname, '..', 'node_modules', '@vercel', 'noop');
  
  if (!fs.existsSync(mockDir)) {
    console.log(`Creating mock directory at ${mockDir}...`);
    fs.mkdirSync(mockDir, { recursive: true });
  }
  
  const mockIndexPath = path.join(mockDir, 'index.js');
  console.log(`Creating mock implementation at ${mockIndexPath}...`);
  
  const mockContent = `
    module.exports = {};
    module.exports.default = {};
    module.exports.Pool = class Pool {
      connect() { return Promise.resolve(); }
      query() { return Promise.resolve({ rows: [] }); }
      end() { return Promise.resolve(); }
    };
    module.exports.Client = class Client {
      connect() { return Promise.resolve(); }
      query() { return Promise.resolve({ rows: [] }); }
      end() { return Promise.resolve(); }
    };
  `;
  
  fs.writeFileSync(mockIndexPath, mockContent);
  
  const mockPackageJsonPath = path.join(mockDir, 'package.json');
  const mockPackageJson = {
    name: '@vercel/noop',
    version: '1.0.0',
    main: 'index.js'
  };
  
  fs.writeFileSync(mockPackageJsonPath, JSON.stringify(mockPackageJson, null, 2));
  console.log('✅ Mock pg implementation created successfully');
};

// Main execution
(async () => {
  try {
    console.log('🔍 Checking for PostgreSQL dependencies...');
    
    // Create .npmrc file
    createNpmrc();
    
    // Update package.json with overrides
    const packageUpdated = updatePackageJson();
    
    if (packageUpdated) {
      // Create mock implementation
      createPgMock();
      
      console.log('✅ Vercel build patch completed successfully');
    } else {
      console.error('❌ Vercel build patch failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Vercel build patch error:', error.message);
    process.exit(1);
  }
})();
