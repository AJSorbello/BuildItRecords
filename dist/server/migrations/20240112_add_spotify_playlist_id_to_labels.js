'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
module.exports = {
    up: (queryInterface, Sequelize) => __awaiter(void 0, void 0, void 0, function* () {
        yield queryInterface.addColumn('labels', 'spotify_playlist_id', {
            type: Sequelize.STRING,
            allowNull: true
        });
        // Add Spotify playlist IDs for existing labels
        yield queryInterface.bulkUpdate('labels', { spotify_playlist_id: '37i9dQZF1DX5wDmLW735Yd' }, // Replace with actual playlist ID
        { id: 'buildit-records' });
        yield queryInterface.bulkUpdate('labels', { spotify_playlist_id: '37i9dQZF1DX6J5NfMJS675' }, // Replace with actual playlist ID
        { id: 'buildit-tech' });
        yield queryInterface.bulkUpdate('labels', { spotify_playlist_id: '37i9dQZF1DX2TRYkJECvfC' }, // Replace with actual playlist ID
        { id: 'buildit-deep' });
    }),
    down: (queryInterface, Sequelize) => __awaiter(void 0, void 0, void 0, function* () {
        yield queryInterface.removeColumn('labels', 'spotify_playlist_id');
    })
};
