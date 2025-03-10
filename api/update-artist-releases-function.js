// Script to create or update the artist-releases SQL function in Supabase
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

// Read the SQL function definition
const sqlFilePath = path.join(__dirname, 'create-artist-releases-function.sql');
const sqlFunction = fs.readFileSync(sqlFilePath, 'utf8');

console.log('Environment variables loaded:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 
                     process.env.VITE_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL;
                     
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || // Note: Needs service role key for SQL execution
                    process.env.SUPABASE_ANON_KEY || 
                    process.env.VITE_SUPABASE_ANON_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createFunction() {
  try {
    console.log('Attempting to create/update SQL function in Supabase...');
    
    // Execute the SQL function creation
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_statement: sqlFunction 
    });
    
    if (error) {
      console.error('Error creating SQL function:', error);
      
      // Try alternative approach with REST API if RPC fails
      console.log('Trying alternative approach with direct REST API...');
      
      // Note: This requires additional setup and proper authorization
      // You might need to use a different approach based on your Supabase configuration
      
      return;
    }
    
    console.log('SQL function created/updated successfully!');
    console.log('Function ready to be used with: supabase.rpc("get_artist_releases", { artist_id_param: "your_artist_id" })');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Check if we can create a simpler version of the function without joins
async function inspectSchema() {
  try {
    console.log('Inspecting database schema...');
    
    // Check if release_artists join table exists
    const { data: releaseArtistsCheck, error: raError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'release_artists')
      .eq('table_schema', 'public');
      
    const hasReleaseArtists = releaseArtistsCheck && releaseArtistsCheck.length > 0;
    console.log(`release_artists table exists: ${hasReleaseArtists}`);
    
    // Check releases table schema
    const { data: releasesColumns, error: relError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'releases')
      .eq('table_schema', 'public');
      
    if (relError) {
      console.error('Error checking releases table schema:', relError);
      return;
    }
    
    const columns = releasesColumns.map(col => col.column_name);
    console.log('Releases table columns:', columns);
    
    const hasArtistId = columns.includes('artist_id');
    console.log(`releases.artist_id exists: ${hasArtistId}`);
    
    // Suggest appropriate SQL function based on schema
    if (!hasReleaseArtists && !hasArtistId) {
      console.log('WARNING: Neither release_artists join table nor artist_id column found.');
      console.log('You may need to modify the SQL function to match your actual schema.');
    }
    
  } catch (error) {
    console.error('Error inspecting schema:', error);
  }
}

// Execute both functions
async function main() {
  await inspectSchema();
  await createFunction();
  console.log('Script completed');
}

main();
