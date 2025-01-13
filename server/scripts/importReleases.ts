import { config } from 'dotenv';
import { Pool } from 'pg';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

config(); // Load environment variables

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'builditrecords'
});

const spotifyApi = SpotifyApi.withClientCredentials(
  process.env.SPOTIFY_CLIENT_ID || '',
  process.env.SPOTIFY_CLIENT_SECRET || ''
);

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
      "labelId" = EXCLUDED."labelId",
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING id`,
    [
      id,
      name,
      JSON.stringify(images),
      JSON.stringify(external_urls),
      followers.total,
      popularity,
      labelId
    ]
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
    images,
    release_date,
    total_tracks,
    external_urls,
    popularity = 0
  } = album;

  return pool.query(
    `INSERT INTO albums (
      id, name, "artistId", "labelId", images, release_date,
      total_tracks, external_urls, popularity
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      "artistId" = EXCLUDED."artistId",
      "labelId" = EXCLUDED."labelId",
      images = EXCLUDED.images,
      release_date = EXCLUDED.release_date,
      total_tracks = EXCLUDED.total_tracks,
      external_urls = EXCLUDED.external_urls,
      popularity = EXCLUDED.popularity,
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING id`,
    [
      id,
      name,
      artistId,
      labelId,
      JSON.stringify(images),
      release_date,
      total_tracks,
      JSON.stringify(external_urls),
      popularity
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
    uri
  } = track;

  return pool.query(
    `INSERT INTO tracks (
      id, name, "albumId", "artistId", duration_ms,
      preview_url, external_urls, uri
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      "albumId" = EXCLUDED."albumId",
      "artistId" = EXCLUDED."artistId",
      duration_ms = EXCLUDED.duration_ms,
      preview_url = EXCLUDED.preview_url,
      external_urls = EXCLUDED.external_urls,
      uri = EXCLUDED.uri,
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING id`,
    [
      id,
      name,
      albumId,
      artistId,
      duration_ms,
      preview_url,
      JSON.stringify(external_urls),
      uri
    ]
  );
}

async function importArtistReleases(artistId: string, labelName: string) {
  try {
    const labelId = await getLabelId(labelName);
    
    // Fetch artist details
    const artist = await spotifyApi.artists.get(artistId);
    await insertArtist(artist, labelId);

    // Fetch artist's albums
    const albums = await spotifyApi.artists.albums(artistId);
    
    for (const album of albums.items) {
      // Only import albums and singles
      if (album.album_type !== 'album' && album.album_type !== 'single') {
        continue;
      }

      // Insert album
      await insertAlbum(album, artistId, labelId);

      // Fetch and insert tracks
      const albumTracks = await spotifyApi.albums.tracks(album.id);
      for (const track of albumTracks.items) {
        await insertTrack(track, album.id, artistId);
      }
    }

    console.log(`Successfully imported releases for artist: ${artist.name}`);
  } catch (error) {
    console.error('Error importing releases:', error);
    throw error;
  }
}

async function main() {
  try {
    // Example artists to import (replace with your actual artist IDs)
    const artists = [
      { id: '5INjqkS1o8h1imAzPqGZBb', label: 'records' }, // Tame Impala
      { id: '4LLpKhyESsyAXpc4laK94U', label: 'tech' },   // Mac Miller
      { id: '6l3HvQ5sa6mXTsMTB19rO5', label: 'deep' }    // J. Cole
    ];

    for (const artist of artists) {
      await importArtistReleases(artist.id, artist.label);
    }

    console.log('Successfully imported all releases');
  } catch (error) {
    console.error('Error in main:', error);
  } finally {
    await pool.end();
  }
}

main();
