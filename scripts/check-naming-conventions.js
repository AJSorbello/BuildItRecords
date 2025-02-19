#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns that should use snake_case (database fields)
const snakeCasePatterns = [
  'duration_ms',
  'spotify_url',
  'preview_url',
  'artwork_url',
  'track_number',
  'disc_number',
  'release_id',
  'label_id',
  'image_url',
  'release_date',
  'display_name',
  'spotify_playlist_id',
  'created_at',
  'updated_at'
];

// Words that should never be used (replaced terms)
const forbiddenTerms = [
  'title',        // use 'name' instead
  'spotifyUrl',   // use 'spotify_url' instead
  'previewUrl',   // use 'preview_url' instead
  'artworkUrl',   // use 'artwork_url' instead
  'trackNumber',  // use 'track_number' instead
  'discNumber',   // use 'disc_number' instead
  'releaseDate',  // use 'release_date' instead
  'labelId',      // use 'label_id' instead
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];

  // Check for forbidden terms
  forbiddenTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      errors.push(`Found forbidden term '${term}' in ${filePath}:${getLineNumber(content, match.index)}`);
    }
  });

  // Check snake_case patterns are used correctly
  snakeCasePatterns.forEach(pattern => {
    const camelCase = pattern.replace(/_([a-z])/g, g => g[1].toUpperCase());
    const regex = new RegExp(`\\b${camelCase}\\b`, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      errors.push(`Found camelCase '${camelCase}' where snake_case '${pattern}' should be used in ${filePath}:${getLineNumber(content, match.index)}`);
    }
  });

  return errors;
}

function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

// Find all TypeScript files
const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: ['node_modules/**', 'build/**', 'dist/**']
});

let hasErrors = false;
files.forEach(file => {
  const errors = checkFile(file);
  if (errors.length > 0) {
    hasErrors = true;
    console.error(`\nErrors in ${file}:`);
    errors.forEach(error => console.error(`  ${error}`));
  }
});

if (hasErrors) {
  console.error('\nNaming convention errors found. Please fix them before committing.');
  process.exit(1);
}
