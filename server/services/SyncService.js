const { Label, Artist, Release } = require('../models');
const SpotifyService = require('./SpotifyService');

class SyncService {
  static instance = null;

  static getInstance() {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async syncLabel(labelName, labelSlug) {
    try {
      // Create or update label
      const [label, created] = await Label.findOrCreate({
        where: { slug: labelSlug },
        defaults: {
          name: labelName,
          slug: labelSlug
        }
      });

      // Get releases from Spotify
      const spotifyReleases = await SpotifyService.getLabelReleases(labelName);
      
      for (const release of spotifyReleases) {
        // Create or update artist
        const [artist, artistCreated] = await Artist.findOrCreate({
          where: { spotifyId: release.artist.spotifyId },
          defaults: {
            name: release.artist.name,
            imageUrl: release.artist.imageUrl,
            labelId: label.id
          }
        });

        // Create or update release
        await Release.findOrCreate({
          where: { spotifyId: release.spotifyId },
          defaults: {
            title: release.name,
            releaseDate: release.releaseDate,
            imageUrl: release.imageUrl,
            previewUrl: release.previewUrl,
            artistId: artist.id,
            labelId: label.id
          }
        });
      }

      return { success: true, message: `Synced ${spotifyReleases.length} releases for ${labelName}` };
    } catch (error) {
      console.error('Error syncing label:', error);
      return { success: false, message: error.message };
    }
  }

  async syncAllLabels() {
    const labels = [
      { name: 'Records', slug: 'records' },
      { name: 'Tech', slug: 'tech' },
      { name: 'Deep', slug: 'deep' }
    ];

    const results = [];
    for (const label of labels) {
      const result = await this.syncLabel(label.name, label.slug);
      results.push({ label: label.name, ...result });
    }

    return results;
  }
}

module.exports = SyncService.getInstance();
