const getSpotifyService = require('../server/services/SpotifyService');
const { Label, Release } = require('../server/models');
const logger = require('../server/utils/logger').createLogger('ImportScript');

async function importAllTracks() {
  try {
    logger.info('Starting import for all labels');
    
    // Get current counts
    const beforeCounts = {};
    const labels = await Label.findAll();
    for (const label of labels) {
      const count = await Release.count({ where: { label_id: label.id }});
      beforeCounts[label.id] = count;
      logger.info(`Current count for ${label.name}: ${count} releases`);
    }
    
    // Get Spotify service instance
    const spotifyService = await getSpotifyService();
    if (!spotifyService) {
      throw new Error('Failed to initialize Spotify service');
    }

    logger.info(`Found ${labels.length} labels to process`);

    // Process each label
    for (const label of labels) {
      logger.info(`Processing label: ${label.name}`);
      
      try {
        // Search for releases
        const releases = await spotifyService.searchReleases(label);
        logger.info(`Found ${releases.length} releases for ${label.name} from Spotify search`);

        // Import releases and tracks
        const result = await spotifyService.importReleases(label, releases);
        
        // Get new count
        const afterCount = await Release.count({ where: { label_id: label.id }});
        const difference = afterCount - beforeCounts[label.id];
        
        logger.info('Import completed for label:', {
          label: label.name,
          beforeCount: beforeCounts[label.id],
          afterCount: afterCount,
          difference: difference,
          spotifyFound: releases.length,
          stats: result
        });
      } catch (error) {
        logger.error(`Error processing label ${label.name}:`, error);
      }
    }

    // Final counts
    for (const label of labels) {
      const finalCount = await Release.count({ where: { label_id: label.id }});
      const difference = finalCount - beforeCounts[label.id];
      logger.info(`Final count for ${label.name}: ${finalCount} releases (${difference >= 0 ? '+' : ''}${difference})`);
    }

    logger.info('Import completed for all labels');
  } catch (error) {
    logger.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importAllTracks();
