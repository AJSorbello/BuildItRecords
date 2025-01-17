"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const SpotifyService = require('../services/spotifyService');
const spotifyConfig = require('../config/spotify');
const { Label } = require('../models');
const sequelize = require('../config/database');
function importLabelData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Initialize Spotify service
            const spotifyService = new SpotifyService(spotifyConfig);
            yield spotifyService.initialize();
            // Get the Build It Tech label
            const label = yield Label.findByPk('buildit-tech');
            if (!label) {
                throw new Error('Build It Tech label not found in database');
            }
            const labelConfig = spotifyConfig.labels['buildit-tech'];
            console.log(`[Import] Starting import for ${labelConfig.name}`);
            // First import all artists
            console.log('[Import] Importing artists...');
            for (const artistId of labelConfig.artists) {
                try {
                    const artistData = yield spotifyService.fetchArtist(artistId);
                    yield spotifyService.saveArtist(artistData);
                    console.log(`[Import] Imported artist: ${artistData.name}`);
                }
                catch (error) {
                    console.error(`[Import] Error importing artist ${artistId}:`, error);
                }
            }
            // Then import all label releases
            console.log('[Import] Importing releases...');
            const releases = yield spotifyService.importLabelReleases(label.id, labelConfig.name);
            console.log(`[Import] Successfully imported ${releases.length} releases`);
            console.log('[Import] Import completed successfully');
            process.exit(0);
        }
        catch (error) {
            console.error('[Import] Import failed:', error);
            process.exit(1);
        }
    });
}
// Run the import
importLabelData();
