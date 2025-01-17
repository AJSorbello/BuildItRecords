import { pool } from '../db';

async function checkDatabase() {
  try {
    // Check labels
    console.log('\nChecking labels table:');
    const labels = await pool.query('SELECT * FROM labels');
    console.log(`Found ${labels.rows.length} labels:`, labels.rows);

    // Check albums
    console.log('\nChecking albums table:');
    const albums = await pool.query('SELECT * FROM albums');
    console.log(`Found ${albums.rows.length} albums:`, albums.rows);

    // Check artists
    console.log('\nChecking artists table:');
    const artists = await pool.query('SELECT * FROM artists');
    console.log(`Found ${artists.rows.length} artists:`, artists.rows);

    // Check tracks
    console.log('\nChecking tracks table:');
    const tracks = await pool.query('SELECT * FROM tracks');
    console.log(`Found ${tracks.rows.length} tracks:`, tracks.rows);

    // Check artist_labels
    console.log('\nChecking artist_labels table:');
    const artistLabels = await pool.query('SELECT * FROM artist_labels');
    console.log(`Found ${artistLabels.rows.length} artist-label relationships:`, artistLabels.rows);

    process.exit(0);
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase();
