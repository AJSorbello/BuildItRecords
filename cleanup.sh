#!/bin/bash

# Remove old lock files
rm -f yarn.lock
rm -f package-lock.json

# Remove old node_modules
rm -rf node_modules
rm -rf server/node_modules
rm -rf client/node_modules

# Clean up any temporary files
rm -rf .DS_Store
rm -rf **/.DS_Store

# Remove CRA specific files
rm -f .env.development.local
rm -f .env.test.local
rm -f .env.production.local
rm -f .env.local

# Remove old build directories
rm -rf build
rm -rf dist
rm -rf server/dist
rm -rf server/build

# Install dependencies with pnpm
pnpm install
