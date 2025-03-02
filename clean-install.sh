#!/bin/bash
echo "Cleaning node_modules..."
rm -rf node_modules
rm -rf ./.pnpm-store
echo "Cleaning pnpm store..."
pnpm store prune
echo "Reinstalling dependencies..."
pnpm install
echo "Installation complete. Now starting the development server..."
pnpm run dev
