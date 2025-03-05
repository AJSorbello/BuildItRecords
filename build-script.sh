#!/bin/bash

# =====================================================
# Improved build script for Vercel deployment with better error handling
# =====================================================

# Print commands as they are executed
set -x

# Don't exit immediately on error so we can capture and report issues
set +e
exec 2>&1  # Redirect stderr to stdout for better logs in Vercel

echo "🚀 Starting build process for Vercel deployment $(date)"
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Disk space:"
df -h

# Set environment variables
echo "🔧 Setting environment variables for production"
export NODE_ENV=production
export REACT_APP_ENV=production
export REACT_APP_API_URL=/api
export API_URL=/api

# Database configuration
export DB_HOST="db.liuaozuvkmvanmchndzl.supabase.co"
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

# Install dependencies with optional dependencies included
echo "📦 Installing dependencies with legacy-peer-deps"
npm install --legacy-peer-deps --no-optional
if [ $? -ne 0 ]; then
  echo "❌ Main dependency installation failed. Trying without peer deps..."
  npm install --no-optional
  if [ $? -ne 0 ]; then
    echo "❌ Dependency installation failed completely. Exiting."
    exit 1
  fi
fi

# Skip platform-specific installations
echo "📦 Skipping platform-specific installations"

# Install API dependencies
echo "📦 Installing API dependencies"
cd api 
npm install pg pg-hstore --no-optional
if [ $? -ne 0 ]; then
  echo "❌ API dependency installation failed. Continuing anyway..."
fi
cd ..

# Test database connection but don't fail if it doesn't work
echo "🔍 Testing database connection"
node api/db-diagnostic.js || echo "Warning: Database connection test failed, but continuing with build"

# Check for needed directories
echo "🔧 Checking project structure"
mkdir -p dist
ls -la

# Check for vite.config.js
echo "🔧 Checking for vite configuration"
if [ ! -f "vite.config.js" ] && [ ! -f "vite.config.ts" ]; then
  echo "❌ No vite config found. This could cause build issues."
  ls -la
fi

# Run build using npx to ensure we use the local version
echo "🏗️ Building the application"
VITE_CJS_TRACE=1 npx vite build --debug
BUILD_RESULT=$?

if [ $BUILD_RESULT -ne 0 ]; then
  echo "❌ Vite build failed with exit code $BUILD_RESULT"
  echo "Attempting to debug the issue..."
  echo "Node modules:"
  ls -la node_modules
  echo "Vite modules:"
  ls -la node_modules/vite || echo "No vite module found"
  echo "Full package.json:"
  cat package.json
  exit $BUILD_RESULT
fi

# Verify build output
if [ -d "dist" ]; then
  echo "✅ Build completed successfully, files in dist directory:"
  ls -la dist
  echo "HTML files:"
  find dist -name "*.html" | xargs cat || echo "No HTML files found"
else
  echo "❌ Build failed: dist directory does not exist or is empty"
  exit 1
fi

echo "🎉 Build process completed successfully! $(date)"
