import { Pool } from 'pg';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

interface Artist {
  id: string;
  name: string;
  label_id: string;
  spotify_url: string;
  images: any[];
  profile_image_url: string | null;
  profile_image_small_url: string | null;
  profile_image_large_url: string | null;
}

interface Release {
  id: string;
  title: string;
  artist_id: string;
  label_id: string;
  release_date: Date;
  images: any[];
  spotify_url: string;
  external_urls: any;
  external_ids: any;
  popularity: number;
  total_tracks: number;
}

interface Track {
  id: string;
  title: string;
  artist_id: string;
  release_id: string;
  label_id: string;
  duration_ms: number;
  preview_url: string | null;
  spotify_url: string;
  external_urls: any;
  uri: string;
}

class ReleaseService {
  private static instance: ReleaseService;
  private pool: Pool;
  private spotify: SpotifyApi;

  private constructor() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME
    });

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Spotify credentials are missing');
      // Initialize with empty strings to avoid errors; service will handle auth failures
      this.spotify = SpotifyApi.withClientCredentials('', '');
    } else {
      this.spotify = SpotifyApi.withClientCredentials(clientId, clientSecret);
    }
  }

  public static getInstance(): ReleaseService {
    if (!ReleaseService.instance) {
      ReleaseService.instance = new ReleaseService();
    }
    return ReleaseService.instance;
  }

  // Database operations
  async getAllLabels() {
    const result = await this.pool.query('SELECT * FROM labels ORDER BY name');
    return result.rows;
  }

  async getLabelById(labelId: string) {
    const result = await this.pool.query('SELECT * FROM labels WHERE id = $1', [labelId]);
    return result.rows[0];
  }

  async getArtistsByLabel(labelId: string) {
    const result = await this.pool.query(
      'SELECT * FROM artists WHERE label_id = $1 ORDER BY name',
      [labelId]
    );
    return result.rows;
  }

  async getReleasesByLabel(labelId: string) {
    const result = await this.pool.query(
      `SELECT r.*, a.name as artist_name 
       FROM releases r 
       JOIN artists a ON r.artist_id = a.id
       WHERE r.label_id = $1 
       ORDER BY r.release_date DESC`,
      [labelId]
    );
    return result.rows;
  }

  async getTracksByRelease(releaseId: string) {
    const result = await this.pool.query(
      'SELECT * FROM tracks WHERE release_id = $1 ORDER BY uri',
      [releaseId]
    );
    return result.rows;
  }

  async searchReleases(query: string, labelId?: string) {
    const params = [`%${query}%`];
    let sql = `
      SELECT r.*, a.name as artist_name, l.name as label_name
      FROM releases r
      JOIN artists a ON r.artist_id = a.id
      JOIN labels l ON r.label_id = l.id
      WHERE (r.title ILIKE $1 OR a.name ILIKE $1)
    `;

    if (labelId) {
      sql += ' AND r.label_id = $2';
      params.push(labelId);
    }

    sql += ' ORDER BY r.release_date DESC';
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  // Spotify import operations
  async importArtistForLabel(spotifyArtistId: string, labelId: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get artist from Spotify
      const artistData = await this.spotify.artists.get(spotifyArtistId);
      
      // Insert or update artist
      const artistResult = await client.query(
        `INSERT INTO artists (id, name, label_id, spotify_url, images, profile_image_url, profile_image_small_url, profile_image_large_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           label_id = EXCLUDED.label_id,
           spotify_url = EXCLUDED.spotify_url,
           images = EXCLUDED.images,
           profile_image_url = EXCLUDED.profile_image_url,
           profile_image_small_url = EXCLUDED.profile_image_small_url,
           profile_image_large_url = EXCLUDED.profile_image_large_url
         RETURNING id`,
        [
          artistData.id,
          artistData.name,
          labelId,
          artistData.external_urls.spotify,
          JSON.stringify(artistData.images),
          artistData.images[0]?.url || null,
          artistData.images[1]?.url || artistData.images[0]?.url || null,
          artistData.images[2]?.url || artistData.images[0]?.url || null
        ]
      );

      // Get artist's albums
      const albums = await this.spotify.artists.albums(spotifyArtistId);
      
      for (const album of albums.items) {
        // Insert or update release
        const releaseResult = await client.query(
          `INSERT INTO releases (
            id, title, artist_id, label_id, release_date,
            images, spotify_url, external_urls, external_ids,
            popularity, total_tracks
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            release_date = EXCLUDED.release_date,
            images = EXCLUDED.images,
            spotify_url = EXCLUDED.spotify_url,
            external_urls = EXCLUDED.external_urls,
            external_ids = EXCLUDED.external_ids,
            popularity = EXCLUDED.popularity,
            total_tracks = EXCLUDED.total_tracks
          RETURNING id`,
          [
            album.id,
            album.name,
            artistData.id,
            labelId,
            album.release_date,
            JSON.stringify(album.images),
            album.external_urls.spotify,
            JSON.stringify(album.external_urls),
            JSON.stringify(album.external_ids),
            album.popularity || 0,
            album.total_tracks
          ]
        );

        // Get album tracks
        const tracks = await this.spotify.albums.tracks(album.id);
        
        for (const track of tracks.items) {
          await client.query(
            `INSERT INTO tracks (
              id, title, artist_id, release_id, label_id,
              duration_ms, preview_url, spotify_url, external_urls, uri
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              duration_ms = EXCLUDED.duration_ms,
              preview_url = EXCLUDED.preview_url,
              spotify_url = EXCLUDED.spotify_url,
              external_urls = EXCLUDED.external_urls,
              uri = EXCLUDED.uri`,
            [
              track.id,
              track.name,  // Fix non-null assertion warning
              artistData.id,
              album.id,
              labelId,
              track.duration_ms,
              track.preview_url,
              track.external_urls.spotify,
              JSON.stringify(track.external_urls),
              track.uri
            ]
          );
        }
      }

      await client.query('COMMIT');
      return artistResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Schedule regular updates for all artists
  startUpdateSchedule(intervalHours = 24) {
    setInterval(async () => {
      try {
        const artists = await this.pool.query('SELECT id, label_id FROM artists');
        for (const artist of artists.rows) {
          await this.importArtistForLabel(artist.id, artist.label_id);
          console.log(`Updated releases for artist: ${artist.id}`);
        }
      } catch (error) {
        console.error('Error updating releases:', error);
      }
    }, intervalHours * 60 * 60 * 1000);
  }
}

export const releaseService = ReleaseService.getInstance();
