// Schema inspection endpoint to diagnose database structure
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

module.exports = async (req, res) => {
  // Enable CORS
  await new Promise((resolve, reject) => {
    cors({ origin: true })(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });

  // Initialize Supabase
  const supabaseUrl = process.env.SUPABASE_URL || 
                      process.env.VITE_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL;
                      
  const supabaseKey = process.env.SUPABASE_ANON_KEY || 
                      process.env.VITE_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({
      success: false,
      message: 'Supabase configuration missing',
      data: {
        supabaseUrlExists: !!supabaseUrl,
        supabaseKeyExists: !!supabaseKey,
        env: process.env.NODE_ENV,
        envVars: Object.keys(process.env).filter(key => 
          key.includes('SUPABASE') || 
          key.includes('NEXT_PUBLIC') || 
          key.includes('VITE_')
        )
      }
    });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const results = {};
  
  try {
    // First, check what tables exist
    console.log('[inspect-schema] Checking tables in database');
    const { data: tables, error: tablesError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('schemaname, tablename')
      .eq('schemaname', 'public');
      
    if (tablesError) {
      console.error(`[inspect-schema] Error fetching tables: ${tablesError.message}`);
      
      // Try alternative approach
      const { data: tables2, error: tablesError2 } = await supabase
        .rpc('list_tables');
        
      if (tablesError2) {
        console.error(`[inspect-schema] Alternative tables approach also failed: ${tablesError2.message}`);
        results.tables = { error: tablesError.message };
      } else {
        results.tables = tables2;
      }
    } else {
      results.tables = tables;
    }
    
    // Second, examine specific tables of interest
    const tablesToCheck = ['artists', 'releases', 'release_artists'];
    
    for (const table of tablesToCheck) {
      try {
        console.log(`[inspect-schema] Checking columns for table: ${table}`);
        
        // Try to get column information for this table
        const { data: columns, error: columnsError } = await supabase
          .from(`information_schema.columns`)
          .select('column_name, data_type')
          .eq('table_name', table)
          .eq('table_schema', 'public');
          
        if (columnsError) {
          console.error(`[inspect-schema] Error fetching columns for ${table}: ${columnsError.message}`);
          results[`${table}_columns`] = { error: columnsError.message };
        } else {
          results[`${table}_columns`] = columns;
        }
        
        // Try to count rows in this table
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          console.error(`[inspect-schema] Error counting rows in ${table}: ${countError.message}`);
          results[`${table}_count`] = { error: countError.message };
        } else {
          results[`${table}_count`] = { count };
        }
        
        // Get a sample row from the table
        const { data: sample, error: sampleError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (sampleError) {
          console.error(`[inspect-schema] Error getting sample from ${table}: ${sampleError.message}`);
          results[`${table}_sample`] = { error: sampleError.message };
        } else {
          results[`${table}_sample`] = sample;
        }
        
      } catch (e) {
        console.error(`[inspect-schema] Unexpected error checking ${table}: ${e.message}`);
        results[`${table}_error`] = e.message;
      }
    }
    
    // Third, check for specific relationships
    try {
      // Check for artist_id in releases
      const { data: artistIdReleases, error: airError } = await supabase
        .from('releases')
        .select('id, artist_id')
        .not('artist_id', 'is', null)
        .limit(5);
        
      results.artist_id_in_releases = {
        exists: !airError && artistIdReleases && artistIdReleases.length > 0,
        sample: artistIdReleases || [],
        error: airError ? airError.message : null
      };
      
      // Check for release_artists join entries
      const { data: releaseArtists, error: raError } = await supabase
        .from('release_artists')
        .select('*')
        .limit(5);
        
      results.release_artists_join = {
        exists: !raError && releaseArtists && releaseArtists.length > 0,
        sample: releaseArtists || [],
        error: raError ? raError.message : null
      };
      
    } catch (e) {
      console.error(`[inspect-schema] Error checking relationships: ${e.message}`);
      results.relationships_error = e.message;
    }
    
    // Fourth, test artist relationships specifically
    try {
      // Test with a specific artist ID
      const testArtistId = "6uuUmaH6yzvpnPgDcdl0y4"; // From the logs you shared
      
      // Check if artist exists
      const { data: artistExists, error: aeError } = await supabase
        .from('artists')
        .select('id, name')
        .eq('id', testArtistId)
        .single();
        
      results.test_artist = {
        exists: !aeError && artistExists,
        data: artistExists,
        error: aeError ? aeError.message : null
      };
      
      // Check direct releases connection
      const { data: directReleases, error: drError } = await supabase
        .from('releases')
        .select('id, title')
        .eq('artist_id', testArtistId)
        .limit(5);
        
      results.test_artist_direct_releases = {
        exists: !drError && directReleases && directReleases.length > 0,
        count: directReleases ? directReleases.length : 0,
        sample: directReleases || [],
        error: drError ? drError.message : null
      };
      
      // Check join table connection
      const { data: joinReleases, error: jrError } = await supabase
        .from('release_artists')
        .select('release_id')
        .eq('artist_id', testArtistId)
        .limit(5);
        
      results.test_artist_join_releases = {
        exists: !jrError && joinReleases && joinReleases.length > 0,
        count: joinReleases ? joinReleases.length : 0,
        sample: joinReleases || [],
        error: jrError ? jrError.message : null
      };
      
    } catch (e) {
      console.error(`[inspect-schema] Error in artist test: ${e.message}`);
      results.test_artist_error = e.message;
    }
    
    // Finally, return the entire results object
    return res.status(200).json({
      success: true,
      message: 'Database schema inspection completed',
      data: results
    });
    
  } catch (error) {
    console.error(`[inspect-schema] Unexpected error: ${error.message}`);
    return res.status(200).json({
      success: false,
      message: `Error inspecting schema: ${error.message}`,
      data: results
    });
  }
};
