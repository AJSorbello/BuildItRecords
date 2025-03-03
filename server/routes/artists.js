const express = require('express');
const router = express.Router();
const { query, param, body } = require('express-validator');
const { validateRequest, isValidSpotifyId } = require('../utils/validation');
const spotifyService = require('../services/SpotifyService');
const { Artist, Release, Track, sequelize } = require('../models');
const { Op } = require('sequelize');

// Format artist data to match Spotify SDK format
const formatArtistData = (spotifyData) => {
    console.log('Formatting artist data:', spotifyData);
    const formattedData = {
        id: spotifyData.id,
        name: spotifyData.name,
        external_urls: spotifyData.external_urls || { spotify: null },
        followers: {
            total: spotifyData.followers?.total || 0,
            href: null
        },
        images: Array.isArray(spotifyData.images) 
            ? spotifyData.images.map(img => ({
                url: img.url,
                height: img.height || null,
                width: img.width || null
              }))
            : [],
        popularity: spotifyData.popularity || 0,
        type: 'artist',
        uri: spotifyData.uri || `spotify:artist:${spotifyData.id}`,
        cached_at: Date.now()
    };
    console.log('Formatted artist data:', formattedData);
    return formattedData;
};

// Search artists - this must come before /:artistId routes
router.get('/search', [
    query('search').optional().isString(),
    query('label').optional().isString(),
    validateRequest
], async (req, res) => {
    console.log('Received search request:', {
        query: req.query,
        headers: req.headers,
        path: req.path
    });

    try {
        const searchQuery = req.query.search || '';
        const labelId = req.query.label;
        console.log('Searching artists with query:', searchQuery, 'and labelId:', labelId);

        // Build the query conditions
        const whereConditions = {};
        if (searchQuery.trim()) {
            whereConditions.name = {
                [Op.iLike]: `%${searchQuery.trim()}%`
            };
        }

        const include = [];
        let labelRecord = null;

        if (labelId) {
            // Try to find the label by either ID or slug
            labelRecord = await sequelize.models.Label.findOne({
                where: { 
                  [Op.or]: [
                    { id: labelId },
                    { slug: { [Op.iLike]: `%${labelId}%` } },
                    { name: { [Op.iLike]: `%${labelId}%` } },
                    { display_name: { [Op.iLike]: `%${labelId}%` } }
                  ]
                },
                attributes: ['id', 'name', 'display_name', 'slug']
            });

            if (!labelRecord) {
                console.log('Label not found:', labelId);
                return res.status(404).json({ error: 'Label not found' });
            }

            console.log('Found label:', labelRecord.get({ plain: true }));

            // Include releases for this label
            include.push({
                model: Release,
                as: 'releases',
                required: true,
                attributes: [
                    'id',
                    'spotify_id',
                    'title',
                    'release_type',
                    'release_date',
                    'artwork_url',
                    'images',
                    'spotify_url',
                    'total_tracks',
                    'label_id',
                    'status',
                    'created_at',
                    'updated_at'
                ],
                through: {
                    attributes: []
                },
                include: [{
                    model: sequelize.models.Label,
                    as: 'label',
                    where: { id: labelRecord.id },
                    required: true,
                    attributes: []
                }]
            });
        }

        console.log('Final where conditions:', whereConditions);
        console.log('Include:', JSON.stringify(include, null, 2));

        const artists = await Artist.findAll({
            where: whereConditions,
            include: include,
            order: [['name', 'ASC']],
            attributes: ['id', 'name', 'spotify_url', 'profile_image_url', 'created_at', 'updated_at'],
            group: ['Artist.id', 'releases.id', 'releases->ReleaseArtist.id'],
            subQuery: false
        });

        console.log(`Found ${artists.length} artists`);
        
        // Format the response to match the expected Artist type
        const formattedArtists = artists.map(artist => {
            const artistData = artist.get({ plain: true });
            return {
                id: artistData.id,
                name: artistData.name,
                spotify_url: artistData.spotify_url,
                profile_image_url: artistData.profile_image_url,
                created_at: artistData.created_at,
                updated_at: artistData.updated_at,
                releases: artistData.releases?.map(release => ({
                    id: release.id,
                    title: release.title,
                    spotify_url: release.spotify_url,
                    artwork_url: release.artwork_url,
                    release_date: release.release_date,
                    created_at: release.created_at,
                    updated_at: release.updated_at
                })) || []
            };
        });

        console.log('Successfully formatted artists:', formattedArtists.length);
        res.json(formattedArtists);
    } catch (error) {
        console.error('Error searching artists:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to search artists', details: error.message });
    }
});

// Get artist by ID
router.get('/:artistId', [
    param('artistId').isString().withMessage('Artist ID must be a string'),
    query('fields').optional().isString(),
    validateRequest
], async (req, res) => {
    console.log('Received artist request:', {
        params: req.params,
        query: req.query,
        headers: req.headers,
        path: req.path
    });

    try {
        const { artistId } = req.params;
        const { fields } = req.query;
        
        let artist;
        // Check if the ID is a valid Spotify ID (22 chars) or a UUID
        const isSpotifyIdFormat = typeof artistId === 'string' && artistId.length === 22;
        
        if (isSpotifyIdFormat) {
            // Try to find by Spotify ID
            console.log('Looking up artist by Spotify ID:', artistId);
            artist = await Artist.findOne({ 
                where: { 
                    spotify_id: artistId 
                } 
            });
        } else {
            // Try to find by UUID
            console.log('Looking up artist by UUID:', artistId);
            try {
                artist = await Artist.findByPk(artistId);
            } catch (error) {
                console.error('Error finding artist by UUID:', error.message);
                // If it fails because of invalid UUID format, return appropriate error
                if (error.message.includes('invalid input syntax for type uuid')) {
                    return res.status(400).json({ 
                        success: false,
                        message: `Invalid UUID format: ${artistId}` 
                    });
                }
                // Otherwise rethrow
                throw error;
            }
        }
        
        console.log('Found artist in database:', artist ? 'Yes' : 'No');
        
        if (!artist && isSpotifyIdFormat) {
            // If not in database but it's a Spotify ID, fetch from Spotify
            console.log('No artist found in database, trying Spotify');
            const spotifyArtist = await spotifyService.getArtist(artistId);

            let formattedArtist = formatArtistData(spotifyArtist);

            // Apply field filtering if requested
            if (fields) {
                const requestedFields = fields.split(',');
                formattedArtist = requestedFields.reduce((filtered, field) => {
                    if (field in formattedArtist) {
                        filtered[field] = formattedArtist[field];
                    }
                    return filtered;
                }, {});
            }

            // Insert artist into database
            await Artist.upsert({
                id: formattedArtist.id,
                name: formattedArtist.name,
                external_urls: formattedArtist.external_urls,
                followers: formattedArtist.followers,
                images: formattedArtist.images,
                popularity: formattedArtist.popularity,
                type: formattedArtist.type,
                uri: formattedArtist.uri,
                cached_at: formattedArtist.cached_at
            });

            res.set('X-Data-Source', 'spotify').json(formattedArtist);
        } else {
            console.log('Found artist in database:', artist);
            let artistData = artist.dataValues;
            
            // Apply field filtering if requested
            if (fields) {
                const requestedFields = fields.split(',');
                artistData = requestedFields.reduce((filtered, field) => {
                    if (field in artistData) {
                        filtered[field] = artistData[field];
                    }
                    return filtered;
                }, {});
            }
            
            res.set('X-Data-Source', 'database').json(artistData);
        }

    } catch (error) {
        console.error('Error in /artist route:', error);
        res.status(error.response?.status || 500).json({
            message: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get artist's top tracks
router.get('/:artistId/top-tracks', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
    query('market').optional().isString().isLength({ min: 2, max: 2 }),
    validateRequest
], async (req, res) => {
    console.log('Received top tracks request:', {
        params: req.params,
        query: req.query,
        headers: req.headers,
        path: req.path
    });

    try {
        const { artistId } = req.params;
        const market = req.query.market || 'US';
        
        const topTracks = await Track.findAll({
            where: {
                artist_id: artistId,
                market
            }
        });
        
        console.log('Found top tracks in database:', topTracks.length);
        
        if (topTracks.length === 0) {
            // If not in database, fetch from Spotify
            console.log('No top tracks found in database, trying Spotify');
            const topTracksResponse = await spotifyService.getArtistTopTracks(artistId, market);

            console.log('Got Spotify response:', topTracksResponse.tracks.length, 'tracks');
            const formattedTopTracks = topTracksResponse.tracks.map(track => ({
                id: track.id,
                title: track.name,
                popularity: track.popularity,
                preview_url: track.preview_url,
                duration_ms: track.duration_ms,
                album: {
                    id: track.album.id,
                    name: track.album.name,
                    release_date: track.album.release_date,
                    images: track.album.images
                }
            }));

            // Insert top tracks into database
            await Promise.all(formattedTopTracks.map(async (track) => {
                await Track.upsert({
                    artist_id: artistId,
                    market,
                    id: track.id,
                    title: track.title,
                    popularity: track.popularity,
                    preview_url: track.preview_url,
                    duration_ms: track.duration_ms,
                    album_id: track.album.id,
                    album_name: track.album.name,
                    album_release_date: track.album.release_date,
                    album_images: track.album.images
                });
            }));

            res.set('X-Data-Source', 'spotify').json(formattedTopTracks);
        } else {
            console.log('Found top tracks in database:', topTracks);
            res.set('X-Data-Source', 'database').json(topTracks);
        }

    } catch (error) {
        console.error('Error in /top-tracks route:', error);
        res.status(error.response?.status || 500).json({
            message: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get artist's albums
router.get('/:artistId/albums', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
    query('include_groups').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    validateRequest
], async (req, res) => {
    console.log('Received albums request:', {
        params: req.params,
        query: req.query,
        headers: req.headers,
        path: req.path
    });

    try {
        const { artistId } = req.params;
        const { 
            include_groups = 'album,single,compilation',
            limit = 20,
            offset = 0
        } = req.query;
        
        const albums = await Release.findAll({
            where: {
                artist_id: artistId,
                include_groups
            },
            limit,
            offset
        });
        
        console.log('Found albums in database:', albums.length);
        
        if (albums.length === 0) {
            // If not in database, fetch from Spotify
            console.log('No albums found in database, trying Spotify');
            const albumsResponse = await spotifyService.getArtistAlbums(artistId, include_groups, limit, offset);

            console.log('Got Spotify response:', albumsResponse.items.length, 'albums');
            const formattedAlbums = albumsResponse.items.map(album => ({
                id: album.id,
                name: album.name,
                release_date: album.release_date,
                total_tracks: album.total_tracks,
                type: album.album_type,
                images: album.images,
                external_urls: album.external_urls
            }));

            // Insert albums into database
            await Promise.all(formattedAlbums.map(async (album) => {
                await Release.upsert({
                    artist_id: artistId,
                    include_groups,
                    id: album.id,
                    name: album.name,
                    release_date: album.release_date,
                    total_tracks: album.total_tracks,
                    type: album.type,
                    images: album.images,
                    external_urls: album.external_urls
                });
            }));

            res.set('X-Data-Source', 'spotify').json({
                albums: formattedAlbums,
                total: albumsResponse.total,
                offset,
                limit
            });
        } else {
            console.log('Found albums in database:', albums);
            res.set('X-Data-Source', 'database').json({
                albums,
                total: albums.length,
                offset,
                limit
            });
        }

    } catch (error) {
        console.error('Error in /albums route:', error);
        res.status(error.response?.status || 500).json({
            message: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get artist's related artists
router.get('/:artistId/related', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
    validateRequest
], async (req, res) => {
    console.log('Received related artists request:', {
        params: req.params,
        query: req.query,
        headers: req.headers,
        path: req.path
    });

    try {
        const { artistId } = req.params;
        
        const relatedArtists = await Artist.findAll({
            where: {
                id: artistId
            }
        });
        
        console.log('Found related artists in database:', relatedArtists.length);
        
        if (relatedArtists.length === 0) {
            // If not in database, fetch from Spotify
            console.log('No related artists found in database, trying Spotify');
            const relatedResponse = await spotifyService.getArtistRelatedArtists(artistId);

            console.log('Got Spotify response:', relatedResponse.artists.length, 'artists');
            const formattedRelatedArtists = relatedResponse.artists.map(formatArtistData);

            // Insert related artists into database
            await Promise.all(formattedRelatedArtists.map(async (artist) => {
                await Artist.upsert({
                    id: artist.id,
                    name: artist.name,
                    external_urls: artist.external_urls,
                    followers: artist.followers,
                    images: artist.images,
                    popularity: artist.popularity,
                    type: artist.type,
                    uri: artist.uri,
                    cached_at: artist.cached_at
                });
            }));

            res.set('X-Data-Source', 'spotify').json(formattedRelatedArtists);
        } else {
            console.log('Found related artists in database:', relatedArtists);
            res.set('X-Data-Source', 'database').json(relatedArtists);
        }

    } catch (error) {
        console.error('Error in /related route:', error);
        res.status(error.response?.status || 500).json({
            message: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get artist's releases (including collaborations)
router.get('/:artistId/releases', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
    validateRequest
], async (req, res) => {
    console.log('Received releases request:', {
        params: req.params,
        query: req.query,
        headers: req.headers,
        path: req.path
    });

    try {
        const { artistId } = req.params;
        
        const releases = await Release.findAll({
            where: {
                artist_id: artistId
            }
        });
        
        console.log('Found releases in database:', releases.length);
        
        if (releases.length === 0) {
            // If not in database, fetch from Spotify
            console.log('No releases found in database, trying Spotify');
            const releasesResponse = await spotifyService.getArtistReleases(artistId);

            console.log('Got Spotify response:', releasesResponse.length, 'releases');
            // Format the releases
            const formattedReleases = releasesResponse.map(item => ({
                id: item.id,
                name: item.name,
                type: item.type,
                release_date: item.release_date,
                images: item.images,
                artists: item.artists.map(artist => ({
                    id: artist.id,
                    name: artist.name
                }))
            }));

            // Insert releases into database
            await Promise.all(formattedReleases.map(async (release) => {
                await Release.upsert({
                    artist_id: artistId,
                    id: release.id,
                    name: release.name,
                    type: release.type,
                    release_date: release.release_date,
                    images: release.images,
                    artists: JSON.stringify(release.artists)
                });
            }));

            res.set('X-Data-Source', 'spotify').json(formattedReleases);
        } else {
            console.log('Found releases in database:', releases);
            res.set('X-Data-Source', 'database').json(releases);
        }

    } catch (error) {
        console.error('Error in /releases route:', error);
        res.status(error.response?.status || 500).json({
            message: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get all tracks by an artist across all labels
router.get('/:artistId/tracks', async (req, res) => {
  try {
    const { artistId } = req.params;
    console.log(`Getting all tracks for artist: ${artistId}`);

    // First, verify the artist exists
    const artist = await Artist.findByPk(artistId, {
      attributes: [
        'id', 
        'name', 
        'display_name',
        'profile_image_url',
        'profile_image_small_url',
        'profile_image_large_url',
        'spotify_url',
        'spotify_id',
        'external_urls'
      ]
    });

    if (!artist) {
      console.log(`Artist not found: ${artistId}`);
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Find all tracks where this artist is either a main artist or remixer
    const tracks = await Track.findAll({
      where: {
        [Op.or]: [
          sequelize.literal('"artists"."id" = :artistId'),
          { remixer_id: artistId }
        ]
      },
      replacements: { artistId },
      include: [
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] },
          attributes: ['id', 'name', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url'],
          required: false
        },
        {
          model: Artist,
          as: 'remixer',
          through: { attributes: [] },
          attributes: ['id', 'name', 'profile_image_url', 'profile_image_small_url', 'profile_image_large_url'],
          required: false
        },
        {
          model: Release,
          as: 'release',
          attributes: [
            'id', 
            'title', 
            'artwork_url', 
            'release_date',
            'label_id'
          ],
          include: [
            {
              model: sequelize.models.Label,
              as: 'label',
              attributes: ['id', 'name', 'display_name']
            }
          ]
        },
        {
          model: sequelize.models.Genre,
          as: 'genres',
          through: { attributes: [] },
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [
        ['created_at', 'DESC']
      ]
    });

    console.log(`Found ${tracks.length} tracks for artist ${artist.name}`);

    // Format the response
    const formattedTracks = tracks.map(track => ({
      id: track.id,
      title: track.title,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      spotify_url: track.spotify_url,
      isrc: track.isrc,
      release: track.release ? {
        id: track.release.id,
        title: track.release.title,
        artwork_url: track.release.artwork_url,
        release_date: track.release.release_date,
        label: track.release.label ? {
          id: track.release.label.id,
          name: track.release.label.name,
          display_name: track.release.label.display_name
        } : null
      } : null,
      artists: track.artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        profile_image_url: artist.profile_image_url,
        profile_image_small_url: artist.profile_image_small_url,
        profile_image_large_url: artist.profile_image_large_url
      })),
      remixer: track.remixer ? {
        id: track.remixer.id,
        name: track.remixer.name,
        profile_image_url: track.remixer.profile_image_url,
        profile_image_small_url: track.remixer.profile_image_small_url,
        profile_image_large_url: track.remixer.profile_image_large_url
      } : null,
      is_remixer: track.remixer_id === artistId
    }));

    return res.json({
      artist,
      tracks: formattedTracks
    });
  } catch (error) {
    console.error('Error getting tracks for artist:', error);
    return res.status(500).json({
      error: 'Failed to get tracks',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Get all releases associated with an artist across all labels
 * Use database IDs, not Spotify IDs
 */
router.get('/:artistId/all-releases', async (req, res) => {
  try {
    const { artistId } = req.params;
    console.log(`[DEBUG] Getting all releases for artist: ${artistId}`);

    // First, verify the artist exists
    const artist = await Artist.findByPk(artistId);
    if (!artist) {
      console.log(`[DEBUG] Artist not found: ${artistId}`);
      return res.status(404).json({ error: 'Artist not found' });
    }

    console.log(`[DEBUG] Found artist: ${artist.name}`);

    // Find all tracks associated with this artist
    const artistTracks = await Track.findAll({
      where: {
        [Op.or]: [
          sequelize.literal('"artists"."id" = :artistId'),
          { remixer_id: artistId }
        ]
      },
      replacements: { artistId },
      include: [
        {
          model: Artist,
          as: 'artists',
          through: { attributes: [] },
          required: false
        },
        {
          model: Release,
          as: 'release',
          attributes: ['id'],
          required: true
        }
      ],
      attributes: ['id', 'release_id']
    });

    const releaseIds = artistTracks
      .filter(track => track.release_id)
      .map(track => track.release_id);

    console.log(`[DEBUG] Found ${releaseIds.length} release IDs for artist ${artist.name}`);
    
    if (releaseIds.length === 0) {
      console.log(`[DEBUG] No releases found for artist ${artist.name}`);
      return res.json({ releases: [] });
    }

    // Remove duplicate release IDs
    const uniqueReleaseIds = [...new Set(releaseIds)];
    console.log(`[DEBUG] Unique release IDs: ${uniqueReleaseIds.join(', ')}`);

    // Get the full release details
    const releases = await Release.findAll({
      where: {
        id: uniqueReleaseIds
      },
      include: [
        {
          model: sequelize.models.Label,
          as: 'label',
          attributes: ['id', 'name', 'display_name']
        },
        {
          model: Track,
          as: 'tracks',
          attributes: ['id', 'title', 'duration_ms', 'spotify_url', 'preview_url'],
          include: [
            {
              model: Artist,
              as: 'artists',
              through: { attributes: [] },
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['release_date', 'DESC']]
    });

    console.log(`[DEBUG] Found ${releases.length} releases for artist ${artist.name}`);

    // Format the response
    const formattedReleases = releases.map(release => ({
      id: release.id,
      title: release.title,
      artwork_url: release.artwork_url,
      release_date: release.release_date,
      catalog_number: release.catalog_number,
      label_id: release.label_id,
      spotify_url: release.spotify_url,
      spotify_id: release.spotify_id,
      spotify_uri: release.spotify_uri,
      label: release.label ? {
        id: release.label.id,
        name: release.label.name,
        display_name: release.label.display_name
      } : null,
      tracks: release.tracks ? release.tracks.map(track => ({
        id: track.id,
        title: track.title,
        duration_ms: track.duration_ms,
        spotify_url: track.spotify_url,
        preview_url: track.preview_url,
        artists: track.artists ? track.artists.map(artist => ({
          id: artist.id,
          name: artist.name
        })) : []
      })) : [],
      tracks_count: release.tracks.length
    }));

    return res.json({
      releases: formattedReleases
    });
  } catch (error) {
    console.error('Error getting releases for artist:', error);
    return res.status(500).json({
      error: 'Failed to get releases',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all artists for a label
router.get('/label/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    console.log('Getting artists for label:', labelId);

    // Find the label with more flexible matching
    const label = await sequelize.models.Label.findOne({
      where: { 
        [Op.or]: [
          { id: labelId },
          { id: `buildit-${labelId}` }, // Try with buildit- prefix
          { slug: { [Op.iLike]: `%${labelId}%` } },
          { name: { [Op.iLike]: `%${labelId}%` } },
          { display_name: { [Op.iLike]: `%${labelId}%` } }
        ]
      }
    });

    if (!label) {
      console.log('Label not found:', labelId);
      return res.status(404).json({ error: 'Label not found' });
    }

    console.log('Found label:', label.id);

    // Get all artists who have releases under this label
    const artists = await sequelize.models.Artist.findAll({
      include: [{
        model: sequelize.models.Release,
        as: 'releases',
        required: true,
        where: { label_id: label.id },
        through: { attributes: [] },
        attributes: []
      }],
      attributes: [
        'id',
        'name',
        'display_name',
        'profile_image_url',
        'profile_image_small_url',
        'profile_image_large_url',
        'spotify_url',
        'spotify_id',
        'external_urls'
      ],
      group: ['Artist.id'],
      order: [['name', 'ASC']]
    });

    console.log('Found artists:', artists.length);

    // Return the artists wrapped in a data object
    res.json({
      success: true,
      data: {
        artists: artists
      }
    });
  } catch (error) {
    console.error('Error getting artists for label:', error);
    return res.status(500).json({ 
      error: 'Failed to get artists', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create or update multiple artist profiles
router.post('/batch', [
    body('artists').isArray().withMessage('Artists array is required'),
    validateRequest
], async (req, res) => {
    console.log('Received batch request:', {
        body: req.body,
        headers: req.headers,
        path: req.path
    });

    try {
        const { artists } = req.body;
        
        // Process each artist in parallel
        const processedArtists = await Promise.all(
            artists.map(async (artist) => {
                try {
                    console.log('Processing artist:', artist.id);
                    const spotifyArtist = await spotifyService.getArtist(artist.id);
                    return formatArtistData(spotifyArtist);
                } catch (error) {
                    console.error(`Error processing artist ${artist.id}:`, error);
                    return {
                        id: artist.id,
                        error: error.message,
                        status: 'failed'
                    };
                }
            })
        );
        
        // Insert artists into database
        await Promise.all(processedArtists.map(async (artist) => {
            await Artist.upsert({
                id: artist.id,
                name: artist.name,
                external_urls: artist.external_urls,
                followers: artist.followers,
                images: artist.images,
                popularity: artist.popularity,
                type: artist.type,
                uri: artist.uri,
                cached_at: artist.cached_at
            });
        }));

        res.json({
            message: 'Artist profiles processed',
            artists: processedArtists
        });
        
    } catch (error) {
        console.error('Error in /batch route:', error);
        res.status(500).json({
            message: error.message || 'Internal server error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;
