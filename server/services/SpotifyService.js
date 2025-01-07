const SpotifyWebApi = require('spotify-web-api-node');
const { Artist, Release, Track, sequelize } = require('../models');
const { Op } = require('sequelize');

// Known Build It Tech release IDs on Spotify
const BUILD_IT_TECH_RELEASES = [
  '6h3XmMGEhl4pPqX6ZheNUQ', // City High (Radio Edit)
  // Add more release IDs here as they are released
];

// Known Build It Deep release IDs on Spotify
const BUILD_IT_DEEP_RELEASES = [
  // Add Build It Deep release IDs here
];

class SpotifyService {
  constructor(clientId, clientSecret, redirectUri) {
    this.spotifyApi = new SpotifyWebApi({
      clientId,
      clientSecret,
      redirectUri
    });
    this._initialized = false;
  }

  isInitialized() {
    return this._initialized;
  }

  async initialize() {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      console.log('Got Spotify access token:', {
        token: data.body['access_token'].substring(0, 10) + '...',
        expiresIn: data.body['expires_in']
      });
      this.spotifyApi.setAccessToken(data.body['access_token']);
      this._initialized = true;
      console.log('Spotify API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Spotify API:', error);
      throw error;
    }
  }

  async getAlbumById(albumId) {
    try {
      if (!this._initialized || !this.spotifyApi.getAccessToken()) {
        console.log('Spotify API not initialized, initializing now...');
        await this.initialize();
      }

      console.log('Fetching album by ID:', albumId);
      const result = await this.spotifyApi.getAlbum(albumId);
      
      if (!result.body) {
        console.error('No album data in response:', result);
        return null;
      }

      console.log('Found album:', {
        name: result.body.name,
        label: result.body.label,
        artists: result.body.artists.map(a => a.name)
      });

      return result.body;
    } catch (error) {
      console.error('Error fetching album by ID:', error);
      throw error;
    }
  }

  async searchAlbumsByLabel(labelName) {
    try {
      // Ensure we have a valid token
      if (!this._initialized || !this.spotifyApi.getAccessToken()) {
        console.log('Spotify API not initialized, initializing now...');
        await this.initialize();
      }

      console.log(`Searching for releases from label: ${labelName}`);
      const albums = [];
      
      // Search for albums with the label name
      const searchResults = await this.spotifyApi.searchAlbums(`label:"${labelName}"`);
      
      if (!searchResults.body || !searchResults.body.albums) {
        console.log('No search results found');
        return albums;
      }

      // Process each album from the search results
      for (const item of searchResults.body.albums.items) {
        try {
          // Get full album details
          const album = await this.getAlbumById(item.id);
          if (album && album.label === labelName) {
            albums.push(album);
          } else if (album) {
            console.log(`Album ${item.id} has label "${album.label}", expected "${labelName}"`);
          }
        } catch (error) {
          console.error(`Error fetching album ${item.id}:`, error);
        }
      }

      console.log(`Found ${albums.length} releases for label: ${labelName}`);
      return albums;
    } catch (error) {
      console.error('Error searching albums by label:', error);
      throw error;
    }
  }

  async importReleases(label, albums) {
    try {
      console.log(`Importing ${albums.length} releases for label: ${label.name}`);
      const importedReleases = [];

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

          // Process artists
          const artistPromises = releaseData.artists.map(async (artistData) => {
            try {
              // Get full artist details including images
              const artistDetails = await this.spotifyApi.getArtist(artistData.id);
              const artistImages = artistDetails.body.images || [];
              const profileImage = artistImages.length > 0 ? artistImages[0].url : null;

              const [artist] = await Artist.findOrCreate({
                where: { id: artistData.id },
                defaults: {
                  id: artistData.id,
                  name: artistData.name,
                  spotify_url: artistData.external_urls?.spotify,
                  profile_image: profileImage,
                  label_id: label.id
                }
              });
              return artist;
            } catch (error) {
              console.error(`Error saving artist ${artistData.name}:`, error);
              return null;
            }
          });

          const savedArtists = (await Promise.all(artistPromises)).filter(a => a !== null);
          
          if (savedArtists.length === 0) {
            console.log(`Skipping release ${releaseData.name} - no artists could be saved`);
            continue;
          }

          // Get the primary artist (first artist)
          const primaryArtist = savedArtists[0];

          // Parse release date with proper precision handling
          let releaseDate = null;
          if (releaseData.release_date) {
            switch (releaseData.release_date_precision) {
              case 'day':
                releaseDate = releaseData.release_date;
                break;
              case 'month':
                releaseDate = `${releaseData.release_date}-01`;
                break;
              case 'year':
                releaseDate = `${releaseData.release_date}-01-01`;
                break;
            }
          }

          // Get highest quality artwork
          const artworkUrl = releaseData.images && releaseData.images.length > 0
            ? releaseData.images.sort((a, b) => b.width - a.width)[0].url
            : null;

          // Create the release
          const [release] = await Release.findOrCreate({
            where: { id: releaseData.id },
            defaults: {
              id: releaseData.id,
              name: releaseData.name,
              release_date: releaseDate,
              spotify_url: releaseData.external_urls.spotify,
              spotify_uri: releaseData.uri,
              artwork_url: artworkUrl,
              label_id: label.id,
              primary_artist_id: primaryArtist.id,
              total_tracks: releaseData.total_tracks
            }
          });

          console.log('Saved release:', release.name);

          // Associate all artists with the release
          await release.setArtists(savedArtists.map(a => a.id));
          
          // Process tracks
          if (releaseData.tracks && releaseData.tracks.items) {
            const trackPromises = releaseData.tracks.items.map(async (trackData) => {
              try {
                const [track] = await Track.findOrCreate({
                  where: { id: trackData.id },
                  defaults: {
                    id: trackData.id,
                    name: trackData.name,
                    duration: trackData.duration_ms,
                    preview_url: trackData.preview_url,
                    spotify_url: trackData.external_urls.spotify,
                    spotify_uri: trackData.uri,
                    release_id: release.id,
                    label_id: label.id,
                    track_number: trackData.track_number,
                    disc_number: trackData.disc_number
                  }
                });

                // Associate track with release artists
                await track.setArtists(savedArtists.map(a => a.id));
                console.log('Saved track:', track.name);
                return track;
              } catch (error) {
                console.error(`Error saving track ${trackData.name}:`, error);
                return null;
              }
            });

            await Promise.all(trackPromises);
          }

          importedReleases.push(release);
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
}

module.exports = SpotifyService;
