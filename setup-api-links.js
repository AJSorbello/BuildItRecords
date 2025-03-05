// Script to create symlinks from serverless functions to server code
// This allows us to test both environments locally
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the mapping from serverless API paths to server routes
const mappings = [
  {
    serverless: 'api/releases/index.js',
    express: 'server/routes/releases.js',
    type: 'route'
  },
  {
    serverless: 'api/artists/index.js',
    express: 'server/routes/artists.js',
    type: 'route'
  },
  {
    serverless: 'api/tracks/index.js',
    express: 'server/routes/tracks.js',
    type: 'route'
  }
];

// Helper to ensure directory exists
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
}

// Compare the files and print differences
function compareFiles(serverlessPath, expressPath) {
  try {
    // If the serverless file doesn't exist, nothing to compare
    if (!fs.existsSync(serverlessPath)) {
      console.log(`  Serverless file doesn't exist yet: ${serverlessPath}`);
      return;
    }
    
    // Check if express path exists
    if (!fs.existsSync(expressPath)) {
      console.log(`  Express file doesn't exist: ${expressPath}`);
      return;
    }
    
    // Read file contents
    const serverlessContent = fs.readFileSync(serverlessPath, 'utf8');
    const expressContent = fs.readFileSync(expressPath, 'utf8');
    
    // Simple difference check
    if (serverlessContent === expressContent) {
      console.log('  Files are identical');
    } else {
      console.log('  ⚠️ Files have differences');
      
      // Print a simple diff statistic
      const serverlessLines = serverlessContent.split('\n').length;
      const expressLines = expressContent.split('\n').length;
      console.log(`  - Serverless: ${serverlessLines} lines`);
      console.log(`  - Express: ${expressLines} lines`);
    }
  } catch (err) {
    console.error(`  Error comparing files: ${err.message}`);
  }
}

console.log('🔄 Checking API serverless functions vs Express routes...');

// Process each mapping
for (const mapping of mappings) {
  const serverlessPath = path.join(__dirname, mapping.serverless);
  const expressPath = path.join(__dirname, mapping.express);
  
  console.log(`\n📋 Examining: ${mapping.serverless}`);
  compareFiles(serverlessPath, expressPath);
  
  // Ensure the directory for the serverless function exists
  ensureDirectoryExists(serverlessPath);
  
  // For routes that don't exist as serverless functions, we need to create them
  if (!fs.existsSync(serverlessPath)) {
    console.log(`  Creating serverless handler for ${mapping.serverless}`);
    
    if (mapping.type === 'route') {
      // Create a wrapper around the Express route
      const routeWrapper = `// Serverless API handler for ${path.basename(mapping.serverless)}
import { Pool } from 'pg';

// CRITICAL: Force Node.js to accept self-signed certificates
// This should only be used in controlled environments with trusted sources
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Create connection options
let poolConfig;

if (process.env.POSTGRES_URL) {
  // Use connection string if available
  poolConfig = {
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      sslmode: 'require'
    }
  };
  console.log('Using connection string from POSTGRES_URL');
} else {
  // Use individual parameters
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'builditrecords',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    // Only use SSL if explicitly set to true
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      sslmode: 'require'
    } : false
  };
  console.log('Using individual connection parameters:', JSON.stringify({
    host: poolConfig.host,
    port: poolConfig.port,
    database: poolConfig.database,
    user: poolConfig.user,
    ssl: !!poolConfig.ssl
  }));
}

// Add common options
poolConfig.connectionTimeoutMillis = 10000;
poolConfig.idleTimeoutMillis = 10000;

// Initialize database connection
const pool = new Pool(poolConfig);

export default async (req, res) => {
  try {
    console.log('Processing ${path.basename(mapping.serverless)} request', req.query);
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to database');
    
    try {
      // First inspect the database schema to understand what columns we have
      try {
        // TODO: Implement API logic here based on database schema
        
        // Example query
        let query = '';
        let queryParams = [];
        
        // Add your custom query logic here
        ${mapping.serverless.includes('releases') ? `
        // Query for releases
        const { label, offset = 0, limit = 50 } = req.query;
        
        query = label
          ? 'SELECT * FROM releases WHERE label_id = $1 ORDER BY release_date DESC LIMIT $2 OFFSET $3'
          : 'SELECT * FROM releases ORDER BY release_date DESC LIMIT $1 OFFSET $2';
          
        queryParams = label 
          ? [label, parseInt(limit), parseInt(offset)]
          : [parseInt(limit), parseInt(offset)];
        ` : ''}
        
        ${mapping.serverless.includes('artists') ? `
        // Query for artists
        const { label } = req.query;
        
        query = label
          ? 'SELECT * FROM artists WHERE label_id = $1 ORDER BY name LIMIT 50'
          : 'SELECT * FROM artists ORDER BY name LIMIT 50';
          
        queryParams = label ? [label] : [];
        ` : ''}
        
        ${mapping.serverless.includes('tracks') ? `
        // Query for tracks
        const { label, release } = req.query;
        
        if (release) {
          query = 'SELECT * FROM tracks WHERE release_id = $1 ORDER BY track_number';
          queryParams = [release];
        } else if (label) {
          query = 'SELECT t.* FROM tracks t JOIN releases r ON t.release_id = r.id WHERE r.label_id = $1 LIMIT 50';
          queryParams = [label];
        } else {
          query = 'SELECT * FROM tracks ORDER BY created_at DESC LIMIT 50';
          queryParams = [];
        }
        ` : ''}
        
        console.log('Executing query:', query);
        console.log('With parameters:', queryParams);
        
        const result = await client.query(query, queryParams);
        console.log(\`Found \${result.rows.length} results\`);
        
        // Return the results
        return res.status(200).json({ 
          ${mapping.serverless.includes('releases') ? 'releases: result.rows' : ''}
          ${mapping.serverless.includes('artists') ? 'artists: result.rows' : ''}
          ${mapping.serverless.includes('tracks') ? 'tracks: result.rows' : ''}
        });
      } catch (schemaError) {
        console.error('Schema or query error:', schemaError.message);
        return res.status(500).json({ 
          error: 'Database query error', 
          details: schemaError.message
        });
      }
    } finally {
      // Release the client back to the pool
      client.release();
      console.log('Database connection released');
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message
    });
  }
};
`;
      
      // Write the wrapper to the serverless file
      fs.writeFileSync(serverlessPath, routeWrapper);
      console.log(`  ✅ Created serverless function: ${serverlessPath}`);
    }
  } else {
    console.log(`  ✅ Serverless function already exists: ${serverlessPath}`);
  }
}

console.log('\n✅ API setup completed successfully!');
