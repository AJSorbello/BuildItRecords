// Script to deploy database fixes to Render
// This will create a new deployment with our SQL updates

const fs = require('fs');
const path = require('path');

// Read SQL files and combine them into a single migration
const sqlFiles = [
  'create-exec-sql-function.sql',
  'create-helper-functions.sql',
  'create-artist-releases-function.sql',
  'populate-release-artists.sql'
];

let combinedSql = '-- Combined SQL migration for artist-releases fix\n\n';

sqlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const sql = fs.readFileSync(filePath, 'utf8');
    combinedSql += `-- From ${file}\n${sql}\n\n`;
  } else {
    console.error(`File not found: ${filePath}`);
  }
});

// Write the combined SQL to a new migration file
const migrationFile = path.join(__dirname, '..', 'server', 'migrations', `${Date.now()}_fix_artist_releases.sql`);
fs.writeFileSync(migrationFile, combinedSql);

console.log(`Created migration file: ${migrationFile}`);
console.log(`To deploy this fix, commit and push this file to GitHub, then deploy to Render.`);
