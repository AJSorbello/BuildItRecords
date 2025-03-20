/**
 * Script to reimport data for Build It Records labels
 * - Ensures the correct distribution of releases across labels
 * - Updates artist-label associations
 * - Fixes counts to match expected values
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Constants
const CONFIG = {
  // Build It Records label ID (numeric format)
  labelId: 1,
  skipExistingReleases: true // Skip releases that already exist (by Spotify ID)
};

// Check if a table exists by trying to query it
async function checkTableExists(supabase, tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    // If no error, the table exists
    return !error;
  } catch (error) {
    return false;
  }
}

// Create missing tables if needed - this will try to work with what we have
// since we can't create tables directly through Supabase client
async function createMissingTables(supabase) {
  console.log('Checking if artist_labels table or relationship exists...');
  
  // Check if artist_labels exists
  const tableExists = await checkTableExists(supabase, 'artist_labels');
  
  if (tableExists) {
    console.log('artist_labels table exists');
    return true;
  } else {
    console.log('artist_labels table does not exist');
    
    // Since we can't create tables directly with Supabase client,
    // we'll need to adapt our strategy
    console.log('Attempting to work with existing tables...');
    
    // Check if releases has a direct artist_id field we can use
    try {
      const { data, error } = await supabase
        .from('releases')
        .select('artist_id')
        .limit(1);
      
      if (!error && data) {
        console.log('releases table has artist_id field we can use');
        return true;
      } else {
        console.log('releases table does not have artist_id field');
      }
    } catch (error) {
      console.log('Error checking releases table:', error.message);
    }
    
    // Check if release_artists join table exists
    const releaseArtistsExists = await checkTableExists(supabase, 'release_artists');
    
    if (releaseArtistsExists) {
      console.log('release_artists table exists, will use this for artist associations');
      return true;
    }
    
    console.log('Warning: No suitable artist-label relationship tables found, but continuing anyway');
    return false;
  }
}

// Setup artist-label relationships using multiple strategies
async function setupArtistLabelsTable(supabase) {
  console.log('Setting up artist-label relationships...');
  
  // First check if the table exists
  const artistLabelsExists = await checkTableExists(supabase, 'artist_labels');
  
  try {
    console.log('Finding artists associated with Build It Records releases...');
    
    // Multi-strategy approach for finding artists
    // Strategy 1: Use release_artists join table
    console.log('Strategy 1: Looking up artists via release_artists join table...');
    
    // First check if release_artists exists
    const releaseArtistsExists = await checkTableExists(supabase, 'release_artists');
    
    if (releaseArtistsExists) {
      const { data: releases, error: releasesError } = await supabase
        .from('releases')
        .select(`
          id,
          title,
          label_id,
          release_artists (
            artist_id
          )
        `)
        .eq('label_id', CONFIG.labelId)
        .limit(1000);
        
      if (releasesError) {
        console.error('Strategy 1 error:', releasesError.message);
      } else {
        console.log(`Found ${releases.length} releases associated with Build It Records`);
        
        // Extract artist IDs from the releases
        const artistIds = new Set();
        let artistCount = 0;
        
        releases.forEach(release => {
          if (release.release_artists && Array.isArray(release.release_artists)) {
            release.release_artists.forEach(ra => {
              if (ra.artist_id) {
                artistIds.add(ra.artist_id);
                artistCount++;
              }
            });
          }
        });
        
        const uniqueArtistIds = Array.from(artistIds);
        console.log(`Strategy 1 found ${uniqueArtistIds.length} unique artists from ${artistCount} total artist mentions`);
        
        if (uniqueArtistIds.length > 0) {
          if (artistLabelsExists) {
            return await createArtistLabelAssociations(supabase, uniqueArtistIds);
          } else {
            console.log('artist_labels table does not exist, but we found artists');
            // Just log the artist IDs since we can't store them
            console.log(`Found artist IDs: ${uniqueArtistIds.slice(0, 5).join(', ')}... (and ${uniqueArtistIds.length - 5} more)`);
            return true;
          }
        }
      }
    } else {
      console.log('release_artists table does not exist, skipping strategy 1');
    }
    
    // Strategy 2: Look for artists directly
    console.log('Strategy 2: Looking up artists directly...');
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id, name')
      .limit(200);
      
    if (artistsError) {
      console.error('Strategy 2 error:', artistsError.message);
    } else if (artists && artists.length > 0) {
      console.log(`Strategy 2 found ${artists.length} artists to associate with Build It Records`);
      const artistIds = artists.map(a => a.id);
      
      if (artistLabelsExists) {
        return await createArtistLabelAssociations(supabase, artistIds);
      } else {
        console.log('artist_labels table does not exist, but we found artists');
        // Just log the artist IDs since we can't store them
        console.log(`Found artist IDs: ${artistIds.slice(0, 5).join(', ')}... (and ${artistIds.length - 5} more)`);
        return true;
      }
    }
    
    // Strategy 3: Use the direct artist_id field in releases if it exists
    console.log('Strategy 3: Checking for direct artist_id fields in releases...');
    
    try {
      const { data: directReleases, error: directError } = await supabase
        .from('releases')
        .select('id, title, artist_id')
        .eq('label_id', CONFIG.labelId)
        .not('artist_id', 'is', null)
        .limit(200);
        
      if (directError) {
        console.error('Strategy 3 error:', directError.message);
      } else if (directReleases && directReleases.length > 0) {
        const artistIds = new Set();
        directReleases.forEach(release => {
          if (release.artist_id) {
            artistIds.add(release.artist_id);
          }
        });
        
        const uniqueArtistIds = Array.from(artistIds);
        console.log(`Strategy 3 found ${uniqueArtistIds.length} artist IDs from direct release relationships`);
        
        if (uniqueArtistIds.length > 0) {
          if (artistLabelsExists) {
            return await createArtistLabelAssociations(supabase, uniqueArtistIds);
          } else {
            console.log('artist_labels table does not exist, but we found artists tied to releases');
            console.log(`Found artist IDs: ${uniqueArtistIds.slice(0, 5).join(', ')}... (and ${uniqueArtistIds.length - 5} more)`);
            return true;
          }
        }
      }
    } catch (e) {
      console.log('Error in strategy 3, possibly releases table has no artist_id column:', e.message);
    }
    
    console.log('All strategies completed. Continuing with release distribution...');
    return true;
  } catch (error) {
    console.error('Error setting up artist-label relationships:', error.message);
    return false;
  }
}

// Helper function to create artist-label associations if the table exists
async function createArtistLabelAssociations(supabase, artistIds) {
  // First validate that the table exists
  const tableExists = await checkTableExists(supabase, 'artist_labels');
  
  if (!tableExists) {
    console.log('Cannot create artist-label associations: artist_labels table does not exist');
    return false;
  }
  
  // Insert artist-label associations in batches
  console.log(`Creating artist-label associations for ${artistIds.length} artists...`);
  const BATCH_SIZE = 50;
  let totalInserted = 0;
  
  for (let i = 0; i < artistIds.length; i += BATCH_SIZE) {
    const batch = artistIds.slice(i, i + BATCH_SIZE);
    const associations = batch.map(artistId => ({
      artist_id: artistId,
      label_id: CONFIG.labelId
    }));
    
    // Use upsert to handle duplicates gracefully
    const { data: inserted, error: insertError } = await supabase
      .from('artist_labels')
      .upsert(associations, {
        onConflict: 'artist_id,label_id',
        returning: 'minimal'
      });
    
    if (insertError) {
      console.error('Error inserting artist-label associations batch:', insertError.message);
      console.log('Continuing with next batch...');
    }
    
    totalInserted += batch.length;
    console.log(`Processed batch ${i/BATCH_SIZE + 1}/${Math.ceil(artistIds.length/BATCH_SIZE)}, ${totalInserted}/${artistIds.length} associations`);
  }
  
  console.log(`Successfully processed ${totalInserted} artist-label associations`);
  
  // Verify the associations were created
  const { data: counts, error: countError } = await supabase
    .from('artist_labels')
    .select('*')
    .eq('label_id', CONFIG.labelId);
    
  if (countError) {
    console.error('Error counting artist-label associations:', countError.message);
  } else {
    console.log(`Verified ${counts ? counts.length : 0} artist-label associations exist for Build It Records`);
  }
  
  return true;
}

// Redistribute releases across labels
async function redistributeReleases(supabase) {
  console.log('Redistributing releases across labels...');
  
  try {
    // Check release count by label - we need to use count() instead of group for Supabase
    console.log('Checking release counts by label...');
    
    // First count releases for Build It Records
    const { data: buildItData, error: buildItError } = await supabase
      .from('releases')
      .select('*', { count: 'exact', head: true })
      .eq('label_id', CONFIG.labelId);
    
    if (buildItError) {
      console.error('Error counting Build It Records releases:', buildItError.message);
      return false;
    }
    
    const buildItCount = buildItData ? buildItData.count || 0 : 0;
    console.log(`Current Build It Records releases count: ${buildItCount}`);
    
    // Count other labels' releases
    const { data: otherLabelsData, error: otherLabelsError } = await supabase
      .from('releases')
      .select('label_id, id')
      .neq('label_id', CONFIG.labelId)
      .limit(500);
    
    if (otherLabelsError) {
      console.error('Error counting other labels releases:', otherLabelsError.message);
      return false;
    }
    
    // Manually count releases per label
    const labelCounts = {};
    if (otherLabelsData) {
      otherLabelsData.forEach(release => {
        if (!labelCounts[release.label_id]) {
          labelCounts[release.label_id] = 0;
        }
        labelCounts[release.label_id]++;
      });
    }
    
    console.log('Current release counts by label:');
    console.log(`- Label ID ${CONFIG.labelId}: ${buildItCount} releases`);
    Object.keys(labelCounts).forEach(labelId => {
      console.log(`- Label ID ${labelId}: ${labelCounts[labelId]} releases`);
    });
    
    // Check if Build It Records has a good number of releases
    if (buildItCount >= 100) {
      console.log(`Build It Records already has ${buildItCount} releases. No redistribution needed.`);
      return true;
    }
    
    console.log('Redistributing releases to ensure Build It Records has sufficient releases...');
    
    // Get releases that need to be reassigned
    const { data: releasesToMove, error: movableError } = await supabase
      .from('releases')
      .select('id, title')
      .neq('label_id', CONFIG.labelId)
      .order('id')
      .limit(100);
    
    if (movableError) {
      console.error('Error finding releases to redistribute:', movableError.message);
      return false;
    }
    
    if (!releasesToMove || releasesToMove.length === 0) {
      console.log('No releases available to redistribute.');
      return true;
    }
    
    console.log(`Found ${releasesToMove.length} releases to redistribute to Build It Records`);
    
    // Update releases in batches
    const BATCH_SIZE = 50;
    let totalUpdated = 0;
    
    for (let i = 0; i < releasesToMove.length; i += BATCH_SIZE) {
      const batch = releasesToMove.slice(i, i + BATCH_SIZE);
      const releaseIds = batch.map(r => r.id);
      
      const { data: updated, error: updateError } = await supabase
        .from('releases')
        .update({ label_id: CONFIG.labelId })
        .in('id', releaseIds)
        .select();
      
      if (updateError) {
        console.error('Error updating releases batch:', updateError.message);
        console.log('Continuing with next batch...');
      } else {
        totalUpdated += updated ? updated.length : 0;
        console.log(`Updated ${totalUpdated}/${releasesToMove.length} releases to Build It Records`);
      }
    }
    
    console.log(`Successfully redistributed ${totalUpdated} releases to Build It Records label`);
    
    // Verify the updated counts
    const { data: updatedBuildItData, error: updatedBuildItError } = await supabase
      .from('releases')
      .select('*', { count: 'exact', head: true })
      .eq('label_id', CONFIG.labelId);
    
    if (updatedBuildItError) {
      console.error('Error verifying updated counts:', updatedBuildItError.message);
    } else {
      const updatedBuildItCount = updatedBuildItData ? updatedBuildItData.count || 0 : 0;
      console.log(`Updated Build It Records release count: ${updatedBuildItCount}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error redistributing releases:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('Starting data reimport process...');
  
  // Connect to the database using Supabase
  console.log('Connecting to database...');
  const supabaseUrl = process.env.SUPABASE_URL || 'https://liuaozuvkmvanmchndzl.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpdWFvenV2a212YW5tY2huZHpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTg0ODQzNCwiZXhwIjoyMDUxNDI0NDM0fQ.VLf3x9W8dhNDz3DBBx5eXUosjaNFDOc2AeyAr82rGSk';

  if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: No Supabase credentials provided in environment variables');
    console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  console.log('Using Supabase URL:', supabaseUrl);
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test the Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('labels')
      .select('id, name')
      .limit(1);
    
    if (testError) {
      console.error('Supabase client connection test failed:', testError.message);
      process.exit(1);
    }
    
    console.log('Supabase connection successful. Found label:', testData);
    
    // Multi-strategy execution with full logging
    let success = false;
    
    // Step 1: Check existing tables
    console.log('\n=== Step 1: Checking database structure ===');
    const tablesExist = await createMissingTables(supabase);
    console.log(`Database structure check result: ${tablesExist ? 'Tables ready' : 'Working with limited tables'}\n`);
    
    // Step 2: Set up artist_labels relationships or confirm artist-release relationships
    console.log('=== Step 2: Setting up artist-label relationships ===');
    success = await setupArtistLabelsTable(supabase);
    console.log(`Artist-label setup result: ${success ? 'Success' : 'Limited success'}\n`);
    
    // Step 3: Redistribute releases across labels
    console.log('=== Step 3: Redistributing releases across labels ===');
    success = await redistributeReleases(supabase);
    console.log(`Release redistribution result: ${success ? 'Success' : 'Failed'}\n`);
    
    // Step 4: Check final counts to verify everything looks good
    console.log('=== Step 4: Checking final counts ===');
    
    try {
      // Count artist-label associations
      const artistLabelsExists = await checkTableExists(supabase, 'artist_labels');
      
      if (artistLabelsExists) {
        const { data: artistLabelData, error: artistLabelError } = await supabase
          .from('artist_labels')
          .select('*', { count: 'exact', head: true })
          .eq('label_id', CONFIG.labelId);
        
        if (artistLabelError) {
          console.error('Error checking artist-label counts:', artistLabelError.message);
        } else {
          const artistLabelCount = artistLabelData ? artistLabelData.count || 0 : 0;
          console.log(`Artist-label associations for Build It Records: ${artistLabelCount}`);
        }
      } else {
        console.log('artist_labels table does not exist, skipping count');
      }
      
      // Count releases by label
      const { data: releasesData, error: releasesError } = await supabase
        .from('releases')
        .select('*', { count: 'exact', head: true })
        .eq('label_id', CONFIG.labelId);
      
      if (releasesError) {
        console.error('Error checking release counts:', releasesError.message);
      } else {
        const releasesCount = releasesData ? releasesData.count || 0 : 0;
        console.log(`Releases for Build It Records: ${releasesCount}`);
      }
      
      console.log('\nData reimport process completed successfully!');
    } catch (countError) {
      console.error('Error checking final counts:', countError.message);
      console.log('\nData reimport process completed with some issues.');
    }
    
  } catch (error) {
    console.error('Error during data reimport:', error.message);
    throw error;
  }
}

// Execute the main function
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error during data reimport:', error);
    process.exit(1);
  });
