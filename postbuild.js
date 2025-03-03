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

// Check if the main CSS file was generated
try {
  const cssFiles = fs.readdirSync(distPath).filter(file => file.endsWith('.css'));
  if (cssFiles.length > 0) {
    console.log('✅ CSS files found:', cssFiles.join(', '));
    
    // Check if the CSS file has content
    const cssContent = fs.readFileSync(path.join(distPath, cssFiles[0]), 'utf8');
    if (cssContent.length > 100) {
      console.log(`✅ CSS file has content (${cssContent.length} bytes)`);
    } else {
      console.warn(`⚠️ CSS file is suspiciously small (${cssContent.length} bytes)`);
    }
  } else {
    console.error('❌ No CSS files found in dist directory');
  }
} catch (err) {
  console.error('❌ Error checking CSS files:', err.message);
}

// Check for index.html
try {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('✅ index.html exists');
    
    // Verify it contains expected content
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    if (indexContent.includes('<div id="root"></div>')) {
      console.log('✅ index.html contains root element');
    } else {
      console.warn('⚠️ index.html might be missing the root element');
    }
  } else {
    console.error('❌ index.html not found');
  }
} catch (err) {
  console.error('❌ Error checking index.html:', err.message);
}

console.log('✅ Postbuild verification completed');
