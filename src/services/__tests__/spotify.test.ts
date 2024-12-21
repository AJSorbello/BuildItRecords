import { spotifyService } from '../spotify';
import { describe, it, expect, test } from '@jest/globals';

describe('SpotifyService', () => {
  // This is a real ISRC for "Bohemian Rhapsody" by Queen
  const TEST_ISRC = 'GBUM71029604';

  it('should fetch track by ISRC', async () => {
    try {
      const track = await spotifyService.getTrackByISRC(TEST_ISRC);
      
      expect(track).toBeDefined();
      expect(track.title).toBeDefined();
      expect(track.artist).toBeDefined();
      expect(track.imageUrl).toBeDefined();
      expect(track.releaseDate).toBeDefined();
      expect(track.spotifyUrl).toBeDefined();
      
      // Log the result for manual verification
      console.log('Found track:', track);
    } catch (error) {
      fail('Failed to fetch track: ' + error);
    }
  });
});
