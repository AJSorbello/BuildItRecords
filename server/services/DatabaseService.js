const { Label, Artist, Release, Track } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db'); // assuming you have a db config file
const SpotifyService = require('./SpotifyService'); // assuming SpotifyService is in the same directory

class DatabaseService {
  static instance = null;

  static getInstance() {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  constructor() {
    console.log('DatabaseService initialized');
  }

  async getAllTracks() {
    try {
      const tracks = await Track.findAll({
        include: [
          {
            model: Artist,
            as: 'artist',
            attributes: ['name', 'spotifyUrl'],
          },
        ],
        order: [['releaseDate', 'DESC']],
      });

      return tracks.map(track => ({
        id: track.id,
        name: track.name,
        trackTitle: track.title,
        artist: track.artist.name,
        albumCover: track.albumArtUrl,
        recordLabel: track.label,
        releaseDate: track.releaseDate,
        previewUrl: track.previewUrl,
        beatportUrl: track.beatportUrl,
        soundcloudUrl: track.soundcloudUrl,
        spotifyUrl: track.spotifyUrl,
        album: {
          id: track.albumId,
          name: track.albumName,
          releaseDate: track.releaseDate,
          images: track.albumArtUrl ? [{ url: track.albumArtUrl }] : [],
        },
        artists: [{
          id: track.artist.id,
          name: track.artist.name,
          spotifyUrl: track.artist.spotifyUrl,
        }],
      }));
    } catch (error) {
      console.error('Error getting all tracks:', error);
      return [];
    }
  }

  async saveTracks(tracks) {
    try {
      // Start a transaction
      const result = await sequelize.transaction(async (t) => {
        for (const track of tracks) {
          // Find or create artist
          const [artist] = await Artist.findOrCreate({
            where: { spotifyUrl: track.artists[0].spotifyUrl },
            defaults: {
              name: track.artists[0].name,
              spotifyUrl: track.artists[0].spotifyUrl,
            },
            transaction: t,
          });

          // Create or update track
          await Track.upsert({
            id: track.id,
            title: track.trackTitle,
            name: track.name,
            artistId: artist.id,
            albumId: track.album.id,
            albumName: track.album.name,
            albumArtUrl: track.albumCover,
            label: track.recordLabel,
            releaseDate: track.releaseDate,
            previewUrl: track.previewUrl,
            beatportUrl: track.beatportUrl,
            soundcloudUrl: track.soundcloudUrl,
            spotifyUrl: track.spotifyUrl,
          }, {
            transaction: t,
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Error saving tracks:', error);
      throw error;
    }
  }

  async getTracksForLabel(labelSlug) {
    try {
      const releases = await Release.findAll({
        include: [
          {
            model: Label,
            as: 'label',
            where: { slug: labelSlug },
            attributes: [],
          },
          {
            model: Artist,
            as: 'artist',
            attributes: ['name', 'spotifyUrl'],
          },
        ],
        order: [['releaseDate', 'DESC']],
      });

      return releases.map(release => ({
        id: release.id,
        title: release.title,
        releaseDate: release.releaseDate,
        albumArtUrl: release.albumArtUrl,
        spotifyUrl: release.spotifyUrl,
        beatportUrl: release.beatportUrl,
        soundcloudUrl: release.soundcloudUrl,
        artist: {
          name: release.artist.name,
          spotifyUrl: release.artist.spotifyUrl,
        },
        popularity: release.popularity,
      }));
    } catch (error) {
      console.error('Error getting tracks for label:', error);
      return null;
    }
  }

  async getArtistsForLabel(labelSlug) {
    try {
      const artists = await Artist.findAll({
        include: [{
          model: Label,
          as: 'label',
          where: { slug: labelSlug },
          attributes: [],
        }],
        order: [['name', 'ASC']],
      });

      return artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.imageUrl,
        bio: artist.bio,
        spotifyUrl: artist.spotifyUrl,
        beatportUrl: artist.beatportUrl,
        soundcloudUrl: artist.soundcloudUrl,
      }));
    } catch (error) {
      console.error('Error getting artists for label:', error);
      return null;
    }
  }

  async setTracksForLabel(labelSlug, tracks) {
    try {
      const label = await Label.findOne({ where: { slug: labelSlug } });
      if (!label) {
        throw new Error('Label not found');
      }

      // Create or update tracks
      for (const track of tracks) {
        const [artist] = await Artist.findOrCreate({
          where: { name: track.artist.name },
          defaults: {
            labelId: label.id,
            spotifyUrl: track.artist.spotifyUrl,
          },
        });

        await Release.findOrCreate({
          where: { spotifyId: track.spotifyId },
          defaults: {
            title: track.title,
            releaseDate: track.releaseDate,
            albumArtUrl: track.albumArtUrl,
            spotifyUrl: track.spotifyUrl,
            beatportUrl: track.beatportUrl,
            soundcloudUrl: track.soundcloudUrl,
            artistId: artist.id,
            labelId: label.id,
            popularity: track.popularity || 0,
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Error setting tracks for label:', error);
      return false;
    }
  }

  async setArtistsForLabel(labelSlug, artists) {
    try {
      const label = await Label.findOne({ where: { slug: labelSlug } });
      if (!label) {
        throw new Error('Label not found');
      }

      for (const artistData of artists) {
        await Artist.findOrCreate({
          where: { name: artistData.name },
          defaults: {
            ...artistData,
            labelId: label.id,
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Error setting artists for label:', error);
      return false;
    }
  }

  async syncReleases(labelId) {
    try {
      console.log('Syncing releases for label:', labelId);
      const spotifyService = new SpotifyService();
      
      // Get access token
      const accessToken = await spotifyService.getAccessToken();
      
      // Get label from database or create it
      const [label] = await Label.findOrCreate({
        where: { name: labelId },
        defaults: { name: labelId }
      });

      // Fetch releases from Spotify
      const releases = await spotifyService.searchTracksByLabel(labelId);
      console.log(`Found ${releases.length} releases for label ${labelId}`);

      // Process each release
      for (const releaseData of releases) {
        // Find or create artist
        const [artist] = await Artist.findOrCreate({
          where: { spotifyId: releaseData.artists[0].id },
          defaults: {
            name: releaseData.artists[0].name,
            spotifyId: releaseData.artists[0].id,
            spotifyUrl: releaseData.artists[0].spotifyUrl,
            labelId: label.id
          }
        });

        // Create or update release
        await Release.upsert({
          title: releaseData.name,
          releaseDate: releaseData.releaseDate,
          albumArtUrl: releaseData.albumCover,
          spotifyId: releaseData.id,
          spotifyUrl: releaseData.spotifyUrl,
          beatportUrl: releaseData.beatportUrl,
          soundcloudUrl: releaseData.soundcloudUrl,
          artistId: artist.id,
          labelId: label.id
        });
      }

      console.log(`Successfully synced ${releases.length} releases`);
      return true;
    } catch (error) {
      console.error('Error syncing releases:', error);
      throw error;
    }
  }

  async getReleasesByLabel(labelId) {
    try {
      console.log('Getting releases for label:', labelId);
      
      // Find the label
      const label = await Label.findOne({
        where: { name: labelId }
      });

      if (!label) {
        console.log('Label not found:', labelId);
        return [];
      }

      // Get releases with artist information
      const releases = await Release.findAll({
        where: { labelId: label.id },
        include: [{
          model: Artist,
          as: 'artist'
        }],
        order: [['releaseDate', 'DESC']]
      });

      // Format releases for frontend
      return releases.map(release => ({
        id: release.spotifyId,
        title: release.title,
        artist: {
          name: release.artist.name
        },
        imageUrl: release.albumArtUrl,
        releaseDate: release.releaseDate,
        spotifyUrl: release.spotifyUrl,
        beatportUrl: release.beatportUrl,
        soundcloudUrl: release.soundcloudUrl
      }));
    } catch (error) {
      console.error('Error getting releases by label:', error);
      throw error;
    }
  }
}

module.exports = DatabaseService.getInstance();
