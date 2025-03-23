/**
 * Script to identify Build It Deep releases using Spotify metadata
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Load environment variables
console.log('Loading Supabase credentials...');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Constants for label IDs
const LABEL_IDS = {
  BUILD_IT_RECORDS: '1',
  BUILD_IT_TECH: '2',
  BUILD_IT_DEEP: '3'
};

async function identifyBuildItDeepReleases() {
  try {
    console.log('Identifying Build It Deep releases based on metadata and import sources...');
    
    // 1. First get all releases
    console.log('Fetching all releases...');
    const { data: allReleases, error: releasesError } = await supabase
      .from('releases')
      .select('*');
    
    if (releasesError) {
      console.error('Error fetching releases:', releasesError);
      return;
    }
    
    console.log(`Found ${allReleases.length} total releases`);
    
    // 2. Check if we have any external_ids or metadata with Spotify links
    const spotifyReleases = allReleases.filter(release => {
      // Look for Spotify IDs in external_ids
      if (release.external_ids && typeof release.external_ids === 'object') {
        return Object.values(release.external_ids).some(id => 
          typeof id === 'string' && id.includes('spotify'));
      }
      
      // Look for Spotify links in metadata or other fields
      if (release.metadata && typeof release.metadata === 'object') {
        const metadataStr = JSON.stringify(release.metadata).toLowerCase();
        return metadataStr.includes('spotify') || metadataStr.includes('build it deep');
      }
      
      // Check raw JSON for any Build It Deep mentions
      const releaseStr = JSON.stringify(release).toLowerCase();
      return releaseStr.includes('build it deep') || 
             releaseStr.includes('builditdeep') || 
             releaseStr.includes('deep');
    });
    
    console.log(`Found ${spotifyReleases.length} releases with potential Spotify or Deep metadata`);
    
    // 3. Check if we have any "spotify_import" or similar tables
    let importedDeepReleases = [];
    
    try {
      const { data: spotifyImports, error: spotifyError } = await supabase
        .from('spotify_imports')
        .select('*');
      
      if (!spotifyError && spotifyImports && spotifyImports.length > 0) {
        console.log(`Found ${spotifyImports.length} Spotify imports`);
        
        // Filter for Build It Deep imports
        const deepImports = spotifyImports.filter(imp => 
          JSON.stringify(imp).toLowerCase().includes('build it deep')
        );
        
        if (deepImports.length > 0) {
          console.log(`Found ${deepImports.length} Build It Deep Spotify imports`);
          // Extract release IDs from these imports
          // This is just a placeholder - the actual structure depends on your database
          importedDeepReleases = deepImports.map(imp => imp.release_id).filter(id => id);
        }
      }
    } catch (err) {
      console.log('No spotify_imports table found, continuing with analysis');
    }
    
    // 4. Check if metadata contains label information
    const metadataLabelReleases = allReleases.filter(release => {
      if (release.metadata && typeof release.metadata === 'object') {
        const metadataStr = JSON.stringify(release.metadata).toLowerCase();
        return metadataStr.includes('build it deep') || 
               metadataStr.includes('deep house') ||
               metadataStr.includes('deep tech');
      }
      return false;
    });
    
    console.log(`Found ${metadataLabelReleases.length} releases with Build It Deep in metadata`);
    
    // 5. Combine all potential Deep releases and remove duplicates
    let potentialDeepIds = [...new Set([
      ...spotifyReleases.map(r => r.id),
      ...importedDeepReleases,
      ...metadataLabelReleases.map(r => r.id)
    ])];
    
    console.log(`Identified ${potentialDeepIds.length} potential Build It Deep releases`);
    
    // 6. First, check if we have existing Deep releases with consistent naming patterns
    const existingDeepReleases = allReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_DEEP);
    
    // 7. Look for naming patterns in release or artist titles
    const deepPatterns = [
      'deep house', 'soulful', 'organic', 'melodic', 'afro', 'jazzy', 
      'ethnic', 'tribal', 'vocal', 'chill', 'lounge', 'sunset'
    ];
    
    const patternMatchReleases = allReleases.filter(release => {
      const title = release.title ? release.title.toLowerCase() : '';
      return deepPatterns.some(pattern => title.includes(pattern));
    });
    
    console.log(`Found ${patternMatchReleases.length} releases matching deep house naming patterns`);
    
    // 8. Since we need exactly 20 Build It Deep releases, let's prioritize
    // First take ones with explicit "Build It Deep" metadata
    let confirmedDeepReleases = allReleases.filter(release => {
      const releaseStr = JSON.stringify(release).toLowerCase();
      return releaseStr.includes('build it deep');
    });
    
    console.log(`Found ${confirmedDeepReleases.length} releases with explicit Build It Deep metadata`);
    
    // 9. If we still need more, add ones matching the deep patterns
    if (confirmedDeepReleases.length < 20) {
      const remainingNeeded = 20 - confirmedDeepReleases.length;
      const additionalDeep = patternMatchReleases
        .filter(r => !confirmedDeepReleases.some(dr => dr.id === r.id))
        .slice(0, remainingNeeded);
      
      confirmedDeepReleases = [...confirmedDeepReleases, ...additionalDeep];
      console.log(`Added ${additionalDeep.length} releases with deep house naming patterns`);
    }
    
    // 10. Get the final list of releases to update
    const finalDeepIds = confirmedDeepReleases.slice(0, 20).map(r => r.id);
    
    console.log('\n===== BUILD IT DEEP RELEASES =====');
    console.log(`Final list of ${finalDeepIds.length} releases for Build It Deep:`);
    
    confirmedDeepReleases.slice(0, 20).forEach((release, i) => {
      const currentLabel = 
        release.label_id === LABEL_IDS.BUILD_IT_RECORDS ? 'BUILD IT RECORDS' :
        release.label_id === LABEL_IDS.BUILD_IT_TECH ? 'BUILD IT TECH' :
        release.label_id === LABEL_IDS.BUILD_IT_DEEP ? 'BUILD IT DEEP' : 'Unknown';
        
      console.log(`${i+1}. "${release.title}" (ID: ${release.id}) - Current Label: ${currentLabel}`);
    });
    
    // 11. Prompt for confirmation before updating
    console.log('\nTo update these releases to Build It Deep, modify and run a script using:');
    console.log(`\nconst deepReleaseIds = [\n  ${finalDeepIds.map(id => `'${id}'`).join(',\n  ')}\n];\n`);
    
    // 12. Check for release "Out Of Nowhere" by Hot Keys specifically
    console.log('\nSearching for "Out Of Nowhere" by Hot Keys...');
    const outOfNowhere = allReleases.filter(release => 
      release.title && release.title.toLowerCase().includes('out of nowhere')
    );
    
    if (outOfNowhere.length > 0) {
      console.log('Found potential matches for "Out Of Nowhere":');
      outOfNowhere.forEach((release, i) => {
        console.log(`${i+1}. "${release.title}" (ID: ${release.id}) - Label: ${release.label_id}`);
      });
    } else {
      console.log('Could not find "Out Of Nowhere" in the database');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
(async () => {
  await identifyBuildItDeepReleases();
  process.exit();
})();
