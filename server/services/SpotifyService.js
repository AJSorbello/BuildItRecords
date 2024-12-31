const axios = require('axios');
const querystring = require('querystring');
const { Label, Artist, Release } = require('../models');
const sequelize = require('../config/database');
const labelArtists = require('../data/labelArtists');

class SpotifyService {
  constructor() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Spotify client credentials not found in environment variables');
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = 'https://api.spotify.com/v1';
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

  async getArtistById(artistId, accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/artists/${artistId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const artist = response.data;
      return {
        id: artist.id,
        name: artist.name,
        spotifyUrl: artist.external_urls.spotify,
        images: artist.images,
        genres: artist.genres || [],
        followersCount: artist.followers.total,
        popularity: artist.popularity
      };
    } catch (error) {
      console.error(`Error getting artist ${artistId}:`, error);
      throw error;
    }
  }

  async getArtistTracks(artistId, accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/artists/${artistId}/top-tracks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          market: 'US'
        }
      });

      return response.data.tracks.map(track => ({
        id: track.id,
        name: track.name,
        trackTitle: track.name,
        artistId: track.artists[0].id,
        album: {
          id: track.album.id,
          name: track.album.name,
          images: track.album.images,
          release_date: track.album.release_date,
          external_urls: {
            spotify: track.album.external_urls.spotify
          }
        },
        spotifyUrl: track.external_urls.spotify,
        previewUrl: track.preview_url,
        duration_ms: track.duration_ms,
        popularity: track.popularity
      }));
    } catch (error) {
      console.error(`Error getting tracks for artist ${artistId}:`, error);
      throw error;
    }
  }

  async getTrackDetails(trackId, accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error getting track ${trackId}:`, error);
      throw error;
    }
  }

  async getAlbumDetails(albumId, accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/albums/${albumId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error getting album ${albumId}:`, error);
      throw error;
    }
  }

  async discoverArtistsFromTrack(trackId) {
    try {
      const accessToken = await this.getAccessToken();
      const track = await this.getTrackDetails(trackId, accessToken);
      const album = await this.getAlbumDetails(track.album.id, accessToken);
      
      console.log(`Found track: ${track.name}`);
      console.log(`From album: ${album.name}`);
      console.log(`Label: ${album.label}`);

      // Get all artists involved in the track
      const artistIds = new Set();
      track.artists.forEach(artist => artistIds.add(artist.id));

      // Get all artists from other tracks on the same album
      const albumArtists = new Set();
      album.tracks.items.forEach(track => {
        track.artists.forEach(artist => albumArtists.add(artist.id));
      });

      console.log(`Found ${artistIds.size} artists on track and ${albumArtists.size} artists on album`);

      // Get full details for all artists
      const artists = [];
      const allArtistIds = new Set([...artistIds, ...albumArtists]);
      
      for (const artistId of allArtistIds) {
        try {
          const artist = await this.getArtistById(artistId, accessToken);
          artists.push(artist);
        } catch (error) {
          console.error(`Error getting artist ${artistId}:`, error);
          continue;
        }
      }

      return {
        track,
        album,
        artists
      };
    } catch (error) {
      console.error(`Error discovering artists from track ${trackId}:`, error);
      throw error;
    }
  }

  async syncLabelFromTrack(trackId) {
    const transaction = await sequelize.transaction();

    try {
      const { track, album, artists } = await this.discoverArtistsFromTrack(trackId);
      const results = {
        artists: [],
        tracks: []
      };

      // Determine label from album
      const labelName = album.label.toLowerCase();
      let labelId;
      
      // Extended label mapping with more variations
      const labelMappings = {
        'build it records': 'build-it-records',
        'builditrecords': 'build-it-records',
        'build-it-records': 'build-it-records',
        'build it tech': 'build-it-tech',
        'buildittech': 'build-it-tech',
        'build-it-tech': 'build-it-tech',
        'build it deep': 'build-it-deep',
        'builditdeep': 'build-it-deep',
        'build-it-deep': 'build-it-deep'
      };
      
      // Try to find a direct match first
      labelId = labelMappings[labelName];
      
      // If no direct match, try to find a partial match
      if (!labelId) {
        for (const [key, value] of Object.entries(labelMappings)) {
          if (labelName.includes(key.replace(/[-\s]/g, ''))) {
            labelId = value;
            break;
          }
        }
      }
      
      if (!labelId) {
        throw new Error(`Unknown label: ${album.label}`);
      }

      // Find or create label
      const [label] = await Label.findOrCreate({
        where: { id: labelId },
        defaults: {
          displayName: album.label,
          description: `Releases from ${album.label}`
        },
        transaction
      });

      // Create or update artists
      for (const artistData of artists) {
        let artist = await Artist.findOne({
          where: { id: artistData.id },
          transaction
        });

        if (artist) {
          await artist.update({
            ...artistData,
            recordLabel: label.id
          }, { transaction });
          results.artists.push({ artist, created: false });
        } else {
          artist = await Artist.create({
            ...artistData,
            recordLabel: label.id
          }, { transaction });
          results.artists.push({ artist, created: true });
        }

        // Get and save their tracks
        const tracks = await this.getArtistTracks(artist.id, await this.getAccessToken());
        for (const trackData of tracks) {
          let release = await Release.findOne({
            where: { id: trackData.id },
            transaction
          });

          const releaseData = {
            ...trackData,
            recordLabel: label.id,
            artistId: artist.id
          };

          if (release) {
            await release.update(releaseData, { transaction });
            results.tracks.push({ track: release, created: false });
          } else {
            release = await Release.create(releaseData, { transaction });
            results.tracks.push({ track: release, created: true });
          }
        }
      }

      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      console.error(`Error syncing from track ${trackId}:`, error);
      throw error;
    }
  }

  async syncLabelArtists(labelId) {
    const transaction = await sequelize.transaction();

    try {
      const results = {
        artists: [],
        tracks: []
      };

      // Find the label
      const label = await Label.findOne({ 
        where: { id: labelId },
        transaction
      });

      if (!label) {
        throw new Error(`Label ${labelId} not found`);
      }

      // Get list of artist IDs for this label
      const artistIds = labelArtists[labelId] || [];
      if (artistIds.length === 0) {
        console.log(`No artists configured for label ${labelId}`);
        return results;
      }

      console.log(`Found ${artistIds.length} artists for label ${labelId}`);
      const accessToken = await this.getAccessToken();

      // Get artist details and tracks
      for (const artistId of artistIds) {
        try {
          // Get artist details from Spotify
          const artistData = await this.getArtistById(artistId, accessToken);
          console.log(`Processing artist: ${artistData.name}`);

          // Create or update artist
          let artist = await Artist.findOne({
            where: { id: artistId },
            transaction
          });

          if (artist) {
            await artist.update({
              ...artistData,
              recordLabel: label.id
            }, { transaction });
            results.artists.push({ artist, created: false });
          } else {
            artist = await Artist.create({
              ...artistData,
              recordLabel: label.id
            }, { transaction });
            results.artists.push({ artist, created: true });
          }

          // Get and save tracks
          const tracksData = await this.getArtistTracks(artist.id, accessToken);
          for (const trackData of tracksData) {
            let track = await Release.findOne({
              where: { id: trackData.id },
              transaction
            });

            const trackToSave = {
              ...trackData,
              recordLabel: label.id,
              artistId: artist.id
            };

            if (track) {
              await track.update(trackToSave, { transaction });
              results.tracks.push({ track, created: false });
            } else {
              track = await Release.create(trackToSave, { transaction });
              results.tracks.push({ track, created: true });
            }
          }
        } catch (error) {
          console.error(`Error processing artist ${artistId}:`, error);
          continue;
        }
      }

      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      console.error(`Error syncing artists for label ${labelId}:`, error);
      throw error;
    }
  }

  async searchTracksByLabel(labelName, accessToken) {
    try {
      const tracks = [];
      let offset = 0;
      const limit = 50;
      let total = null;

      // Keep fetching until we have all tracks
      while (total === null || offset < total) {
        const response = await axios.get(`${this.baseUrl}/search`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params: {
            q: `label:"${labelName}"`,
            type: 'track',
            limit,
            offset
          }
        });

        const { items, total: totalTracks } = response.data.tracks;
        total = totalTracks;

        // Get full track details and album info for each track
        for (const track of items) {
          const albumResponse = await axios.get(`${this.baseUrl}/albums/${track.album.id}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          // Only include tracks where album label matches
          if (albumResponse.data.label && 
              albumResponse.data.label.toLowerCase().includes(labelName.toLowerCase())) {
            tracks.push({
              ...track,
              album: albumResponse.data
            });
          }
        }

        offset += limit;
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return tracks;
    } catch (error) {
      console.error(`Error searching tracks for label ${labelName}:`, error);
      throw error;
    }
  }

  async syncAllLabelTracks(labelId) {
    const transaction = await sequelize.transaction();

    try {
      // Find the label
      const label = await Label.findOne({ 
        where: { id: labelId },
        transaction
      });

      if (!label) {
        throw new Error(`Label ${labelId} not found`);
      }

      const results = {
        artists: [],
        tracks: []
      };

      const accessToken = await this.getAccessToken();
      
      // Get all tracks for this label
      console.log(`Searching for tracks from ${label.displayName}...`);
      const tracks = await this.searchTracksByLabel(label.displayName, accessToken);
      console.log(`Found ${tracks.length} tracks for ${label.displayName}`);

      // Keep track of processed artists to avoid duplicates
      const processedArtistIds = new Set();

      // Process each track and its artists
      for (const trackData of tracks) {
        try {
          // Process the track's artists
          for (const artistData of trackData.artists) {
            // Skip if we've already processed this artist
            if (processedArtistIds.has(artistData.id)) {
              continue;
            }

            let artist = await Artist.findOne({
              where: { id: artistData.id },
              transaction
            });

            // Get full artist details from Spotify
            const artistResponse = await axios.get(`${this.baseUrl}/artists/${artistData.id}`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });

            const fullArtistData = artistResponse.data;

            if (!artist) {
              // Create new artist
              artist = await Artist.create({
                id: fullArtistData.id,
                name: fullArtistData.name,
                spotifyUrl: fullArtistData.external_urls.spotify,
                images: fullArtistData.images,
                genres: fullArtistData.genres || [],
                followersCount: fullArtistData.followers.total,
                popularity: fullArtistData.popularity,
                recordLabel: label.id
              }, { transaction });

              results.artists.push({ artist, created: true });
              console.log(`Created new artist: ${artist.name}`);
            } else {
              // Update existing artist
              await artist.update({
                name: fullArtistData.name,
                spotifyUrl: fullArtistData.external_urls.spotify,
                images: fullArtistData.images,
                genres: fullArtistData.genres || [],
                followersCount: fullArtistData.followers.total,
                popularity: fullArtistData.popularity,
                recordLabel: label.id
              }, { transaction });

              results.artists.push({ artist, created: false });
              console.log(`Updated artist: ${artist.name}`);
            }

            processedArtistIds.add(artistData.id);
          }

          // Process the track
          let track = await Release.findOne({
            where: { id: trackData.id },
            transaction
          });

          const trackToSave = {
            id: trackData.id,
            name: trackData.name,
            trackTitle: trackData.name,
            artistId: trackData.artists[0].id, // Primary artist
            featured: trackData.artists.length > 1,
            album: {
              id: trackData.album.id,
              name: trackData.album.name,
              images: trackData.album.images,
              release_date: trackData.album.release_date,
              external_urls: trackData.album.external_urls
            },
            spotifyUrl: trackData.external_urls.spotify,
            previewUrl: trackData.preview_url,
            recordLabel: label.id
          };

          if (track) {
            await track.update(trackToSave, { transaction });
            results.tracks.push({ track, created: false });
            console.log(`Updated track: ${track.name}`);
          } else {
            track = await Release.create(trackToSave, { transaction });
            results.tracks.push({ track, created: true });
            console.log(`Created new track: ${track.name}`);
          }
        } catch (error) {
          console.error(`Error processing track ${trackData.id}:`, error);
          continue;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      console.error(`Error syncing tracks for label ${labelId}:`, error);
      throw error;
    }
  }

  async getArtistsWithReleases(artistIds) {
    try {
      const accessToken = await this.getAccessToken();
      const results = [];
      
      // Process artists in batches of 5 to avoid rate limiting
      for (let i = 0; i < artistIds.length; i += 5) {
        const batch = artistIds.slice(i, i + 5);
        const batchPromises = batch.map(async (artistId) => {
          try {
            const artist = await this.getArtistById(artistId, accessToken);
            const tracks = await this.getArtistTracks(artistId, accessToken);
            
            // Get album details for each track
            const releases = await Promise.all(
              tracks.map(async (track) => {
                const album = await this.getAlbumDetails(track.album.id, accessToken);
                return {
                  ...track,
                  album: {
                    ...track.album,
                    ...album,
                    label: album.label
                  }
                };
              })
            );
            
            return {
              ...artist,
              releases
            };
          } catch (error) {
            console.error(`Error processing artist ${artistId}:`, error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(Boolean));
        
        // Add a small delay between batches to avoid rate limiting
        if (i + 5 < artistIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching artists with releases:', error);
      throw error;
    }
  }
}

module.exports = SpotifyService;
