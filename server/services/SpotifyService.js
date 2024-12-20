const axios = require('axios');
const RedisService = require('./RedisService');
const querystring = require('querystring');

class SpotifyService {
  constructor() {
    // Load environment variables
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      throw new Error('Spotify client credentials not found in environment variables');
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.baseUrl = 'https://api.spotify.com/v1';
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.rateLimitWindow = Date.now();
    this.requestCount = 0;
    this.MAX_REQUESTS_PER_WINDOW = 100;
    this.WINDOW_SIZE = 30000; // 30 seconds
  }

  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const data = querystring.stringify({ grant_type: 'client_credentials' });
      
      const response = await axios.post('https://accounts.spotify.com/api/token', 
        data,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Spotify access token:', error);
      throw error;
    }
  }

  async executeWithRetry(operation, maxRetries = 3) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (error.response && error.response.status === 401) {
          // Token expired, get a new one
          await this.getAccessToken();
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  async getPlaylist(playlistId) {
    const accessToken = await this.getAccessToken();
    return this.addToQueue(async () => {
      try {
        const response = await axios.get(
          `${this.baseUrl}/playlists/${playlistId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );
        return response.data;
      } catch (error) {
        console.error('Error getting playlist:', error);
        throw error;
      }
    });
  }

  async getTracksByLabel(label) {
    try {
      // Use the LABEL_URLS from the constants
      const playlistUrls = {
        'Build It Records': '37i9dQZF1DXcBWIGoYBM5M', // Top 50 Global
        'Build It Tech': '37i9dQZF1DX1lVhptIYRda',    // Beast Mode
        'Build It Deep': '37i9dQZF1DX4dyzvuaRJ0n'     // mint
      };

      const playlistUrl = playlistUrls[label];
      if (!playlistUrl) {
        throw new Error(`Invalid label: ${label}`);
      }

      // Extract playlist ID from URL
      const playlistId = playlistUrl;
      if (!playlistId) {
        throw new Error(`Invalid playlist URL for label: ${label}`);
      }

      // Get the playlist tracks
      const playlist = await this.getPlaylist(playlistId);
      if (!playlist || !playlist.tracks || !playlist.tracks.items) {
        throw new Error('Failed to get playlist tracks');
      }

      // Convert tracks to the expected format
      const tracks = await Promise.all(playlist.tracks.items.map(async (item) => {
        const track = item.track;
        if (!track) return null;

        // Get the artist details for each track
        const artists = track.artists.map(artist => ({
          id: artist.id,
          name: artist.name,
          spotifyUrl: artist.external_urls?.spotify || '',
          images: artist.images || []
        }));

        return {
          id: track.id,
          name: track.name,
          artists,
          album: {
            id: track.album.id,
            name: track.album.name,
            images: track.album.images || [],
            releaseDate: track.album.release_date,
            spotifyUrl: track.album.external_urls?.spotify || ''
          },
          duration: track.duration_ms,
          spotifyUrl: track.external_urls?.spotify || '',
          previewUrl: track.preview_url,
          popularity: track.popularity || 0,
          label
        };
      }));

      // Filter out null values and return
      return tracks.filter(track => track !== null);
    } catch (error) {
      console.error(`Error getting tracks for label ${label}:`, error);
      throw error;
    }
  }

  async importLabelTracks(label, batchSize = 50) {
    try {
      console.log(`[Spotify Service] Starting batch import for label: ${label}`);
      const tracks = await this.searchTracks(`label:"${label}"`, batchSize);
      
      const enrichedTracks = [];
      for (let i = 0; i < tracks.length; i += 5) {
        const batch = tracks.slice(i, i + 5);
        const batchResults = await Promise.all(
          batch.map(track => this.enrichTrackData(track))
        );
        enrichedTracks.push(...batchResults);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await this.redisService.setTracksForLabel(label, enrichedTracks);
      return enrichedTracks;
    } catch (error) {
      console.error('[Spotify Service] Error in batch import:', error.message);
      throw error;
    }
  }

  async enrichTrackData(track) {
    const [trackDetails, artistDetails, albumDetails] = await Promise.all([
      this.getTrackDetails(track.id),
      Promise.all(track.artists.map(artist => this.getArtistDetails(artist.id))),
      this.getAlbumDetails(track.album.id)
    ]);

    return {
      id: trackDetails.id,
      name: trackDetails.name,
      popularity: trackDetails.popularity,
      duration_ms: trackDetails.duration_ms,
      preview_url: trackDetails.preview_url,
      external_urls: trackDetails.external_urls,
      artists: artistDetails.map(artist => ({
        id: artist.id,
        name: artist.name,
        images: artist.images,
        genres: artist.genres,
        followers: artist.followers,
        popularity: artist.popularity
      })),
      album: {
        id: albumDetails.id,
        name: albumDetails.name,
        images: albumDetails.images,
        release_date: albumDetails.releaseDate,
        total_tracks: albumDetails.totalTracks,
        label: albumDetails.label
      }
    };
  }

  async searchTracks(query, limit = 50) {
    return this.addToQueue(async () => {
      const accessToken = await this.getAccessToken();
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: { q: query, type: 'track', limit },
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return response.data.tracks.items;
    });
  }

  async getArtistDetails(artistId) {
    return this.executeWithRetry(async () => {
      const accessToken = await this.getAccessToken();
      const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data;
    });
  }

  async getAlbumDetails(albumId) {
    return this.executeWithRetry(async () => {
      const accessToken = await this.getAccessToken();
      const response = await axios.get(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const album = response.data;
      return {
        id: album.id,
        name: album.name,
        artists: album.artists,
        releaseDate: album.release_date,
        totalTracks: album.total_tracks,
        images: album.images,
        label: album.label,
        copyrights: album.copyrights
      };
    });
  }

  async getAlbumTracks(albumId) {
    return this.executeWithRetry(async () => {
      const accessToken = await this.getAccessToken();
      const response = await axios.get(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Get full track details for each track
      const trackPromises = response.data.items.map(track => 
        this.getTrackDetails(track.id)
      );
      const tracks = await Promise.all(trackPromises);
      return tracks.filter(track => track !== null);
    });
  }

  async getTrackDetails(trackId) {
    return this.executeWithRetry(async () => {
      const accessToken = await this.getAccessToken();
      const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const track = response.data;
      return {
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => ({
          id: artist.id,
          name: artist.name,
          spotifyUrl: artist.external_urls.spotify
        })),
        album: {
          id: track.album.id,
          name: track.album.name,
          releaseDate: track.album.release_date,
          totalTracks: track.album.total_tracks,
          images: track.album.images
        },
        spotifyUrl: track.external_urls.spotify
      };
    });
  }

  async getArtistAlbums(artistId) {
    const accessToken = await this.getAccessToken();
    return this.addToQueue(async () => {
      try {
        const response = await axios.get(
          `${this.baseUrl}/artists/${artistId}/albums`,
          {
            params: {
              include_groups: 'album,single',
              limit: 5,  // Only get the 5 most recent albums
              market: 'US'
            },
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        return response.data.items.map(album => ({
          id: album.id,
          name: album.name,
          artists: album.artists.map(artist => ({
            id: artist.id,
            name: artist.name,
            spotifyUrl: artist.external_urls?.spotify || ''
          })),
          releaseDate: album.release_date,
          totalTracks: album.total_tracks,
          images: album.images || [],
          spotifyUrl: album.external_urls?.spotify || '',
          albumType: album.album_type,
          cached_at: Date.now()
        }));
      } catch (error) {
        console.error('Error getting artist albums:', error);
        throw error;
      }
    });
  }

  async addToQueue(operation) {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          if (this.requestCount >= this.MAX_REQUESTS_PER_WINDOW) {
            const waitTime = this.WINDOW_SIZE - (Date.now() - this.rateLimitWindow);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
          
          this.requestCount++;
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      this.requestQueue.push(task);
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;
    while (this.requestQueue.length > 0) {
      const task = this.requestQueue.shift();
      await task();
    }
    this.isProcessingQueue = false;
  }
}

module.exports = SpotifyService;
