const { execSync } = require('child_process') // eslint-disable-line @typescript-eslint/no-var-requires;
const fs = require('fs') // eslint-disable-line @typescript-eslint/no-var-requires;
const path = require('path') // eslint-disable-line @typescript-eslint/no-var-requires;

console.log('🔍 Starting pg installation script');

// Function to check if pg is already installed properly
function isPgInstalled() {
  try {
    require.resolve('pg');
    console.log('✅ pg is already installed');
    return true;
  } catch (e) {
    console.log('❌ pg is not installed:', e.message);
    return false;
  }
}

// Install pg and pg-hstore directly
function installPg() {
  console.log('📦 Installing pg and pg-hstore directly');
  
  try {
    execSync('npm install pg pg-hstore --no-save', { stdio: 'inherit' });
    console.log('✅ pg and pg-hstore installed successfully');
    
    // Verify installation
    if (isPgInstalled()) {
      // Create a test file
      const testContent = `
const pg = require('pg') // eslint-disable-line @typescript-eslint/no-var-requires;
console.log('Successfully loaded pg module');
console.log('pg version:', require('pg/package.json').version);
      `;
      
      fs.writeFileSync('pg-test.js', testContent);
      console.log('Running pg test...');
      execSync('node pg-test.js', { stdio: 'inherit' });
      
      return true;
    } else {
      throw new Error('pg still not available after installation');
    }
  } catch (error) {
    console.error('❌ Failed to install pg:', error.message);
    return false;
  }
}

// Check node_modules structure
function checkNodeModules() {
  console.log('🔍 Checking node_modules structure');
  
  const pgPath = path.join(process.cwd(), 'node_modules', 'pg');
  
  if (fs.existsSync(pgPath)) {
    console.log('✅ node_modules/pg directory exists');
    
    // Check for package.json
    if (fs.existsSync(path.join(pgPath, 'package.json'))) {
      console.log('✅ pg package.json exists');
      
      // List files in the directory
      const files = fs.readdirSync(pgPath);
      console.log('📂 Files in pg directory:', files.join(', '));
      
      return true;
    } else {
      console.log('❌ pg package.json does not exist');
      return false;
    }
  } else {
    console.log('❌ node_modules/pg directory does not exist');
    return false;
  }
}

// Main execution
if (!isPgInstalled()) {
  installPg();
  checkNodeModules();
} else {
  checkNodeModules();
}

console.log('✅ pg installation script completed');
