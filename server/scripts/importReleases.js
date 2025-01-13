const SpotifyService = require('../services/spotifyService');
const spotifyConfig = require('../config/spotify');
const { Label } = require('../models');
const sequelize = require('../config/database');

async function importLabelData() {
  try {
    // Initialize Spotify service
    const spotifyService = new SpotifyService(spotifyConfig);
    await spotifyService.initialize();

    // Get the Build It Tech label
    const label = await Label.findByPk('buildit-tech');
    if (!label) {
      throw new Error('Build It Tech label not found in database');
    }

    const labelConfig = spotifyConfig.labels['buildit-tech'];
    console.log(`[Import] Starting import for ${labelConfig.name}`);

    // First import all artists
    console.log('[Import] Importing artists...');
    for (const artistId of labelConfig.artists) {
      try {
        const artistData = await spotifyService.fetchArtist(artistId);
        await spotifyService.saveArtist(artistData);
        console.log(`[Import] Imported artist: ${artistData.name}`);
      } catch (error) {
        console.error(`[Import] Error importing artist ${artistId}:`, error);
      }
    }

    // Then import all label releases
    console.log('[Import] Importing releases...');
    const releases = await spotifyService.importLabelReleases(label.id, labelConfig.name);
    console.log(`[Import] Successfully imported ${releases.length} releases`);

    console.log('[Import] Import completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('[Import] Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importLabelData();
