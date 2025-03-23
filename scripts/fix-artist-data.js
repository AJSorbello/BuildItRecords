/**
 * Script to identify and fix issues with artist data in releases
 * 
 * This script addresses issues where releases display "Label 3 Artist" 
 * or "BURNTECH" instead of the actual artist names
 */

require('dotenv').config({ path: '../.env.supabase' });
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Check if env variables are correctly loaded
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Loaded' : 'Missing');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Loaded' : 'Missing');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.log('Loading environment variables using full path...');
  require('dotenv').config({ path: '/Users/ajsorbello/Documents/MyWebPortfolio/BuildItRecords/.env.supabase' });
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Constants for label IDs
const LABEL_IDS = {
  BUILD_IT_RECORDS: 1,
  BUILD_IT_DEEP: 2,
  BUILD_IT_TECH: 3
};

/**
 * Analyze the artist associations in the database
 */
async function analyzeArtistData() {
  try {
    console.log('Analyzing artist-release associations...');
    
    // First, get all releases to analyze
    const { data: allReleases, error: releasesError } = await supabase
      .from('releases')
      .select('id, title, label_id');
    
    if (releasesError) {
      console.error('Error fetching releases:', releasesError);
      return;
    }
    
    console.log(`Found ${allReleases.length} total releases`);
    
    // Get data from the release_artists junction table to see the associations
    const { data: releaseArtistLinks, error: linksError } = await supabase
      .from('release_artists')
      .select('*');
    
    if (linksError) {
      console.error('Error fetching release_artists links:', linksError);
      return;
    }
    
    console.log(`Found ${releaseArtistLinks.length} release-artist associations in the junction table`);
    
    // Get all artists 
    const { data: allArtists, error: artistsError } = await supabase
      .from('artists')
      .select('*');
    
    if (artistsError) {
      console.error('Error fetching artists:', artistsError);
      return;
    }
    
    console.log(`Found ${allArtists.length} artists in the database`);
    
    // Create a map of release ID to artist IDs from the junction table
    const releaseToArtistMap = {};
    releaseArtistLinks.forEach(link => {
      if (!releaseToArtistMap[link.release_id]) {
        releaseToArtistMap[link.release_id] = [];
      }
      releaseToArtistMap[link.release_id].push(link.artist_id);
    });
    
    // Create a map of artist ID to artist data
    const artistMap = {};
    allArtists.forEach(artist => {
      artistMap[artist.id] = artist;
    });
    
    // Analyze releases with missing artist associations
    const releasesWithNoArtists = allReleases.filter(release => 
      !releaseToArtistMap[release.id] || releaseToArtistMap[release.id].length === 0
    );
    
    console.log(`\nAnalysis Results:`);
    console.log(`- ${releasesWithNoArtists.length} releases have no artist associations`);
    
    if (releasesWithNoArtists.length > 0) {
      console.log('\nReleases with no associated artists:');
      releasesWithNoArtists.slice(0, 10).forEach(release => {
        console.log(`- "${release.title}" (ID: ${release.id}, Label: ${release.label_id})`);
      });
      
      if (releasesWithNoArtists.length > 10) {
        console.log(`... and ${releasesWithNoArtists.length - 10} more`);
      }
    }
    
    // Check for the placeholder artist names in the database
    const placeholderArtists = allArtists.filter(artist => 
      artist.name === 'Label 3 Artist' || artist.name === 'BURNTECH'
    );
    
    console.log(`\n- ${placeholderArtists.length} placeholder artists found in the database`);
    
    if (placeholderArtists.length > 0) {
      console.log('\nPlaceholder artists:');
      placeholderArtists.forEach(artist => {
        console.log(`- "${artist.name}" (ID: ${artist.id})`);
      });
      
      // Count how many releases use these placeholder artists
      let releasesWithPlaceholders = 0;
      Object.keys(releaseToArtistMap).forEach(releaseId => {
        if (releaseToArtistMap[releaseId].some(artistId => 
          placeholderArtists.some(pa => pa.id === artistId)
        )) {
          releasesWithPlaceholders++;
        }
      });
      
      console.log(`\n- ${releasesWithPlaceholders} releases use placeholder artists`);
    }
    
    // Find default artist for each label
    for (const labelId of Object.values(LABEL_IDS)) {
      // Get artists most frequently associated with this label
      const artistFrequency = {};
      
      // Filter releases by label
      const labelReleases = allReleases.filter(r => r.label_id === labelId);
      
      // Count artist frequencies for this label
      labelReleases.forEach(release => {
        const artistIds = releaseToArtistMap[release.id] || [];
        artistIds.forEach(artistId => {
          artistFrequency[artistId] = (artistFrequency[artistId] || 0) + 1;
        });
      });
      
      // Find most frequent artists
      const sortedArtists = Object.entries(artistFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      console.log(`\nMost common artists for Label ${labelId}:`);
      sortedArtists.forEach(([artistId, count]) => {
        const artist = artistMap[artistId];
        if (artist) {
          console.log(`- "${artist.name}" (ID: ${artistId}) - used in ${count} releases`);
        }
      });
    }
    
    // Suggest remediation steps
    console.log('\nRecommended Actions:');
    console.log('1. Update the database schema and queries to properly join releases with artists through the junction table');
    console.log('2. Modify the UI components to correctly display artist names fetched from the relationship');
    console.log('3. Consider replacing placeholder artists with actual artist data or a generic "Various Artists" label');
    
  } catch (error) {
    console.error('Error in analyzeArtistData:', error);
  }
}

// Run the main function
(async () => {
  try {
    await analyzeArtistData();
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    console.log('\nScript completed');
    process.exit();
  }
})();
