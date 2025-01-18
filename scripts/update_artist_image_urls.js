const { Pool } = require('pg');
const { SpotifyApi } = require('@spotify/web-api-ts-sdk');
require('dotenv').config();

async function updateArtistImageUrls() {
  const pool = new Pool({
    user: 'postgres',
    password: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'builditrecords'
  });

  // Initialize Spotify API
  const spotify = SpotifyApi.withClientCredentials(
    process.env.SPOTIFY_CLIENT_ID,
    process.env.SPOTIFY_CLIENT_SECRET
  );

  try {
    // Get all artists that have no image_url
    const result = await pool.query(
      `SELECT id, name, images 
       FROM artists 
       WHERE image_url IS NULL OR image_url = ''`
    );

    console.log(`Found ${result.rows.length} artists to update`);

    for (const artist of result.rows) {
      try {
        // Try to use existing images first
        const existingImages = typeof artist.images === 'string' ? JSON.parse(artist.images) : artist.images;
        let imageUrl = null;

        if (existingImages && Array.isArray(existingImages) && existingImages.length > 0) {
          imageUrl = existingImages[0].url;
          console.log(`Using existing image for artist ${artist.id} (${artist.name})`);
        } else {
          // Fetch fresh images from Spotify
          console.log(`Fetching fresh images for artist ${artist.id} (${artist.name})`);
          try {
            const spotifyData = await spotify.artists.get(artist.id);
            if (spotifyData.images && spotifyData.images.length > 0) {
              imageUrl = spotifyData.images[0].url;
              // Update both image_url and images
              await pool.query(
                `UPDATE artists 
                 SET image_url = $1, images = $2
                 WHERE id = $3`,
                [imageUrl, JSON.stringify(spotifyData.images), artist.id]
              );
              console.log(`Updated image data from Spotify for artist ${artist.id} (${artist.name})`);
              continue;
            }
          } catch (spotifyErr) {
            console.error(`Error fetching Spotify data for artist ${artist.id}:`, spotifyErr);
          }
        }

        if (imageUrl) {
          await pool.query(
            `UPDATE artists 
             SET image_url = $1 
             WHERE id = $2`,
            [imageUrl, artist.id]
          );
          console.log(`Updated image_url for artist ${artist.id} (${artist.name})`);
        } else {
          console.log(`No valid image URL found for artist ${artist.id} (${artist.name})`);
        }
      } catch (err) {
        console.error(`Error updating artist ${artist.id} (${artist.name}):`, err);
      }
    }

    console.log('Finished updating artist image URLs');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

updateArtistImageUrls().catch(console.error);
