/**
 * Simple script to check the current commit hash
 * This helps verify which version of the codebase Vercel is deploying
 */

console.log('Starting BuildItRecords deployment');
console.log('Checking current commit information...');

const { execSync } = require('child_process');

try {
  // Check if git is available and we're in a git repository
  if (process.env.VERCEL) {
    console.log('Running in Vercel environment');
    console.log('VERCEL_GIT_COMMIT_SHA:', process.env.VERCEL_GIT_COMMIT_SHA);
    console.log('VERCEL_GIT_COMMIT_MESSAGE:', process.env.VERCEL_GIT_COMMIT_MESSAGE);
    console.log('VERCEL_GIT_COMMIT_AUTHOR_NAME:', process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME);
  } else {
    // Local environment
    const commitHash = execSync('git rev-parse HEAD').toString().trim();
    const commitMessage = execSync('git log -1 --pretty=%B').toString().trim();
    const commitAuthor = execSync('git log -1 --pretty=%an').toString().trim();
    
    console.log('Current commit hash:', commitHash);
    console.log('Commit message:', commitMessage);
    console.log('Commit author:', commitAuthor);
  }
  
  // Show package.json content for debugging
  const fs = require('fs');
  const path = require('path');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('package.json dependencies count:', Object.keys(packageJson.dependencies || {}).length);
    console.log('package.json devDependencies count:', Object.keys(packageJson.devDependencies || {}).length);
    
    // Check if we have PostgreSQL dependencies
    const pgDeps = Object.keys(packageJson.dependencies || {})
      .filter(dep => dep.includes('pg') || dep.includes('postgres'));
    
    if (pgDeps.length > 0) {
      console.log('⚠️ PostgreSQL dependencies found:', pgDeps);
    } else {
      console.log('✅ No PostgreSQL dependencies found in package.json');
    }
    
    // Check for overrides
    if (packageJson.overrides) {
      console.log('✅ package.json contains overrides:', Object.keys(packageJson.overrides));
    } else {
      console.log('⚠️ No overrides found in package.json');
    }
  } else {
    console.log('❌ package.json not found!');
  }
  
} catch (error) {
  console.error('Error getting git information:', error.message);
}

console.log('Deployment preparation complete');
