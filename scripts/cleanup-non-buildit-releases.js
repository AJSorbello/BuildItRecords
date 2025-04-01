/**
 * Cleanup Script for Non-Build It Records Releases
 * 
 * This script identifies and removes releases that don't actually belong to
 * Build It Records, Build It Tech, or Build It Deep labels.
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Valid Build It Records label IDs
const VALID_LABEL_IDS = ['buildit-records', 'buildit-tech', 'buildit-deep'];

// Test pattern regexes to identify test releases
const TEST_PATTERNS = [
  /^bass\s+/i,
  /^beat\s+/i,
  /^beats\s+/i,
  /^beta\s+/i,
  /^big\s+/i,
  /^break\s+/i,
  /test/i,
  /demo/i,
  /sample/i
];

// Specific test artist names to remove
const TEST_ARTIST_NAMES = [
  'a girl and a gun', 'alpha mid', 'alpha max',
  'beats gd 32', 'beta 89', 'big loop 21', 'big vibes 99', 
  'big zero spin', 'break 119'
];

async function cleanupReleases() {
  const client = await pool.connect();
  
  try {
    console.log('Starting cleanup of non-Build It Records releases...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // 1. Find releases with invalid label IDs
    const { rows: invalidLabelReleases } = await client.query(`
      SELECT id, title, label_id 
      FROM releases 
      WHERE label_id NOT IN ($1, $2, $3)
    `, VALID_LABEL_IDS);
    
    console.log(`Found ${invalidLabelReleases.length} releases with invalid label IDs`);
    
    // 2. Find releases with test patterns in their titles
    let testPatternReleases = [];
    for (const pattern of TEST_PATTERNS) {
      const { rows } = await client.query(`
        SELECT id, title, label_id 
        FROM releases 
        WHERE title ~ $1
      `, [pattern.source]);
      
      testPatternReleases = [...testPatternReleases, ...rows];
    }
    
    // Remove duplicates
    testPatternReleases = testPatternReleases.filter((release, index, self) =>
      index === self.findIndex((r) => r.id === release.id)
    );
    
    console.log(`Found ${testPatternReleases.length} releases with test patterns in titles`);
    
    // 3. Find releases associated with test artists
    const { rows: testArtistReleases } = await client.query(`
      SELECT DISTINCT r.id, r.title, r.label_id 
      FROM releases r
      JOIN release_artists ra ON r.id = ra.release_id
      JOIN artists a ON ra.artist_id = a.id
      WHERE a.name = ANY($1)
    `, [TEST_ARTIST_NAMES]);
    
    console.log(`Found ${testArtistReleases.length} releases associated with test artists`);
    
    // Combine all release IDs to remove
    const releasesToRemove = [
      ...invalidLabelReleases,
      ...testPatternReleases,
      ...testArtistReleases
    ].filter((release, index, self) =>
      index === self.findIndex((r) => r.id === release.id)
    );
    
    console.log(`Total releases to remove: ${releasesToRemove.length}`);
    
    // Print the list of releases to be removed
    console.log('Releases to be removed:');
    releasesToRemove.forEach(release => {
      console.log(`- ${release.title} (ID: ${release.id}, Label: ${release.label_id})`);
    });
    
    // Confirm before proceeding
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      readline.question('Do you want to proceed with removal? (yes/no): ', resolve);
    });
    
    readline.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('Cleanup cancelled by user');
      await client.query('ROLLBACK');
      return;
    }
    
    // Remove the releases
    const releaseIds = releasesToRemove.map(r => r.id);
    
    // Delete associated track_artists
    const { rowCount: trackArtistsDeleted } = await client.query(`
      DELETE FROM track_artists
      WHERE track_id IN (
        SELECT id FROM tracks WHERE release_id = ANY($1)
      )
    `, [releaseIds]);
    
    console.log(`Deleted ${trackArtistsDeleted} track_artists records`);
    
    // Delete associated tracks
    const { rowCount: tracksDeleted } = await client.query(`
      DELETE FROM tracks
      WHERE release_id = ANY($1)
    `, [releaseIds]);
    
    console.log(`Deleted ${tracksDeleted} tracks`);
    
    // Delete associated release_artists
    const { rowCount: releaseArtistsDeleted } = await client.query(`
      DELETE FROM release_artists
      WHERE release_id = ANY($1)
    `, [releaseIds]);
    
    console.log(`Deleted ${releaseArtistsDeleted} release_artists records`);
    
    // Finally, delete the releases
    const { rowCount: releasesDeleted } = await client.query(`
      DELETE FROM releases
      WHERE id = ANY($1)
    `, [releaseIds]);
    
    console.log(`Deleted ${releasesDeleted} releases`);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Cleanup completed successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during cleanup:', error);
  } finally {
    client.release();
  }
}

// Run the cleanup
cleanupReleases().catch(console.error);
