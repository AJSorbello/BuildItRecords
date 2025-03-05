#!/bin/bash

# =====================================================
# Simplified build script for Vercel deployment
# =====================================================

set -e  # Exit immediately if a command exits with non-zero status
exec 2>&1  # Redirect stderr to stdout for better logs in Vercel

echo "🚀 Starting simplified build process for Vercel deployment"
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Set environment variables
echo "🔧 Setting environment variables for production"
export NODE_ENV=production
export REACT_APP_ENV=production
export REACT_APP_API_URL=/api
export API_URL=/api

# Database configuration
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

# Install dependencies (npm is available by default in Vercel)
echo "📦 Installing dependencies"
npm install --no-package-lock --no-optional --legacy-peer-deps

# Install API dependencies
echo "📦 Installing API dependencies"
cd api && npm install --no-package-lock pg pg-hstore && cd ..

# Run build using npx to ensure we use the local version
echo "🏗️ Building the application"
npx vite build

# Verify build output
if [ -d "dist" ]; then
  echo "✅ Build completed successfully, files in dist directory:"
  ls -la dist
else
  echo "❌ Build failed: dist directory does not exist"
  exit 1
fi

echo "🎉 Build process completed successfully!"
