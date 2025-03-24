/**
 * Fix Track Distribution Based on Correct Label Release Counts
 * Redistributes tracks to match the proper release count percentages
 */

require('dotenv').config({ path: '.env.supabase' });
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.supabase');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Label naming for clarity in logs
const LABEL_NAMES = {
  '1': 'Build It Records',
  '2': 'Build It Tech',
  '3': 'Build It Deep'
};

// CORRECT RELEASE COUNTS (from LabelReleaseCount.md)
const CORRECT_RELEASE_COUNTS = {
  '1': 361, // Build It Records
  '2': 96,  // Build It Tech
  '3': 21   // Build It Deep
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Analyze current distribution
 */
async function analyzeCurrentDistribution() {
  console.log('\nAnalyzing current track distribution...');
  
  // Get total number of tracks
  const { count: totalTracks, error: countError } = await supabase
    .from('tracks')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting tracks:', countError.message);
    return null;
  }
  
  console.log(`Total tracks in database: ${totalTracks}`);

  // Get current track counts by label
  const currentCounts = {};
  let totalAccounted = 0;
  
  for (const labelId of Object.keys(LABEL_NAMES)) {
    const { count, error } = await supabase
      .from('tracks')
      .select('*', { count: 'exact', head: true })
      .eq('label_id', labelId);
    
    if (error) {
      console.error(`Error counting tracks for ${LABEL_NAMES[labelId]}:`, error.message);
      currentCounts[labelId] = 0;
    } else {
      currentCounts[labelId] = count || 0;
      totalAccounted += count || 0;
    }
  }

  // Check for tracks with invalid label_id
  if (totalAccounted < totalTracks) {
    console.log(`\n⚠️ Found ${totalTracks - totalAccounted} tracks with invalid or null label_id`);
  }

  // Calculate the correct distribution based on the known release counts
  const totalReleases = Object.values(CORRECT_RELEASE_COUNTS).reduce((sum, count) => sum + count, 0);
  const targetCounts = {};
  
  for (const labelId of Object.keys(LABEL_NAMES)) {
    const releasePercentage = CORRECT_RELEASE_COUNTS[labelId] / totalReleases;
    targetCounts[labelId] = Math.round(releasePercentage * totalTracks);
  }
  
  // Make sure the total adds up exactly (account for rounding)
  let targetTotal = Object.values(targetCounts).reduce((sum, count) => sum + count, 0);
  if (targetTotal !== totalTracks) {
    // Adjust the largest category to make the total correct
    const largestLabelId = Object.keys(targetCounts).reduce(
      (a, b) => targetCounts[a] > targetCounts[b] ? a : b
    );
    targetCounts[largestLabelId] += totalTracks - targetTotal;
  }
  
  // Display distribution
  console.log('\nCurrent vs Target Distribution:');
  console.log('┌─────────────────────┬───────────┬───────────┬───────────┬──────────┐');
  console.log('│ Label               │ Releases  │ Current   │ Target    │ Change   │');
  console.log('├─────────────────────┼───────────┼───────────┼───────────┼──────────┤');
  
  for (const labelId of Object.keys(LABEL_NAMES)) {
    const labelName = LABEL_NAMES[labelId];
    const releaseCount = CORRECT_RELEASE_COUNTS[labelId];
    const current = currentCounts[labelId];
    const target = targetCounts[labelId];
    const change = target - current;
    const changeText = change === 0 ? '—' : (change > 0 ? `+${change}` : `${change}`);
    
    console.log(`│ ${labelName.padEnd(19)} │ ${String(releaseCount).padStart(9)} │ ${String(current).padStart(9)} │ ${String(target).padStart(9)} │ ${changeText.padStart(8)} │`);
  }
  
  console.log('└─────────────────────┴───────────┴───────────┴───────────┴──────────┘');
  
  return { totalTracks, currentCounts, targetCounts };
}

/**
 * Generate SQL to fix the track distribution
 */
async function generateRedistributionSQL(distributionData) {
  if (!distributionData) return null;

  const { totalTracks, currentCounts, targetCounts } = distributionData;
  
  console.log('\nGenerating SQL to fix track distribution...');
  
  // Calculate changes needed
  const changes = {};
  for (const labelId of Object.keys(LABEL_NAMES)) {
    changes[labelId] = targetCounts[labelId] - currentCounts[labelId];
  }
  
  // Find source labels (negative changes) and target labels (positive changes)
  const sourceLabels = Object.keys(changes)
    .filter(labelId => changes[labelId] < 0)
    .sort((a, b) => changes[a] - changes[b]); // Sort by most negative first
  
  const targetLabels = Object.keys(changes)
    .filter(labelId => changes[labelId] > 0)
    .sort((a, b) => changes[b] - changes[a]); // Sort by most positive first
  
  if (targetLabels.length === 0) {
    console.log('No redistribution needed - current distribution matches target!');
    return null;
  }
  
  // Generate SQL script
  let sqlScript = `-- SQL script to fix track distribution based on correct release counts\n\n`;
  sqlScript += `-- CORRECT RELEASE COUNTS (from LabelReleaseCount.md):\n`;
  for (const labelId of Object.keys(CORRECT_RELEASE_COUNTS)) {
    sqlScript += `-- ${LABEL_NAMES[labelId]}: ${CORRECT_RELEASE_COUNTS[labelId]} releases\n`;
  }
  
  sqlScript += `\n-- CURRENT TRACK DISTRIBUTION:\n`;
  for (const labelId of Object.keys(currentCounts)) {
    const percentage = ((currentCounts[labelId] / totalTracks) * 100).toFixed(1);
    sqlScript += `-- ${LABEL_NAMES[labelId]}: ${currentCounts[labelId]} tracks (${percentage}%)\n`;
  }
  
  sqlScript += `\n-- TARGET TRACK DISTRIBUTION:\n`;
  for (const labelId of Object.keys(targetCounts)) {
    const percentage = ((targetCounts[labelId] / totalTracks) * 100).toFixed(1);
    sqlScript += `-- ${LABEL_NAMES[labelId]}: ${targetCounts[labelId]} tracks (${percentage}%)\n`;
  }
  
  sqlScript += `\n-- CHANGES NEEDED:\n`;
  for (const labelId of Object.keys(changes)) {
    const changeText = changes[labelId] >= 0 ? `+${changes[labelId]}` : `${changes[labelId]}`;
    sqlScript += `-- ${LABEL_NAMES[labelId]}: ${changeText} tracks\n`;
  }
  
  // Create the redistribution plan
  // For each source-target pair, create SQL to transfer tracks
  sqlScript += `\n-- REDISTRIBUTION PLAN:\n`;
  
  // For each target label that needs tracks
  for (const targetLabelId of targetLabels) {
    const tracksNeeded = changes[targetLabelId];
    sqlScript += `-- ${LABEL_NAMES[targetLabelId]} needs ${tracksNeeded} more tracks\n`;
    
    // Get all releases for the target label
    const { data: targetReleases, error: releaseError } = await supabase
      .from('releases')
      .select('id, title')
      .eq('label_id', targetLabelId);
    
    if (releaseError) {
      console.error(`Error fetching releases for ${LABEL_NAMES[targetLabelId]}:`, releaseError.message);
      continue;
    }
    
    if (!targetReleases || targetReleases.length === 0) {
      console.log(`⚠️ No releases found for ${LABEL_NAMES[targetLabelId]} - cannot redistribute tracks to this label`);
      continue;
    }
    
    console.log(`Found ${targetReleases.length} releases for ${LABEL_NAMES[targetLabelId]}`);
    
    // Get tracks from source labels
    let tracksObtained = 0;
    let trackQueries = [];
    
    for (const sourceLabelId of sourceLabels) {
      const tracksAvailable = Math.min(
        -changes[sourceLabelId], // How many tracks this source can give up
        tracksNeeded - tracksObtained // How many more tracks are needed
      );
      
      if (tracksAvailable <= 0) continue;
      
      // Find the largest release in this source label - using a different approach
      // since group() doesn't seem to be supported
      const { data: sourceReleases, error: releasesError } = await supabase
        .from('releases')
        .select('id, title')
        .eq('label_id', sourceLabelId);
      
      if (releasesError || !sourceReleases || sourceReleases.length === 0) {
        console.error(`Error fetching releases for ${LABEL_NAMES[sourceLabelId]}:`, releasesError?.message || 'No releases found');
        continue;
      }
      
      // Find release with most tracks
      let largestReleaseId = null;
      let largestReleaseTitle = null;
      let largestReleaseCount = 0;
      
      for (const release of sourceReleases) {
        const { count, error: countError } = await supabase
          .from('tracks')
          .select('*', { count: 'exact', head: true })
          .eq('release_id', release.id)
          .eq('label_id', sourceLabelId);
        
        if (!countError && count && count > largestReleaseCount) {
          largestReleaseId = release.id;
          largestReleaseTitle = release.title;
          largestReleaseCount = count;
        }
      }
      
      if (!largestReleaseId) {
        console.log(`No suitable releases found for ${LABEL_NAMES[sourceLabelId]}`);
        continue;
      }
      
      const sourceReleaseId = largestReleaseId;
      const sourceRelease = { title: largestReleaseTitle };
      
      // Get tracks from this release
      const { data: sourceTracks, error: tracksError } = await supabase
        .from('tracks')
        .select('id, title')
        .eq('release_id', sourceReleaseId)
        .eq('label_id', sourceLabelId)
        .limit(tracksAvailable);
      
      if (tracksError || !sourceTracks || sourceTracks.length === 0) {
        console.error(`Error fetching tracks from release:`, tracksError?.message || 'No tracks found');
        continue;
      }
      
      // Add to the tracking
      tracksObtained += sourceTracks.length;
      changes[sourceLabelId] += sourceTracks.length; // Decrease the negative change
      
      trackQueries.push({
        sourceLabelId,
        sourceRelease: sourceRelease.title,
        sourceReleaseId,
        tracks: sourceTracks
      });
      
      sqlScript += `-- Taking ${sourceTracks.length} tracks from "${sourceRelease.title}" (${LABEL_NAMES[sourceLabelId]})\n`;
      
      if (tracksObtained >= tracksNeeded) break;
    }
    
    // Distribute tracks to target label releases
    if (trackQueries.length > 0) {
      const tracksPerRelease = Math.ceil(tracksObtained / targetReleases.length);
      let trackIndex = 0;
      
      for (const query of trackQueries) {
        sqlScript += `\n-- Moving tracks from "${query.sourceRelease}" (${LABEL_NAMES[query.sourceLabelId]}) to ${LABEL_NAMES[targetLabelId]} releases\n`;
        
        for (let i = 0; i < targetReleases.length && trackIndex < tracksObtained; i++) {
          const targetRelease = targetReleases[i];
          const tracksForThisRelease = Math.min(
            tracksPerRelease,
            tracksObtained - trackIndex
          );
          
          if (tracksForThisRelease <= 0) continue;
          
          // Get the next batch of tracks
          const batchTracks = query.tracks.slice(trackIndex, trackIndex + tracksForThisRelease);
          
          if (batchTracks.length === 0) break;
          
          const trackIds = batchTracks.map(t => `'${t.id}'`).join(', ');
          
          sqlScript += `-- Move ${batchTracks.length} tracks to "${targetRelease.title}"\n`;
          sqlScript += `UPDATE tracks\n`;
          sqlScript += `SET release_id = '${targetRelease.id}', label_id = '${targetLabelId}'\n`;
          sqlScript += `WHERE id IN (${trackIds});\n\n`;
          
          trackIndex += batchTracks.length;
        }
      }
    }
  }
  
  // Save SQL to a file
  try {
    const fs = require('fs');
    const filename = '/Users/ajsorbello/Documents/MyWebPortfolio/BuildItRecords/fix-track-distribution.sql';
    fs.writeFileSync(filename, sqlScript);
    console.log(`\nSQL script saved to: ${filename}`);
  } catch (error) {
    console.error('Error saving SQL script:', error.message);
  }
  
  return sqlScript;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('Starting track distribution fix based on correct release counts...');
    
    // Analyze current distribution
    const distributionData = await analyzeCurrentDistribution();
    
    // Generate SQL to fix distribution
    const sqlScript = await generateRedistributionSQL(distributionData);
    
    if (!sqlScript) {
      console.log('No SQL script generated - distribution already correct or error occurred');
      rl.close();
      return;
    }
    
    // Preview the SQL
    console.log('\nPreview of the generated SQL:');
    const previewLines = sqlScript.split('\n').slice(0, 20).join('\n');
    console.log(previewLines + '\n...');
    
    // Ask for confirmation before applying
    rl.question('\nDo you want to apply this SQL to fix the track distribution? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        console.log('\nApplying track redistribution...');
        
        // Parse the SQL to extract the UPDATE statements and track IDs
        const updateStatements = sqlScript.split('\n')
          .filter(line => line.trim().startsWith('WHERE id IN'))
          .map(line => {
            // Extract track IDs from the SQL
            const trackIdsMatch = line.match(/\('([^']+)'(?:, '([^']+)')*\)/);
            if (!trackIdsMatch) return null;
            
            // Convert the matched group to an array of IDs
            return Array.from(trackIdsMatch)
              .slice(1) // Remove the full match
              .filter(id => id); // Filter out undefined values
          })
          .filter(ids => ids && ids.length > 0);
        
        // Extract the release IDs and label IDs from the SQL
        const updateInfo = sqlScript.split('\n')
          .filter(line => line.trim().startsWith('SET release_id'))
          .map(line => {
            const releaseIdMatch = line.match(/release_id = '([^']+)'/);
            const labelIdMatch = line.match(/label_id = '([^']+)'/);
            
            if (!releaseIdMatch || !labelIdMatch) return null;
            
            return {
              releaseId: releaseIdMatch[1],
              labelId: labelIdMatch[1]
            };
          })
          .filter(info => info);
        
        // Combine the track IDs with the update info
        const updates = [];
        for (let i = 0; i < Math.min(updateStatements.length, updateInfo.length); i++) {
          const trackIds = updateStatements[i];
          const { releaseId, labelId } = updateInfo[i];
          
          for (const trackId of trackIds) {
            updates.push({
              trackId,
              releaseId,
              labelId
            });
          }
        }
        
        console.log(`Found ${updates.length} track updates to apply`);
        
        // Apply the updates in batches
        const batchSize = 10;
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < updates.length; i += batchSize) {
          const batch = updates.slice(i, i + batchSize);
          
          for (const update of batch) {
            try {
              const { error } = await supabase
                .from('tracks')
                .update({
                  release_id: update.releaseId,
                  label_id: update.labelId
                })
                .eq('id', update.trackId);
              
              if (error) {
                console.error(`Error updating track ${update.trackId}:`, error.message);
                errorCount++;
              } else {
                successCount++;
              }
            } catch (error) {
              console.error(`Error updating track ${update.trackId}:`, error.message);
              errorCount++;
            }
          }
          
          // Progress update
          console.log(`Progress: ${i + batch.length}/${updates.length} updates processed`);
        }
        
        console.log(`\nUpdates completed: ${successCount} succeeded, ${errorCount} failed`);
        
        // Check the new distribution
        await analyzeCurrentDistribution();
      } else {
        console.log('Operation cancelled. You can manually apply the SQL from the file: fix-track-distribution.sql');
      }
      
      rl.close();
    });
    
  } catch (error) {
    console.error('Fatal error:', error);
    rl.close();
    process.exit(1);
  }
}

// Run the script
main();
