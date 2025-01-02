import { Router } from 'express';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import fetch from 'node-fetch';

config();

const router = Router();
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'builditrecords'
});

// Create a new Spotify API client for each request
const getSpotifyApi = async () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify credentials');
  }

  console.log('Getting Spotify token...');
  
  // Get access token using client credentials
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Failed to get Spotify token:', data);
    throw new Error(`Failed to get Spotify token: ${data.error}`);
  }

  console.log('Got Spotify token successfully');
  return SpotifyApi.withAccessToken(clientId, data.access_token);
};

// Get all tracks with optional label filter
router.get('/tracks', async (req, res) => {
  try {
    const { label } = req.query;
    let query = `
      SELECT t.*, a.name as album_name, ar.name as artist_name, l.name as label_name
      FROM tracks t
      JOIN albums a ON t."albumId" = a.id
      JOIN artists ar ON t."artistId" = ar.id
      JOIN labels l ON a."labelId" = l.id
    `;
    
    const params: any[] = [];
    if (label) {
      query += ` WHERE l.name = $1`;
      params.push(label);
    }
    
    query += ` ORDER BY t.name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get releases for a label
router.get('/releases/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    console.log('Fetching releases for label:', labelId);

    const query = `
      SELECT 
        a.id,
        a.name,
        a."artistId",
        art.name as artist_name,
        a.release_date,
        a.external_urls
      FROM albums a
      JOIN artists art ON a."artistId" = art.id
      WHERE a."labelId" = $1
      ORDER BY a.release_date DESC
    `;

    const result = await pool.query(query, [labelId]);
    console.log(`Found ${result.rows.length} releases`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ error: 'Failed to fetch releases' });
  }
});

// Get tracks for a label
router.get('/tracks/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    console.log('Fetching tracks for label:', labelId);

    // First get all albums for this label
    const albumsQuery = `
      SELECT id FROM albums 
      WHERE "labelId" = $1
    `;
    const albumsResult = await pool.query(albumsQuery, [labelId]);
    const albumIds = albumsResult.rows.map(r => r.id);

    if (albumIds.length === 0) {
      console.log('No albums found for label:', labelId);
      return res.json([]);
    }

    // Then get all tracks for these albums
    const tracksQuery = `
      SELECT 
        t.id,
        t.name,
        t."albumId",
        t."artistId",
        art.name as artist_name,
        alb.name as album_title,
        t.duration_ms,
        t.preview_url,
        t.external_urls,
        t.uri
      FROM tracks t
      JOIN albums alb ON t."albumId" = alb.id
      JOIN artists art ON t."artistId" = art.id
      WHERE t."albumId" = ANY($1)
      ORDER BY alb.name, t.name
    `;
    
    console.log('Executing tracks query with album IDs:', albumIds);
    const tracksResult = await pool.query(tracksQuery, [albumIds]);
    console.log(`Found ${tracksResult.rows.length} tracks`);

    res.json(tracksResult.rows);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tracks',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Import releases for a label
router.post('/import/:labelId', async (req, res) => {
  console.log('Received import request for label:', req.params.labelId);
  try {
    const { labelId } = req.params;
    
    // Verify Spotify credentials
    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      console.error('Missing Spotify credentials');
      return res.status(500).json({ error: 'Missing Spotify credentials' });
    }

    // Initialize Spotify API
    console.log('Initializing Spotify API...');
    const spotifyApi = await getSpotifyApi();
    console.log('Spotify API initialized successfully');
    
    // Get label info
    const labelQuery = 'SELECT * FROM labels WHERE id = $1';
    const labelResult = await pool.query(labelQuery, [labelId]);
    
    if (labelResult.rows.length === 0) {
      console.error('Label not found:', labelId);
      return res.status(404).json({ error: 'Label not found' });
    }

    const label = labelResult.rows[0];
    console.log('Processing label:', label.displayName);

    // Define search queries for each label
    const labelSearchQueries: { [key: string]: string[] } = {
      'buildit-records': [
        'label:"Build It Records"',
        'label:"BuildIt Records"',
        'label:"Build-It Records"',
        'label:Build It Records',
        'label:BuildIt Records',
        'label:Build-It Records'
      ],
      'buildit-tech': [
        'label:"Build It Tech"',
        'label:"BuildIt Tech"',
        'label:"Build-It Tech"',
        'label:Build It Tech',
        'label:BuildIt Tech',
        'label:Build-It Tech'
      ],
      'buildit-deep': [
        'label:"Build It Deep"',
        'label:"BuildIt Deep"',
        'label:"Build-It Deep"',
        'label:Build It Deep',
        'label:BuildIt Deep',
        'label:Build-It Deep'
      ]
    };

    const searchQueries = labelSearchQueries[labelId] || [];
    if (searchQueries.length === 0) {
      return res.status(400).json({ error: 'No search queries defined for this label' });
    }

    let processedAlbums = new Set<string>();
    let processedArtists = new Set<string>();

    // Search for albums using each label variation
    for (const query of searchQueries) {
      console.log('Searching with query:', query);
      try {
        const searchResults = await spotifyApi.search(query, ['album'], { limit: 50 });
        console.log(`Found ${searchResults.albums?.items.length || 0} albums for query:`, query);

        if (!searchResults.albums?.items.length) {
          continue;
        }

        for (const album of searchResults.albums.items) {
          if (processedAlbums.has(album.id)) {
            console.log('Album already processed:', album.name);
            continue;
          }

          try {
            // Get full album details to verify the label
            const fullAlbum = await spotifyApi.albums.get(album.id);
            const albumLabel = fullAlbum.label?.toLowerCase() || '';
            const labelName = label.displayName.toLowerCase();

            console.log('Comparing labels:', {
              albumLabel,
              labelName,
              albumName: album.name,
              fullLabel: fullAlbum.label
            });

            // More lenient label matching
            const normalizedAlbumLabel = albumLabel.replace(/[-\s]/g, '');
            const normalizedLabelName = labelName.replace(/[-\s]/g, '');

            if (!normalizedAlbumLabel.includes(normalizedLabelName) && 
                !normalizedLabelName.includes(normalizedAlbumLabel)) {
              console.log('Skipping album with non-matching label:', {
                albumName: album.name,
                albumLabel: fullAlbum.label,
                normalizedAlbumLabel,
                normalizedLabelName
              });
              continue;
            }

            console.log('Processing album:', album.name, 'with label:', fullAlbum.label);
            processedAlbums.add(album.id);

            // First, check if the artist exists
            let artistId = album.artists[0].id;
            if (!processedArtists.has(artistId)) {
              const artistResult = await pool.query(
                'INSERT INTO artists (id, name, images, external_urls, uri) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = $2, images = $3, external_urls = $4, uri = $5 RETURNING id',
                [
                  artistId,
                  album.artists[0].name,
                  JSON.stringify(album.artists[0].images || []),
                  JSON.stringify(album.artists[0].external_urls || {}),
                  album.artists[0].uri || null
                ]
              );
              processedArtists.add(artistId);
            }

            // Insert the album
            await pool.query(
              `INSERT INTO albums (
                id, name, "artistId", "labelId", images, release_date,
                total_tracks, external_urls, uri, album_type, popularity
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              ON CONFLICT (id) DO UPDATE SET
                name = $2,
                "artistId" = $3,
                "labelId" = $4,
                images = $5,
                release_date = $6,
                total_tracks = $7,
                external_urls = $8,
                uri = $9,
                album_type = $10,
                popularity = $11`,
              [
                album.id,
                album.name,
                artistId,
                labelId,
                JSON.stringify(album.images || []),
                album.release_date,
                album.total_tracks,
                JSON.stringify(album.external_urls || {}),
                album.uri || null,
                album.album_type || null,
                album.popularity || 0
              ]
            );

            // Insert tracks
            for (const track of fullAlbum.tracks.items) {
              try {
                const trackResult = await pool.query(
                  `INSERT INTO tracks (
                    id, name, "albumId", "artistId", duration_ms,
                    preview_url, external_urls, uri, track_number
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                  ON CONFLICT (id) DO UPDATE SET
                    name = $2,
                    "albumId" = $3,
                    "artistId" = $4,
                    duration_ms = $5,
                    preview_url = $6,
                    external_urls = $7,
                    uri = $8,
                    track_number = $9`,
                  [
                    track.id,
                    track.name,
                    album.id,
                    track.artists[0].id,
                    track.duration_ms,
                    track.preview_url,
                    JSON.stringify(track.external_urls || {}),
                    track.uri || null,
                    track.track_number
                  ]
                );
              } catch (trackError) {
                console.error('Error inserting track:', track.name, trackError);
              }
            }
          } catch (albumError) {
            console.error('Error processing album:', album.name, albumError);
          }
        }
      } catch (searchError) {
        console.error('Error searching with query:', query, searchError);
      }
    }

    console.log('Import completed successfully');
    res.json({ 
      message: 'Import completed successfully',
      stats: {
        albums: processedAlbums.size,
        artists: processedArtists.size
      }
    });
  } catch (error) {
    console.error('Error importing releases:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

router.get('/import-releases/:labelId', async (req, res) => {
  const { labelId } = req.params;
  console.log('Starting import for label:', labelId);

  try {
    // Get label info
    const labelResult = await pool.query(
      'SELECT * FROM labels WHERE id = $1',
      [labelId]
    );

    if (labelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Label not found' });
    }

    const label = labelResult.rows[0];
    console.log('Found label:', label);

    // Initialize Spotify API with fresh token
    try {
      const spotifyApi = await getSpotifyApi();
      console.log('Successfully initialized Spotify API');
      
      // Try different search approaches
      const searchTerms = [
        // Search by genre and filter by label later
        'genre:electronic',
        'genre:house',
        'genre:techno',
        // Search by specific terms
        'build it records',
        'build it tech',
        'build it deep'
      ];

      let processedAlbums = new Set<string>();
      let totalResults = 0;

      for (const searchTerm of searchTerms) {
        console.log('Searching with term:', searchTerm);
        try {
          const searchResults = await spotifyApi.search(searchTerm, ['album']);
          console.log(`Found ${searchResults.albums?.items.length || 0} albums for search:`, searchTerm);
          
          if (!searchResults.albums?.items.length) continue;
          
          for (const album of searchResults.albums.items) {
            if (processedAlbums.has(album.id)) continue;
            
            try {
              const fullAlbum = await spotifyApi.albums.get(album.id);
              console.log('Album details:', {
                name: album.name,
                label: fullAlbum.label,
                artists: album.artists.map(a => a.name).join(', '),
                releaseDate: album.release_date
              });
              
              totalResults++;
              processedAlbums.add(album.id);
              
            } catch (error) {
              console.error('Error fetching album details:', {
                albumId: album.id,
                albumName: album.name,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
        } catch (error) {
          console.error('Search error:', {
            searchTerm,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log('Total results found:', totalResults);
      return res.json({ message: 'Import completed', totalResults });

    } catch (spotifyError) {
      console.error('Spotify API error:', {
        error: spotifyError instanceof Error ? spotifyError.message : 'Unknown error',
        stack: spotifyError instanceof Error ? spotifyError.stack : undefined
      });
      return res.status(500).json({ error: 'Failed to initialize Spotify API' });
    }

  } catch (error) {
    console.error('Import error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ error: 'Import failed' });
  }
});

// Get all releases for a label
router.get('/releases/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    console.log('Fetching releases for label:', labelId);

    // First check if the label exists
    const labelResult = await pool.query(
      'SELECT * FROM labels WHERE id = $1',
      [labelId]
    );
    console.log('Label query result:', labelResult.rows);

    if (labelResult.rows.length === 0) {
      console.error('Label not found:', labelId);
      return res.status(404).json({ error: 'Label not found' });
    }

    // Fetch releases for the label
    const query = `
      SELECT 
        r.id,
        r.name,
        r."artistId" as artist_id,
        r.images::text as images,
        r.release_date,
        r.external_urls->'spotify' as spotify_url,
        a.name as artist_name
      FROM albums r
      JOIN artists a ON r."artistId" = a.id
      WHERE r."labelId" = $1
      ORDER BY r.release_date DESC NULLS LAST
    `;
    console.log('Executing query:', query);
    console.log('With parameters:', [labelId]);

    const result = await pool.query(query, [labelId]);
    console.log('Found releases:', result.rows.length);

    // Parse JSON fields
    const releases = result.rows.map(row => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : null
    }));

    res.json(releases);
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get all tracks for a release
router.get('/releases/:releaseId/tracks', async (req, res) => {
  try {
    const { releaseId } = req.params;
    const result = await pool.query(
      `SELECT t.*, ar.name as artist_name
       FROM tracks t
       JOIN artists ar ON t."artistId" = ar.id
       WHERE t."albumId" = $1
       ORDER BY t.name`,
      [releaseId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all artists for a label
router.get('/artists/:labelId', async (req, res) => {
  try {
    const { labelId } = req.params;
    const result = await pool.query(
      `SELECT a.*
       FROM artists a
       WHERE a."labelId" = $1
       ORDER BY a.name`,
      [labelId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all labels
router.get('/labels', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM labels ORDER BY name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching labels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
