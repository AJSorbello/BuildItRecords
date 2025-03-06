// Script to check the schema of tables in Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration (from .env file)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Tables to check
const tables = ['artists', 'tracks', 'albums', 'labels', 'album_artists'];

// Main function
async function checkSchema() {
  console.log('🔍 Checking Supabase database schema...');
  console.log(`🔌 Connected to Supabase at: ${supabaseUrl}`);

  for (const table of tables) {
    console.log(`\n📋 Checking table: ${table}`);
    
    try {
      // First check if the table exists by trying to select a single row
      const { data, error } = await supabase
        .from(table)
        .select()
        .limit(1);
      
      if (error) {
        console.error(`❌ Error accessing table ${table}:`, error.message);
        console.log(`   Table might not exist or you might not have permission to access it.`);
        continue;
      }
      
      // Get column information using system tables
      const { data: columns, error: columnError } = await supabase
        .rpc('get_table_columns', { table_name: table });
      
      if (columnError) {
        console.error(`❌ Error getting columns for ${table}:`, columnError.message);
        
        // Fallback: Try to infer columns from the first row
        if (data && data.length > 0) {
          console.log(`   Inferred columns from data:`, Object.keys(data[0]));
        }
        
        continue;
      }
      
      if (columns && columns.length > 0) {
        console.log(`   Columns for ${table}:`);
        columns.forEach(col => {
          console.log(`     - ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ', NOT NULL' : ''}${col.is_identity === 'YES' ? ', IDENTITY' : ''})`);
        });
      } else {
        console.log(`   No columns found for ${table} or table might be empty`);
        
        // Fallback: Try to infer columns from the first row
        if (data && data.length > 0) {
          console.log(`   Inferred columns from data:`, Object.keys(data[0]));
        }
      }
      
      // Get row count
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error(`❌ Error getting row count for ${table}:`, countError.message);
      } else {
        console.log(`   Row count: ${count}`);
      }
    } catch (err) {
      console.error(`❌ Unexpected error checking table ${table}:`, err.message);
    }
  }
}

// Function to get table columns might not exist in all Supabase instances
// Let's create it if needed
async function createColumnFunction() {
  try {
    const { error } = await supabase.rpc('get_table_columns', { table_name: 'labels' });
    
    // If the function doesn't exist, create it
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('Creating function to get table columns...');
      
      const { error: createError } = await supabase.rpc('create_column_function');
      
      if (createError) {
        // If we can't create the function, let's try a direct SQL approach
        const { error: sqlError } = await supabase.from('_exec_sql').select('*').eq('query', `
          CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
          RETURNS TABLE (
            column_name text,
            data_type text,
            is_nullable text,
            is_identity text
          )
          LANGUAGE sql
          AS $$
            SELECT
              column_name,
              data_type,
              is_nullable,
              is_identity
            FROM
              information_schema.columns
            WHERE
              table_name = $1
            ORDER BY
              ordinal_position;
          $$;
        `);
        
        if (sqlError) {
          console.log('Could not create column function, will use fallback method');
        }
      }
    }
  } catch (err) {
    console.log('Could not create column function, will use fallback method');
  }
}

// Run the check
createColumnFunction()
  .then(() => checkSchema())
  .catch(err => {
    console.error('❌ Unhandled error:', err);
    process.exit(1);
  });
