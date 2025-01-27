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
const { Release, Artist, Track, Label } = require('../models');
const { Op } = require('sequelize');
module.exports = {
    up: (queryInterface, Sequelize) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log('Starting to export current releases to seed file...');
            // Get all releases with their associations
            const releases = yield Release.findAll({
                include: [
                    {
                        model: Artist,
                        as: 'artists',
                        through: { attributes: [] },
                        attributes: ['id', 'name', 'spotify_url', 'profile_image']
                    },
                    {
                        model: Track,
                        as: 'tracks',
                        attributes: ['id', 'name', 'duration', 'preview_url', 'spotify_url', 'track_number'],
                        include: [
                            {
                                model: Artist,
                                as: 'artists',
                                through: { attributes: [] },
                                attributes: ['id', 'name', 'spotify_url', 'profile_image']
                            }
                        ]
                    }
                ]
            });
            // Create seed data arrays
            const artistSeedData = new Set();
            const releaseSeedData = [];
            const trackSeedData = [];
            const releaseArtistSeedData = [];
            const trackArtistSeedData = [];
            // Process each release
            releases.forEach(release => {
                // Add release data
                releaseSeedData.push({
                    id: release.id,
                    name: release.name,
                    release_date: release.release_date,
                    artwork_url: release.artwork_url,
                    spotify_url: release.spotify_url,
                    spotify_uri: release.spotify_uri,
                    total_tracks: release.total_tracks,
                    label_id: release.label_id,
                    created_at: release.created_at,
                    updated_at: release.updated_at
                });
                // Add artists
                release.artists.forEach(artist => {
                    artistSeedData.add(JSON.stringify({
                        id: artist.id,
                        name: artist.name,
                        spotify_url: artist.spotify_url,
                        profile_image: artist.profile_image,
                        created_at: artist.created_at,
                        updated_at: artist.updated_at
                    }));
                    // Add release-artist association
                    releaseArtistSeedData.push({
                        release_id: release.id,
                        artist_id: artist.id,
                        created_at: new Date(),
                        updated_at: new Date()
                    });
                });
                // Add tracks and their artists
                release.tracks.forEach(track => {
                    trackSeedData.push({
                        id: track.id,
                        name: track.name,
                        duration: track.duration,
                        preview_url: track.preview_url,
                        spotify_url: track.spotify_url,
                        track_number: track.track_number,
                        release_id: release.id,
                        created_at: track.created_at,
                        updated_at: track.updated_at
                    });
                    track.artists.forEach(artist => {
                        artistSeedData.add(JSON.stringify({
                            id: artist.id,
                            name: artist.name,
                            spotify_url: artist.spotify_url,
                            profile_image: artist.profile_image,
                            created_at: artist.created_at,
                            updated_at: artist.updated_at
                        }));
                        trackArtistSeedData.push({
                            track_id: track.id,
                            artist_id: artist.id,
                            created_at: new Date(),
                            updated_at: new Date()
                        });
                    });
                });
            });
            // Convert Set back to array and parse JSON
            const artistData = Array.from(artistSeedData).map(json => JSON.parse(json));
            // Write seed data to a file
            const fs = require('fs');
            const path = require('path');
            const seedData = {
                artists: artistData,
                releases: releaseSeedData,
                tracks: trackSeedData,
                releaseArtists: releaseArtistSeedData,
                trackArtists: trackArtistSeedData
            };
            fs.writeFileSync(path.join(__dirname, 'release_seed_data.json'), JSON.stringify(seedData, null, 2));
            console.log('Seed data has been exported to release_seed_data.json');
            // Insert the data
            yield queryInterface.sequelize.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
                // Clear existing data
                yield queryInterface.bulkDelete('track_artists', null, { transaction });
                yield queryInterface.bulkDelete('release_artists', null, { transaction });
                yield queryInterface.bulkDelete('tracks', null, { transaction });
                yield queryInterface.bulkDelete('releases', null, { transaction });
                yield queryInterface.bulkDelete('artists', null, { transaction });
                // Insert new data
                if (artistData.length > 0) {
                    yield queryInterface.bulkInsert('artists', artistData, { transaction });
                }
                if (releaseSeedData.length > 0) {
                    yield queryInterface.bulkInsert('releases', releaseSeedData, { transaction });
                }
                if (trackSeedData.length > 0) {
                    yield queryInterface.bulkInsert('tracks', trackSeedData, { transaction });
                }
                if (releaseArtistSeedData.length > 0) {
                    yield queryInterface.bulkInsert('release_artists', releaseArtistSeedData, { transaction });
                }
                if (trackArtistSeedData.length > 0) {
                    yield queryInterface.bulkInsert('track_artists', trackArtistSeedData, { transaction });
                }
            }));
            console.log('Seed completed successfully');
        }
        catch (error) {
            console.error('Error in seed file:', error);
            throw error;
        }
    }),
    down: (queryInterface, Sequelize) => __awaiter(void 0, void 0, void 0, function* () {
        // Clear all data
        yield queryInterface.sequelize.transaction((transaction) => __awaiter(void 0, void 0, void 0, function* () {
            yield queryInterface.bulkDelete('track_artists', null, { transaction });
            yield queryInterface.bulkDelete('release_artists', null, { transaction });
            yield queryInterface.bulkDelete('tracks', null, { transaction });
            yield queryInterface.bulkDelete('releases', null, { transaction });
            yield queryInterface.bulkDelete('artists', null, { transaction });
        }));
    })
};
