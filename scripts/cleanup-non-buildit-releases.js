/**
 * Cleanup Script for Non-Build It Records Releases
 * 
 * This script identifies and removes releases that don't actually belong to
 * Build It Records, Build It Tech, or Build It Deep labels.
 */

const axios = require('axios');
require('dotenv').config();

// Production API URL
const API_URL = 'https://builditrecords.onrender.com/api';

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
  try {
    console.log('Starting cleanup of non-Build It Records releases...');
    
    // 1. Get all artists from the API
    console.log('Fetching all artists...');
    const artistsResponse = await axios.get(`${API_URL}/label-artists/buildit-records?limit=500`);
    const artists = artistsResponse.data.data || [];
    
    console.log(`Found ${artists.length} artists in total`);
    
    // 2. Filter out test artists
    const testArtists = artists.filter(artist => {
      // Check for test patterns in artist names
      for (const pattern of TEST_PATTERNS) {
        if (pattern.test(artist.name)) {
          return true;
        }
      }
      
      // Check for specific test artist names
      return TEST_ARTIST_NAMES.includes(artist.name.toLowerCase());
    });
    
    console.log(`Found ${testArtists.length} test artists to filter out`);
    
    // Print the list of test artists
    console.log('Test artists to be filtered out:');
    testArtists.forEach(artist => {
      console.log(`- ${artist.name} (ID: ${artist.id})`);
    });
    
    // 3. Create a report of what would be removed
    console.log('\nTo remove these test artists from your database, please:');
    console.log('1. Log in to your database management tool');
    console.log('2. Run the following SQL queries:');
    
    console.log('\n-- Delete associated track_artists');
    console.log(`DELETE FROM track_artists
WHERE artist_id IN (
  SELECT id FROM artists 
  WHERE name ~* '^(bass|beat|beats|beta|big|break)\\s+'
  OR name IN ('${TEST_ARTIST_NAMES.join("', '")}')
);`);
    
    console.log('\n-- Delete associated release_artists');
    console.log(`DELETE FROM release_artists
WHERE artist_id IN (
  SELECT id FROM artists 
  WHERE name ~* '^(bass|beat|beats|beta|big|break)\\s+'
  OR name IN ('${TEST_ARTIST_NAMES.join("', '")}')
);`);
    
    console.log('\n-- Delete the test artists');
    console.log(`DELETE FROM artists
WHERE name ~* '^(bass|beat|beats|beta|big|break)\\s+'
OR name IN ('${TEST_ARTIST_NAMES.join("', '")}');`);
    
    console.log('\n-- Delete releases with test patterns in their titles');
    console.log(`DELETE FROM releases
WHERE title ~* '^(bass|beat|beats|beta|big|break)\\s+'
OR title ~* 'test|demo|sample';`);
    
    console.log('\nAlternatively, you can use the enhanced filtering in the API endpoint that we already implemented to hide these test artists from the frontend.');
    
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    if (error.response) {
      console.error('API response error:', error.response.data);
    }
  }
}

// Run the cleanup
cleanupReleases().catch(console.error);
