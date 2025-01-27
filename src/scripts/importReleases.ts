import { config } from 'dotenv';
import { Pool } from 'pg';

config(); // Load environment variables

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'builditrecords'
});

async function getSpotifyToken(): Promise<string> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify access token');
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchFromSpotify<T>(endpoint: string, token: string): Promise<T> {
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.statusText}`);
  }

  return response.json();
}

async function getLabelId(labelName: string): Promise<number> {
  const result = await pool.query(
    'SELECT id FROM labels WHERE name = $1',
    [labelName]
  );
  if (result.rows.length === 0) {
    throw new Error(`Label not found: ${labelName}`);
  }
  return result.rows[0].id;
}

async function insertArtist(artist: any, labelId: number) {
  const {
    id,
    name,
    images,
    external_urls,
    followers,
    popularity
  } = artist;

  // First insert the artist
  await pool.query(
    `INSERT INTO artists (
      id, name, images, external_urls, followers, popularity, "labelId"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      images = EXCLUDED.images,
      external_urls = EXCLUDED.external_urls,
      followers = EXCLUDED.followers,
      popularity = EXCLUDED.popularity,
      "labelId" = EXCLUDED."labelId"`,
    [id, name, JSON.stringify(images), JSON.stringify(external_urls), followers, popularity, labelId]
  );

  // Then insert into artist_labels junction table
  await pool.query(
    `INSERT INTO artist_labels ("artistId", "labelId")
     VALUES ($1, $2)
     ON CONFLICT ("artistId", "labelId") DO NOTHING`,
    [id, labelId]
  );
}

async function insertAlbum(album: any, artistId: string, labelId: number) {
  const {
    id,
    name,
    release_date,
    release_date_precision,
    total_tracks,
    images,
    external_urls,
    uri,
    copyrights
  } = album;

  await pool.query(
    `INSERT INTO albums (
      id, name, release_date, release_date_precision, total_tracks,
      images, external_urls, uri, copyrights, "artistId", "labelId"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      release_date = EXCLUDED.release_date,
      release_date_precision = EXCLUDED.release_date_precision,
      total_tracks = EXCLUDED.total_tracks,
      images = EXCLUDED.images,
      external_urls = EXCLUDED.external_urls,
      uri = EXCLUDED.uri,
      copyrights = EXCLUDED.copyrights,
      "artistId" = EXCLUDED."artistId",
      "labelId" = EXCLUDED."labelId"`,
    [
      id, name, release_date, release_date_precision, total_tracks,
      JSON.stringify(images), JSON.stringify(external_urls), uri, copyrights, artistId, labelId
    ]
  );
}

async function insertTrack(track: any, albumId: string, artistId: string) {
  const {
    id,
    name,
    duration_ms,
    preview_url,
    external_urls,
    external_ids,
    uri,
    popularity
  } = track;

  await pool.query(
    `INSERT INTO tracks (
      id, name, duration_ms, preview_url, external_urls,
      external_ids, uri, popularity, "albumId", "artistId"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      duration_ms = EXCLUDED.duration_ms,
      preview_url = EXCLUDED.preview_url,
      external_urls = EXCLUDED.external_urls,
      external_ids = EXCLUDED.external_ids,
      uri = EXCLUDED.uri,
      popularity = EXCLUDED.popularity,
      "albumId" = EXCLUDED."albumId",
      "artistId" = EXCLUDED."artistId"`,
    [
      id, name, duration_ms, preview_url, JSON.stringify(external_urls),
      JSON.stringify(external_ids), uri, popularity, albumId, artistId
    ]
  );
}

async function importArtistReleases(artistId: string, labelName: string) {
  try {
    const labelId = await getLabelId(labelName);
    const token = await getSpotifyToken();

    // Get artist details
    const artist = await fetchFromSpotify(`/artists/${artistId}`, token);
    await insertArtist(artist, labelId);

    // Get artist's albums
    const albumsResponse = await fetchFromSpotify(`/artists/${artistId}/albums`, token);
    const albums = albumsResponse.items;

    for (const album of albums) {
      // Only import albums and singles
      if (album.album_type !== 'album' && album.album_type !== 'single') {
        continue;
      }

      await insertAlbum(album, artistId, labelId);

      // Get album tracks
      const tracksResponse = await fetchFromSpotify(`/albums/${album.id}/tracks`, token);
      const tracks = tracksResponse.items;

      for (const track of tracks) {
        await insertTrack(track, album.id, artistId);
      }
    }

    console.log(`Successfully imported releases for artist: ${artist.name}`);
  } catch (error) {
    console.error('Error importing artist releases:', error);
  }
}

async function main() {
  try {
    // Example usage
    const artistsToImport = [
      { id: '0TnOYISbd1XYRBk9myaseg', label: 'Pitchfork' }, // Pitchfork
      { id: '2YZyLoL8N0Wb9xBt1NhZWg', label: 'Rough Trade' }, // Kendrick Lamar
      { id: '4LEiUm1SRbFMgfqnQTwUbQ', label: 'XL Recordings' } // Bon Iver
    ];

    for (const artist of artistsToImport) {
      await importArtistReleases(artist.id, artist.label);
    }

    console.log('Import completed successfully');
  } catch (error) {
    console.error('Error in main:', error);
  } finally {
    await pool.end();
  }
}

main();
