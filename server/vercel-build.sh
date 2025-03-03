#!/bin/bash

# This script prepares the server for Vercel deployment

set -e
echo "🚀 Starting server build process for Vercel deployment"

# Copy the special package.json for Vercel
echo "📝 Using Vercel-specific package.json"
cp vercel-package.json package.json

# Install dependencies explicitly
echo "📦 Installing pg and other dependencies explicitly"
npm install pg pg-hstore --no-save

# Log installed packages
echo "📦 Installed packages:"
npm list --depth=0

# Create a test file to verify pg
echo "🧪 Creating test file to verify pg installation"
cat > pg-test.js << 'EOF'
try {
  const pg = require('pg');
  console.log("Successfully loaded pg module");
  
  const { Pool } = pg;
  console.log("Successfully loaded Pool from pg");
  
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || "postgres://user:pass@localhost:5432/db",
    ssl: { rejectUnauthorized: false }
  });
  console.log("Successfully created Pool instance");
  
  console.log("pg installation verified!");
} catch (error) {
  console.error("Error loading pg:", error);
  process.exit(1);
}
EOF

# Run the test
echo "🧪 Testing pg installation"
node pg-test.js

echo "✅ Server build completed successfully"
