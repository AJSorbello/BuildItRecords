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

// Ensure TailwindCSS and related dependencies are available
if (!pkg.dependencies.tailwindcss) {
  console.log('📦 Adding TailwindCSS dependency');
  pkg.dependencies.tailwindcss = '^3.3.0';
}

if (!pkg.dependencies.postcss) {
  console.log('📦 Adding PostCSS dependency');
  pkg.dependencies.postcss = '^8.4.31';
}

if (!pkg.dependencies.autoprefixer) {
  console.log('📦 Adding Autoprefixer dependency');
  pkg.dependencies.autoprefixer = '^10.4.15';
}

// Ensure PostCSS plugins are available at correct versions
if (!pkg.dependencies['postcss-import']) {
  pkg.dependencies['postcss-import'] = '^15.0.0';
}

if (!pkg.dependencies['postcss-url']) {
  pkg.dependencies['postcss-url'] = '^10.1.3';
}

// Make sure PostCSS loader is in dependencies with correct version
if (!pkg.dependencies['postcss-loader'] || pkg.dependencies['postcss-loader'] !== '^6.2.1') {
  console.log('📦 Adding postcss-loader to dependencies');
  pkg.dependencies['postcss-loader'] = '^6.2.1';
}

// Remove postcss-loader from devDependencies if it exists there
if (pkg.devDependencies && pkg.devDependencies['postcss-loader']) {
  console.log('📦 Moving postcss-loader from devDependencies to dependencies');
  delete pkg.devDependencies['postcss-loader'];
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

# Create a simplified postcss.config.js for better compatibility
echo "📝 Creating a simplified postcss.config.js"
cat > postcss.config.js << EOF
module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('autoprefixer'),
    require('postcss-url')
  ]
};
EOF

# Install all dependencies at once to ensure proper resolution
echo "📦 Installing all build dependencies at once for better resolution"
npm install vite@4.5.0 @vitejs/plugin-react@4.2.0 tailwindcss@3.3.0 postcss@8.4.31 autoprefixer@10.4.15 postcss-import@15.0.0 postcss-url@10.1.3 postcss-loader@6.2.1 path-browserify@1.0.1 --global --no-package-lock

# Make sure postcss-loader is available globally
echo "🔧 Making sure postcss-loader is available globally"
npm link postcss-loader

# Use npm instead of pnpm for more reliable package installation in CI environments
echo "📦 Installing all dependencies with npm"
npm install --no-package-lock --legacy-peer-deps --no-fund --no-audit

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

# Check if tailwindcss is installed and available
echo "🔍 Verifying TailwindCSS installation"
node -e "
try {
  const tailwindPath = require.resolve('tailwindcss');
  console.log('✅ TailwindCSS found at:', tailwindPath);
  console.log('✅ TailwindCSS version:', require('tailwindcss/package.json').version || 'unknown');
} catch (e) {
  console.error('❌ Error finding/loading TailwindCSS:', e.message);
  process.exit(1);
}
"

# Check for PostCSS plugins with more detailed error handling
echo "🔍 Verifying PostCSS plugins"
node -e "
const checkModule = (name) => {
  try {
    const modulePath = require.resolve(name);
    console.log('✅ ' + name + ' found at:', modulePath);
    let version = 'unknown';
    try {
      version = require(name + '/package.json').version || 'unknown';
    } catch (err) {
      console.log('⚠️ Could not determine version of ' + name + ': ' + err.message);
    }
    console.log('✅ ' + name + ' version:', version);
    return true;
  } catch (e) {
    console.error('❌ Error finding/loading ' + name + ':', e.message);
    // List the contents of node_modules to help debug
    try {
      const fs = require('fs');
      const path = require('path');
      const nodeModulesPath = path.resolve('./node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        console.log('Contents of node_modules directory:');
        const dirs = fs.readdirSync(nodeModulesPath);
        console.log(dirs.slice(0, 20).join(', ') + (dirs.length > 20 ? '...' : ''));
        
        // Try to see if the package directory exists but module can't be resolved
        const packagePath = path.join(nodeModulesPath, name);
        if (fs.existsSync(packagePath)) {
          console.log('📁 ' + name + ' directory exists in node_modules:');
          console.log('Contents:', fs.readdirSync(packagePath).join(', '));
        } else {
          console.log('❌ ' + name + ' directory does not exist in node_modules');
        }
      }
    } catch (fsErr) {
      console.error('Error checking node_modules:', fsErr.message);
    }
    return false;
  }
};

const modules = ['postcss', 'postcss-import', 'postcss-url', 'autoprefixer', 'postcss-loader', 'path-browserify', 'tailwindcss'];
let allSuccessful = true;

for (const module of modules) {
  if (!checkModule(module)) {
    allSuccessful = false;
  }
}

if (!allSuccessful) {
  console.error('❌ Not all required modules were found');
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
echo "📝 Using direct vite build with explicit postcss config"
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
