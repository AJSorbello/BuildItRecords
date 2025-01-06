const SpotifyWebApi = require('spotify-web-api-node');
const { Artist, Release, Track } = require('../models');

class SpotifyService {
  constructor(config) {
    this.spotifyApi = new SpotifyWebApi({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri
    });
  }

  async initialize() {
    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body['access_token']);
    } catch (error) {
      console.error('Failed to initialize Spotify API:', error);
      throw error;
    }
  }

  async fetchArtist(artistId) {
    const response = await this.spotifyApi.getArtist(artistId);
    return response.body;
  }

  async fetchAlbum(albumId) {
    const response = await this.spotifyApi.getAlbum(albumId);
    return response.body;
  }

  async fetchPlaylistTracks(playlistId) {
    const response = await this.spotifyApi.getPlaylistTracks(playlistId);
    return response.body.items;
  }

  async fetchArtistReleases(artistId) {
    const response = await this.spotifyApi.getArtistAlbums(artistId, { limit: 50 });
    return response.body.items;
  }

  async saveArtist(spotifyData, labelId) {
    try {
      const [artist] = await Artist.findOrCreate({
        where: { id: spotifyData.id },
        defaults: {
          name: spotifyData.name,
          label_id: labelId,
          spotify_url: spotifyData.external_urls.spotify,
          image_url: spotifyData.images?.[0]?.url || null
        }
      });
      return artist;
    } catch (error) {
      console.error('Error saving artist:', error);
      throw error;
    }
  }

  async saveRelease(spotifyData, artistId, labelId) {
    try {
      const [release] = await Release.findOrCreate({
        where: { id: spotifyData.id },
        defaults: {
          title: spotifyData.name,
          primary_artist_id: artistId,
          label_id: labelId,
          release_date: new Date(spotifyData.release_date),
          type: spotifyData.album_type,
          status: 'published',
          spotify_url: spotifyData.external_urls.spotify,
          image_url: spotifyData.images?.[0]?.url || null
        }
      });
      return release;
    } catch (error) {
      console.error('Error saving release:', error);
      throw error;
    }
  }

  async saveTrack(trackData, releaseId, labelId) {
    try {
      const [track] = await Track.findOrCreate({
        where: { id: trackData.id },
        defaults: {
          name: trackData.name,
          duration: trackData.duration_ms,
          track_number: trackData.track_number,
          disc_number: trackData.disc_number,
          isrc: trackData.external_ids?.isrc,
          preview_url: trackData.preview_url,
          spotify_url: trackData.external_urls.spotify,
          release_id: releaseId,
          label_id: labelId
        }
      });
      return track;
    } catch (error) {
      console.error('Error saving track:', error);
      throw error;
    }
  }

  async importArtistData(artistId, labelId) {
    try {
      // Fetch and save artist
      const artistData = await this.fetchArtist(artistId);
      const artist = await this.saveArtist(artistData, labelId);

      // Fetch and save releases
      const releases = await this.fetchArtistReleases(artistId);
      for (const releaseData of releases) {
        const release = await this.saveRelease(releaseData, artist.id, labelId);

        // Fetch and save tracks
        const albumData = await this.fetchAlbum(releaseData.id);
        for (const trackData of albumData.tracks.items) {
          await this.saveTrack(trackData, release.id, labelId);
        }
      }

      return artist;
    } catch (error) {
      console.error('Error importing artist data:', error);
      throw error;
    }
  }
}

module.exports = SpotifyService;
