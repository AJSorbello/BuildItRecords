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

# Create .npmrc file with registry fallbacks and configuration
echo "📝 Creating .npmrc file with registry configuration"
cat > .npmrc << EOF
registry=https://registry.npmjs.org/
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
strict-ssl=false
node-options=--max-old-space-size=4096 --no-node-snapshot
legacy-peer-deps=true
node-linker=hoisted
public-hoist-pattern[]=*pg*
public-hoist-pattern[]=*libpq*
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
EOF

# Validate vercel.json to prevent deployment errors
echo "🔍 Validating vercel.json"
node -e "try { const data = require('./vercel.json'); console.log('✅ vercel.json is valid'); } catch(e) { console.error('❌ Invalid vercel.json:', e.message); process.exit(1); }"

# Use npm instead of pnpm for more reliable package installation in CI environments
echo "📦 Installing dependencies with npm"
npm install --no-package-lock --legacy-peer-deps

# Install TailwindCSS and PostCSS dependencies
echo "🌈 Installing TailwindCSS and related dependencies"
npm install tailwindcss@3.3.0 postcss@8.4.31 autoprefixer@10.4.15 --save-dev --no-package-lock

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

# The package.json modifications to handle PostgreSQL dependencies
echo "🔧 Patching package.json for Vercel compatibility"
node << EOF
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Add deployment timestamp
packageJson.vercelDeploymentTimestamp = new Date().toISOString();

// Handle PostgreSQL dependencies
if (!packageJson.overrides) {
  packageJson.overrides = {};
}

packageJson.overrides['pg'] = '@vercel/noop';
packageJson.overrides['pg-native'] = '@vercel/noop';
packageJson.overrides['pg-hstore'] = '@vercel/noop';

// Add TailwindCSS to devDependencies if not present
if (!packageJson.devDependencies) {
  packageJson.devDependencies = {};
}
if (!packageJson.devDependencies.tailwindcss) {
  packageJson.devDependencies.tailwindcss = "^3.3.0";
}
if (!packageJson.devDependencies.autoprefixer) {
  packageJson.devDependencies.autoprefixer = "^10.4.15";
}
if (!packageJson.devDependencies.postcss) {
  packageJson.devDependencies.postcss = "^8.4.31";
}

fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Successfully patched package.json');
EOF

# Create a basic tailwind config if it doesn't exist
if [ ! -f "tailwind.config.js" ]; then
  echo "📝 Creating TailwindCSS configuration file"
  npx tailwindcss init
fi

# Create mock implementations for PostgreSQL modules
echo "🔧 Creating mock implementations for PostgreSQL modules"
mkdir -p node_modules/pg
cat > node_modules/pg/index.js << EOF
console.warn('Using mock pg implementation for Vercel deployment');
      
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
};
EOF

cat > node_modules/pg/package.json << EOF
{
  "name": "pg",
  "version": "8.11.0",
  "main": "index.js"
}
EOF

# Run the build using npm
echo "🏗️ Building the application"
npm run build

# Copy the build output to the correct location
echo "📁 Ensuring build output is in the correct location"
if [ -d "dist" ]; then
  echo "✅ Build complete and dist folder exists"
else
  echo "❌ Build failed or dist folder is missing"
  exit 1
fi

echo "✅ Custom build process completed successfully"
