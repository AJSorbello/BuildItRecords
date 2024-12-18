import { redisService } from '../services/RedisService';
import { RECORD_LABELS } from '../constants/labels';

async function testRedisConnection() {
  try {
    // Test track matching the Track interface structure
    const testTrack = {
      id: 'test',
      trackTitle: 'Test Track',
      artist: 'Test Artist',
      recordLabel: RECORD_LABELS.RECORDS,
      spotifyUrl: '',
      albumCover: '',
      album: {
        name: 'Test Album',
        releaseDate: new Date().toISOString(),
        images: [{
          url: '',
          height: 0,
          width: 0
        }]
      },
      releaseDate: new Date().toISOString(),
      previewUrl: null,
      beatportUrl: '',
      soundcloudUrl: '',
      popularity: 0
    };

    console.log('Initializing Redis test...');

    // Test setting a value
    console.log('Setting test track in Redis...');
    await redisService.setTracksForLabel(RECORD_LABELS.RECORDS, [testTrack]);

    // Test getting the value
    console.log('Retrieving test track from Redis...');
    const tracks = await redisService.getTracksForLabel(RECORD_LABELS.RECORDS);
    console.log('Retrieved tracks:', tracks);

    console.log('Redis test completed successfully');
  } catch (error) {
    console.error('Redis test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

testRedisConnection();

// Make this a module
export {};
