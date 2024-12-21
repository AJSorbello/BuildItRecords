const { Label, Artist, Release } = require('../models');
const SpotifyService = require('./SpotifyService');

const LABEL_NAMES = {
  'records': 'Build It Records',
  'tech': 'Build It Tech',
  'deep': 'Build It Deep'
};

class SyncService {
  static instance = null;

  static getInstance() {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async syncLabel(labelSlug) {
    try {
      const labelName = LABEL_NAMES[labelSlug];
      if (!labelName) {
        throw new Error(`Invalid label slug: ${labelSlug}`);
      }

      // Create or update label
      const [label, created] = await Label.findOrCreate({
        where: { slug: labelSlug },
        defaults: {
          name: labelName,
          slug: labelSlug
        }
      });

      // Use SpotifyService to search and sync artists for this label
      const results = await SpotifyService.syncLabelArtists(labelName);
      
      return {
        success: true,
        label,
        created,
        results
      };
    } catch (error) {
      console.error('Error syncing label:', error);
      throw error;
    }
  }

  async syncAllLabels() {
    try {
      const results = {};
      for (const [slug, name] of Object.entries(LABEL_NAMES)) {
        results[slug] = await this.syncLabel(slug);
      }
      return results;
    } catch (error) {
      console.error('Error syncing all labels:', error);
      throw error;
    }
  }
}

module.exports = SyncService.getInstance();
