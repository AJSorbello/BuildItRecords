const axios = require('axios');
const querystring = require('querystring');
const SpotifyWebApi = require('spotify-web-api-node');
const { Label, Artist, Release, Track } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// Label mapping constants
const LABEL_SLUGS = {
  'buildit-records': 'buildit-records',
  'buildit': 'buildit-records',
  'br': 'buildit-records',
  'records': 'buildit-records',
  'tech': 'buildit-tech',
  'deep': 'buildit-deep'
};

const LABEL_MAP = {
  'Build It Records': 'buildit-records',
  'Build It Tech': 'buildit-tech',
  'Build It Deep': 'buildit-deep',
  'Records': 'buildit-records',
  'Tech': 'buildit-tech',
  'Deep': 'buildit-deep',
  'buildit-records': 'buildit-records',
  'buildit-tech': 'buildit-tech',
  'buildit-deep': 'buildit-deep'
};

const LABEL_PLAYLISTS = {
  'buildit-records': process.env.SPOTIFY_LABEL_BUILDIT_RECORDS_PLAYLIST_ID,
  'buildit-tech': process.env.SPOTIFY_LABEL_BUILDIT_TECH_PLAYLIST_ID,
  'buildit-deep': process.env.SPOTIFY_LABEL_BUILDIT_DEEP_PLAYLIST_ID
};

class SpotifyService {
  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
    this.tokenExpirationTime = null;
    this.labelCache = new Map();
  }

  async initialize() {
    try {
      console.log('Initializing Spotify API...');
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        throw new Error('Missing Spotify credentials in environment variables');
      }

      const data = await this.spotifyApi.clientCredentialsGrant();
      console.log('Spotify API initialized successfully');
      
      this.spotifyApi.setAccessToken(data.body['access_token']);
      this.tokenExpirationTime = Date.now() + (data.body['expires_in'] * 1000);
      
      return true;
    } catch (error) {
      console.error('Error initializing Spotify API:', error);
      throw error;
    }
  }

  async refreshTokenIfNeeded() {
    try {
      if (Date.now() >= this.tokenExpirationTime - 1000) {
        console.log('Refreshing Spotify access token...');
        const data = await this.spotifyApi.clientCredentialsGrant();
        this.spotifyApi.setAccessToken(data.body['access_token']);
        this.tokenExpirationTime = Date.now() + (data.body['expires_in'] * 1000);
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  async getTrack(trackId) {
    try {
      await this.refreshTokenIfNeeded();
      console.log(`Fetching track data for ID: ${trackId}`);
      const response = await this.spotifyApi.getTrack(trackId);
      return response.body;
    } catch (error) {
      console.error(`Error getting track ${trackId}:`, error);
      throw error;
    }
  }

  async getArtist(artistId) {
    try {
      await this.refreshTokenIfNeeded();
      console.log(`Fetching artist data for ID: ${artistId}`);
      const response = await this.spotifyApi.getArtist(artistId);
      return response.body;
    } catch (error) {
      console.error(`Error getting artist ${artistId}:`, error);
      throw error;
    }
  }

  async getAlbum(albumId) {
    try {
      await this.refreshTokenIfNeeded();
      console.log(`Fetching album data for ID: ${albumId}`);
      const response = await this.spotifyApi.getAlbum(albumId);
      return response.body;
    } catch (error) {
      console.error(`Error getting album ${albumId}:`, error);
      throw error;
    }
  }

  async getAlbumTracks(albumId) {
    try {
      await this.refreshTokenIfNeeded();
      console.log(`Fetching tracks for album ID: ${albumId}`);
      
      let allTracks = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        console.log(`Fetching tracks batch with offset ${offset}`);
        const response = await this.spotifyApi.getAlbumTracks(albumId, {
          limit,
          offset
        });

        if (!response.body || !response.body.items) {
          console.log('No more tracks found');
          break;
        }

        console.log(`Found ${response.body.items.length} tracks in this batch`);
        allTracks = allTracks.concat(response.body.items);
        
        if (response.body.next) {
          offset += limit;
        } else {
          hasMore = false;
        }
      }

      console.log(`Total tracks found for album: ${allTracks.length}`);
      return allTracks;
    } catch (error) {
      console.error(`Error getting album tracks for ${albumId}:`, error);
      throw error;
    }
  }

  async getPlaylistTracks(playlistId) {
    try {
      await this.refreshTokenIfNeeded();
      console.log(`Fetching playlist tracks for ID: ${playlistId}`);
      
      const response = await this.spotifyApi.getPlaylistTracks(playlistId);
      return response.body.items;
    } catch (error) {
      console.error(`Error getting playlist tracks for ${playlistId}:`, error);
      throw error;
    }
  }

  async getLabelArtists(labelId) {
    const playlistId = LABEL_PLAYLISTS[labelId];
    if (!playlistId) {
      throw new Error(`No playlist found for label: ${labelId}`);
    }

    const tracks = await this.getPlaylistTracks(playlistId);
    const artistIds = new Set();
    
    tracks.forEach(track => {
      track.track.artists.forEach(artist => {
        artistIds.add(artist.id);
      });
    });

    return Array.from(artistIds);
  }

  async validateArtistLabel(artistId, labelId) {
    try {
      // Check if artist already exists in our database
      const existingArtist = await Artist.findOne({
        where: { 
          spotify_id: artistId
        }
      });

      if (existingArtist) {
        // If artist exists, make sure they're under the correct label
        return existingArtist.label_id === labelId;
      }

      // If artist doesn't exist, we'll trust the user's input
      // since they are the label owners and know which artists belong to their labels
      return true;
    } catch (error) {
      console.error('Failed to validate artist label:', error);
      return false;
    }
  }

  async discoverArtistsFromTrack(trackId) {
    try {
      console.log(`Discovering artists from track with ID: ${trackId}`);
      
      const track = await this.getTrack(trackId);
      const album = await this.getAlbum(track.album.id);
      
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
          const artist = await this.getArtist(artistId);
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
      throw new Error('Failed to discover artists from track: ' + error.message);
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
      const artistIds = await this.getLabelArtists(labelId);
      if (artistIds.length === 0) {
        console.log(`No artists configured for label ${labelId}`);
        return results;
      }

      console.log(`Found ${artistIds.length} artists for label ${labelId}`);

      // Get artist details and tracks
      for (const artistId of artistIds) {
        try {
          // Get artist details from Spotify
          const artistData = await this.getArtist(artistId);
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
          const tracks = await this.getArtistTracks(artistId);
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
          console.error(`Error processing artist ${artistId}:`, error);
          continue;
        }
      }

      await transaction.commit();
      console.log(`Successfully synced artists for label ${labelId}`);
      return results;
    } catch (error) {
      await transaction.rollback();
      console.error(`Error syncing artists for label ${labelId}:`, error);
      throw new Error('Failed to sync artists for label: ' + error.message);
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
      console.error(`Error searching tracks for label ${labelName}:`, error);
      throw new Error('Failed to search tracks for label: ' + error.message);
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

      // Get all tracks for this label
      console.log(`Searching for tracks from ${label.displayName}...`);
      const tracks = await this.searchTracksByLabel(label.displayName);
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
                'Authorization': `Bearer ${this.accessToken}`
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
          console.error(`Error processing track ${trackData.id}:`, error);
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
      console.error(`Error syncing tracks for label ${labelId}:`, error);
      throw new Error('Failed to sync tracks for label: ' + error.message);
    }
  }

  async getArtistsWithReleases(artistIds) {
    try {
      console.log(`Getting artists with releases for IDs: ${artistIds.join(', ')}`);
      
      const results = [];
      
      // Process artists in batches of 5 to avoid rate limiting
      for (let i = 0; i < artistIds.length; i += 5) {
        const batch = artistIds.slice(i, i + 5);
        const batchPromises = batch.map(async (artistId) => {
          try {
            const artist = await this.getArtist(artistId);
            const tracks = await this.getArtistTracks(artistId);
            
            // Get album details for each track
            const releases = await Promise.all(
              tracks.map(async (track) => {
                const album = await this.getAlbum(track.album.id);
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
      
      console.log(`Successfully retrieved artists with releases for IDs: ${artistIds.join(', ')}`);
      return results;
    } catch (error) {
      console.error('Error fetching artists with releases:', error);
      throw new Error('Failed to fetch artists with releases: ' + error.message);
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
      console.error('Error getting tracks by label:', error);
      throw new Error('Failed to get tracks by label: ' + error.message);
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
      console.error('Error getting tracks by label:', error);
      throw new Error('Failed to get tracks by label: ' + error.message);
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
          labelId: labelId
        }
      });

      console.log(`Successfully created track: ${track.name}`);
      return track;
    } catch (error) {
      console.error('Error creating track:', error);
      throw new Error('Failed to create track: ' + error.message);
    }
  }

  async importReleasesByArtist(labelId, artistId) {
    try {
      console.log(`Importing releases for artist with ID: ${artistId}`);
      
      const artist = await this.getArtist(artistId);
      const albums = await this.getArtistAlbums(artistId);
      
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
          const tracks = await this.getAlbumTracks(album.id);
          
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
        console.error('Error importing releases:', error);
        throw new Error('Failed to import releases: ' + error.message);
      }
    } catch (error) {
      console.error('Error importing releases:', error);
      throw new Error('Failed to import releases: ' + error.message);
    }
  }

  async searchAlbums(query, limit = 50) {
    try {
      console.log(`Searching Spotify albums with query: "${query}", limit: ${limit}`);
      
      if (!this.accessToken) {
        console.log('No access token found, initializing SpotifyService...');
        await this.initialize();
      }

      const response = await this.spotifyApi.searchAlbums(query, {
        limit,
        market: 'US'
      });

      const albums = response.body.albums.items;
      console.log(`Found ${albums.length} albums matching query "${query}"`);
      return albums;
    } catch (error) {
      // Check if it's an authentication error
      if (error.statusCode === 401) {
        console.log('Access token expired, refreshing...');
        await this.initialize();
        // Retry the search once with new token
        return this.searchAlbums(query, limit);
      }
      
      console.error('Error searching albums:', error);
      throw new Error('Failed to search Spotify albums: ' + error.message);
    }
  }

  async getArtistAlbums(artistId, options = {}) {
    try {
      await this.refreshTokenIfNeeded();
      console.log(`Fetching albums for artist ID: ${artistId}`);
      
      const include_groups = options.include_groups || 'album,single';
      const market = options.market || 'US';
      
      let allReleases = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        console.log(`Fetching releases batch with offset ${offset}`);
        const response = await this.spotifyApi.getArtistAlbums(artistId, {
          limit,
          offset,
          include_groups,
          market
        });

        if (!response.body || !response.body.items) {
          console.log('No more releases found');
          break;
        }

        console.log(`Found ${response.body.items.length} releases in this batch`);
        allReleases = allReleases.concat(response.body.items);
        
        if (response.body.next) {
          offset += limit;
        } else {
          hasMore = false;
        }
      }

      console.log(`Total releases found for artist: ${allReleases.length}`);

      // Remove duplicates based on name and release type
      const uniqueReleases = Array.from(new Map(
        allReleases.map(release => [
          `${release.name.toLowerCase()}-${release.album_type}`,
          release
        ])
      ).values());

      console.log(`Unique releases after deduplication: ${uniqueReleases.length}`);
      return uniqueReleases;
    } catch (error) {
      console.error(`Error getting artist releases for ${artistId}:`, error);
      throw error;
    }
  }

  async getArtistTracks(artistId, accessToken) {
    try {
      console.log(`Fetching tracks for artist ID: ${artistId}`);
      
      let allTracks = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        console.log(`Fetching tracks batch with offset ${offset}`);
        const response = await this.spotifyApi.getArtistTracks(artistId, {
          limit,
          offset
        });

        if (!response.body || !response.body.items) {
          console.log('No more tracks found');
          break;
        }

        console.log(`Found ${response.body.items.length} tracks in this batch`);
        allTracks = allTracks.concat(response.body.items);
        
        if (response.body.next) {
          offset += limit;
        } else {
          hasMore = false;
        }
      }

      console.log(`Total tracks found for artist: ${allTracks.length}`);
      return allTracks;
    } catch (error) {
      console.error(`Error getting artist tracks for ${artistId}:`, error);
      throw error;
    }
  }

  async syncLabelFromTrack(track, spotifyTrack) {
    try {
      // Extract label information from Spotify track
      const labelName = spotifyTrack.album?.label || 'Unknown Label';
      const normalizedLabelPath = this.normalizeLabelPath(labelName);
      
      if (!normalizedLabelPath) {
        console.warn(`Could not normalize label path for: ${labelName}`);
        return null;
      }

      let label = await this.getLabelByPath(normalizedLabelPath);
      
      if (!label) {
        // Create new label if it doesn't exist
        label = await Label.create({
          id: normalizedLabelPath,
          name: labelName,
          display_name: labelName,
          slug: normalizedLabelPath
        });
        this.labelCache.set(normalizedLabelPath, label);
      }

      // Update track with label
      await track.update({ label_id: label.id });
      return label;
    } catch (error) {
      console.error('Error syncing label from track:', error);
      throw error;
    }
  }

  // Normalize label path to handle different formats
  normalizeLabelPath(path) {
    if (!path) return null;
    const normalized = path.toLowerCase().trim();
    return LABEL_MAP[normalized] || LABEL_SLUGS[normalized] || normalized;
  }

  // Get label by path with caching
  async getLabelByPath(labelPath) {
    const normalizedPath = this.normalizeLabelPath(labelPath);
    if (!normalizedPath) return null;

    // Check cache first
    if (this.labelCache.has(normalizedPath)) {
      return this.labelCache.get(normalizedPath);
    }

    const label = await Label.findOne({
      where: {
        [Op.or]: [
          { id: normalizedPath },
          { slug: normalizedPath }
        ]
      }
    });

    if (label) {
      this.labelCache.set(normalizedPath, label);
    }

    return label;
  }

  // Clear label cache
  clearLabelCache() {
    this.labelCache.clear();
  }

  async getArtistReleases(artistId) {
    try {
      let allReleases = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      // Get albums
      while (hasMore) {
        const response = await this.spotifyApi.getArtistAlbums(artistId, {
          limit,
          offset,
          include_groups: 'album,single'
        });

        if (!response.body || !response.body.items) {
          break;
        }

        allReleases = allReleases.concat(response.body.items);
        
        if (response.body.next) {
          offset += limit;
        } else {
          hasMore = false;
        }
      }

      // Remove duplicates based on name (some releases might appear multiple times with different regions)
      const uniqueReleases = Array.from(new Map(
        allReleases.map(release => [release.name.toLowerCase(), release])
      ).values());

      return uniqueReleases;
    } catch (error) {
      console.error('Error getting artist releases:', error);
      throw error;
    }
  }

  async searchReleasesByLabel(labelName) {
    try {
      await this.refreshTokenIfNeeded();
      console.log(`Searching for releases with label: ${labelName}`);
      
      let allReleases = [];
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      // Convert label ID to display name for search
      const labelDisplayNames = {
        'buildit-records': 'Build It Records',
        'buildit-tech': 'Build It Tech',
        'buildit-deep': 'Build It Deep'
      };
      const searchQuery = labelDisplayNames[labelName] || labelName;

      while (hasMore) {
        console.log(`Searching releases batch with offset ${offset}`);
        const response = await this.spotifyApi.searchAlbums(`label:"${searchQuery}"`, {
          limit,
          offset,
          market: 'US'
        });

        if (!response.body?.albums?.items) {
          console.log('No more releases found');
          break;
        }

        const releases = response.body.albums.items;
        console.log(`Found ${releases.length} releases in this batch`);
        allReleases = allReleases.concat(releases);
        
        if (releases.length === limit) {
          offset += limit;
          // Add a small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMore = false;
        }
      }

      console.log(`Total releases found for label ${labelName}: ${allReleases.length}`);
      return allReleases;
    } catch (error) {
      console.error(`Error searching releases for label ${labelName}:`, error);
      throw error;
    }
  }

  async fetchAllPages(initialUrl) {
    let items = [];
    let url = initialUrl;

    while (url) {
      try {
        if (this.isTokenExpired()) {
          await this.getAccessToken();
        }

        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });

        const data = response.data;
        items = items.concat(data.items || []);
        url = data.next; // Spotify provides next URL for pagination

        if (url) {
          // Add a small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        if (error.response?.status === 429) {
          // Handle rate limiting
          const retryAfter = error.response.headers['retry-after'] || 1;
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        console.error('Error fetching page:', error);
        throw error;
      }
    }

    return items;
  }

  async getReleasesByLabel(labelId) {
    await this.initialize();
    const query = `label:"${labelId}"`;
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=50`;
    
    let allReleases = [];
    let nextUrl = url;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    while (nextUrl && retryCount < MAX_RETRIES) {
      try {
        const response = await axios.get(nextUrl, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });

        const { items, next } = response.data.albums;
        allReleases = allReleases.concat(items);
        nextUrl = next;

        if (nextUrl) {
          // Add a small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Error fetching releases:', error.message);
        
        if (error.response?.status === 429) {
          // Handle rate limiting
          const retryAfter = parseInt(error.response.headers['retry-after'] || '1');
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          retryCount++;
          continue;
        }

        if (error.response?.status === 401) {
          // Token expired, get a new one and retry
          await this.getAccessToken();
          retryCount++;
          continue;
        }

        throw error;
      }
    }

    console.log(`Total releases fetched for ${labelId}: ${allReleases.length}`);
    return allReleases;
  }

  async getRelease(releaseId) {
    await this.initialize();
    try {
      const response = await axios.get(`https://api.spotify.com/v1/albums/${releaseId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        // Handle rate limiting
        const retryAfter = parseInt(error.response.headers['retry-after'] || '1');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return this.getRelease(releaseId);
      }

      if (error.response?.status === 401) {
        // Token expired, get a new one and retry
        await this.getAccessToken();
        return this.getRelease(releaseId);
      }

      console.error('Error fetching release:', error);
      return null;
    }
  }
}

module.exports = SpotifyService;
