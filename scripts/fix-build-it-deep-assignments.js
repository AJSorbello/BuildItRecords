/**
 * Script to properly assign releases to Build It Deep
 * including the "Out Of Nowhere" release from Spotify
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

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

// List of releases that MUST be assigned to Build It Deep
// Including "Out Of Nowhere" from Spotify
const confirmedDeepReleaseIds = [
  'df940d13-2c5a-4ba4-8d79-3b39327b0d57', // Out Of Nowhere
];

// Additional deep house style releases to assign to Build It Deep
// to reach our target of 20 releases
const deepHouseReleaseIds = [
  // Releases with deep house characteristics
  '832c0950-f3cd-4aeb-b7e7-89ea4cc2a318', // Afro Dizzy Act
  '73e44221-2fd9-4ddd-b4a0-b89dd75470b4', // Didn't Want To Hurt You (Vocal VIP)
  '06ac2d79-0bff-4b7f-bd6a-e7ab4677e867', // Tribal Is Waiting
  '50505abe-9103-451f-a470-65ed9ee70d53', // Soul Food
  '830eec84-c1b9-4aa4-9534-54ad71a699ee', // Deeper (Radio)
  '93fa5294-fac9-4045-86bc-f7b58d37e62d', // The Way You Groove
  '9a56d074-116a-465d-ad54-d5fb39869e8c', // My Soul / Summer Noise
  'd70abdea-f9da-4663-a7db-d6363fbcceca', // My House
  '3933f7c2-1e8d-4e66-a7af-de99714b96b5', // Dope House
];

async function fixBuildItDeepAssignments() {
  try {
    console.log('Starting Build It Deep label assignment fix...');
    
    // 1. Check current label distribution
    const { data: initialReleases, error: initialError } = await supabase
      .from('releases')
      .select('label_id');
    
    if (initialError) {
      console.error('Error fetching initial releases:', initialError);
      return;
    }
    
    const initialCounts = {
      records: initialReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_RECORDS).length,
      tech: initialReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_TECH).length,
      deep: initialReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_DEEP).length
    };
    
    console.log('Initial label distribution:');
    console.log(`- BUILD IT RECORDS: ${initialCounts.records}`);
    console.log(`- BUILD IT TECH: ${initialCounts.tech}`);
    console.log(`- BUILD IT DEEP: ${initialCounts.deep}`);
    
    // 2. First step: reset all current BUILD IT DEEP releases back to TECH
    if (initialCounts.deep > 0) {
      console.log(`\nResetting ${initialCounts.deep} current Build It Deep releases to Build It Tech...`);
      
      const { error: resetError } = await supabase
        .from('releases')
        .update({ label_id: LABEL_IDS.BUILD_IT_TECH })
        .eq('label_id', LABEL_IDS.BUILD_IT_DEEP);
      
      if (resetError) {
        console.error('Error resetting Deep releases:', resetError);
        return;
      }
      
      console.log('✅ Reset successful');
    }
    
    // 3. Verify the confirmed deep release IDs
    const { data: confirmedReleases, error: confirmedError } = await supabase
      .from('releases')
      .select('id, title, label_id')
      .in('id', confirmedDeepReleaseIds);
    
    if (confirmedError) {
      console.error('Error checking confirmed deep releases:', confirmedError);
      return;
    }
    
    if (confirmedReleases.length < confirmedDeepReleaseIds.length) {
      console.warn(`⚠️ Warning: Only found ${confirmedReleases.length} of ${confirmedDeepReleaseIds.length} confirmed deep releases`);
    }
    
    console.log('\nConfirmed Build It Deep releases:');
    confirmedReleases.forEach((release, index) => {
      const currentLabel = 
        release.label_id === LABEL_IDS.BUILD_IT_RECORDS ? 'BUILD IT RECORDS' :
        release.label_id === LABEL_IDS.BUILD_IT_TECH ? 'BUILD IT TECH' :
        release.label_id === LABEL_IDS.BUILD_IT_DEEP ? 'BUILD IT DEEP' : 'Unknown';
        
      console.log(`${index+1}. "${release.title}" (current label: ${currentLabel})`);
    });
    
    // 4. Check the additional deep house release IDs
    const { data: additionalReleases, error: additionalError } = await supabase
      .from('releases')
      .select('id, title, label_id')
      .in('id', deepHouseReleaseIds);
    
    if (additionalError) {
      console.error('Error checking additional deep house releases:', additionalError);
      return;
    }
    
    console.log('\nAdditional deep house style releases:');
    additionalReleases.forEach((release, index) => {
      const currentLabel = 
        release.label_id === LABEL_IDS.BUILD_IT_RECORDS ? 'BUILD IT RECORDS' :
        release.label_id === LABEL_IDS.BUILD_IT_TECH ? 'BUILD IT TECH' :
        release.label_id === LABEL_IDS.BUILD_IT_DEEP ? 'BUILD IT DEEP' : 'Unknown';
        
      console.log(`${index+1}. "${release.title}" (current label: ${currentLabel})`);
    });
    
    // 5. Combine all releases that should be assigned to Build It Deep
    const allDeepReleaseIds = [
      ...confirmedDeepReleaseIds,
      ...deepHouseReleaseIds
    ];
    
    // Limit to 20 releases if needed
    const finalDeepReleaseIds = allDeepReleaseIds.slice(0, 20);
    
    // 6. Move the releases to BUILD IT DEEP
    console.log(`\nMoving ${finalDeepReleaseIds.length} releases to Build It Deep...`);
    
    const { error: moveError } = await supabase
      .from('releases')
      .update({ label_id: LABEL_IDS.BUILD_IT_DEEP })
      .in('id', finalDeepReleaseIds);
    
    if (moveError) {
      console.error('Error moving releases to Build It Deep:', moveError);
      return;
    }
    
    console.log('✅ Successfully moved releases to Build It Deep');
    
    // 7. Calculate how many more releases we need to reach exactly 20
    const additionalNeeded = 20 - finalDeepReleaseIds.length;
    
    if (additionalNeeded > 0) {
      console.log(`\nNeed ${additionalNeeded} more releases to reach 20 for Build It Deep`);
      
      // Find additional candidates based on deep house keywords
      const deepKeywords = [
        'deep', 'house', 'soul', 'groove', 'chill', 'lounge', 'organic', 
        'jazz', 'vocal', 'melodic', 'soulful'
      ];
      
      const { data: potentialReleases, error: potentialError } = await supabase
        .from('releases')
        .select('id, title, label_id')
        .not('id', 'in', `(${finalDeepReleaseIds.map(id => `'${id}'`).join(',')})`)
        .order('created_at', { ascending: false });
      
      if (potentialError) {
        console.error('Error finding additional releases:', potentialError);
        return;
      }
      
      // Score releases by keywords
      const scoredReleases = potentialReleases.map(release => {
        let score = 0;
        const title = (release.title || '').toLowerCase();
        
        deepKeywords.forEach(keyword => {
          if (title.includes(keyword.toLowerCase())) {
            score += 1;
          }
        });
        
        return { ...release, score };
      });
      
      // Sort by score and take what we need
      const sortedReleases = [...scoredReleases].sort((a, b) => b.score - a.score);
      const additionalReleaseIds = sortedReleases
        .slice(0, additionalNeeded)
        .map(r => r.id);
      
      if (additionalReleaseIds.length > 0) {
        console.log(`Found ${additionalReleaseIds.length} additional releases to assign to Build It Deep`);
        
        const { error: additionalMoveError } = await supabase
          .from('releases')
          .update({ label_id: LABEL_IDS.BUILD_IT_DEEP })
          .in('id', additionalReleaseIds);
        
        if (additionalMoveError) {
          console.error('Error moving additional releases:', additionalMoveError);
        } else {
          console.log('✅ Successfully moved additional releases to Build It Deep');
        }
      }
    }
    
    // 8. Verify final distribution
    const { data: finalReleases, error: finalError } = await supabase
      .from('releases')
      .select('label_id, id, title')
      .eq('label_id', LABEL_IDS.BUILD_IT_DEEP);
    
    if (!finalError) {
      console.log(`\nFinal Build It Deep releases (${finalReleases.length}):`);
      finalReleases.forEach((release, index) => {
        console.log(`${index+1}. "${release.title}" (ID: ${release.id})`);
      });
      
      // Get final counts of all labels
      const { data: allFinalReleases, error: countError } = await supabase
        .from('releases')
        .select('label_id');
      
      if (!countError) {
        const finalCounts = {
          records: allFinalReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_RECORDS).length,
          tech: allFinalReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_TECH).length,
          deep: allFinalReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_DEEP).length
        };
        
        console.log('\nFinal label distribution:');
        console.log(`- BUILD IT RECORDS: ${finalCounts.records}`);
        console.log(`- BUILD IT TECH: ${finalCounts.tech}`);
        console.log(`- BUILD IT DEEP: ${finalCounts.deep}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
(async () => {
  await fixBuildItDeepAssignments();
  process.exit();
})();
