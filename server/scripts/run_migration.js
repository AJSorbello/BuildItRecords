const { pool } = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const migrationFile = path.join(__dirname, '../migrations/20250106_update_artists_schema.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    try {
        await pool.query('BEGIN');
        await pool.query(sql);
        await pool.query('COMMIT');
        console.log('Migration completed successfully');
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error running migration:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
