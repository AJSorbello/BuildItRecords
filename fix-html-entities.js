#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 Fixing HTML entities in TypeScript/React files...');

// Function to fix HTML entities
function fixHtmlEntities(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace HTML entities with actual characters
  const replacements = [
    { pattern: /&quot;/g, replacement: '"' },
    { pattern: /&apos;/g, replacement: "'" },
    { pattern: /&lt;/g, replacement: '<' },
    { pattern: /&gt;/g, replacement: '>' },
    { pattern: /&amp;/g, replacement: '&' }
  ];
  
  for (const { pattern, replacement } of replacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed HTML entities in ${filePath}`);
  }
  return modified;
}

// Find all TypeScript/React files
console.log('\n🔍 Scanning for files to fix...');
const tsxFiles = glob.sync('src/**/*.tsx');
const jsxFiles = glob.sync('src/**/*.jsx');
const allFiles = [...tsxFiles, ...jsxFiles];

console.log(`Found ${allFiles.length} files to process`);

// Apply fixes to each file
console.log('\n🛠️ Applying fixes to files...');
let fixedCount = 0;

for (const file of allFiles) {
  const modified = fixHtmlEntities(file);
  if (modified) {
    fixedCount++;
  }
}

console.log(`\n✅ Fixed HTML entities in ${fixedCount} files`);
console.log('\n🚀 Now you can run npm run dev again to start the development server.');
