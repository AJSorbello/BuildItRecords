/**
 * Script to fix compilation releases:
 * 1. Set proper release dates for compilations
 * 2. Add missing artwork URLs
 * 3. Update release_type field to 'compilation'
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

const DEFAULT_ARTWORK_BY_LABEL = {
  1: 'https://f4.bcbits.com/img/a2138594744_10.jpg', // BuildIt Records compilation image
  2: 'https://f4.bcbits.com/img/a1698425572_10.jpg', // BuildIt Deep compilation image
  3: 'https://f4.bcbits.com/img/a0780547517_10.jpg', // BuildIt Tech compilation image
};

async function findAndFixCompilations() {
  console.log('Finding compilation releases...');
  
  // First identify all releases that are likely compilations
  const { data: potentialCompilations, error: searchError } = await supabase
    .from('releases')
    .select('id, title, release_date, artwork_url, label_id, release_type')
    .or('title.ilike.%Compilation%,title.ilike.%Various%');
    
  if (searchError) {
    console.error('Error fetching potential compilations:', searchError);
    return;
  }
  
  console.log(`Found ${potentialCompilations.length} potential compilations`);
  
  // Process each potential compilation
  for (const release of potentialCompilations) {
    console.log(`Processing: ${release.title} (ID: ${release.id})`);
    
    const updates = {};
    
    // 1. Fix release_type
    if (release.release_type !== 'compilation') {
      updates.release_type = 'compilation';
    }
    
    // 2. Fix missing release_date
    if (!release.release_date) {
      // Set a default date based on release ID (newer IDs = newer releases)
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      // Assign a date in the current year, with month determined by ID
      updates.release_date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    }
    
    // 3. Fix missing artwork_url
    if (!release.artwork_url) {
      // Use default artwork based on label
      updates.artwork_url = DEFAULT_ARTWORK_BY_LABEL[release.label_id] || DEFAULT_ARTWORK_BY_LABEL[1];
    }
    
    // Apply updates if needed
    if (Object.keys(updates).length > 0) {
      console.log(`Updating release ${release.id} with:`, updates);
      
      const { error: updateError } = await supabase
        .from('releases')
        .update(updates)
        .eq('id', release.id);
        
      if (updateError) {
        console.error(`Error updating release ${release.id}:`, updateError);
      } else {
        console.log(`✅ Successfully updated release ${release.id}`);
      }
    } else {
      console.log(`No updates needed for release ${release.id}`);
    }
  }
  
  console.log('Compilation fixes completed');
}

findAndFixCompilations();
