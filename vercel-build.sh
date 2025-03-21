#!/bin/bash

# Install PostgreSQL client
apt-get update -qq
apt-get install -y postgresql-client

# Run the build command
npm run build

# Create a static file to handle client-side routing
echo "/* /index.html 200" > dist/_redirects

# Copy the redirects file from public to dist if it exists
if [ -f "public/_redirects" ]; then
  cp public/_redirects dist/
fi

# Create a simple rewrite rule for admin routes
echo "Creating Vercel routing configuration..."
cat > dist/vercel.json <<EOL
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/admin", "destination": "/index.html" },
    { "source": "/admin/(.*)", "destination": "/index.html" },
    { "source": "/(.*)", "destination": "/$1" }
  ]
}
EOL

echo "Build process completed successfully!"
