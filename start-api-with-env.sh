#!/bin/bash
# Script to start the API server with environment variables

# Supabase environment variables
export VITE_SUPABASE_URL=https://liuaozuvkmvanmchndzl.supabase.co
export VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpdWFvenV2a212YW5tY2huZHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NDg0MzQsImV4cCI6MjA1MTQyNDQzNH0.tlHgYcid26cTNuDoKZkHacwfaJ7BWR9d35EtAxtTB_g
export SUPABASE_URL=https://liuaozuvkmvanmchndzl.supabase.co
export SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpdWFvenV2a212YW5tY2huZHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NDg0MzQsImV4cCI6MjA1MTQyNDQzNH0.tlHgYcid26cTNuDoKZkHacwfaJ7BWR9d35EtAxtTB_g
export NEXT_PUBLIC_SUPABASE_URL=https://liuaozuvkmvanmchndzl.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpdWFvenV2a212YW5tY2huZHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4NDg0MzQsImV4cCI6MjA1MTQyNDQzNH0.tlHgYcid26cTNuDoKZkHacwfaJ7BWR9d35EtAxtTB_g

# PostgreSQL connection parameters - match the exact variable names expected in db-utils.js
export POSTGRES_HOST=liuaozuvkmvanmchndzl.supabase.co
export POSTGRES_PORT=5432
export POSTGRES_DATABASE=postgres
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=$SUPABASE_ANON_KEY
export POSTGRES_SSL=true

# Also set the PG* variables as a backup
export PGHOST=$POSTGRES_HOST
export PGPORT=$POSTGRES_PORT
export PGDATABASE=$POSTGRES_DATABASE
export PGUSER=$POSTGRES_USER
export PGPASSWORD=$POSTGRES_PASSWORD

# Disable certificate validation for development
export NODE_TLS_REJECT_UNAUTHORIZED=0
export DB_SSL_REJECT_UNAUTHORIZED=false
export NODE_ENV=development

# Start the API server with improved debug logging
echo "Starting API server with environment variables set"
echo "Supabase URL: $SUPABASE_URL"
echo "PostgreSQL Host: $POSTGRES_HOST"
node server/local-api-server.js
