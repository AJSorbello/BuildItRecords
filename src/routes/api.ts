import { Router } from 'express';
import { Pool } from 'pg';
import { config } from 'dotenv';
import fetch from 'node-fetch';
import { verifyAdminToken } from '../middleware/auth';

config();

const router = Router();
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'builditrecords',
  ssl: false
});

// Get Spotify access token
const getSpotifyToken = async () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify credentials');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }).toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify access token');
  }

  const data = await response.json();
  return data.access_token;
};

// Fetch from Spotify API
const fetchFromSpotify = async <T>(endpoint: string): Promise<T> => {
  const token = await getSpotifyToken();
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.statusText}`);
  }

  return response.json();
};

// Get all tracks for a specific label
router.get('/labels/:labelId/tracks', async (req, res) => {
  try {
    const { labelId } = req.params;
    const query = `
      SELECT t.*, 
             json_agg(DISTINCT a.*) as artists,
             json_agg(DISTINCT r.*) as release
      FROM tracks t
      LEFT JOIN track_artists ta ON t.id = ta.track_id
      LEFT JOIN artists a ON ta.artist_id = a.id
      LEFT JOIN releases r ON t.release_id = r.id
      WHERE t.label_id = $1
      GROUP BY t.id
    `;
    
    const result = await pool.query(query, [labelId]);
    res.json({ tracks: result.rows });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tracks (no label filter)
router.get('/tracks', async (req, res) => {
  try {
    const query = `
      SELECT t.*, 
             json_agg(DISTINCT a.*) as artists,
             json_agg(DISTINCT r.*) as release
      FROM tracks t
      LEFT JOIN track_artists ta ON t.id = ta.track_id
      LEFT JOIN artists a ON ta.artist_id = a.id
      LEFT JOIN releases r ON t.release_id = r.id
      GROUP BY t.id
    `;
    
    const result = await pool.query(query);
    res.json({ tracks: result.rows });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search tracks for a specific label
router.get('/labels/:labelId/tracks/search', async (req, res) => {
  try {
    const { labelId } = req.params;
    const { query } = req.query;
    
    const searchQuery = `
      SELECT t.*, 
             json_agg(DISTINCT a.*) as artists,
             json_agg(DISTINCT r.*) as release
      FROM tracks t
      LEFT JOIN track_artists ta ON t.id = ta.track_id
      LEFT JOIN artists a ON ta.artist_id = a.id
      LEFT JOIN releases r ON t.release_id = r.id
      WHERE t.label_id = $1
        AND (
          t.title ILIKE $2
          OR a.name ILIKE $2
          OR r.name ILIKE $2
        )
      GROUP BY t.id
    `;
    
    const result = await pool.query(searchQuery, [labelId, `%${query}%`]);
    res.json({ tracks: result.rows });
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search all tracks
router.get('/tracks/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    const searchQuery = `
      SELECT t.*, 
             json_agg(DISTINCT a.*) as artists,
             json_agg(DISTINCT r.*) as release
      FROM tracks t
      LEFT JOIN track_artists ta ON t.id = ta.track_id
      LEFT JOIN artists a ON ta.artist_id = a.id
      LEFT JOIN releases r ON t.release_id = r.id
      WHERE t.title ILIKE $1
        OR a.name ILIKE $1
        OR r.name ILIKE $1
      GROUP BY t.id
    `;
    
    const result = await pool.query(searchQuery, [`%${query}%`]);
    res.json({ tracks: result.rows });
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get releases for a specific label
router.get('/labels/:labelId/releases', async (req, res) => {
  try {
    const { labelId } = req.params;
    const query = `
      SELECT r.*, 
             json_agg(DISTINCT a.*) as artists,
             json_agg(DISTINCT t.*) as tracks
      FROM releases r
      LEFT JOIN release_artists ra ON r.id = ra.release_id
      LEFT JOIN artists a ON ra.artist_id = a.id
      LEFT JOIN tracks t ON r.id = t.release_id
      WHERE r.label_id = $1
      GROUP BY r.id
    `;
    
    const result = await pool.query(query, [labelId]);
    res.json({ releases: result.rows });
  } catch (error) {
    console.error('Error fetching releases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import tracks for a specific label
router.post('/labels/:labelId/import', verifyAdminToken, async (req, res) => {
  console.log('Received import request for label:', req.params.labelId);
  try {
    const { labelId } = req.params;
    
    // Get the Spotify playlist ID for this label
    const labelQuery = 'SELECT spotify_playlist_id FROM labels WHERE id = $1';
    const labelResult = await pool.query(labelQuery, [labelId]);
    
    if (!labelResult.rows[0]?.spotify_playlist_id) {
      return res.status(400).json({ error: 'No Spotify playlist ID found for this label' });
    }

    const playlistId = labelResult.rows[0].spotify_playlist_id;
    
    // Get tracks from Spotify playlist
    const playlist = await fetchFromSpotify<any>(`/playlists/${playlistId}/tracks`);
    
    // Process each track
    for (const item of playlist.items) {
      if (!item.track) continue;
      
      const track = item.track;
      
      // Get or create artist
      const artistResult = await pool.query(
        'INSERT INTO artists (name, spotify_id, label_id) VALUES ($1, $2, $3) ON CONFLICT (spotify_id) DO UPDATE SET name = $1 RETURNING id',
        [track.artists[0].name, track.artists[0].id, labelId]
      );
      
      // Get or create release
      const releaseResult = await pool.query(
        'INSERT INTO releases (name, spotify_id, label_id) VALUES ($1, $2, $3) ON CONFLICT (spotify_id) DO UPDATE SET name = $1 RETURNING id',
        [track.album.name, track.album.id, labelId]
      );
      
      // Insert track
      await pool.query(
        'INSERT INTO tracks (title, id, release_id, label_id) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET title = $1',
        [track.title, track.id, releaseResult.rows[0].id, labelId]
      );
    }
    
    res.json({ success: true, message: 'Import completed successfully' });
  } catch (error) {
    console.error('Error importing tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a track
router.put('/tracks/:trackId', async (req, res) => {
  try {
    const { trackId } = req.params;
    const updates = req.body;
    
    const query = `
      UPDATE tracks 
      SET ${Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [trackId, ...Object.values(updates)];
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating track:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tracks for a release
router.get('/releases/:releaseId/tracks', async (req, res) => {
  try {
    const { releaseId } = req.params;
    
    const query = `
      SELECT t.*, a.name as artist_name
      FROM tracks t
      LEFT JOIN artists a ON t.artist_id = a.id
      WHERE t.release_id = $1
    `;
    
    const result = await pool.query(query, [releaseId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching release tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
