#!/usr/bin/env node

import pg from 'pg';
import { RECORD_LABELS } from '../src/constants/labels.js';
import type { RecordLabel } from '../src/types/labels.js';
import dotenv from 'dotenv';
import SpotifyWebApi from 'spotify-web-api-node';

const { Pool } = pg;

// Load environment variables
dotenv.config();

// Configure PostgreSQL connection
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'builditrecords',
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

async function insertLabel(labelId: string, label: RecordLabel): Promise<string> {
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO labels (
      id, name, display_name, slug, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $5) 
    ON CONFLICT (id) DO NOTHING`,
    [labelId, label.name, label.displayName, labelId.toLowerCase(), now]
  );
  return labelId;
}

async function insertArtist(artist: any, labelId: string): Promise<void> {
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO artists (
      id, name, image_url, bio, spotify_url, monthly_listeners, label_id, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      image_url = EXCLUDED.image_url,
      spotify_url = EXCLUDED.spotify_url,
      monthly_listeners = EXCLUDED.monthly_listeners,
      updated_at = EXCLUDED.updated_at`,
    [
      artist.id,
      artist.name,
      artist.images?.[0]?.url || '',
      '',
      artist.external_urls?.spotify || '',
      artist.followers?.total || 0,
      labelId,
      now
    ]
  );
}

async function insertRelease(release: any, artistId: string, labelId: string): Promise<void> {
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO releases (
      id, name, artwork_url, release_date, spotify_url, label_id, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      artwork_url = EXCLUDED.artwork_url,
      spotify_url = EXCLUDED.spotify_url,
      updated_at = EXCLUDED.updated_at`,
    [
      release.id,
      release.title,
      release.artworkUrl,
      release.releaseDate,
      release.spotifyUrl,
      labelId,
      now
    ]
  );

  // Insert release_artists association
  await pool.query(
    `INSERT INTO release_artists (release_id, artist_id, created_at, updated_at)
    VALUES ($1, $2, $3, $3)
    ON CONFLICT (release_id, artist_id) DO NOTHING`,
    [release.id, artistId, now]
  );
}

async function insertTrack(track: any, artistId: string, releaseId: string): Promise<void> {
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO tracks (
      id, title, preview_url, spotify_url, release_id, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $6)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      preview_url = EXCLUDED.preview_url,
      spotify_url = EXCLUDED.spotify_url,
      updated_at = EXCLUDED.updated_at`,
    [
      track.id,
      track.title,  // Changed from name to title
      track.previewUrl,
      track.spotifyUrl,
      releaseId,
      now
    ]
  );

  // Insert track_artists association
  await pool.query(
    `INSERT INTO track_artists (track_id, artist_id, created_at, updated_at)
    VALUES ($1, $2, $3, $3)
    ON CONFLICT (track_id, artist_id) DO NOTHING`,
    [track.id, artistId, now]
  );
}

async function verifyTrackLabel(track: any, labelId: string): Promise<boolean> {
  try {
    const album = await spotifyApi.getAlbum(track.album.id);
    const copyrights = album.body.copyrights || [];
    const trackCopyrights = copyrights.map(c => c.text?.toLowerCase().trim());
    
    // Check if any copyright mentions Build It Records
    return trackCopyrights.some(copyright => 
      copyright?.includes('build it') || 
      copyright?.includes('buildit') ||
      copyright?.includes(labelId.toLowerCase())
    );
  } catch (error) {
    console.error(`Error verifying track label for "${track.title}":`, error);  // Changed from name to title
    return false;
  }
}

async function getTracksForLabel(labelId: string) {
  const allTracks = new Map<string, any>();
  const queries = [
    'label:"Build It Records"',
    'label:"BuildIt Records"',
    'label:"Buildit Records"',
    'copyright:"Build It Records"',
    'copyright:"BuildIt Records"',
    'copyright:"Buildit Records"'
  ];

  for (const query of queries) {
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    try {
      while (hasMore) {
        const result = await spotifyApi.searchTracks(query, { limit, offset });
        const tracks = result.body.tracks?.items || [];
        console.log(`Found ${tracks.length} tracks for query "${query}" (offset: ${offset})`);

        for (const track of tracks) {
          if (await verifyTrackLabel(track, labelId)) {
            allTracks.set(track.id, track);
          }
        }

        offset += limit;
        hasMore = tracks.length === limit && offset < 1000; // Spotify limit is 1000
      }
    } catch (error) {
      console.error(`Error fetching tracks for query "${query}":`, error);
    }
  }

  const finalTracks = Array.from(allTracks.values());
  console.log(`Total unique tracks found for ${labelId}: ${finalTracks.length}`);
  return finalTracks;
}

async function migrateData() {
  try {
    console.log('Starting migration...');
    
    // Insert labels
    for (const [labelId, label] of Object.entries(RECORD_LABELS)) {
      await insertLabel(labelId, label);
      console.log(`Inserted label: ${label.displayName}`);
    }

    // Migrate tracks and associated data for each label
    for (const [labelId, label] of Object.entries(RECORD_LABELS)) {
      console.log(`\nProcessing label: ${label.displayName}`);

      await getSpotifyToken();
      const tracks = await getTracksForLabel(labelId);
      console.log(`\nFound ${tracks.length} verified tracks for ${label.displayName}`);

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
              images: artistData.body.images,
              external_urls: artistData.body.external_urls,
              followers: artistData.body.followers
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
              spotifyUrl: album.external_urls?.spotify || ''
            };

            await insertRelease(release, artist.id, labelId);
            console.log(`Inserted release: ${release.title}`);

            // Insert track
            const trackDetails = {
              id: track.id,
              title: track.title,  // Changed from name to title
              previewUrl: track.preview_url || '',
              spotifyUrl: track.external_urls?.spotify || ''
            };

            await insertTrack(trackDetails, artist.id, release.id);
            console.log(`Inserted track: ${track.title}`);  // Changed from name to title

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
