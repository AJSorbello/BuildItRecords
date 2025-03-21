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

# Database configuration - DO NOT override Vercel-provided values
# These are fallbacks only
echo "🔧 Setting database environment variables"
export DB_SSL="true"
export DB_SSL_REJECT_UNAUTHORIZED="false"

# Admin configuration
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD_HASH="$2a$10$nQ0oN9pavoYZiAjdPdstL.S.Vi/3012suNyKxHX/CI39wB424l9Ya"
export JWT_SECRET="buildit_records_jwt_secret_2025"

# Supabase configuration
export VITE_SUPABASE_URL="${SUPABASE_URL}"
export VITE_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"

# Ensure API URL is properly set
echo "🌐 API URL set to: $REACT_APP_API_URL"

# Print important environment variables for debugging
echo "🔍 Database Connection Info (masked):"
echo "POSTGRES_URL is set: $(if [ -n "$POSTGRES_URL" ]; then echo "Yes"; else echo "No"; fi)"
echo "POSTGRES_URL_NON_POOLING is set: $(if [ -n "$POSTGRES_URL_NON_POOLING" ]; then echo "Yes"; else echo "No"; fi)"
echo "SUPABASE_URL: ${SUPABASE_URL}"

# Install dependencies WITH optional dependencies (important for esbuild)
echo "📦 Installing dependencies with legacy-peer-deps and including optional dependencies"
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
  echo "❌ Main dependency installation failed. Trying without peer deps..."
  npm install
  if [ $? -ne 0 ]; then
    echo "❌ Dependency installation failed completely. Exiting."
    exit 1
  fi
fi

# Explicitly install esbuild with its binaries
echo "📦 Ensuring esbuild is properly installed with binaries"
npm install esbuild

# Install API dependencies
echo "📦 Installing API dependencies"
cd api 
npm install pg pg-hstore
if [ $? -ne 0 ]; then
  echo "❌ API dependency installation failed. Continuing anyway..."
fi
cd ..

# Clean up redundant API endpoints
echo "🧹 Cleaning up redundant API endpoints to stay within Vercel limits"
# Create a directory for redundant files if it doesn't exist
mkdir -p api-backup

# Move redundant API endpoint files to backup directory
# These endpoints are now consolidated and shouldn't be deployed
if [ -d "api/artists" ]; then
  echo "Moving api/artists directory to backup..."
  mv api/artists api-backup/
fi

if [ -d "api/releases" ]; then
  echo "Moving api/releases directory to backup..."
  mv api/releases api-backup/
fi

if [ -d "api/tracks" ]; then
  echo "Moving api/tracks directory to backup..."
  mv api/tracks api-backup/
fi

if [ -d "api/diagnostic" ]; then
  echo "Moving api/diagnostic directory to backup..."
  mv api/diagnostic api-backup/
fi

if [ -d "api/health" ]; then
  echo "Moving api/health directory to backup..."
  mv api/health api-backup/
fi

if [ -f "api/release/[id].js" ]; then
  echo "Moving api/release/[id].js to backup..."
  mkdir -p api-backup/release
  mv api/release/[id].js api-backup/release/
fi

if [ -f "api/artist/[id].js" ]; then
  echo "Moving api/artist/[id].js to backup..."
  mkdir -p api-backup/artist
  mv api/artist/[id].js api-backup/artist/
fi

# Verify our key API endpoints are present
echo "🔍 Checking for crucial API endpoint files"
for file in api/artist.js api/release.js api/health.js api/index.js api/label.js; do
  if [ -f "$file" ]; then
    echo "✅ Found $file"
    echo "File size: $(du -h $file | cut -f1)"
    echo "Last modified: $(stat -f "%Sm" $file)"
  else
    echo "❌ MISSING CRUCIAL FILE: $file"
  fi
done

# Test database connection but don't fail if it doesn't work
echo "🔍 Testing database connection"
# Commented out as db-diagnostic.js was removed to reduce function count
# node api/db-diagnostic.js || echo "Warning: Database connection test failed, but continuing with build"
echo "Skipping database diagnostic test"

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
VITE_CJS_TRACE=1 VITE_DEBUG=1 npx vite build --debug
BUILD_RESULT=$?

if [ $BUILD_RESULT -ne 0 ]; then
  echo "❌ Vite build failed with exit code $BUILD_RESULT"
  echo "Attempting to debug the issue..."
  echo "Node modules:"
  ls -la node_modules
  echo "Vite modules:"
  ls -la node_modules/vite || echo "No vite module found"
  echo "esbuild modules:"
  ls -la node_modules/esbuild || echo "No esbuild module found"
  echo "Full package.json:"
  cat package.json
  echo "Environment variables (masked):"
  env | grep -v -E '(PASSWORD|SECRET|KEY|TOKEN)' | sort
  echo "API Config file content:"
  cat src/utils/apiConfig.ts
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
