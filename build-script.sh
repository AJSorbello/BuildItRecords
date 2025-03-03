#!/bin/bash

# =====================================================
# Custom build script for Vercel deployment
# This script completely bypasses pnpm lock file issues
# =====================================================

set -e
echo "🚀 Starting custom build process for Vercel deployment"

# Remove any existing lock files to prevent conflicts
echo "🧹 Cleaning up lock files"
rm -f pnpm-lock.yaml package-lock.json yarn.lock

# Create temporary package.json without direct pg dependency
echo "📝 Creating clean package.json for build"
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Store original pg version
if (pkg.dependencies && pkg.dependencies.pg) {
  console.log('📦 Temporarily removing pg dependency for build');
  delete pkg.dependencies.pg;
}

// Ensure vite is at the correct version
if (!pkg.dependencies.vite || pkg.dependencies.vite !== '^4.5.0') {
  console.log('📦 Setting vite version to 4.5.0');
  pkg.dependencies.vite = '^4.5.0';
}

// Ensure vite plugin is at the correct version
if (!pkg.dependencies['@vitejs/plugin-react']) {
  console.log('📦 Adding @vitejs/plugin-react dependency');
  pkg.dependencies['@vitejs/plugin-react'] = '^4.2.0';
}

// Ensure path-browserify for Vite compatibility
if (!pkg.dependencies['path-browserify']) {
  console.log('📦 Adding path-browserify dependency');
  pkg.dependencies['path-browserify'] = '^1.0.1';
}

// Update overrides to use latest noop
pkg.overrides = {
  ...pkg.overrides,
  'pg': 'npm:@vercel/noop@latest',
  'pg-native': 'npm:@vercel/noop@latest',
  'pg-hstore': 'npm:@vercel/noop@latest',
  'libpq': 'npm:@vercel/noop@latest'
};

fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));

// Debug: Display the modified package.json content
console.log('Modified package.json:', JSON.stringify(pkg, null, 2).substring(0, 500) + '... (truncated)');
"

# Create .npmrc file with registry fallbacks and configuration
echo "📝 Creating .npmrc file with registry configuration"
cat > .npmrc << EOF
registry=https://registry.npmjs.org/
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
strict-ssl=false
node-options=--max-old-space-size=4096 --no-node-snapshot --no-warnings
legacy-peer-deps=true
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
EOF

# Validate vercel.json to prevent deployment errors
echo "🔍 Validating vercel.json"
node -e "try { const data = require('./vercel.json'); console.log('✅ vercel.json is valid'); } catch(e) { console.error('❌ Invalid vercel.json:', e.message); process.exit(1); }"

# Install all dependencies at once to ensure proper resolution
echo "📦 Installing build dependencies globally"
npm install -g vite@4.5.0 @vitejs/plugin-react@4.2.0 path-browserify@1.0.1

# Use pnpm for local installation
echo "📦 Installing all dependencies with pnpm"
pnpm install --no-frozen-lockfile

# Check if vite is installed and available
echo "🔍 Verifying vite installation"
node -e "
try {
  const vitePath = require.resolve('vite');
  console.log('✅ Vite found at:', vitePath);
  
  // Test that the vite module can be loaded
  const vite = require('vite');
  console.log('✅ Vite version:', vite.version || 'unknown');
  
  // Debug: List all files in node_modules/vite
  const fs = require('fs');
  const path = require('path');
  const viteDir = path.dirname(vitePath);
  console.log('Vite directory contents:', fs.readdirSync(viteDir).slice(0, 10).join(', ') + '... (truncated)');
} catch (e) {
  console.error('❌ Error finding/loading vite:', e.message);
  
  // Debug: Check if node_modules/vite exists at all
  try {
    const fs = require('fs');
    if (fs.existsSync('./node_modules/vite')) {
      console.log('✅ node_modules/vite directory exists');
      console.log('Contents:', fs.readdirSync('./node_modules/vite').slice(0, 10).join(', ') + '... (truncated)');
    } else {
      console.log('❌ node_modules/vite directory does not exist');
    }
  } catch (innerErr) {
    console.error('Error checking for vite directory:', innerErr.message);
  }
  
  process.exit(1);
}
"

# Configure package.json scripts to include postbuild validation
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Add postbuild script if it doesn't exist
if (!pkg.scripts.postbuild) {
  pkg.scripts.postbuild = 'node postbuild.js';
  console.log('📝 Added postbuild validation script to package.json');
  fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
}
"

# Set environment variables for the build
echo "🔧 Setting environment variables for production"
export NODE_ENV=production
export REACT_APP_ENV=production
export REACT_APP_API_URL=/api
export API_URL=/api
# Set Supabase configuration
export VITE_SUPABASE_URL=https://liuaozuvkmvanmchndzl.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpdWFvenV2a212YW5tY2huZHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NDg0MzQsImV4cCI6MjA1MTQyNDQzNH0.tlHgYcid26cTNuDoKZkHacwfaJ7BWR9d35EtAxtTB_g
# Database configuration
export DB_HOST=liuaozuvkmvanmchndzl.supabase.co
export DB_PORT=5432
export DB_NAME=postgres
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_SSL=true
export DB_SSL_REJECT_UNAUTHORIZED=false

# Try a different approach to run the build
echo "🏗️ Running the build process"

# Use Vite directly with a custom config path
echo "📝 Using direct vite build with explicit config"
export NODE_OPTIONS=--max-old-space-size=4096
npx vite build --config vite.config.js

# Run postbuild validation
echo "🧪 Running postbuild validation"
node postbuild.js

# Log success message
echo "✅ Build completed successfully!"
echo "📁 Build artifacts are in the dist directory"

# Restore original package.json from git to prevent any unintended changes
echo "🔄 Restoring original package.json"
git checkout -- package.json
