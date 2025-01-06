const SpotifyWebApi = require('spotify-web-api-node');
const { Artist, Release, Track, sequelize } = require('../models');
const { Op } = require('sequelize');

class SpotifyService {
  constructor(config) {
    this.spotifyApi = new SpotifyWebApi({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri
    });
    this._initialized = false;
  }

  isInitialized() {
    return this._initialized;
  }

  async initialize() {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body['access_token']);
      this._initialized = true;
      console.log('Spotify API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Spotify API:', error);
      throw error;
    }
  }

  async searchAlbumsByLabel(labelName) {
    try {
      const labelQuery = `label:"${labelName}"`;
      console.log('Searching Spotify with query:', labelQuery);
      
      // Search for albums with the exact label query
      const searchResults = await this.spotifyApi.searchAlbums(labelQuery);
      console.log('Search results:', searchResults.body.albums.items.length, 'albums found');
      
      // Filter to ensure exact label match
      const filteredResults = searchResults.body.albums.items.filter(album => 
        album.label && album.label.toLowerCase() === labelName.toLowerCase()
      );
      
      console.log('Filtered results:', filteredResults.length, 'albums match exactly');
      return filteredResults;
    } catch (error) {
      console.error('Error searching albums by label:', error);
      throw error;
    }
  }

  async importReleases(label) {
    try {
      console.log(`Importing releases for label: ${label.name}`);
      const importedReleases = [];

      // Search for albums by label name
      const albums = await this.searchAlbumsByLabel(label.name);
      console.log(`Found ${albums.length} albums for ${label.name}`);

      for (const albumData of albums) {
        try {
          // Get full album details
          const fullAlbum = await this.spotifyApi.getAlbum(albumData.id);
          const releaseData = fullAlbum.body;

          console.log('Processing release:', {
            name: releaseData.name,
            id: releaseData.id,
            type: releaseData.album_type,
            total_tracks: releaseData.total_tracks,
            artists: releaseData.artists.map(a => a.name),
            label: releaseData.label
          });

          // Get all artists involved in the release
          const allArtists = new Set();
          releaseData.artists.forEach(artist => allArtists.add(artist));

          // Save all artists
          const savedArtists = new Map();
          for (const artistData of allArtists) {
            const artist = await this.saveArtist(artistData, label.id);
            if (artist) {
              savedArtists.set(artistData.id, artist);
              console.log('Saved artist:', artist.name);
            }
          }

          // Get the primary artist
          const primaryArtist = savedArtists.get(releaseData.artists[0].id);
          if (!primaryArtist) {
            console.log(`Skipping release ${releaseData.name} - could not save primary artist`);
            continue;
          }

          // Parse release date
          let releaseDate = releaseData.release_date;
          if (!releaseDate && releaseData.release_date_precision === 'year') {
            releaseDate = `${releaseData.release_date}-01-01`;
          } else if (!releaseDate && releaseData.release_date_precision === 'month') {
            releaseDate = `${releaseData.release_date}-01`;
          }

          // Create the release
          const [releaseRecord] = await Release.findOrCreate({
            where: { id: releaseData.id },
            defaults: {
              id: releaseData.id,
              title: releaseData.name,
              release_date: releaseDate,
              spotify_url: releaseData.external_urls.spotify,
              cover_image: releaseData.images?.[0]?.url,
              label_id: label.id,
              primary_artist_id: primaryArtist.id,
              total_tracks: releaseData.total_tracks,
              record_label: releaseData.label
            }
          });

          console.log('Saved release:', releaseRecord.title);

          // Associate all release artists
          const releaseArtistIds = releaseData.artists
            .map(artist => savedArtists.get(artist.id)?.id)
            .filter(id => id != null);

          await releaseRecord.setArtists(releaseArtistIds);
          importedReleases.push(releaseRecord);

          // Process tracks
          if (releaseData.tracks && releaseData.tracks.items) {
            for (const track of releaseData.tracks.items) {
              const [trackRecord] = await Track.findOrCreate({
                where: { id: track.id },
                defaults: {
                  id: track.id,
                  title: track.name,
                  duration: track.duration_ms,
                  preview_url: track.preview_url,
                  spotify_url: track.external_urls.spotify,
                  release_id: releaseRecord.id,
                  label_id: label.id,
                  track_number: track.track_number,
                  disc_number: track.disc_number
                }
              });

              // Associate track with release artists
              await trackRecord.setArtists(releaseArtistIds);
              console.log('Saved track:', trackRecord.title);
            }
          }

        } catch (error) {
          console.error(`Error processing album ${albumData.id}:`, error);
          continue;
        }
      }

      return importedReleases;
    } catch (error) {
      console.error('Error importing releases:', error);
      throw error;
    }
  }

  async saveArtist(artistData, labelId) {
    try {
      const [artist] = await Artist.findOrCreate({
        where: { id: artistData.id },
        defaults: {
          id: artistData.id,
          name: artistData.name,
          spotify_url: artistData.external_urls?.spotify,
          label_id: labelId
        }
      });
      return artist;
    } catch (error) {
      console.error(`Error saving artist ${artistData.name}:`, error);
      return null;
    }
  }
}

module.exports = SpotifyService;
