// Script to check if we can connect to Supabase using Vercel environment variables
const https = require('https') // eslint-disable-line @typescript-eslint/no-var-requires;

// Try to get Supabase URL using DNS lookup
console.log('Attempting to resolve Supabase domain...');

function lookupDomain(domain) {
  return new Promise((resolve, reject) => {
    const req = https.get(`https://${domain}/rest/v1/`, {
      headers: {
        'Accept': 'application/json'
      }
    }, (res) => {
      console.log(`Status code for ${domain}: ${res.statusCode}`);
      res.on('data', () => { /* No operation */ });
      res.on('end', () => {
        resolve(res.statusCode !== 404);
      });
    });
    
    req.on('error', (err) => {
      console.error(`Error reaching ${domain}:`, err.message);
      resolve(false);
    });
    
    req.end();
  });
}

async function main() {
  console.log('=== Supabase Connection Test ===');
  
  // Test different domain formats
  const domains = [
    'liuaozuvkmvanmchndzl.supabase.co',
    'db.liuaozuvkmvanmchndzl.supabase.co'
  ];
  
  for (const domain of domains) {
    console.log(`Testing connection to: ${domain}`);
    const reachable = await lookupDomain(domain);
    console.log(`${domain} is ${reachable ? 'reachable' : 'not reachable'}`);
  }
  
  // Print connection URLs from environment
  console.log('\n=== Environment Variables ===');
  console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'Set (masked)' : 'Not set');
  console.log('POSTGRES_URL_NON_POOLING:', process.env.POSTGRES_URL_NON_POOLING ? 'Set (masked)' : 'Not set');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set (masked)' : 'Not set');
  console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
  console.log('DB_HOST:', process.env.DB_HOST);
  
  console.log('\n=== Connection Configuration ===');
  console.log('Database test complete. If "liuaozuvkmvanmchndzl.supabase.co" is reachable but "db.liuaozuvkmvanmchndzl.supabase.co" is not,');
  console.log('you should update your connection string to use the regular URL without the "db." prefix.');
  
  console.log('\nRecommended connection string format:');
  console.log('postgres://postgres:password@liuaozuvkmvanmchndzl.supabase.co:5432/postgres?sslmode=require');
}

main().catch(console.error);
