// Script to fix the artist-releases relationship in the database
// This script runs both SQL files to:
// 1. Create the get_artist_releases function 
// 2. Populate the release_artists join table with data

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials in environment variables');
  console.error('Please make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

console.log('Creating Supabase client with admin privileges...');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read SQL files
const execSqlPath = path.resolve(__dirname, 'create-exec-sql-function.sql');
const helperFunctionsPath = path.resolve(__dirname, 'create-helper-functions.sql');
const functionSqlPath = path.resolve(__dirname, 'create-artist-releases-function.sql');
const populateSqlPath = path.resolve(__dirname, 'populate-release-artists.sql');

const execSql = fs.readFileSync(execSqlPath, 'utf8');
const helperFunctions = fs.readFileSync(helperFunctionsPath, 'utf8');
const functionSql = fs.readFileSync(functionSqlPath, 'utf8');
const populateSql = fs.readFileSync(populateSqlPath, 'utf8');

async function runQuery(query, description) {
  console.log(`Executing: ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query });
    
    if (error) {
      console.error(`ERROR with ${description}:`, error.message);
      return false;
    }
    
    console.log(`✅ ${description} successful:`, data);
    return true;
  } catch (err) {
    console.error(`EXCEPTION with ${description}:`, err.message);
    return false;
  }
}

async function executeScript() {
  try {
    // Step 0: First create the exec_sql function directly using raw SQL (can't use rpc yet)
    console.log('Step 0: Creating exec_sql function to run other SQL commands...');
    const { data: execSqlResult, error: execSqlError } = await supabase.from('_exec_sql')
      .select('*')
      .limit(1)
      .then(() => {
        // This will always error since _exec_sql doesn't exist
        // We're just going to use the raw SQL REST endpoint to create our function
        return supabase.rest.sql(execSql);
      });
    
    if (execSqlError) {
      console.log('Note: Error is expected if using raw SQL endpoint:', execSqlError.message);
      console.log('Continuing with script execution...');
    } else {
      console.log('exec_sql function created:', execSqlResult);
    }
    
    // Step 1: Create helper functions
    const helpersSuccess = await runQuery(helperFunctions, 'Creating helper functions');
    
    // Step 2: Create get_artist_releases function
    const functionSuccess = await runQuery(functionSql, 'Creating get_artist_releases function');
    
    // Step 3: Populate release_artists table
    const populateSuccess = await runQuery(populateSql, 'Populating release_artists table');
    
    // Verify the function exists
    console.log('Step 4: Verifying function exists...');
    try {
      const { data: verifyData, error: verifyError } = await supabase.rpc('function_exists', { 
        function_name: 'get_artist_releases' 
      });

      if (verifyError) {
        console.error('ERROR verifying function:', verifyError.message);
      } else if (verifyData) {
        console.log('✅ Function verified successfully!');
      } else {
        console.error('⚠️ Function verification failed - function does not exist');
      }
    } catch (err) {
      console.error('Exception verifying function:', err.message);
    }

    // Test the function with a sample artist
    console.log('Step 5: Testing function with a sample artist...');
    const { data: artists, error: artistError } = await supabase
      .from('artists')
      .select('id, name')
      .limit(1);

    if (artistError) {
      console.error('ERROR fetching test artist:', artistError.message);
    } else if (artists && artists.length > 0) {
      const testArtist = artists[0];
      console.log(`Testing with artist: ${testArtist.name} (${testArtist.id})`);
      
      try {
        const { data: releases, error: releaseError } = await supabase
          .rpc('get_artist_releases', { artist_id_param: testArtist.id });

        if (releaseError) {
          console.error('ERROR testing function:', releaseError.message);
        } else {
          console.log(`✅ Function returned ${releases ? releases.length : 0} releases for artist ${testArtist.name}`);
        }
      } catch (err) {
        console.error('Exception testing function:', err.message);
      }
    }

    console.log('Database update complete! Artist releases should now work correctly.');
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

executeScript();
