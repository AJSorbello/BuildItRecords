"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./db/index");
async function checkDatabase() {
    try {
        console.log('\nChecking labels table:');
        const labels = await index_1.pool.query('SELECT * FROM labels');
        console.log(`Found ${labels.rows.length} labels:`, labels.rows);
        console.log('\nChecking albums table:');
        const albums = await index_1.pool.query('SELECT * FROM albums');
        console.log(`Found ${albums.rows.length} albums:`, albums.rows);
        console.log('\nChecking artists table:');
        const artists = await index_1.pool.query('SELECT * FROM artists');
        console.log(`Found ${artists.rows.length} artists:`, artists.rows);
        console.log('\nChecking tracks table:');
        const tracks = await index_1.pool.query('SELECT * FROM tracks');
        console.log(`Found ${tracks.rows.length} tracks:`, tracks.rows);
        console.log('\nChecking artist_labels table:');
        const artistLabels = await index_1.pool.query('SELECT * FROM artist_labels');
        console.log(`Found ${artistLabels.rows.length} artist-label relationships:`, artistLabels.rows);
        process.exit(0);
    }
    catch (error) {
        console.error('Error checking database:', error);
        process.exit(1);
    }
}
checkDatabase();
//# sourceMappingURL=checkDb.js.map