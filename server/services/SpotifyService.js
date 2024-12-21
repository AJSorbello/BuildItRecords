const axios = require('axios');
const querystring = require('querystring');
const { Label, Artist, Release } = require('../models');

const LABEL_PLAYLIST_MAP = {
  'records': 'RECORDS',
  'tech': 'TECH',
  'deep': 'DEEP'
};

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

      const response = await axios.post('https://accounts.spotify.com/api/token', data, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Spotify access token:', error);
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
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '5');
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        } else if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    throw lastError;
  }

  async makeSpotifyRequest(endpoint, method = 'GET', data = null) {
    const accessToken = await this.getAccessToken();
    
    return this.executeWithRetry(async () => {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        data: data
      };

      const response = await axios(config);
      return response.data;
    });
  }

  async getArtistsForLabel(labelSlug) {
    try {
      const playlistKey = LABEL_PLAYLIST_MAP[labelSlug];
      if (!playlistKey) {
        throw new Error(`Invalid label slug: ${labelSlug}`);
      }

      // Get the label's playlist ID from environment variables
      const playlistId = process.env[`SPOTIFY_${playlistKey}_PLAYLIST_ID`];
      if (!playlistId) {
        throw new Error(`No playlist ID found for label: ${labelSlug} (${playlistKey})`);
      }

      console.log(`Fetching artists for playlist: ${playlistId}`);

      // Get playlist tracks
      const data = await this.makeSpotifyRequest(`/playlists/${playlistId}/tracks`);
      
      // Extract unique artists
      const artistsMap = new Map();
      for (const item of data.items) {
        const track = item.track;
        if (!track) continue;

        for (const artist of track.artists) {
          if (!artistsMap.has(artist.id)) {
            // Get detailed artist info
            const artistData = await this.makeSpotifyRequest(`/artists/${artist.id}`);
            artistsMap.set(artist.id, {
              id: artist.id,
              name: artist.name,
              imageUrl: artistData.images[0]?.url,
              spotifyUrl: artist.external_urls.spotify,
              genres: artistData.genres,
              popularity: artistData.popularity
            });
          }
        }
      }

      return Array.from(artistsMap.values());
    } catch (error) {
      console.error('Error getting artists for label:', error);
      throw error;
    }
  }

  async getTracksForLabel(labelSlug) {
    try {
      const playlistKey = LABEL_PLAYLIST_MAP[labelSlug];
      if (!playlistKey) {
        throw new Error(`Invalid label slug: ${labelSlug}`);
      }

      const playlistId = process.env[`SPOTIFY_${playlistKey}_PLAYLIST_ID`];
      if (!playlistId) {
        throw new Error(`No playlist ID found for label: ${labelSlug} (${playlistKey})`);
      }

      console.log(`Fetching tracks for playlist: ${playlistId}`);

      const data = await this.makeSpotifyRequest(`/playlists/${playlistId}/tracks`);
      
      return data.items
        .filter(item => item.track)
        .map(item => ({
          id: item.track.id,
          title: item.track.name,
          releaseDate: item.track.album.release_date,
          albumArtUrl: item.track.album.images[0]?.url,
          spotifyUrl: item.track.external_urls.spotify,
          artists: item.track.artists.map(artist => ({
            id: artist.id,
            name: artist.name,
            spotifyUrl: artist.external_urls.spotify
          })),
          popularity: item.track.popularity
        }));
    } catch (error) {
      console.error('Error getting tracks for label:', error);
      throw error;
    }
  }

  async storeArtistsAndTracks(labelSlug) {
    try {
      console.log(`Starting sync for label: ${labelSlug}`);

      // Get or create label
      const [label] = await Label.findOrCreate({
        where: { slug: labelSlug },
        defaults: { 
          name: labelSlug.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }
      });

      // Get and store artists
      console.log('Fetching artists...');
      const artists = await this.getArtistsForLabel(labelSlug);
      console.log(`Found ${artists.length} artists`);

      for (const artistData of artists) {
        await Artist.upsert({
          spotifyId: artistData.id,
          name: artistData.name,
          imageUrl: artistData.imageUrl,
          spotifyUrl: artistData.spotifyUrl,
          labelId: label.id
        });
      }

      // Get and store tracks
      console.log('Fetching tracks...');
      const tracks = await this.getTracksForLabel(labelSlug);
      console.log(`Found ${tracks.length} tracks`);

      for (const trackData of tracks) {
        const artist = await Artist.findOne({
          where: { spotifyId: trackData.artists[0].id }
        });

        if (artist) {
          await Release.upsert({
            spotifyId: trackData.id,
            title: trackData.title,
            releaseDate: trackData.releaseDate,
            albumArtUrl: trackData.albumArtUrl,
            spotifyUrl: trackData.spotifyUrl,
            artistId: artist.id,
            labelId: label.id,
            popularity: trackData.popularity
          });
        }
      }

      return { 
        success: true,
        message: `Successfully synced ${tracks.length} tracks from ${artists.length} artists for ${label.name}`
      };
    } catch (error) {
      console.error('Error storing artists and tracks:', error);
      throw error;
    }
  }
}

module.exports = SpotifyService;
