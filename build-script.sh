#!/bin/bash

# =====================================================
# Custom build script for Vercel deployment
# This script ensures proper dependency installation
# =====================================================

set -e  # Exit immediately if a command exits with non-zero status
exec 2>&1  # Redirect stderr to stdout for better logs in Vercel

echo "🚀 Starting custom build process for Vercel deployment"
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Directory contents: $(ls -la)"

# Remove any existing lock files to prevent conflicts
echo "🧹 Cleaning up lock files"
rm -f pnpm-lock.yaml package-lock.json yarn.lock || true

# Create temporary package.json without conflicts
echo "📝 Creating clean package.json for build"
node -e "
try {
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

  // Ensure vite is at the correct version
  if (!pkg.devDependencies) pkg.devDependencies = {};
  pkg.devDependencies.vite = '^5.0.0';
  
  // Remove pnpm specific fields for npm compatibility
  delete pkg.pnpm;
  
  // Write the modified package.json
  fs.writeFileSync('./package.json.build', JSON.stringify(pkg, null, 2));
  console.log('Successfully created package.json.build');
} catch (err) {
  console.error('Error processing package.json:', err);
  process.exit(1);
}
"

# Check if the modified package.json was created successfully
if [ -f package.json.build ]; then
  cp package.json package.json.bak
  mv package.json.build package.json
  echo "✅ Modified package.json created successfully"
else
  echo "❌ Failed to create modified package.json"
  exit 1
fi

# Install dependencies using npm
echo "📦 Installing dependencies with NPM"
npm install --legacy-peer-deps --no-package-lock || { echo "❌ NPM install failed"; exit 1; }

# Install API dependencies
echo "📦 Installing API dependencies"
cd api || { echo "❌ Could not change to API directory"; exit 1; }
npm install --no-package-lock pg pg-hstore || { echo "❌ API dependencies installation failed"; exit 1; }
cd .. || { echo "❌ Could not return to root directory"; exit 1; }

# Set environment variables
echo "🔧 Setting environment variables for production"
export NODE_ENV=production
export REACT_APP_ENV=production
export REACT_APP_API_URL=/api
export API_URL=/api

# Manually set important environment variables from .env without using export command
echo "📝 Setting up critical environment variables"
# Database connection
export DB_HOST="liuaozuvkmvanmchndzl.supabase.co"
export DB_PORT="5432"
export DB_NAME="postgres"
export DB_USER="postgres"
export DB_PASSWORD="postgres"
export DB_SSL="true"
export DB_SSL_REJECT_UNAUTHORIZED="false"
export POSTGRES_URL="postgres://postgres:postgres@db.liuaozuvkmvanmchndzl.supabase.co:5432/postgres?sslmode=require"

# Supabase
export VITE_SUPABASE_URL="https://liuaozuvkmvanmchndzl.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpdWFvenV2a212YW5tY2huZHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NDg0MzQsImV4cCI6MjA1MTQyNDQzNH0.tlHgYcid26cTNuDoKZkHacwfaJ7BWR9d35EtAxtTB_g"

# Ensure API URL is properly set
echo "🌐 API URL set to: $REACT_APP_API_URL"

# Explicitly install vite globally to ensure it's available
echo "📦 Installing vite explicitly"
npm install -g vite || { echo "❌ Global vite installation failed"; exit 1; }

# Also install it in the project
echo "📦 Installing vite in the project"
npm install --save-dev vite@latest @vitejs/plugin-react || { echo "❌ Local vite installation failed"; exit 1; }

# Run the build commands using npx to ensure we use the local installation
echo "🏗️ Building the application with Vite"
npx vite build || { echo "❌ Build command failed"; exit 1; }

# Restore original package.json
if [ -f package.json.bak ]; then
  mv package.json.bak package.json
  echo "✅ Restored original package.json"
fi

# Ensure the dist directory exists and has content
if [ -d "dist" ]; then
  echo "✅ Build completed successfully, files in dist directory:"
  ls -la dist
else
  echo "❌ Build failed: dist directory does not exist"
  exit 1
fi

echo "🎉 Build process completed successfully!"
