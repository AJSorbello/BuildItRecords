#!/usr/bin/env node

/**
 * This script bypasses Vercel's ignoreCommand by ensuring there's
 * always a difference in the watched files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📝 Running Vercel deployment bypass script...');

// Force update package.json to ensure Vercel detects changes
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Update with a timestamp to force change detection
packageData.vercelDeploymentTimestamp = new Date().toISOString();
packageData.vercelDeploymentId = `deploy-${Math.floor(Math.random() * 10000)}`;

// Write the updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2));
console.log('✅ Updated package.json with new deployment timestamp');

// Always exit with success code to bypass checks
process.exit(0);
