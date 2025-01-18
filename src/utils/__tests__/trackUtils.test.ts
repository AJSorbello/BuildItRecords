import {
  isTrack,
  formatDuration,
  getTrackArtists,
  getTrackImage,
  getTrackSpotifyUrl,
  PLACEHOLDER_IMAGE
} from '../trackUtils';
import type { Track } from '../../types/track';

describe('trackUtils', () => {
  describe('isTrack', () => {
    it('should return true for valid track objects', () => {
      const validTracks = [
        {
          id: '1',
          name: 'Test Track',
          artists: [{ id: '1', name: 'Test Artist' }],
          release: {
            id: '1',
            name: 'Test Album',
            images: [{ url: 'test.jpg', width: 300, height: 300 }]
          }
        },
        {
          id: '2',
          name: 'Minimal Track',
          // Valid track can have no artists or release
        }
      ];

      validTracks.forEach(track => {
        expect(isTrack(track)).toBe(true);
      });
    });

    it('should return false for invalid track objects', () => {
      const invalidTracks = [
        null,
        undefined,
        {},
        { id: '1' },
        { name: 'Test' },
        { id: '1', name: 'Test', artists: 'not an array' },
        { id: '1', name: 'Test', release: 'not an object' }
      ];

      invalidTracks.forEach(track => {
        expect(isTrack(track)).toBe(false);
      });
    });
  });

  describe('formatDuration', () => {
    it('should format duration in milliseconds to MM:SS format', () => {
      expect(formatDuration(180000)).toBe('3:00');
      expect(formatDuration(61000)).toBe('1:01');
      expect(formatDuration(30000)).toBe('0:30');
    });

    it('should pad seconds with leading zero', () => {
      expect(formatDuration(61000)).toBe('1:01');
      expect(formatDuration(65000)).toBe('1:05');
      expect(formatDuration(9000)).toBe('0:09');
    });

    it('should handle zero and negative values', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(-1000)).toBe('0:00');
    });
  });

  describe('getTrackArtists', () => {
    it('should join multiple artist names with commas', () => {
      const track = {
        artists: [
          { id: '1', name: 'Artist 1' },
          { id: '2', name: 'Artist 2' },
          { id: '3', name: 'Artist 3' }
        ]
      } as Track;

      expect(getTrackArtists(track)).toBe('Artist 1, Artist 2, Artist 3');
    });

    it('should return single artist name without comma', () => {
      const track = {
        artists: [{ id: '1', name: 'Solo Artist' }]
      } as Track;

      expect(getTrackArtists(track)).toBe('Solo Artist');
    });

    it('should handle empty artists array', () => {
      const track = { artists: [] } as Track;
      expect(getTrackArtists(track)).toBe('');
    });

    it('should handle undefined artists', () => {
      const track = {} as Track;
      expect(getTrackArtists(track)).toBe('');
    });
  });

  describe('getTrackImage', () => {
    it('should return first image URL from release images', () => {
      const track = {
        release: {
          images: [
            { url: 'image1.jpg', width: 300, height: 300 },
            { url: 'image2.jpg', width: 600, height: 600 }
          ]
        }
      } as Track;

      expect(getTrackImage(track)).toBe('image1.jpg');
    });

    it('should return placeholder image when no release images exist', () => {
      const track = {
        release: {
          images: []
        }
      } as Track;

      expect(getTrackImage(track)).toBe(PLACEHOLDER_IMAGE);
    });

    it('should return placeholder image when no release exists', () => {
      const track = {} as Track;
      expect(getTrackImage(track)).toBe(PLACEHOLDER_IMAGE);
    });
  });

  describe('getTrackSpotifyUrl', () => {
    it('should return spotify_url from track', () => {
      const track = {
        spotify_url: 'https://open.spotify.com/track/123'
      } as Track;

      expect(getTrackSpotifyUrl(track)).toBe('https://open.spotify.com/track/123');
    });

    it('should return empty string when spotify_url is not available', () => {
      const track = {} as Track;
      expect(getTrackSpotifyUrl(track)).toBe('');
    });
  });
});
