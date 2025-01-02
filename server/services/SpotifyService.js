const axios = require('axios');
const querystring = require('querystring');
const { Label, Artist, Release, Track } = require('../models');
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
    this.accessToken = null;
  }

  async initialize() {
    try {
      console.log('Initializing SpotifyService...');
      this.accessToken = await this.getAccessToken();
      console.log('SpotifyService initialized with access token');
      return true;
    } catch (error) {
      console.error('Failed to initialize SpotifyService:', error.response?.data || error.message);
      throw new Error('Failed to initialize Spotify service: ' + (error.response?.data?.error || error.message));
    }
  }

  async getAccessToken() {
    try {
      console.log('Getting Spotify access token...');
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const data = querystring.stringify({ grant_type: 'client_credentials' });

      const response = await axios.post('https://accounts.spotify.com/api/token', data, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('Successfully obtained Spotify access token');
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Spotify access token:', error.response?.data || error.message);
      throw new Error('Failed to get Spotify access token: ' + (error.response?.data?.error || error.message));
    }
  }

  async getArtistById(artistId, accessToken) {
    try {
      console.log(`Getting Spotify artist with ID: ${artistId}`);
      
      const response = await axios.get(`${this.baseUrl}/artists/${artistId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const artist = response.data;
      console.log(`Successfully retrieved artist: ${artist.name}`);
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
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.log('Access token expired, refreshing...');
        const newAccessToken = await this.getAccessToken();
        // Retry the request once with new token
        return this.getArtistById(artistId, newAccessToken);
      }
      
      console.error(`Error getting artist ${artistId}:`, error.response?.data || error.message);
      throw new Error('Failed to get Spotify artist: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async getArtistTracks(artistId, accessToken) {
    try {
      console.log(`Getting Spotify tracks for artist with ID: ${artistId}`);
      
      const response = await axios.get(`${this.baseUrl}/artists/${artistId}/top-tracks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          market: 'US'
        }
      });

      const tracks = response.data.tracks.map(track => ({
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
      console.log(`Successfully retrieved ${tracks.length} tracks for artist ${artistId}`);
      return tracks;
    } catch (error) {
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.log('Access token expired, refreshing...');
        const newAccessToken = await this.getAccessToken();
        // Retry the request once with new token
        return this.getArtistTracks(artistId, newAccessToken);
      }
      
      console.error(`Error getting tracks for artist ${artistId}:`, error.response?.data || error.message);
      throw new Error('Failed to get Spotify tracks: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async getTrackDetails(trackId, accessToken) {
    try {
      console.log(`Getting Spotify track with ID: ${trackId}`);
      
      const response = await axios.get(`${this.baseUrl}/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log(`Successfully retrieved track: ${response.data.name}`);
      return response.data;
    } catch (error) {
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.log('Access token expired, refreshing...');
        const newAccessToken = await this.getAccessToken();
        // Retry the request once with new token
        return this.getTrackDetails(trackId, newAccessToken);
      }
      
      console.error(`Error getting track ${trackId}:`, error.response?.data || error.message);
      throw new Error('Failed to get Spotify track: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async getAlbumDetails(albumId, accessToken) {
    try {
      console.log(`Getting Spotify album with ID: ${albumId}`);
      
      const response = await axios.get(`${this.baseUrl}/albums/${albumId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log(`Successfully retrieved album: ${response.data.name}`);
      return response.data;
    } catch (error) {
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.log('Access token expired, refreshing...');
        const newAccessToken = await this.getAccessToken();
        // Retry the request once with new token
        return this.getAlbumDetails(albumId, newAccessToken);
      }
      
      console.error(`Error getting album ${albumId}:`, error.response?.data || error.message);
      throw new Error('Failed to get Spotify album: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async discoverArtistsFromTrack(trackId) {
    try {
      console.log(`Discovering artists from track with ID: ${trackId}`);
      
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
          console.error(`Error getting artist ${artistId}:`, error.response?.data || error.message);
          continue;
        }
      }

      return {
        track,
        album,
        artists
      };
    } catch (error) {
      console.error(`Error discovering artists from track ${trackId}:`, error.response?.data || error.message);
      throw new Error('Failed to discover artists from track: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async syncLabelFromTrack(trackId) {
    const transaction = await sequelize.transaction();

    try {
      console.log(`Syncing label from track with ID: ${trackId}`);
      
      const { track, album, artists } = await this.discoverArtistsFromTrack(trackId);
      const results = {
        artists: [],
        tracks: []
      };

      // Determine label from album
      const labelName = album.label.toLowerCase();
      let labelId;
      
      // Label mappings with correct names
      const labelMappings = {
        'build it records': 'buildit-records',
        'builditrecords': 'buildit-records',
        'build-it-records': 'buildit-records',
        'build it tech': 'buildit-tech',
        'buildittech': 'buildit-tech',
        'build-it-tech': 'buildit-tech',
        'build it deep': 'buildit-deep',
        'builditdeep': 'buildit-deep',
        'build-it-deep': 'buildit-deep'
      };

      const labelDisplayNames = {
        'buildit-records': 'Build It Records',
        'buildit-tech': 'Build It Tech',
        'buildit-deep': 'Build It Deep'
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

      // Find or create label with correct display name
      const [label] = await Label.findOrCreate({
        where: { id: labelId },
        defaults: {
          name: labelDisplayNames[labelId],
          display_name: labelDisplayNames[labelId],
          slug: labelId
        },
        transaction
      });

      // Create or update artists
      for (const artistData of artists) {
        let artist = await Artist.findOne({
          where: { id: artistData.id },
          transaction
        });

        if (!artist) {
          artist = await Artist.create({
            id: artistData.id,
            name: artistData.name,
            spotify_url: artistData.external_urls.spotify,
            images: artistData.images,
            label_id: label.id
          }, { transaction });
          results.artists.push(artist);
        }

        // Create or update the album/release
        const [release] = await Release.findOrCreate({
          where: { id: album.id },
          defaults: {
            title: album.name,
            artist_id: artist.id,
            label_id: label.id,
            release_date: album.release_date,
            images: album.images,
            spotify_url: album.external_urls.spotify,
            external_urls: album.external_urls,
            external_ids: album.external_ids,
            popularity: album.popularity,
            total_tracks: album.total_tracks
          },
          transaction
        });

        // Create or update the track
        const [trackRecord] = await Track.findOrCreate({
          where: { id: track.id },
          defaults: {
            title: track.name,
            duration_ms: track.duration_ms,
            preview_url: track.preview_url,
            spotify_url: track.external_urls.spotify,
            external_urls: track.external_urls,
            uri: track.uri,
            release_id: release.id,
            artist_id: artist.id,
            label_id: label.id
          },
          transaction
        });

        results.tracks.push(trackRecord);
      }

      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      console.error(`Error syncing label from track ${trackId}:`, error);
      throw error;
    }
  }

  async syncLabelArtists(labelId) {
    const transaction = await sequelize.transaction();

    try {
      console.log(`Syncing artists for label with ID: ${labelId}`);
      
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

          // Get and save their tracks
          const tracks = await this.getArtistTracks(artist.id, accessToken);
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
        } catch (error) {
          console.error(`Error processing artist ${artistId}:`, error.response?.data || error.message);
          continue;
        }
      }

      await transaction.commit();
      console.log(`Successfully synced artists for label ${labelId}`);
      return results;
    } catch (error) {
      await transaction.rollback();
      console.error(`Error syncing artists for label ${labelId}:`, error.response?.data || error.message);
      throw new Error('Failed to sync artists for label: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async searchTracksByLabel(labelName, accessToken) {
    try {
      console.log(`Searching tracks for label: ${labelName}`);
      
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

      console.log(`Found ${tracks.length} tracks for label ${labelName}`);
      return tracks;
    } catch (error) {
      console.error(`Error searching tracks for label ${labelName}:`, error.response?.data || error.message);
      throw new Error('Failed to search tracks for label: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async syncAllLabelTracks(labelId) {
    const transaction = await sequelize.transaction();

    try {
      console.log(`Syncing all tracks for label with ID: ${labelId}`);
      
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
              external_urls: {
                spotify: trackData.album.external_urls.spotify
              }
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
          console.error(`Error processing track ${trackData.id}:`, error.response?.data || error.message);
          continue;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await transaction.commit();
      console.log(`Successfully synced all tracks for label ${labelId}`);
      return results;
    } catch (error) {
      await transaction.rollback();
      console.error(`Error syncing tracks for label ${labelId}:`, error.response?.data || error.message);
      throw new Error('Failed to sync tracks for label: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async getArtistsWithReleases(artistIds) {
    try {
      console.log(`Getting artists with releases for IDs: ${artistIds.join(', ')}`);
      
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
            console.error(`Error processing artist ${artistId}:`, error.response?.data || error.message);
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
      
      console.log(`Successfully retrieved artists with releases for IDs: ${artistIds.join(', ')}`);
      return results;
    } catch (error) {
      console.error('Error fetching artists with releases:', error.response?.data || error.message);
      throw new Error('Failed to fetch artists with releases: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async getTracksByLabel(labelId) {
    try {
      console.log(`Getting tracks for label with ID: ${labelId}`);
      
      const label = await Label.findByPk(labelId);
      if (!label) {
        throw new Error('Label not found');
      }

      const releases = await Release.findAll({
        where: {
          recordLabel: labelId
        },
        include: [{
          model: Artist,
          attributes: ['id', 'name', 'spotifyUrl', 'images']
        }],
        order: [['createdAt', 'DESC']]
      });

      console.log(`Successfully retrieved ${releases.length} tracks for label ${labelId}`);
      return releases;
    } catch (error) {
      console.error('Error getting tracks by label:', error.response?.data || error.message);
      throw new Error('Failed to get tracks by label: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async getTracksByLabel(labelId) {
    try {
      console.log(`Getting tracks for label with ID: ${labelId}`);
      
      const label = await Label.findByPk(labelId);
      if (!label) {
        throw new Error('Label not found');
      }

      const releases = await Release.findAll({
        where: {
          recordLabel: labelId
        },
        include: [{
          model: Track,
          include: [{
            model: Artist,
            attributes: ['id', 'name', 'spotifyUrl', 'images']
          }]
        }]
      });

      let tracks = [];
      for (const release of releases) {
        if (release.Tracks) {
          tracks = tracks.concat(release.Tracks);
        }
      }

      console.log(`Successfully retrieved ${tracks.length} tracks for label ${labelId}`);
      return tracks;
    } catch (error) {
      console.error('Error getting tracks by label:', error.response?.data || error.message);
      throw new Error('Failed to get tracks by label: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async createTrackFromSpotify(trackData, releaseId, artistId, labelId) {
    try {
      console.log(`Creating track from Spotify data: ${trackData.name}`);
      
      const [track, created] = await Track.findOrCreate({
        where: {
          uri: trackData.uri
        },
        defaults: {
          name: trackData.name,
          duration_ms: trackData.duration_ms,
          preview_url: trackData.preview_url,
          spotifyUrl: trackData.external_urls?.spotify,
          uri: trackData.uri,
          releaseId: releaseId,
          artistId: artistId,
          recordLabel: labelId
        }
      });

      console.log(`Successfully created track: ${track.name}`);
      return track;
    } catch (error) {
      console.error('Error creating track:', error.response?.data || error.message);
      throw new Error('Failed to create track: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async importReleasesByArtist(labelId, artistId) {
    try {
      console.log(`Importing releases for artist with ID: ${artistId}`);
      
      const accessToken = await this.getAccessToken();
      const artist = await this.getArtistById(artistId, accessToken);
      const albums = await this.getArtistAlbums(artistId, accessToken);
      
      console.log(`Found ${albums.length} albums for artist ${artist.name}`);

      const transaction = await sequelize.transaction();

      try {
        // Create or update artist
        const [artistRecord] = await Artist.upsert({
          id: artist.id,
          name: artist.name,
          images: artist.images,
          spotifyUrl: artist.external_urls?.spotify,
          recordLabel: labelId
        }, { transaction });

        console.log('Artist record created/updated:', artistRecord.name);

        // Process each album
        for (const album of albums) {
          console.log(`Processing album: ${album.name}`);
          
          const [release] = await Release.upsert({
            id: album.id,
            title: album.name,
            releaseDate: album.release_date,
            images: album.images,
            artworkUrl: album.images?.[0]?.url,
            spotifyUrl: album.external_urls?.spotify,
            external_urls: album.external_urls,
            external_ids: album.external_ids,
            popularity: album.popularity,
            total_tracks: album.total_tracks,
            artistId: artistRecord.id,
            recordLabel: labelId
          }, { transaction });

          console.log('Release record created/updated:', release.title);

          // Get tracks for this album
          const tracks = await this.getAlbumTracks(album.id, accessToken);
          
          // Process each track
          for (const track of tracks) {
            await Track.upsert({
              id: track.id,
              name: track.name,
              duration_ms: track.duration_ms,
              preview_url: track.preview_url,
              external_urls: track.external_urls,
              external_ids: track.external_ids,
              popularity: track.popularity,
              spotifyUrl: track.external_urls?.spotify,
              uri: track.uri,
              releaseId: release.id,
              artistId: artistRecord.id,
              recordLabel: labelId
            }, { transaction });
          }
        }

        await transaction.commit();
        console.log(`Successfully imported releases for artist ${artist.name}`);
        
        return {
          success: true,
          artist: artistRecord,
          albumCount: albums.length
        };
      } catch (error) {
        await transaction.rollback();
        console.error('Error importing releases:', error.response?.data || error.message);
        throw new Error('Failed to import releases: ' + (error.response?.data?.error?.message || error.message));
      }
    } catch (error) {
      console.error('Error importing releases:', error.response?.data || error.message);
      throw new Error('Failed to import releases: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async searchAlbums(query, limit = 50) {
    try {
      console.log(`Searching Spotify albums with query: "${query}", limit: ${limit}`);
      
      if (!this.accessToken) {
        console.log('No access token found, initializing SpotifyService...');
        await this.initialize();
      }

      const response = await axios.get(`${this.baseUrl}/search`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: {
          q: query,
          type: 'album',
          limit: limit,
          market: 'US'
        }
      });

      const albums = response.data.albums.items;
      console.log(`Found ${albums.length} albums matching query "${query}"`);
      return albums;
    } catch (error) {
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.log('Access token expired, refreshing...');
        await this.initialize();
        // Retry the search once with new token
        return this.searchAlbums(query, limit);
      }
      
      console.error('Error searching albums:', error.response?.data || error.message);
      throw new Error('Failed to search Spotify albums: ' + (error.response?.data?.error?.message || error.message));
    }
  }

  async getArtist(artistId) {
    try {
      console.log(`Getting Spotify artist with ID: ${artistId}`);
      
      if (!this.accessToken) {
        console.log('No access token found, initializing SpotifyService...');
        await this.initialize();
      }

      const response = await axios.get(`${this.baseUrl}/artists/${artistId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      console.log(`Successfully retrieved artist: ${response.data.name}`);
      return response.data;
    } catch (error) {
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.log('Access token expired, refreshing...');
        await this.initialize();
        // Retry the request once with new token
        return this.getArtist(artistId);
      }
      
      console.error(`Error getting artist ${artistId}:`, error.response?.data || error.message);
      throw new Error('Failed to get Spotify artist: ' + (error.response?.data?.error?.message || error.message));
    }
  }
}

module.exports = SpotifyService;
