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

// Update overrides to use latest noop
pkg.overrides = {
  ...pkg.overrides,
  'pg': 'npm:@vercel/noop@latest',
  'pg-native': 'npm:@vercel/noop@latest',
  'pg-hstore': 'npm:@vercel/noop@latest',
  'libpq': 'npm:@vercel/noop@latest'
};

fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
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

# Use npm instead of pnpm for more reliable package installation in CI environments
echo "📦 Installing dependencies with npm"
npm install --no-package-lock --legacy-peer-deps --no-fund --no-audit

# Install TailwindCSS and PostCSS dependencies
echo "🌈 Installing TailwindCSS and related dependencies"
npm install tailwindcss@3.3.0 postcss@8.4.31 autoprefixer@10.4.15 --save-dev --no-package-lock

# Install vite globally for build
echo "🔨 Installing vite for build"
npm install -g vite 

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

# Run the build using npx vite directly
echo "🏗️ Running the build process"
# Instead of npm run build which uses the vite command
npx vite build

# Log success message
echo "✅ Build completed successfully!"
echo "📁 Build artifacts are in the dist directory"

# Restore original package.json from git to prevent any unintended changes
echo "🔄 Restoring original package.json"
git checkout -- package.json
