const express = require('express');
const router = express.Router();
const axios = require('axios');
const { query, param, body } = require('express-validator');
const { validateRequest, isValidSpotifyId } = require('../utils/validation');
const { getSpotifyToken } = require('../utils/spotify');
const { pool } = require('../db');

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
        const result = await pool.query(queryText, queryParams);
        console.log(`Found ${result.rows.length} artists`);

        res.json(result.rows);
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
        
        const { rows } = await pool.query(
            'SELECT * FROM artists WHERE id = $1',
            [artistId]
        );
        
        console.log('Found artist in database:', rows.length);
        
        if (rows.length === 0) {
            // If not in database, fetch from Spotify
            console.log('No artist found in database, trying Spotify');
            const accessToken = await getSpotifyToken();
            const artistResponse = await axios.get(
                `https://api.spotify.com/v1/artists/${artistId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            console.log('Got Spotify response:', artistResponse.data);
            let formattedArtist = formatArtistData(artistResponse.data);

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
            await pool.query(
                `INSERT INTO artists (
                    id, 
                    name, 
                    external_urls, 
                    followers, 
                    images, 
                    popularity,
                    type,
                    uri,
                    cached_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    external_urls = EXCLUDED.external_urls,
                    followers = EXCLUDED.followers,
                    images = EXCLUDED.images,
                    popularity = EXCLUDED.popularity,
                    type = EXCLUDED.type,
                    uri = EXCLUDED.uri,
                    cached_at = EXCLUDED.cached_at`,
                [
                    formattedArtist.id,
                    formattedArtist.name,
                    formattedArtist.external_urls,
                    formattedArtist.followers,
                    formattedArtist.images,
                    formattedArtist.popularity,
                    formattedArtist.type,
                    formattedArtist.uri,
                    formattedArtist.cached_at
                ]
            );

            res.set('X-Data-Source', 'spotify').json(formattedArtist);
        } else {
            console.log('Found artist in database:', rows[0]);
            let artist = rows[0];
            
            // Apply field filtering if requested
            if (fields) {
                const requestedFields = fields.split(',');
                artist = requestedFields.reduce((filtered, field) => {
                    if (field in artist) {
                        filtered[field] = artist[field];
                    }
                    return filtered;
                }, {});
            }
            
            res.set('X-Data-Source', 'database').json(artist);
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
        
        const { rows } = await pool.query(
            'SELECT * FROM top_tracks WHERE artist_id = $1 AND market = $2',
            [artistId, market]
        );
        
        console.log('Found top tracks in database:', rows.length);
        
        if (rows.length === 0) {
            // If not in database, fetch from Spotify
            console.log('No top tracks found in database, trying Spotify');
            const accessToken = await getSpotifyToken();
            const topTracksResponse = await axios.get(
                `https://api.spotify.com/v1/artists/${artistId}/top-tracks`,
                {
                    params: { market },
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            console.log('Got Spotify response:', topTracksResponse.data.tracks.length, 'tracks');
            const topTracks = topTracksResponse.data.tracks.map(track => ({
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
            await Promise.all(topTracks.map(async (track) => {
                await pool.query(
                    'INSERT INTO top_tracks (artist_id, market, id, name, popularity, preview_url, duration_ms, album_id, album_name, album_release_date, album_images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
                    [artistId, market, track.id, track.name, track.popularity, track.preview_url, track.duration_ms, track.album.id, track.album.name, track.album.release_date, track.album.images]
                );
            }));

            res.set('X-Data-Source', 'spotify').json(topTracks);
        } else {
            console.log('Found top tracks in database:', rows);
            res.set('X-Data-Source', 'database').json(rows);
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
        
        const { rows } = await pool.query(
            'SELECT * FROM albums WHERE artist_id = $1 AND include_groups = $2 LIMIT $3 OFFSET $4',
            [artistId, include_groups, limit, offset]
        );
        
        console.log('Found albums in database:', rows.length);
        
        if (rows.length === 0) {
            // If not in database, fetch from Spotify
            console.log('No albums found in database, trying Spotify');
            const accessToken = await getSpotifyToken();
            const albumsResponse = await axios.get(
                `https://api.spotify.com/v1/artists/${artistId}/albums`,
                {
                    params: {
                        include_groups,
                        limit,
                        offset,
                        market: 'US'
                    },
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            console.log('Got Spotify response:', albumsResponse.data.items.length, 'albums');
            const albums = albumsResponse.data.items.map(album => ({
                id: album.id,
                name: album.name,
                release_date: album.release_date,
                total_tracks: album.total_tracks,
                type: album.album_type,
                images: album.images,
                external_urls: album.external_urls
            }));

            // Insert albums into database
            await Promise.all(albums.map(async (album) => {
                await pool.query(
                    'INSERT INTO albums (artist_id, include_groups, id, name, release_date, total_tracks, type, images, external_urls) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                    [artistId, include_groups, album.id, album.name, album.release_date, album.total_tracks, album.type, album.images, album.external_urls]
                );
            }));

            res.set('X-Data-Source', 'spotify').json({
                albums,
                total: albumsResponse.data.total,
                offset,
                limit
            });
        } else {
            console.log('Found albums in database:', rows);
            res.set('X-Data-Source', 'database').json({
                albums: rows,
                total: rows.length,
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
        
        const { rows } = await pool.query(
            'SELECT * FROM related_artists WHERE artist_id = $1',
            [artistId]
        );
        
        console.log('Found related artists in database:', rows.length);
        
        if (rows.length === 0) {
            // If not in database, fetch from Spotify
            console.log('No related artists found in database, trying Spotify');
            const accessToken = await getSpotifyToken();
            const relatedResponse = await axios.get(
                `https://api.spotify.com/v1/artists/${artistId}/related-artists`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            console.log('Got Spotify response:', relatedResponse.data.artists.length, 'artists');
            const relatedArtists = relatedResponse.data.artists.map(formatArtistData);

            // Insert related artists into database
            await Promise.all(relatedArtists.map(async (artist) => {
                await pool.query(
                    `INSERT INTO related_artists (
                        artist_id, 
                        id, 
                        name, 
                        external_urls, 
                        followers, 
                        images, 
                        popularity,
                        type,
                        uri,
                        cached_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                    ON CONFLICT (id) DO UPDATE SET
                        artist_id = EXCLUDED.artist_id,
                        name = EXCLUDED.name,
                        external_urls = EXCLUDED.external_urls,
                        followers = EXCLUDED.followers,
                        images = EXCLUDED.images,
                        popularity = EXCLUDED.popularity,
                        type = EXCLUDED.type,
                        uri = EXCLUDED.uri,
                        cached_at = EXCLUDED.cached_at`,
                    [
                        artistId,
                        artist.id,
                        artist.name,
                        artist.external_urls,
                        artist.followers,
                        artist.images,
                        artist.popularity,
                        artist.type,
                        artist.uri,
                        artist.cached_at
                    ]
                );
            }));

            res.set('X-Data-Source', 'spotify').json(relatedArtists);
        } else {
            console.log('Found related artists in database:', rows);
            res.set('X-Data-Source', 'database').json(rows);
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
        
        const { rows } = await pool.query(
            'SELECT * FROM releases WHERE artist_id = $1',
            [artistId]
        );
        
        console.log('Found releases in database:', rows.length);
        
        if (rows.length === 0) {
            // If not in database, fetch from Spotify
            console.log('No releases found in database, trying Spotify');
            const accessToken = await getSpotifyToken();

            // Get artist's tracks and singles
            const tracksResponse = await axios.get(
                `https://api.spotify.com/v1/artists/${artistId}/albums`,
                {
                    params: {
                        include_groups: 'single,album',
                        limit: 50,
                        market: 'US'
                    },
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            console.log('Got Spotify response:', tracksResponse.data.items.length, 'releases');
            // Format the releases
            const releases = tracksResponse.data.items.map(item => ({
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
            await Promise.all(releases.map(async (release) => {
                await pool.query(
                    'INSERT INTO releases (artist_id, id, name, type, release_date, images, artists) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [artistId, release.id, release.name, release.type, release.release_date, release.images, JSON.stringify(release.artists)]
                );
            }));

            res.set('X-Data-Source', 'spotify').json(releases);
        } else {
            console.log('Found releases in database:', rows);
            res.set('X-Data-Source', 'database').json(rows);
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
                    const accessToken = await getSpotifyToken();
                    const artistResponse = await axios.get(
                        `https://api.spotify.com/v1/artists/${artist.id}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${accessToken}`
                            }
                        }
                    );
                    
                    console.log('Got Spotify response:', artistResponse.data);
                    return formatArtistData(artistResponse.data);
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
            await pool.query(
                `INSERT INTO artists (
                    id, 
                    name, 
                    external_urls, 
                    followers, 
                    images, 
                    popularity,
                    type,
                    uri,
                    cached_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    external_urls = EXCLUDED.external_urls,
                    followers = EXCLUDED.followers,
                    images = EXCLUDED.images,
                    popularity = EXCLUDED.popularity,
                    type = EXCLUDED.type,
                    uri = EXCLUDED.uri,
                    cached_at = EXCLUDED.cached_at`,
                [
                    artist.id,
                    artist.name,
                    artist.external_urls,
                    artist.followers,
                    artist.images,
                    artist.popularity,
                    artist.type,
                    artist.uri,
                    artist.cached_at
                ]
            );
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
