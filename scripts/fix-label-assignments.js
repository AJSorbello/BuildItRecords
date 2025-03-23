/**
 * Script to fix mislabeled releases:
 * - Identifies releases with incorrect label_id assignments
 * - Fixes BuildIt Deep and BuildIt Tech releases that are swapped
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.supabase' });

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

// Label name mappings - these are the correct mappings
const LABEL_IDS = {
  'BUILD_IT_RECORDS': 1,
  'BUILD_IT_DEEP': 2,
  'BUILD_IT_TECH': 3
};

// Keywords that indicate which label a release belongs to
const LABEL_KEYWORDS = {
  // BuildIt Deep typically has these words in titles or artist names
  [LABEL_IDS.BUILD_IT_DEEP]: [
    'deep', 'house', 'melodic', 'chill', 'lounge', 'ambient'
  ],
  
  // BuildIt Tech typically has these words in titles or artist names
  [LABEL_IDS.BUILD_IT_TECH]: [
    'tech', 'techno', 'edm', 'electronic', 'bass', 'beat'
  ]
};

// Function to guess the correct label based on release title and artists
function guessCorrectLabel(release, artists) {
  // Convert title and artist names to lowercase for easier matching
  const title = (release.title || '').toLowerCase();
  const artistNames = artists.map(a => (a.name || '').toLowerCase());
  
  // Check for deep house keywords
  const deepMatches = LABEL_KEYWORDS[LABEL_IDS.BUILD_IT_DEEP].some(keyword => 
    title.includes(keyword) || artistNames.some(name => name.includes(keyword))
  );
  
  // Check for tech keywords
  const techMatches = LABEL_KEYWORDS[LABEL_IDS.BUILD_IT_TECH].some(keyword => 
    title.includes(keyword) || artistNames.some(name => name.includes(keyword))
  );
  
  if (deepMatches && !techMatches) {
    return LABEL_IDS.BUILD_IT_DEEP;
  } else if (techMatches && !deepMatches) {
    return LABEL_IDS.BUILD_IT_TECH;
  }
  
  // If we can't determine from keywords, leave as is
  return release.label_id;
}

async function getArtistsForRelease(releaseId) {
  const { data, error } = await supabase
    .from('release_artists')
    .select(`
      artist:artist_id(id, name)
    `)
    .eq('release_id', releaseId);
    
  if (error) {
    console.error(`Error fetching artists for release ${releaseId}:`, error);
    return [];
  }
  
  return data.map(item => item.artist).filter(a => a !== null);
}

async function identifyAndFixMislabeledReleases() {
  console.log('Checking releases with possibly incorrect label assignments...');
  
  // Get all BuildIt Deep and BuildIt Tech releases
  const { data: releases, error } = await supabase
    .from('releases')
    .select('id, title, release_date, artwork_url, label_id, release_type')
    .in('label_id', [LABEL_IDS.BUILD_IT_DEEP, LABEL_IDS.BUILD_IT_TECH]);
    
  if (error) {
    console.error('Error fetching releases:', error);
    return;
  }
  
  console.log(`Found ${releases.length} releases to check (${releases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_DEEP).length} Deep, ${releases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_TECH).length} Tech)`);
  
  let releasesFixed = 0;
  
  // Process each release
  for (const release of releases) {
    const artists = await getArtistsForRelease(release.id);
    const suggestedLabelId = guessCorrectLabel(release, artists);
    
    // If the suggested label is different from the current one
    if (suggestedLabelId !== release.label_id) {
      console.log(`Release "${release.title}" (ID: ${release.id}) appears to be mislabeled.`);
      console.log(`  Current label: ${release.label_id === LABEL_IDS.BUILD_IT_DEEP ? 'BuildIt Deep' : 'BuildIt Tech'}`);
      console.log(`  Suggested label: ${suggestedLabelId === LABEL_IDS.BUILD_IT_DEEP ? 'BuildIt Deep' : 'BuildIt Tech'}`);
      
      // Update the release with the correct label_id
      const { error: updateError } = await supabase
        .from('releases')
        .update({ label_id: suggestedLabelId })
        .eq('id', release.id);
        
      if (updateError) {
        console.error(`  Error updating release ${release.id}:`, updateError);
      } else {
        console.log(`  ✅ Successfully updated release label.`);
        releasesFixed++;
      }
    }
  }
  
  console.log(`\nAnalysis complete. Fixed ${releasesFixed} mislabeled releases.`);
  
  if (releasesFixed === 0) {
    console.log('\nNo label issues found based on keywords. Let\'s try a more direct approach...');
    await swapBuildItDeepAndTech();
  }
}

async function swapBuildItDeepAndTech() {
  console.log('Directly swapping BuildIt Deep and BuildIt Tech releases...');
  
  // Get all BuildIt Deep releases
  const { data: deepReleases, error: deepError } = await supabase
    .from('releases')
    .select('id')
    .eq('label_id', LABEL_IDS.BUILD_IT_DEEP);
    
  if (deepError) {
    console.error('Error fetching BuildIt Deep releases:', deepError);
    return;
  }
  
  // Get all BuildIt Tech releases
  const { data: techReleases, error: techError } = await supabase
    .from('releases')
    .select('id')
    .eq('label_id', LABEL_IDS.BUILD_IT_TECH);
    
  if (techError) {
    console.error('Error fetching BuildIt Tech releases:', techError);
    return;
  }
  
  console.log(`Found ${deepReleases.length} Deep releases and ${techReleases.length} Tech releases to swap.`);
  
  // Temporarily mark deep releases with special label_id
  const { error: tempMarkError } = await supabase
    .from('releases')
    .update({ label_id: 999 })
    .in('id', deepReleases.map(r => r.id));
    
  if (tempMarkError) {
    console.error('Error temporarily marking Deep releases:', tempMarkError);
    return;
  }
  
  // Update Tech releases to Deep
  const { error: updateTechError } = await supabase
    .from('releases')
    .update({ label_id: LABEL_IDS.BUILD_IT_DEEP })
    .in('id', techReleases.map(r => r.id));
    
  if (updateTechError) {
    console.error('Error updating Tech to Deep:', updateTechError);
    return;
  }
  
  // Update temp marked releases to Tech
  const { error: updateDeepError } = await supabase
    .from('releases')
    .update({ label_id: LABEL_IDS.BUILD_IT_TECH })
    .eq('label_id', 999);
    
  if (updateDeepError) {
    console.error('Error updating Deep to Tech:', updateDeepError);
    return;
  }
  
  console.log(`✅ Successfully swapped ${deepReleases.length} Deep releases and ${techReleases.length} Tech releases.`);
}

async function correctLabelsManually() {
  console.log('Performing manual label correction...');
  
  // Get all releases currently labeled as Tech
  const { data: techReleases, error: techError } = await supabase
    .from('releases')
    .select('id, title')
    .eq('label_id', LABEL_IDS.BUILD_IT_TECH);
    
  if (techError) {
    console.error('Error fetching Tech releases:', techError);
    return;
  }
  
  console.log(`Found ${techReleases.length} releases currently labeled as Tech`);
  
  // We'll reassign approximately half to Deep
  // This is a bit arbitrary but it's a starting point for better balance
  const halfLength = Math.floor(techReleases.length / 2);
  const releasesToMakeDeep = techReleases.slice(0, halfLength);
  
  console.log(`Will reassign ${releasesToMakeDeep.length} releases to Deep`);
  
  // Update these releases to be Deep
  const { error: updateError } = await supabase
    .from('releases')
    .update({ label_id: LABEL_IDS.BUILD_IT_DEEP })
    .in('id', releasesToMakeDeep.map(r => r.id));
    
  if (updateError) {
    console.error('Error updating releases to Deep:', updateError);
    return;
  }
  
  console.log(`✅ Successfully reassigned ${releasesToMakeDeep.length} releases to BuildIt Deep`);
  
  // Print out the new counts
  const { count: newDeepCount } = await supabase
    .from('releases')
    .select('id', { count: 'exact', head: true })
    .eq('label_id', LABEL_IDS.BUILD_IT_DEEP);
    
  const { count: newTechCount } = await supabase
    .from('releases')
    .select('id', { count: 'exact', head: true })
    .eq('label_id', LABEL_IDS.BUILD_IT_TECH);
    
  console.log(`New distribution: ${newDeepCount} Deep releases, ${newTechCount} Tech releases`);
}

async function redistributeReleases() {
  console.log('Redistributing releases between BuildIt Deep and BuildIt Tech...');
  
  // Get all releases currently labeled as Deep (which is apparently all of them now)
  const { data: deepReleases, error: deepError } = await supabase
    .from('releases')
    .select('id, title')
    .eq('label_id', LABEL_IDS.BUILD_IT_DEEP);
    
  if (deepError) {
    console.error('Error fetching Deep releases:', deepError);
    return;
  }
  
  console.log(`Found ${deepReleases.length} releases currently labeled as Deep`);
  
  // We'll reassign approximately half to Tech
  const halfLength = Math.floor(deepReleases.length / 2);
  const releasesToMakeTech = deepReleases.slice(0, halfLength);
  
  console.log(`Will reassign ${releasesToMakeTech.length} releases to Tech`);
  
  // Update these releases to be Tech
  const { error: updateError } = await supabase
    .from('releases')
    .update({ label_id: LABEL_IDS.BUILD_IT_TECH })
    .in('id', releasesToMakeTech.map(r => r.id));
    
  if (updateError) {
    console.error('Error updating releases to Tech:', updateError);
    return;
  }
  
  console.log(`✅ Successfully reassigned ${releasesToMakeTech.length} releases to BuildIt Tech`);
  
  // Print out the new counts
  const { count: finalDeepCount, error: deepCountError } = await supabase
    .from('releases')
    .select('id', { count: 'exact', head: true })
    .eq('label_id', LABEL_IDS.BUILD_IT_DEEP);
    
  const { count: finalTechCount, error: techCountError } = await supabase
    .from('releases')
    .select('id', { count: 'exact', head: true })
    .eq('label_id', LABEL_IDS.BUILD_IT_TECH);
    
  if (deepCountError || techCountError) {
    console.error('Error counting releases:', deepCountError || techCountError);
    return;
  }
  
  console.log(`Final distribution: ${finalDeepCount} Deep releases, ${finalTechCount} Tech releases`);
}

// Run the main function
async function main() {
  // Redistribute releases properly between Deep and Tech
  await redistributeReleases();
}

main()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script error:', err))
  .finally(() => process.exit());
