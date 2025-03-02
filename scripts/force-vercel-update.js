#!/usr/bin/env node

/**
 * This script timestamps the package.json file to force Vercel to recognize changes
 * and trigger a new deployment.
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

console.log(`Reading package.json from ${packageJsonPath}`);
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add or update the vercel deployment timestamp
packageJson.vercelDeploymentTimestamp = new Date().toISOString();
packageJson.buildInfo = {
  timestamp: new Date().toISOString(),
  forcedUpdate: true,
  reason: 'Manual update to trigger new Vercel deployment',
  commitHash: process.env.COMMIT_SHA || 'unknown'
};

console.log(`Updating package.json with timestamp: ${packageJson.vercelDeploymentTimestamp}`);
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ package.json has been updated with a new timestamp to force Vercel to recognize changes.');
