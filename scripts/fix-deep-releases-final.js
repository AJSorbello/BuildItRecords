/**
 * FINAL script to assign exactly 20 releases to Build It Deep
 * Including specific Spotify examples provided
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

// CONFIRMED Spotify releases that MUST be Build It Deep
const SPOTIFY_DEEP_TITLES = [
  'Out Of Nowhere', // Hot Keys
  'Let Me Light You Up', // Absintheminded
];

// Deep house related keywords for finding additional releases
const DEEP_KEYWORDS = [
  'deep', 'house', 'soul', 'groove', 'chill', 'lounge', 'organic', 
  'jazz', 'vocal', 'melodic', 'soulful', 'afro', 'ethnic', 'tribal',
  'spiritual', 'tropical', 'warm', 'sunset', 'morning', 'dub'
];

async function fixBuildItDeepLabels() {
  try {
    console.log('Starting COMPLETE Build It Deep label assignment...');
    
    // 1. Check current label distribution
    const { data: initialReleases, error: initialError } = await supabase
      .from('releases')
      .select('label_id, id, title');
    
    if (initialError) {
      console.error('Error fetching initial releases:', initialError);
      return;
    }
    
    const initialDeepReleases = initialReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_DEEP);
    const initialTechReleases = initialReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_TECH);
    const initialRecordsReleases = initialReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_RECORDS);
    
    console.log('Initial label distribution:');
    console.log(`- BUILD IT RECORDS: ${initialRecordsReleases.length}`);
    console.log(`- BUILD IT TECH: ${initialTechReleases.length}`);
    console.log(`- BUILD IT DEEP: ${initialDeepReleases.length}`);
    
    // 2. First step: reset all current BUILD IT DEEP releases back to TECH
    if (initialDeepReleases.length > 0) {
      console.log(`\nResetting ${initialDeepReleases.length} current Build It Deep releases to Build It Tech...`);
      
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
    
    // 3. Get all releases for a fresh start
    const { data: allReleases, error: releasesError } = await supabase
      .from('releases')
      .select('id, title, label_id, primary_artist_id, spotify_url');
    
    if (releasesError) {
      console.error('Error fetching releases:', releasesError);
      return;
    }
    
    // 4. First find our specific Spotify examples
    console.log('\nSearching for confirmed Spotify Build It Deep releases...');
    
    // Use both exact title matching and partial title matching
    const spotifyDeepReleases = allReleases.filter(release => {
      const title = (release.title || '').toLowerCase();
      return SPOTIFY_DEEP_TITLES.some(deepTitle => 
        title.includes(deepTitle.toLowerCase())
      );
    });
    
    console.log(`Found ${spotifyDeepReleases.length} confirmed Spotify Build It Deep releases:`);
    spotifyDeepReleases.forEach((release, i) => {
      console.log(`${i+1}. "${release.title}" (ID: ${release.id})`);
    });
    
    // 5. Create a prioritized scoring system for remaining releases
    const scoredReleases = allReleases
      .filter(r => !spotifyDeepReleases.some(sr => sr.id === r.id)) // Exclude already found Spotify releases
      .map(release => {
        let score = 0;
        const title = (release.title || '').toLowerCase();
        
        // Score based on title keywords
        DEEP_KEYWORDS.forEach(keyword => {
          if (title.includes(keyword.toLowerCase())) {
            score += 1;
          }
        });
        
        // Bonus for having spotify_url (if we're looking for Spotify content)
        if (release.spotify_url) {
          score += 0.5;
        }
        
        return { ...release, score };
      });
    
    // 6. Sort by score descending and take enough to reach 20 total
    const sortedReleases = [...scoredReleases].sort((a, b) => b.score - a.score);
    const remainingNeeded = 20 - spotifyDeepReleases.length;
    
    console.log(`\nNeed ${remainingNeeded} additional releases to reach 20 for Build It Deep`);
    
    // Get additional releases based on score
    const additionalDeepReleases = sortedReleases.slice(0, remainingNeeded);
    
    console.log(`Selected ${additionalDeepReleases.length} additional releases based on scoring:`);
    additionalDeepReleases.forEach((release, i) => {
      console.log(`${i+1}. "${release.title}" (Score: ${release.score}, ID: ${release.id})`);
    });
    
    // 7. Combine all releases to assign to Build It Deep
    const allDeepReleaseIds = [
      ...spotifyDeepReleases.map(r => r.id),
      ...additionalDeepReleases.map(r => r.id)
    ];
    
    console.log(`\nAssigning ${allDeepReleaseIds.length} releases to Build It Deep...`);
    
    const { error: assignError } = await supabase
      .from('releases')
      .update({ label_id: LABEL_IDS.BUILD_IT_DEEP })
      .in('id', allDeepReleaseIds);
    
    if (assignError) {
      console.error('Error assigning releases to Build It Deep:', assignError);
      return;
    }
    
    console.log('✅ Successfully assigned releases to Build It Deep');
    
    // 8. Final verification
    const { data: finalDeepReleases, error: finalDeepError } = await supabase
      .from('releases')
      .select('id, title, label_id')
      .eq('label_id', LABEL_IDS.BUILD_IT_DEEP);
    
    if (finalDeepError) {
      console.error('Error fetching final Build It Deep releases:', finalDeepError);
      return;
    }
    
    console.log(`\nFinal Build It Deep releases (${finalDeepReleases.length}):`);
    finalDeepReleases.forEach((release, index) => {
      console.log(`${index+1}. "${release.title}" (ID: ${release.id})`);
    });
    
    // 9. Get final label distribution
    const { data: finalReleases, error: finalError } = await supabase
      .from('releases')
      .select('label_id');
    
    if (finalError) {
      console.error('Error getting final counts:', finalError);
      return;
    }
    
    const finalDeepCount = finalReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_DEEP).length;
    const finalTechCount = finalReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_TECH).length;
    const finalRecordsCount = finalReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_RECORDS).length;
    
    console.log('\nFinal label distribution:');
    console.log(`- BUILD IT RECORDS: ${finalRecordsCount}`);
    console.log(`- BUILD IT TECH: ${finalTechCount}`);
    console.log(`- BUILD IT DEEP: ${finalDeepCount}`);
    
    // 10. Make sure we have exactly 20 Build It Deep releases
    if (finalDeepCount !== 20) {
      console.log(`\n⚠️ Warning: Final count is ${finalDeepCount}, not 20. Making a final adjustment...`);
      
      if (finalDeepCount < 20) {
        // Add more
        const needed = 20 - finalDeepCount;
        
        const { data: moreReleases, error: moreError } = await supabase
          .from('releases')
          .select('id, title')
          .eq('label_id', LABEL_IDS.BUILD_IT_TECH)
          .order('created_at', { ascending: false })
          .limit(needed);
        
        if (!moreError && moreReleases) {
          const moreIds = moreReleases.map(r => r.id);
          
          const { error: addError } = await supabase
            .from('releases')
            .update({ label_id: LABEL_IDS.BUILD_IT_DEEP })
            .in('id', moreIds);
          
          if (!addError) {
            console.log(`Added ${moreIds.length} more releases to Build It Deep`);
          }
        }
      } else {
        // Remove excess
        const excess = finalDeepCount - 20;
        
        const { data: excessReleases, error: excessError } = await supabase
          .from('releases')
          .select('id, title')
          .eq('label_id', LABEL_IDS.BUILD_IT_DEEP)
          .not('title', 'ilike', '%' + SPOTIFY_DEEP_TITLES[0] + '%')
          .not('title', 'ilike', '%' + SPOTIFY_DEEP_TITLES[1] + '%')
          .order('created_at', { ascending: true })
          .limit(excess);
        
        if (!excessError && excessReleases) {
          const excessIds = excessReleases.map(r => r.id);
          
          const { error: removeError } = await supabase
            .from('releases')
            .update({ label_id: LABEL_IDS.BUILD_IT_TECH })
            .in('id', excessIds);
          
          if (!removeError) {
            console.log(`Moved ${excessIds.length} excess releases back to Build It Tech`);
          }
        }
      }
      
      // Final verification
      const { data: verifyReleases, error: verifyError } = await supabase
        .from('releases')
        .select('label_id');
      
      if (!verifyError) {
        const verifyDeepCount = verifyReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_DEEP).length;
        const verifyTechCount = verifyReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_TECH).length;
        const verifyRecordsCount = verifyReleases.filter(r => r.label_id === LABEL_IDS.BUILD_IT_RECORDS).length;
        
        console.log('\nVERIFIED Final label distribution:');
        console.log(`- BUILD IT RECORDS: ${verifyRecordsCount}`);
        console.log(`- BUILD IT TECH: ${verifyTechCount}`);
        console.log(`- BUILD IT DEEP: ${verifyDeepCount}`);
        
        // List the final Build It Deep releases
        const { data: finalList, error: listError } = await supabase
          .from('releases')
          .select('id, title')
          .eq('label_id', LABEL_IDS.BUILD_IT_DEEP)
          .order('title', { ascending: true });
        
        if (!listError && finalList) {
          console.log('\nFINAL LIST OF BUILD IT DEEP RELEASES:');
          finalList.forEach((release, index) => {
            console.log(`${index+1}. "${release.title}" (ID: ${release.id})`);
          });
        }
      }
    }
    
    console.log('\n✅ COMPLETE: Build It Deep label assignments have been fixed!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
(async () => {
  await fixBuildItDeepLabels();
  process.exit();
})();
