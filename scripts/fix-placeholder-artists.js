/**
 * Script to fix placeholder artist associations
 * 
 * This script replaces references to placeholder artists like "Label 3 Artist" and "BURNTECH"
 * with proper artist associations or "Various Artists" designation.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env file
console.log('Checking environment variables...');
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.log('Loading environment variables from .env file...');
  require('dotenv').config({ path: './.env' });
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Placeholder artist IDs identified from analysis
const PLACEHOLDER_ARTIST_IDS = [
  '964caf84-1350-40ab-9989-8cd4c8a5f6a7', // "Label 3 Artist"
  '2l9bjRfEhr9BleTsYAJ4kc'                // "BURNTECH"
];

/**
 * Fix releases with placeholder artists
 */
async function fixPlaceholderArtists() {
  try {
    console.log('Starting placeholder artist fix...');
    
    // Get all releases associated with placeholder artists through the junction table
    const { data: problematicAssociations, error: assocError } = await supabase
      .from('release_artists')
      .select('*')
      .in('artist_id', PLACEHOLDER_ARTIST_IDS);
      
    if (assocError) {
      console.error('Error fetching problematic associations:', assocError);
      return;
    }
    
    console.log(`Found ${problematicAssociations.length} associations with placeholder artists`);
    
    // Get unique release IDs that have placeholder artists
    const affectedReleaseIds = [...new Set(problematicAssociations.map(a => a.release_id))];
    console.log(`These affect ${affectedReleaseIds.length} unique releases`);
    
    // Get complete data for affected releases
    const { data: affectedReleases, error: releasesError } = await supabase
      .from('releases')
      .select('*')
      .in('id', affectedReleaseIds);
      
    if (releasesError) {
      console.error('Error fetching affected releases:', releasesError);
      return;
    }
    
    // Process each affected release
    let fixCount = 0;
    for (const release of affectedReleases) {
      console.log(`\nProcessing release: "${release.title}" (ID: ${release.id})`);
      
      // Check if this release has associations with non-placeholder artists
      const { data: otherArtists, error: otherArtistsError } = await supabase
        .from('release_artists')
        .select('artist_id')
        .eq('release_id', release.id)
        .not('artist_id', 'in', `(${PLACEHOLDER_ARTIST_IDS.join(',')})`);
        
      if (otherArtistsError) {
        console.error(`Error checking other artists for release ${release.id}:`, otherArtistsError);
        continue;
      }
      
      // Strategy: If release has other legitimate artists, remove the placeholder associations
      if (otherArtists && otherArtists.length > 0) {
        console.log(`Release has ${otherArtists.length} legitimate artists. Removing placeholder associations...`);
        
        // Delete placeholder artist associations
        const { error: deleteError } = await supabase
          .from('release_artists')
          .delete()
          .eq('release_id', release.id)
          .in('artist_id', PLACEHOLDER_ARTIST_IDS);
          
        if (deleteError) {
          console.error(`Error removing placeholder artists for release ${release.id}:`, deleteError);
        } else {
          console.log(`✅ Successfully removed placeholder artists for release ${release.id}`);
          fixCount++;
        }
      } else {
        // This release only has placeholder artists - consider creating a "Various Artists" entry
        // or keeping one but renaming it to something more appropriate
        console.log(`Release has only placeholder artists - consider manual review`);
        
        // For demo purposes, we'd print these out but not automatically modify them
        // as they need human review
        console.log(`⚠️ Release "${release.title}" (ID: ${release.id}) needs manual review - only has placeholder artists`);
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Processed ${affectedReleases.length} releases with placeholder artists`);
    console.log(`Successfully fixed ${fixCount} releases by removing placeholder associations`);
    console.log(`${affectedReleases.length - fixCount} releases may need manual review`);
    
  } catch (error) {
    console.error('Error in fixPlaceholderArtists:', error);
  }
}

// Run the script
(async () => {
  try {
    await fixPlaceholderArtists();
  } catch (error) {
    console.error('Script execution error:', error);
  } finally {
    console.log('\nScript completed');
    process.exit();
  }
})();
