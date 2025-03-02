#!/usr/bin/env node

/**
 * This script creates a CI-specific package.json that's minimal and works for Vercel
 * It removes all PostgreSQL dependencies and only includes what's needed to build
 */

const fs = require('fs');
const path = require('path');

console.log('🔨 Running CI mode patch script for Vercel...');

// Get the paths
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const ciPackageJsonPath = path.join(__dirname, '..', 'package.ci.json');

try {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Create a clean version for CI
  const ciPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    private: true,
    vercelDeploymentTimestamp: new Date().toISOString(),
    vercelDeploymentId: `deploy-${Math.floor(Math.random() * 10000)}`,
    scripts: {
      build: packageJson.scripts.build,
      start: packageJson.scripts.start,
      dev: packageJson.scripts.dev,
      lint: packageJson.scripts.lint || "echo 'No lint script'"
    },
    dependencies: {},
    devDependencies: {},
    overrides: {
      pg: '@vercel/noop',
      'pg-native': '@vercel/noop',
      'pg-hstore': '@vercel/noop',
      sequelize: 'sequelize' // Keep sequelize but mock its pg dependencies
    }
  };
  
  // Copy essential dependencies
  if (packageJson.dependencies) {
    const skipDeps = ['pg', 'pg-native', 'pg-hstore'];
    
    for (const dep in packageJson.dependencies) {
      if (!skipDeps.includes(dep)) {
        ciPackageJson.dependencies[dep] = packageJson.dependencies[dep];
      }
    }
  }
  
  // Copy essential dev dependencies
  if (packageJson.devDependencies) {
    const requiredDevDeps = [
      'vite', '@vitejs/plugin-react', '@vitejs/plugin-react-swc',
      'typescript', '@types/react', '@types/react-dom'
    ];
    
    for (const dep of requiredDevDeps) {
      if (packageJson.devDependencies[dep]) {
        ciPackageJson.devDependencies[dep] = packageJson.devDependencies[dep];
      }
    }
  }
  
  // Write the CI package.json
  fs.writeFileSync(ciPackageJsonPath, JSON.stringify(ciPackageJson, null, 2));
  console.log('✅ Created CI-specific package.json for Vercel deployment');
  
  // In CI mode, replace the actual package.json
  if (process.env.CI || process.env.VERCEL) {
    fs.copyFileSync(ciPackageJsonPath, packageJsonPath);
    console.log('✅ Replaced package.json with CI-specific version');
  }
  
} catch (error) {
  console.error('❌ Error creating CI package.json:', error);
  process.exit(1);
}
