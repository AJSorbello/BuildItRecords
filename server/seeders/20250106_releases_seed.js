'use strict';

const { Release, Artist, Track, Label } = require('../models');
const { Op } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('Starting to export current releases to seed file...');
      
      // Get all releases with their associations
      const releases = await Release.findAll({
        include: [
          {
            model: Artist,
            as: 'artists',
            through: { attributes: [] },
            attributes: ['id', 'name', 'spotify_url', 'image_url', 'images']
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
                attributes: ['id', 'name', 'spotify_url', 'image_url', 'images']
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
            image_url: artist.image_url,
            images: artist.images,
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
              image_url: artist.image_url,
              images: artist.images,
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

      fs.writeFileSync(
        path.join(__dirname, 'release_seed_data.json'),
        JSON.stringify(seedData, null, 2)
      );

      console.log('Seed data has been exported to release_seed_data.json');
      
      // Insert the data
      await queryInterface.sequelize.transaction(async (transaction) => {
        // Clear existing data
        await queryInterface.bulkDelete('track_artists', null, { transaction });
        await queryInterface.bulkDelete('release_artists', null, { transaction });
        await queryInterface.bulkDelete('tracks', null, { transaction });
        await queryInterface.bulkDelete('releases', null, { transaction });
        await queryInterface.bulkDelete('artists', null, { transaction });

        // Insert new data
        if (artistData.length > 0) {
          await queryInterface.bulkInsert('artists', artistData, { transaction });
        }
        if (releaseSeedData.length > 0) {
          await queryInterface.bulkInsert('releases', releaseSeedData, { transaction });
        }
        if (trackSeedData.length > 0) {
          await queryInterface.bulkInsert('tracks', trackSeedData, { transaction });
        }
        if (releaseArtistSeedData.length > 0) {
          await queryInterface.bulkInsert('release_artists', releaseArtistSeedData, { transaction });
        }
        if (trackArtistSeedData.length > 0) {
          await queryInterface.bulkInsert('track_artists', trackArtistSeedData, { transaction });
        }
      });

      console.log('Seed completed successfully');
    } catch (error) {
      console.error('Error in seed file:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Clear all data
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete('track_artists', null, { transaction });
      await queryInterface.bulkDelete('release_artists', null, { transaction });
      await queryInterface.bulkDelete('tracks', null, { transaction });
      await queryInterface.bulkDelete('releases', null, { transaction });
      await queryInterface.bulkDelete('artists', null, { transaction });
    });
  }
};
