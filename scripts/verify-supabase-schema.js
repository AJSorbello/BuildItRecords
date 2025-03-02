const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Verify table structure in Supabase by fetching column details
 */
async function verifyTableSchema() {
  console.log('Verifying Supabase schema...');
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  
  const tables = [
    'artists',
    'releases',
    'tracks',
    'track_artists',
    'release_artists',
    'labels'
  ];
  
  for (const table of tables) {
    try {
      // Fetch a single row to inspect structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`Error inspecting table ${table}: ${error.message}`);
        continue;
      }
      
      if (!data || data.length === 0) {
        console.log(`Table ${table} exists but is empty.`);
        
        // Try to get structure by examining column definitions
        try {
          // This query may require higher privileges, so it might fail with RLS
          const { data: columnInfo, error: columnError } = await supabase.rpc('get_table_columns', {
            table_name: table
          });
          
          if (columnError) {
            console.log(`Could not retrieve column info for ${table}: ${columnError.message}`);
          } else if (columnInfo && columnInfo.length > 0) {
            console.log(`Columns in ${table}: ${columnInfo.map(c => c.column_name).join(', ')}`);
          }
        } catch (e) {
          console.log(`Failed to get column info: ${e.message}`);
        }
      } else {
        console.log(`\nTable ${table} exists with the following columns:`);
        
        // Print the structure of the first row to show available columns
        const columns = Object.keys(data[0]);
        console.log(columns.join(', '));
        
        // Optionally print a sample record
        console.log('\nSample record:');
        console.log(JSON.stringify(data[0], null, 2));
      }
    } catch (e) {
      console.error(`Error checking table ${table}: ${e.message}`);
    }
  }
  
  console.log('\nSchema verification complete.');
}

// Execute the verification
verifyTableSchema()
  .catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
