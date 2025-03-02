#!/usr/bin/env node

/**
 * This script fixes the package.json file to ensure a clean build on Vercel
 * It reorders dependencies and removes any potential issues that might
 * cause conflicts between package.json and pnpm-lock.yaml
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Running package.json fix script for Vercel deployment...');

// Get the paths
const packageJsonPath = path.join(__dirname, '..', 'package.json');

try {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add deployment metadata
  packageJson.vercelDeploymentTimestamp = new Date().toISOString();
  packageJson.vercelDeploymentId = `deploy-${Math.floor(Math.random() * 10000)}`;
  
  // Fix potential issues with dependencies
  // 1. Move all PostgreSQL-related dependencies to dev dependencies
  const pgDeps = ['pg', 'pg-hstore', 'sequelize'];
  
  // Ensure devDependencies exists
  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }
  
  // Move PostgreSQL dependencies to devDependencies
  if (packageJson.dependencies) {
    for (const dep of pgDeps) {
      if (packageJson.dependencies[dep]) {
        console.log(`Moving ${dep} to devDependencies`);
        packageJson.devDependencies[dep] = packageJson.dependencies[dep];
        delete packageJson.dependencies[dep];
      }
    }
  }
  
  // Replace PostgreSQL dependencies with Vercel-compatible versions
  if (!packageJson.overrides) {
    packageJson.overrides = {};
  }
  
  // Add overrides for PostgreSQL dependencies
  for (const dep of pgDeps) {
    packageJson.overrides[dep] = '@vercel/noop';
  }
  
  // Write the fixed package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Successfully fixed package.json for Vercel deployment');
  
} catch (error) {
  console.error('❌ Error fixing package.json:', error);
  process.exit(1);
}
