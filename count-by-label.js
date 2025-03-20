// Script to count releases and artists per label
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

async function main() {
  try {
    // Connect to the database using Supabase
    console.log('Connecting to database using Supabase...');
    const supabaseUrl = process.env.SUPABASE_URL || 'https://liuaozuvkmvanmchndzl.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpdWFvenV2a212YW5tY2huZHpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTg0ODQzNCwiZXhwIjoyMDUxNDI0NDM0fQ.VLf3x9W8dhNDz3DBBx5eXUosjaNFDOc2AeyAr82rGSk';

    if (!supabaseUrl || !supabaseKey) {
      console.error('ERROR: No Supabase credentials provided in environment variables');
      console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test the Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('labels')
      .select('id, name')
      .limit(1);
    
    if (testError) {
      console.error('Supabase client connection test failed:', testError.message);
      process.exit(1);
    }
    
    console.log('Connected to database using Supabase');

    // First, get all labels
    const { data: labels, error: labelsError } = await supabase
      .from('labels')
      .select('id, name')
      .order('name');
    
    if (labelsError) {
      console.error('Error fetching labels:', labelsError.message);
      return;
    }
    
    console.log(`Found ${labels.length} labels in the database`);
    
    // For each label, count releases and artists
    const results = [];
    
    for (const label of labels) {
      // Count releases for this label
      const { data: releasesData, error: releasesError } = await supabase
        .from('releases')
        .select('*', { count: 'exact', head: true })
        .eq('label_id', label.id);
      
      if (releasesError) {
        console.error(`Error counting releases for label ${label.name}:`, releasesError.message);
        continue;
      }
      
      const releaseCount = releasesData ? releasesData.count || 0 : 0;
      
      // Check if release_artists table exists
      const { data: raTest, error: raTestError } = await supabase
        .from('release_artists')
        .select('*')
        .limit(1);
      
      let artistCount = 0;
      if (!raTestError) {
        // Get releases for this label
        const { data: labelReleases, error: releasesListError } = await supabase
          .from('releases')
          .select('id')
          .eq('label_id', label.id);
        
        if (!releasesListError && labelReleases && labelReleases.length > 0) {
          // Get distinct artists from these releases
          const releaseIds = labelReleases.map(r => r.id);
          
          // This doesn't give us distinct count directly, so we need to process the results
          const { data: releaseArtists, error: raError } = await supabase
            .from('release_artists')
            .select('artist_id')
            .in('release_id', releaseIds);
          
          if (!raError && releaseArtists) {
            // Count unique artist IDs
            const uniqueArtistIds = new Set();
            releaseArtists.forEach(ra => {
              if (ra.artist_id) uniqueArtistIds.add(ra.artist_id);
            });
            artistCount = uniqueArtistIds.size;
          }
        }
      }
      
      // Check if artist_labels table exists and count direct associations
      let directArtistCount = 0;
      const { data: alTest, error: alTestError } = await supabase
        .from('artist_labels')
        .select('*')
        .limit(1);
        
      if (!alTestError) {
        const { data: directArtists, error: directError } = await supabase
          .from('artist_labels')
          .select('*', { count: 'exact', head: true })
          .eq('label_id', label.id);
        
        if (!directError) {
          directArtistCount = directArtists ? directArtists.count || 0 : 0;
        }
      } else {
        console.log('Artist-labels table may not exist');
      }
      
      // Check if artists table has label_id field
      let labelIdArtistCount = 0;
      try {
        const { data: labelArtists, error: laError } = await supabase
          .from('artists')
          .select('id')
          .eq('label_id', label.id);
        
        if (!laError && labelArtists) {
          labelIdArtistCount = labelArtists.length;
        }
      } catch (err) {
        console.log('Artists table may not have label_id column');
      }
      
      results.push({
        label_id: label.id,
        label_name: label.name,
        release_count: releaseCount,
        artist_count: artistCount,
        direct_artist_count: directArtistCount,
        label_id_artist_count: labelIdArtistCount
      });
      
      console.log(`Label: ${label.name} (${label.id}) - Releases: ${releaseCount}, Artists: ${artistCount}, Direct Artists: ${directArtistCount}, Label ID Artists: ${labelIdArtistCount}`);
    }
    
    // Summary - Total counts
    const totalReleases = results.reduce((sum, item) => sum + item.release_count, 0);
    const { data: artistsData, error: artistsCountError } = await supabase
      .from('artists')
      .select('*', { count: 'exact', head: true });
    
    const totalArtists = artistsData ? artistsData.count || 0 : 0;
    
    console.log('\n===== SUMMARY =====');
    console.log(`Total Releases: ${totalReleases}`);
    console.log(`Total Unique Artists: ${totalArtists}`);
    console.log('\n===== LABEL COUNTS =====');
    
    // Print sorted by release count (descending)
    results.sort((a, b) => b.release_count - a.release_count);
    results.forEach(item => {
      console.log(`${item.label_name}: ${item.release_count} releases, ${item.artist_count} artists${item.direct_artist_count ? `, ${item.direct_artist_count} direct artists` : ''}${item.label_id_artist_count ? `, ${item.label_id_artist_count} artists with label_id` : ''}`);
    });
    
    // Check API endpoints response counts for validation
    console.log('\n===== API ENDPOINT CHECKS =====');
    await checkApiEndpoints(labels);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

async function checkApiEndpoints(labels) {
  try {
    // Test API endpoints for each label
    for (const label of labels) {
      console.log(`\nChecking API for label: ${label.name} (${label.id})`);
      
      // Test label endpoint 
      try {
        const labelResponse = await axios.get(`http://localhost:3000/api/labels/${label.id}`);
        if (labelResponse.data && labelResponse.data.success) {
          console.log(`✓ Label endpoint returned data for ${label.name}`);
        } else {
          console.log(`✗ Label endpoint failed for ${label.name}`);
        }
      } catch (err) {
        console.log(`✗ Label endpoint error for ${label.name}: ${err.message}`);
      }
      
      // Test releases by label endpoint
      try {
        const releasesResponse = await axios.get(`http://localhost:3000/api/releases/by-label/${label.id}`);
        if (releasesResponse.data && releasesResponse.data.success) {
          const releases = releasesResponse.data.releases || releasesResponse.data.data || [];
          console.log(`✓ Releases endpoint returned ${releases.length} releases for ${label.name}`);
        } else {
          console.log(`✗ Releases endpoint failed for ${label.name}`);
        }
      } catch (err) {
        console.log(`✗ Releases endpoint error for ${label.name}: ${err.message}`);
      }
      
      // Also try numeric label ID if string-based ID was used
      if (isNaN(parseInt(label.id))) {
        console.log(`Trying alternate numeric label ID (1) for ${label.name}`);
        try {
          const numericResponse = await axios.get(`http://localhost:3000/api/releases/by-label/1`);
          if (numericResponse.data && numericResponse.data.success) {
            const releases = numericResponse.data.releases || numericResponse.data.data || [];
            console.log(`✓ Releases endpoint with numeric ID returned ${releases.length} releases for ${label.name}`);
          } else {
            console.log(`✗ Releases endpoint with numeric ID failed for ${label.name}`);
          }
        } catch (err) {
          console.log(`✗ Releases endpoint with numeric ID error for ${label.name}: ${err.message}`);
        }
      }
    }
    
    // Test general endpoints
    console.log('\nChecking general API endpoints:');
    
    // All releases endpoint
    try {
      const allReleasesResponse = await axios.get(`http://localhost:3000/api/releases`);
      if (allReleasesResponse.data && allReleasesResponse.data.success) {
        const releases = allReleasesResponse.data.releases || allReleasesResponse.data.data || [];
        console.log(`✓ All releases endpoint returned ${releases.length} total releases`);
      } else {
        console.log(`✗ All releases endpoint failed`);
      }
    } catch (err) {
      console.log(`✗ All releases endpoint error: ${err.message}`);
    }
    
    // All artists endpoint
    try {
      const allArtistsResponse = await axios.get(`http://localhost:3000/api/artists`);
      if (allArtistsResponse.data && allArtistsResponse.data.success) {
        const artists = allArtistsResponse.data.artists || allArtistsResponse.data.data || [];
        console.log(`✓ All artists endpoint returned ${artists.length} total artists`);
      } else {
        console.log(`✗ All artists endpoint failed`);
      }
    } catch (err) {
      console.log(`✗ All artists endpoint error: ${err.message}`);
    }
    
  } catch (error) {
    console.error('Error checking API endpoints:', error);
  }
}

// Run the script
main().catch(console.error);
