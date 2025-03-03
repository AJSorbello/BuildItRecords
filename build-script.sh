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

# Use npm instead of pnpm to avoid lockfile issues
echo "📦 Installing dependencies with NPM"
npm install --no-package-lock

# Install TailwindCSS and PostCSS dependencies
echo "🌈 Installing TailwindCSS and related dependencies"
npm install --no-package-lock tailwindcss@3.3.0 postcss@8.4.31 autoprefixer@10.4.15

# Set environment variables for the build
echo "🔧 Setting environment variables for production"
export NODE_ENV=production
export REACT_APP_ENV=production
# Empty REACT_APP_API_URL will make the app use the current origin for API calls
export REACT_APP_API_URL=''

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

# Run the build using NPM
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
