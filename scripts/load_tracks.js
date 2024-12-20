const axios = require('axios');
const RedisService = require('../server/services/RedisService');
const config = require('../server/config/environment');

const LABELS = ['Build It Records', 'Build It Tech', 'Build It Deep'];
const LIMIT = 50;

async function getSpotifyToken() {
  const { clientId, clientSecret } = config.spotify;

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'client_credentials'
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        }
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Failed to get Spotify token:', error.message);
    throw error;
  }
}

async function searchTracks(token, label, offset = 0) {
  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/search`,
      {
        params: {
          q: `label:"${label}"`,
          type: 'track',
          limit: LIMIT,
          offset: offset
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.data.tracks;
  } catch (error) {
    console.error(`Failed to search tracks for ${label}:`, error.message);
    throw error;
  }
}

async function loadTracks() {
  const redisService = new RedisService();
  
  try {
    console.log('Connected to Redis');
    await redisService.init();

    console.log('Authenticating with Spotify...');
    const token = await getSpotifyToken();
    console.log('Successfully authenticated with Spotify\n');

    let totalTracksProcessed = 0;
    let totalTracksCached = 0;
    let failedTracks = 0;

    for (const label of LABELS) {
      console.log(`\nSearching for releases from ${label}`);
      let offset = 0;
      let tracks = [];

      while (true) {
        const result = await searchTracks(token, label, offset);
        if (!result.items || result.items.length === 0) break;

        tracks = tracks.concat(result.items);
        offset += result.items.length;
        console.log(`Fetched ${tracks.length} tracks so far...`);

        if (offset >= result.total) break;
      }

      console.log(`Found ${tracks.length} tracks for ${label}\n`);
      console.log(`Processing ${tracks.length} tracks for ${label}`);

      const labelTracks = [];
      for (const track of tracks) {
        try {
          const trackData = {
            id: track.id,
            name: track.name,
            artists: track.artists.map(artist => ({
              id: artist.id,
              name: artist.name
            })),
            album: {
              id: track.album.id,
              name: track.album.name,
              images: track.album.images,
              release_date: track.album.release_date
            },
            duration_ms: track.duration_ms,
            popularity: track.popularity,
            preview_url: track.preview_url,
            external_urls: track.external_urls,
            label: label,
            cached_at: Date.now()
          };

          await redisService.setTrackJson(track.id, trackData);
          labelTracks.push(trackData);
          console.log(`Cached: ${track.name}`);
          totalTracksCached++;
        } catch (error) {
          console.error(`Failed to cache track ${track.name}:`, error);
          failedTracks++;
        }
      }

      // Store tracks by label
      await redisService.setTracksForLabel(label, tracks);

      // Store individual tracks
      for (const track of tracks) {
        const trackKey = `track:${track.id}`;
        await redisService.setTrack(trackKey, track);
      }

      totalTracksProcessed += tracks.length;
      console.log('\nWaiting before processing next label...\n');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n=== Final Summary ===');
    console.log(`Successfully cached: ${totalTracksCached} tracks`);
    console.log(`Failed to cache: ${failedTracks} tracks\n`);

    const allTracks = await redisService.getAllTracks();
    console.log(`Total tracks in Redis: ${allTracks.length}\n`);

    // Display sample track data
    if (allTracks.length > 0) {
      console.log('Sample track data:');
      console.log(allTracks[0]);
    }

  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    console.log('\nRedis connection closed');
    process.exit(0);
  }
}

loadTracks();
