#!/bin/bash

# Kill any existing Node processes
echo "Stopping any existing Node servers..."
pkill -f "node.*server.js" || true

# Load environment variables from .env.supabase
echo "Loading environment variables from .env.supabase..."
export $(grep -v '^#' .env.supabase | xargs)

# Export the USE_TEST_DATA environment variable to false to force real database usage
export USE_TEST_DATA=false
export NODE_TLS_REJECT_UNAUTHORIZED=0
export DB_SSL=true
export DB_SSL_REJECT_UNAUTHORIZED=false

echo "Set USE_TEST_DATA=false to force real database connection"
echo "Set NODE_TLS_REJECT_UNAUTHORIZED=0 to allow self-signed certificates"
echo "Set DB_SSL=true and DB_SSL_REJECT_UNAUTHORIZED=false for database connection"

# Start the actual API server in a new terminal window
echo "Starting API server..."
cd server && node real-server.js

# Wait for the server to start
echo "Waiting for server to start..."
sleep 2

# Start the Vite dev server with environment variables
echo "Starting Vite dev server..."
npm run dev
