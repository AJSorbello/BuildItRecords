const express = require('express');
const router = express.Router();
const { query, param, body } = require('express-validator');
const { validateRequest, isValidSpotifyId } = require('../utils/validation');
const spotifyService = require('../services/SpotifyService');
const { Artist, Release, Track, sequelize } = require('../models');

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
router.get('/search', async (req, res) => {
    console.log('Received search request:', {
        query: req.query,
        headers: req.headers,
        path: req.path
    });

    try {
        const searchQuery = req.query.search || '';
        const label = req.query.label;
        console.log('Searching artists with query:', searchQuery, 'and label:', label);

        let queryText = 'SELECT * FROM artists WHERE 1=1';
        const queryParams = [];

        // Add search condition if search query exists
        if (searchQuery.trim()) {
            queryParams.push(`%${searchQuery.trim()}%`);
            queryText += ` AND name ILIKE $${queryParams.length}`;
        }

        // Add label condition if label exists
        if (label) {
            queryParams.push(label);
            queryText += ` AND label = $${queryParams.length}`;
        }

        queryText += ' ORDER BY name ASC';

        console.log('Executing query:', queryText, 'with params:', queryParams);
        const result = await sequelize.query(queryText, { replacements: queryParams, type: sequelize.QueryTypes.SELECT });
        console.log(`Found ${result.length} artists`);

        res.json(result);
    } catch (error) {
        console.error('Error searching artists:', error);
        res.status(500).json({ error: 'Failed to search artists' });
    }
});

// Get artist by ID
router.get('/:artistId', [
    param('artistId').custom(isValidSpotifyId).withMessage('Invalid Spotify artist ID'),
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
        
        const artist = await Artist.findByPk(artistId);
        
        console.log('Found artist in database:', artist);
        
        if (!artist) {
            // If not in database, fetch from Spotify
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
                name: track.name,
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
                    name: track.name,
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
