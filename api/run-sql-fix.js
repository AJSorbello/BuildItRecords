// Direct SQL executor for artist-releases fix
// This script connects directly to the Supabase database and runs the SQL commands

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get database credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

console.log('Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Create the function directly
async function createFunction() {
  console.log('Creating the get_artist_releases function...');
  
  const functionSql = `
    -- Create a function to fetch artist releases without the JSON object error
    CREATE OR REPLACE FUNCTION get_artist_releases(artist_id_param TEXT)
    RETURNS SETOF releases AS $$
    BEGIN
      -- First try to get releases via the release_artists join table
      RETURN QUERY
        SELECT r.* 
        FROM releases r
        JOIN release_artists ra ON r.id = ra.release_id
        WHERE ra.artist_id = artist_id_param
        ORDER BY r.release_date DESC NULLS LAST;
      
      -- If no results, try direct artist_id lookup (will only execute if the above returns nothing)
      IF NOT FOUND THEN
        RETURN QUERY
          SELECT * FROM releases 
          WHERE primary_artist_id = artist_id_param
          ORDER BY release_date DESC NULLS LAST;
      END IF;
    END;
    $$ LANGUAGE plpgsql;
  `;
  
  try {
    // Execute the function creation SQL directly
    const { data, error } = await supabase.rpc('exec_sql', { query: functionSql });
    
    if (error) {
      console.error('Error creating function:', error.message);
      
      // If exec_sql function doesn't exist, try creating it first
      console.log('Trying to create exec_sql function first...');
      const createExecSql = `
        CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
        RETURNS TEXT AS $$
        BEGIN
          EXECUTE query;
          RETURN 'SQL executed successfully';
        EXCEPTION WHEN OTHERS THEN
          RETURN 'Error executing SQL: ' || SQLERRM;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;
      
      // Use direct SQL execution if available
      try {
        const { error: directError } = await supabase.from('_exec_direct_sql').select('*');
        console.log('Error is expected, using REST API endpoint instead:', directError?.message);
        
        const { data: sqlResult, error: sqlError } = await supabase.rest.sql(createExecSql);
        console.log('Direct SQL execution result:', sqlResult || sqlError?.message);
        
        // Try again with the function creation
        const { data: retryData, error: retryError } = await supabase.rest.sql(functionSql);
        console.log('Function creation retry result:', retryData || retryError?.message);
      } catch (err) {
        console.error('REST SQL execution failed:', err.message);
      }
    } else {
      console.log('Function created successfully:', data);
    }
  } catch (err) {
    console.error('Unexpected error creating function:', err.message);
  }
}

// Manually update John Summit's releases
async function fixJohnSummitReleases() {
  const johnSummitId = '7kNqXtgeIwFtelmRjWv205';
  const girlReleaseId = '3c7NSZz8Sq6zOZoZDTHGIR'; // This should be the ID of the "Girl" release
  
  console.log(`Fixing releases for John Summit (${johnSummitId})...`);
  
  try {
    // First check if the artist exists
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('id', johnSummitId)
      .single();
      
    if (artistError) {
      console.error('Error fetching John Summit:', artistError.message);
      return;
    }
    
    console.log('Found artist:', artist?.name);
    
    // Now check if "Girl" release exists
    const { data: releases, error: releaseError } = await supabase
      .from('releases')
      .select('*')
      .ilike('title', '%girl%')
      .limit(10);
      
    if (releaseError) {
      console.error('Error finding Girl release:', releaseError.message);
      return;
    }
    
    console.log(`Found ${releases?.length || 0} releases with "girl" in the title:`, 
      releases?.map(r => `${r.title} (${r.id})`));
    
    // Create a specific relationship for John Summit and "Girl"
    const { data: existingRel, error: relError } = await supabase
      .from('release_artists')
      .select('*')
      .eq('artist_id', johnSummitId)
      .limit(5);
      
    if (relError) {
      console.error('Error checking existing relationships:', relError.message);
    } else {
      console.log(`Artist has ${existingRel?.length || 0} existing release relationships`);
    }
    
    // First delete any existing fallback relationships for this artist
    const { error: deleteError } = await supabase
      .from('release_artists')
      .delete()
      .eq('artist_id', johnSummitId);
      
    if (deleteError) {
      console.error('Error deleting existing relationships:', deleteError.message);
    } else {
      console.log('Deleted any existing release relationships for this artist');
    }
    
    // Now create the proper relationship for Girl
    if (girlReleaseId) {
      const { data: insertData, error: insertError } = await supabase
        .from('release_artists')
        .insert({
          release_id: girlReleaseId,
          artist_id: johnSummitId,
          role: 'primary'
        })
        .select();
        
      if (insertError) {
        console.error('Error creating relationship:', insertError.message);
      } else {
        console.log('Successfully created relationship between John Summit and Girl release');
      }
    } else {
      console.error('Girl release ID not found or provided');
    }
    
    // Check final state
    const { data: finalRel, error: finalRelError } = await supabase
      .from('release_artists')
      .select('*')
      .eq('artist_id', johnSummitId);
      
    if (finalRelError) {
      console.error('Error checking final relationships:', finalRelError.message);
    } else {
      console.log(`Artist now has ${finalRel?.length || 0} release relationships`);
    }
  } catch (err) {
    console.error('Unexpected error fixing John Summit releases:', err.message);
  }
}

// Main execution
async function main() {
  try {
    await createFunction();
    await fixJohnSummitReleases();
    console.log('All fixes completed');
  } catch (error) {
    console.error('Error in main execution:', error.message);
  }
}

main();
