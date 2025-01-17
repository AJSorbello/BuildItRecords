import { Pool } from 'pg';
import { RECORD_LABELS, RecordLabel } from '../src/constants/labels';
import dotenv from 'dotenv';
import SpotifyWebApi from 'spotify-web-api-node';

// Load environment variables
dotenv.config();

// Configure PostgreSQL connection
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'buildit_records',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

async function getSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    console.log('Successfully retrieved access token');
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw error;
  }
}

async function insertLabel(label: RecordLabel): Promise<number> {
  const slug = label.toLowerCase().replace(/\s+/g, '-');
  const now = new Date().toISOString();
  const result = await pool.query(
    'INSERT INTO labels (name, slug, "createdAt", "updatedAt") VALUES ($1, $2, $3, $3) RETURNING id',
    [label, slug, now]
  );
  return result.rows[0].id;
}

async function insertArtist(artist: any, labelId: number): Promise<void> {
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO artists (
      id, name, image_url, bio, spotify_url, monthly_listeners, label_id, "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      image_url = EXCLUDED.image_url,
      bio = EXCLUDED.bio,
      spotify_url = EXCLUDED.spotify_url,
      monthly_listeners = EXCLUDED.monthly_listeners,
      label_id = EXCLUDED.label_id,
      "updatedAt" = $8`,
    [
      artist.id,
      artist.name,
      artist.imageUrl,
      artist.bio,
      artist.spotifyUrl,
      artist.monthlyListeners,
      labelId,
      now
    ]
  );
}

async function insertRelease(release: any, artistId: string, labelId: number): Promise<void> {
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO releases (
      id, title, artist_id, artwork_url, release_date, genre,
      label_id, spotify_url, beatport_url, soundcloud_url, "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      artist_id = EXCLUDED.artist_id,
      artwork_url = EXCLUDED.artwork_url,
      release_date = EXCLUDED.release_date,
      genre = EXCLUDED.genre,
      label_id = EXCLUDED.label_id,
      spotify_url = EXCLUDED.spotify_url,
      beatport_url = EXCLUDED.beatport_url,
      soundcloud_url = EXCLUDED.soundcloud_url,
      "updatedAt" = $11`,
    [
      release.id,
      release.title,
      artistId,
      release.artworkUrl,
      release.releaseDate,
      release.genre,
      labelId,
      release.spotifyUrl,
      release.beatportUrl,
      release.soundcloudUrl,
      now
    ]
  );
}

async function insertTrack(track: any, artistId: string, releaseId: string): Promise<void> {
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO tracks (
      id, name, artist_id, release_id, preview_url, spotify_url, "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      artist_id = EXCLUDED.artist_id,
      release_id = EXCLUDED.release_id,
      preview_url = EXCLUDED.preview_url,
      spotify_url = EXCLUDED.spotify_url,
      "updatedAt" = $7`,
    [
      track.id,
      track.name,
      artistId,
      releaseId,
      track.previewUrl,
      track.spotifyUrl,
      now
    ]
  );
}

async function verifyTrackLabel(track: any, label: string): Promise<boolean> {
  try {
    // Get the full album details
    const albumData = await spotifyApi.getAlbum(track.album.id);
    const album = albumData.body;
    
    // Check if the label matches exactly (case-insensitive)
    const trackLabel = album.label?.toLowerCase().trim();
    const expectedLabel = label.toLowerCase().trim();
    
    // Check for exact match or variations
    const isMatch = 
      trackLabel === expectedLabel ||
      (label === 'Build It Records' && trackLabel === 'build it') ||
      (label === 'Build It Tech' && trackLabel === 'build it tech') ||
      (label === 'Build It Deep' && trackLabel === 'build it deep');
    
    if (isMatch) {
      console.log(`✅ Verified track "${track.name}" belongs to label "${label}"`);
    } else {
      console.log(`❌ Track "${track.name}" has label "${album.label}" - not matching "${label}"`);
    }
    
    return isMatch;
  } catch (error) {
    console.error(`Error verifying track label for ${track.name}:`, error);
    return false;
  }
}

async function getTracksForLabel(label: string) {
  const allTracks = new Map();
  const searchQueries = [
    `label:"${label}"`,
    `label:${label.replace(/\s+/g, '')}`,
  ];

  for (const query of searchQueries) {
    try {
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        console.log(`Fetching tracks for "${query}" (offset: ${offset})`);
        const searchResults = await spotifyApi.searchTracks(query, { 
          limit,
          offset,
        });

        const tracks = searchResults.body.tracks?.items || [];
        if (tracks.length === 0) {
          hasMore = false;
          continue;
        }

        // Verify each track's label
        for (const track of tracks) {
          if (!allTracks.has(track.id)) {
            const isCorrectLabel = await verifyTrackLabel(track, label);
            if (isCorrectLabel) {
              allTracks.set(track.id, track);
            }
          }
          // Wait a bit to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        offset += limit;
        hasMore = tracks.length === limit && offset < 1000; // Spotify limit is 1000
      }
    } catch (error) {
      console.error(`Error fetching tracks for query "${query}":`, error);
    }
  }

  return Array.from(allTracks.values());
}

async function migrateData() {
  try {
    console.log('Starting migration...');
    
    // Insert labels first
    const labelIds = new Map<string, number>();
    for (const [labelName, label] of Object.entries(RECORD_LABELS)) {
      const labelId = await insertLabel(label);
      labelIds.set(labelName, labelId);
      console.log(`Inserted label: ${labelName}`);
    }

    // Migrate tracks and associated data for each label
    for (const [labelName, label] of Object.entries(RECORD_LABELS)) {
      console.log(`\nProcessing label: ${labelName}`);
      const labelId = labelIds.get(labelName)!;

      await getSpotifyToken();
      const tracks = await getTracksForLabel(label);
      console.log(`\nFound ${tracks.length} verified tracks for ${labelName}`);

      for (const track of tracks) {
        try {
          // Insert artist
          const artist = track.artists[0];
          if (artist) {
            // Get artist details
            const artistData = await spotifyApi.getArtist(artist.id);
            const artistDetails = {
              id: artist.id,
              name: artist.name,
              imageUrl: artistData.body.images?.[0]?.url || '',
              bio: '',
              spotifyUrl: artistData.body.external_urls?.spotify || '',
              monthlyListeners: artistData.body.followers?.total || 0
            };

            await insertArtist(artistDetails, labelId);
            console.log(`Inserted artist: ${artist.name}`);

            // Get full album details
            const albumData = await spotifyApi.getAlbum(track.album.id);
            const album = albumData.body;

            // Create a release
            const release = {
              id: album.id,
              title: album.name,
              artworkUrl: album.images[0]?.url || '',
              releaseDate: album.release_date,
              genre: album.genres?.[0] || '',
              spotifyUrl: album.external_urls?.spotify || '',
              beatportUrl: '',
              soundcloudUrl: ''
            };

            await insertRelease(release, artist.id, labelId);
            console.log(`Inserted release: ${release.title}`);

            // Insert track
            const trackDetails = {
              id: track.id,
              name: track.name,
              previewUrl: track.preview_url || '',
              spotifyUrl: track.external_urls?.spotify || ''
            };

            await insertTrack(trackDetails, artist.id, release.id);
            console.log(`Inserted track: ${track.name}`);

            // Wait a bit to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Error processing track:`, error);
        }
      }
    }

    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

migrateData();
