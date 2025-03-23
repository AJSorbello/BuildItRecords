/**
 * Script to properly assign releases to the correct labels
 * 
 * BuildIt Records = label_id 1
 * BuildIt Deep = label_id 2
 * BuildIt Tech = label_id 3
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

let supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const LABEL_IDS = {
  BUILD_IT_RECORDS: 1,
  BUILD_IT_DEEP: 2,
  BUILD_IT_TECH: 3
};

// Return Deep and Tech releases to their correct labels (swap them back)
const correctLabelAssignments = async () => {
  console.log('Correcting label assignments between BuildIt Deep and BuildIt Tech...');
  
  // First, get the current count of releases by label to see what we're working with
  const { data: techReleases, error: techError } = await supabase
    .from('releases')
    .select('id')
    .eq('label_id', LABEL_IDS.BUILD_IT_TECH);
    
  const { data: deepReleases, error: deepError } = await supabase
    .from('releases')
    .select('id, title')
    .eq('label_id', LABEL_IDS.BUILD_IT_DEEP);
    
  if (techError || deepError) {
    console.error('Error fetching current label counts:', techError || deepError);
    return;
  }
  
  console.log(`Current distribution: ${deepReleases.length} Deep releases, ${techReleases.length} Tech releases`);
  
  // Since we can't use a temporary label that doesn't exist in the labels table,
  // we'll collect all the IDs first, then swap them directly
  
  // Get all the deep release IDs that need to move to tech
  const deepReleaseIds = deepReleases.map(release => release.id);
  
  // Get all tech release IDs that need to move to deep
  const { data: techReleaseData, error: techFetchError } = await supabase
    .from('releases')
    .select('id')
    .eq('label_id', LABEL_IDS.BUILD_IT_TECH);
    
  if (techFetchError) {
    console.error('Error fetching tech releases:', techFetchError);
    return;
  }
  
  const techReleaseIds = techReleaseData.map(release => release.id);
  
  console.log(`Moving ${deepReleaseIds.length} releases from Deep to Tech`);
  console.log(`Moving ${techReleaseIds.length} releases from Tech to Deep`);
  
  // Step 1: Move Deep releases to Tech
  if (deepReleaseIds.length > 0) {
    const { error: moveDeepError } = await supabase
      .from('releases')
      .update({ label_id: LABEL_IDS.BUILD_IT_TECH })
      .in('id', deepReleaseIds);
      
    if (moveDeepError) {
      console.error('Error moving Deep releases to Tech:', moveDeepError);
      return;
    }
    console.log('✅ Successfully moved Deep releases to Tech');
  }
  
  // Step 2: Move Tech releases to Deep
  if (techReleaseIds.length > 0) {
    const { error: moveTechError } = await supabase
      .from('releases')
      .update({ label_id: LABEL_IDS.BUILD_IT_DEEP })
      .in('id', techReleaseIds);
      
    if (moveTechError) {
      console.error('Error moving Tech releases to Deep:', moveTechError);
      return;
    }
    console.log('✅ Successfully moved Tech releases to Deep');
  }
  
  // Get final counts
  const { data: finalTechReleases, error: finalTechError } = await supabase
    .from('releases')
    .select('id')
    .eq('label_id', LABEL_IDS.BUILD_IT_TECH);
    
  const { data: finalDeepReleases, error: finalDeepError } = await supabase
    .from('releases')
    .select('id')
    .eq('label_id', LABEL_IDS.BUILD_IT_DEEP);
    
  if (finalTechError || finalDeepError) {
    console.error('Error fetching final label counts:', finalTechError || finalDeepError);
    return;
  }
  
  console.log(`Final distribution: ${finalDeepReleases.length} Deep releases, ${finalTechReleases.length} Tech releases`);
  console.log('✅ Successfully corrected label assignments');
};

// Main function to run the script
async function main() {
  try {
    // Correct the label assignments
    await correctLabelAssignments();
  } catch (error) {
    console.error('Script error:', error);
  }
}

// Run the script
main()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script error:', err))
  .finally(() => process.exit());
