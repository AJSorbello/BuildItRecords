import { redisService } from '../services/RedisService';
import { spotifyService } from '../services/SpotifyService';
import { RECORD_LABELS } from '../constants/labels';

async function testRedisIntegration() {
  console.log('Starting Redis integration test...');

  try {
    const label = RECORD_LABELS.DEEP;
    console.log(`Testing with label: ${label}`);

    // First fetch - should come from Spotify and be cached
    console.log('\n1. First fetch (should come from Spotify):');
    console.time('First fetch');
    const tracks = await spotifyService.getTracksByLabel(label);
    console.timeEnd('First fetch');
    console.log(`Retrieved ${tracks.length} tracks`);

    // Small delay to ensure caching is complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Second fetch - should come from Redis cache
    console.log('\n2. Second fetch (should come from Redis cache):');
    console.time('Second fetch');
    const cachedTracks = await spotifyService.getTracksByLabel(label);
    console.timeEnd('Second fetch');
    console.log(`Retrieved ${cachedTracks.length} tracks from cache`);

    // Verify data consistency
    console.log('\n3. Verifying data consistency:');
    const tracksMatch = JSON.stringify(tracks) === JSON.stringify(cachedTracks);
    console.log(`Data consistency check: ${tracksMatch ? 'PASSED ✅' : 'FAILED ❌'}`);

    // Test Redis connection directly
    console.log('\n4. Testing Redis connection directly:');
    await redisService.clearCache();
    console.log('Cache cleared successfully');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testRedisIntegration()
  .then(() => console.log('\nTest completed'))
  .catch(console.error);
