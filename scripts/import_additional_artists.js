require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');
const { Pool } = require('pg');

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Configure PostgreSQL connection
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'buildit_records',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

// List of artists to add
const artistsToAdd = [
  'John Okins',
  // Add other missing artists here
];

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

async function findArtistOnSpotify(artistName) {
  try {
    const result = await spotifyApi.searchArtists(artistName);
    const artists = result.body.artists.items;
    
    if (artists.length > 0) {
      // Try to find an exact match first
      const exactMatch = artists.find(a => 
        a.name.toLowerCase() === artistName.toLowerCase()
      );
      
      return exactMatch || artists[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error searching for artist ${artistName}:`, error);
    return null;
  }
}

async function insertArtist(artist) {
  const now = new Date().toISOString();
  
  try {
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
        'buildit-records',
        now
      ]
    );
    
    console.log(`Successfully added/updated artist: ${artist.name}`);
  } catch (error) {
    console.error(`Error inserting artist ${artist.name}:`, error);
  }
}

async function importArtists() {
  try {
    await getSpotifyToken();
    
    for (const artistName of artistsToAdd) {
      console.log(`\nProcessing artist: ${artistName}`);
      
      const spotifyArtist = await findArtistOnSpotify(artistName);
      
      if (spotifyArtist) {
        await insertArtist(spotifyArtist);
      } else {
        console.log(`Could not find artist "${artistName}" on Spotify`);
        
        // Add artist without Spotify data
        await insertArtist({
          id: artistName.toLowerCase().replace(/\s+/g, '-'),
          name: artistName,
          images: [],
          external_urls: {},
          followers: { total: 0 }
        });
      }
      
      // Wait a bit to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\nImport completed!');
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await pool.end();
  }
}

importArtists();
