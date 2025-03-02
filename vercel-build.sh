#!/bin/bash

# Install PostgreSQL client
apt-get update -qq
apt-get install -y postgresql-client

# Run the build command
npm run build
