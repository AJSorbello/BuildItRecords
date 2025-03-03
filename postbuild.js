// This script runs after the build process to log build information
const fs = require('fs');
const path = require('path');

console.log('🧪 Running postbuild verification checks');

// Check if the dist directory was created
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('✅ Dist directory exists');
  
  // List files in the dist directory
  try {
    const files = fs.readdirSync(distPath);
    console.log(`📁 Dist directory contains ${files.length} files/directories`);
    console.log('Files:', files.slice(0, 10).join(', ') + (files.length > 10 ? '...' : ''));
  } catch (err) {
    console.error('❌ Error reading dist directory:', err.message);
  }
} else {
  console.error('❌ Dist directory does not exist');
}

// Check if the main CSS file was generated with Tailwind styles
try {
  const cssFiles = fs.readdirSync(distPath).filter(file => file.endsWith('.css'));
  if (cssFiles.length > 0) {
    console.log('✅ CSS files found:', cssFiles.join(', '));
    
    // Check the content of the first CSS file for Tailwind classes
    const cssContent = fs.readFileSync(path.join(distPath, cssFiles[0]), 'utf8');
    if (cssContent.includes('flex') && cssContent.includes('grid')) {
      console.log('✅ CSS file appears to contain Tailwind styles');
    } else {
      console.log('⚠️ CSS file may not contain Tailwind styles');
    }
  } else {
    console.log('⚠️ No CSS files found in dist directory');
  }
} catch (err) {
  console.error('❌ Error checking CSS files:', err.message);
}

// Check for other build artifacts
try {
  const indexHtmlPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    console.log('✅ index.html exists in dist directory');
  } else {
    console.error('❌ index.html does not exist in dist directory');
  }
} catch (err) {
  console.error('❌ Error checking for index.html:', err.message);
}

console.log('🏁 Postbuild verification complete');
