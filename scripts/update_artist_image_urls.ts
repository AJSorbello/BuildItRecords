const { Pool } = require('pg');

async function updateArtistImageUrls() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'builditrecords'
  });

  try {
    // Get all artists that have images but no image_url
    const result = await pool.query(
      `SELECT id, images 
       FROM artists 
       WHERE images IS NOT NULL 
         AND (image_url IS NULL OR image_url = '')`
    );

    console.log(`Found ${result.rows.length} artists to update`);

    for (const artist of result.rows) {
      try {
        const images = JSON.parse(artist.images);
        if (images && images.length > 0) {
          const imageUrl = images[0].url;
          await pool.query(
            `UPDATE artists 
             SET image_url = $1 
             WHERE id = $2`,
            [imageUrl, artist.id]
          );
          console.log(`Updated image_url for artist ${artist.id}`);
        }
      } catch (err) {
        console.error(`Error updating artist ${artist.id}:`, err);
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

export {};
