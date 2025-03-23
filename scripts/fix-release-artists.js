const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Using service key to bypass RLS

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.supabase');
  console.log('Current environment variables:');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'defined' : 'undefined');
  console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'defined' : 'undefined');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Get or create an artist for a label
async function getOrCreateArtist(labelId, artistName = null) {
  try {
    // Try to find an existing artist for this label
    const { data: existingArtists, error: queryError } = await supabase
      .from('artists')
      .select('*')
      .eq('label_id', labelId)
      .limit(1);
      
    if (queryError) {
      console.error(`Error querying artists for label ${labelId}:`, queryError);
      return null;
    }
    
    // If we found an artist, use it
    if (existingArtists && existingArtists.length > 0) {
      console.log(`Using existing artist: ${existingArtists[0].name} (${existingArtists[0].id})`);
      return existingArtists[0];
    }
    
    // If no artist was found and no name provided, create a default one
    const defaultName = artistName || `Label ${labelId} Artist`;
    
    // Create a new artist
    const artistData = {
      id: uuidv4(),
      name: defaultName,
      label_id: labelId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newArtist, error: insertError } = await supabase
      .from('artists')
      .insert(artistData)
      .select('*')
      .single();
      
    if (insertError) {
      console.error(`Error creating artist for label ${labelId}:`, insertError);
      return null;
    }
    
    console.log(`Created new artist: ${newArtist.name} (${newArtist.id})`);
    return newArtist;
  } catch (error) {
    console.error('Unexpected error in getOrCreateArtist:', error);
    return null;
  }
}

// Link an artist to a release
async function linkArtistToRelease(releaseId, artistId) {
  try {
    // Check if this relationship already exists
    const { data: existingLinks, error: queryError } = await supabase
      .from('release_artists')
      .select('*')
      .eq('release_id', releaseId)
      .eq('artist_id', artistId);
      
    if (queryError) {
      console.error(`Error checking existing release-artist link:`, queryError);
      return false;
    }
    
    // Skip if already linked
    if (existingLinks && existingLinks.length > 0) {
      console.log(`Artist ${artistId} already linked to release ${releaseId}`);
      return true;
    }
    
    // Create the relationship
    const { error: insertError } = await supabase
      .from('release_artists')
      .insert({
        release_id: releaseId,
        artist_id: artistId,
        role: 'primary',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error(`Error linking artist to release:`, insertError);
      return false;
    }
    
    console.log(`Successfully linked artist ${artistId} to release ${releaseId}`);
    return true;
  } catch (error) {
    console.error('Unexpected error in linkArtistToRelease:', error);
    return false;
  }
}

// Update a release with a primary artist ID
async function updateReleasePrimaryArtist(releaseId, artistId) {
  try {
    const { error } = await supabase
      .from('releases')
      .update({ primary_artist_id: artistId })
      .eq('id', releaseId);
      
    if (error) {
      console.error(`Error updating release primary artist:`, error);
      return false;
    }
    
    console.log(`Set primary artist ${artistId} for release ${releaseId}`);
    return true;
  } catch (error) {
    console.error('Unexpected error in updateReleasePrimaryArtist:', error);
    return false;
  }
}

// Fix releases for a specific label
async function fixReleasesForLabel(labelId) {
  try {
    console.log(`\nFixing releases for label ${labelId}...`);
    
    // Get releases without artists for this label
    const { data: releases, error: queryError } = await supabase
      .from('releases')
      .select('*, release_artists(*)')
      .eq('label_id', labelId);
      
    if (queryError) {
      console.error(`Error querying releases for label ${labelId}:`, queryError);
      return;
    }
    
    if (!releases || releases.length === 0) {
      console.log(`No releases found for label ${labelId}`);
      return;
    }
    
    console.log(`Found ${releases.length} releases for label ${labelId}`);
    
    // Get or create an artist for this label
    const labelArtist = await getOrCreateArtist(labelId);
    if (!labelArtist) {
      console.error(`Could not get or create an artist for label ${labelId}`);
      return;
    }
    
    // Process each release
    for (const release of releases) {
      // Check if this release has any artists
      if (!release.release_artists || release.release_artists.length === 0) {
        console.log(`Release ${release.title} (${release.id}) has no artists. Adding...`);
        
        // Link the label artist to this release
        const linkSuccess = await linkArtistToRelease(release.id, labelArtist.id);
        
        // Update the release's primary artist
        if (linkSuccess) {
          await updateReleasePrimaryArtist(release.id, labelArtist.id);
        }
      } else {
        console.log(`Release ${release.title} already has ${release.release_artists.length} artists. Skipping.`);
      }
    }
    
    console.log(`Completed processing for label ${labelId}`);
  } catch (error) {
    console.error(`Error fixing releases for label ${labelId}:`, error);
  }
}

// Main function
async function main() {
  try {
    // Process each label
    console.log('Starting fix-release-artists script...');
    
    // Fix releases for BuildIt Records (label_id: 1)
    await fixReleasesForLabel('1');
    
    // Fix releases for BuildIt Deep (label_id: 2)
    await fixReleasesForLabel('2');
    
    // Fix releases for BuildIt Tech (label_id: 3)
    await fixReleasesForLabel('3');
    
    console.log('\nScript completed successfully!');
  } catch (error) {
    console.error('Unexpected error in main function:', error);
  }
}

// Run the script
main();
