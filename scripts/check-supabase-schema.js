const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseSchema() {
  console.log('Checking Supabase schema...');
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  
  // Query information_schema to get column definitions for all tables
  const { data: columnData, error: columnError } = await supabase.rpc('inspect_schema', {
    table_names: ['artists', 'releases', 'tracks', 'track_artists', 'release_artists', 'labels']
  });

  if (columnError) {
    console.error('Error querying schema:', columnError.message);
    
    // Create the inspect_schema function if it doesn't exist
    console.log('Creating schema inspection function...');
    
    const { error: fnError } = await supabase.rpc('create_inspect_function');
    
    if (fnError) {
      console.error('Could not create schema inspection function:', fnError.message);
      
      // Fall back to checking individual tables
      await checkTablesExist();
    } else {
      // Try again with the newly created function
      const { data: retryData, error: retryError } = await supabase.rpc('inspect_schema', {
        table_names: ['artists', 'releases', 'tracks']
      });
      
      if (retryError) {
        console.error('Error on retry:', retryError.message);
        await checkTablesExist();
      } else {
        displaySchemaInfo(retryData);
      }
    }
  } else {
    displaySchemaInfo(columnData);
  }
  
  console.log('\nSchema check complete.');
}

// Function to display the schema information
function displaySchemaInfo(schemaData) {
  if (!schemaData || !Array.isArray(schemaData) || schemaData.length === 0) {
    console.log('No schema information available');
    return;
  }
  
  // Group columns by table
  const tableColumns = {};
  schemaData.forEach(col => {
    if (!tableColumns[col.table_name]) {
      tableColumns[col.table_name] = [];
    }
    tableColumns[col.table_name].push({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable === 'YES'
    });
  });
  
  // Display each table's structure
  Object.keys(tableColumns).forEach(tableName => {
    console.log(`\nTABLE: ${tableName.toUpperCase()}`);
    console.log('Columns:');
    tableColumns[tableName].forEach(col => {
      console.log(`  - ${col.name} (${col.type})${col.nullable ? ' NULL' : ' NOT NULL'}`);
    });
  });
}

// Fallback check to see if tables exist without getting column details
async function checkTablesExist() {
  const tables = ['artists', 'releases', 'tracks', 'track_artists', 'release_artists', 'labels'];
  
  for (const table of tables) {
    console.log(`\nCHECKING ${table.toUpperCase()} TABLE:`);
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        console.error(`Error checking ${table}: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`${table} table exists and has data.`);
        console.log('Columns:', Object.keys(data[0]).join(', '));
      } else {
        console.log(`${table} table exists but is empty.`);
        
        // Try inserting test data to see what fields are accepted
        if (table === 'artists') {
          try {
            // Try with fields we're confident about
            const testArtist = {
              id: 'test-artist-' + Date.now(),
              name: 'Test Artist',
              bio: 'Test Bio'
            };
            
            const { error: insertError } = await supabase.from('artists').insert([testArtist]);
            
            if (insertError) {
              console.error('Error inserting test artist:', insertError.message);
              // Try with super minimal fields
              const { error: minimalError } = await supabase
                .from('artists')
                .insert([{ id: 'test-artist-min-' + Date.now(), name: 'Test Artist Min' }]);
              
              if (minimalError) {
                console.error('Error inserting reduced artist:', minimalError.message);
              } else {
                console.log('Successfully inserted minimal artist test record');
              }
            } else {
              console.log('Successfully inserted artist test record');
            }
          } catch (e) {
            console.error('Exception during artist test:', e.message);
          }
        }
      }
    } catch (e) {
      console.error(`Exception checking ${table}: ${e.message}`);
    }
  }
}

// Try to create the schema inspection function
async function createInspectionFunction() {
  const { error } = await supabase.rpc('create_inspect_function', {
    functionBody: `
      CREATE OR REPLACE FUNCTION inspect_schema(table_names text[])
      RETURNS TABLE(
        table_name text,
        column_name text,
        data_type text,
        is_nullable text
      ) LANGUAGE sql SECURITY DEFINER AS $$
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM 
          information_schema.columns
        WHERE 
          table_schema = 'public'
          AND table_name = ANY(table_names)
        ORDER BY table_name, ordinal_position;
      $$;
    `
  });
  
  return !error;
}

checkSupabaseSchema().catch(err => {
  console.error('Error:', err);
});
