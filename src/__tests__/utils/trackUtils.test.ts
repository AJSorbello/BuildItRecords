import {
  formatDuration,
  getTrackImage,
  getTrackSpotifyUrl,
  getTrackReleaseDate,
  getTrackArtists,
  PLACEHOLDER_IMAGE
} from '../../utils/trackUtils';
import { Track } from '../../types/track';

describe('trackUtils', () => {
  describe('formatDuration', () => {
    it('formats milliseconds into MM:SS format', () => {
      expect(formatDuration(180000)).toBe('3:00');
      expect(formatDuration(61000)).toBe('1:01');
      expect(formatDuration(30500)).toBe('0:30');
    });

    it('handles zero duration', () => {
      expect(formatDuration(0)).toBe('0:00');
    });
  });

  describe('getTrackImage', () => {
    it('returns first album image URL if available', () => {
      const track = {
        album: {
          images: [
            { url: 'test-image-url', width: 300, height: 300 }
          ]
        }
      } as Track;

      expect(getTrackImage(track)).toBe('test-image-url');
    });

    it('returns placeholder image if no album images', () => {
      const track = {
        album: { images: [] }
      } as Track;

      expect(getTrackImage(track)).toBe(PLACEHOLDER_IMAGE);
    });

    it('returns placeholder image if no album', () => {
      const track = {} as Track;
      expect(getTrackImage(track)).toBe(PLACEHOLDER_IMAGE);
    });
  });

  describe('getTrackSpotifyUrl', () => {
    it('returns spotify_url if available', () => {
      const track = {
        spotify_url: 'https://open.spotify.com/track/123'
      } as Track;

      expect(getTrackSpotifyUrl(track)).toBe('https://open.spotify.com/track/123');
    });

    it('returns empty string if no spotify_url', () => {
      const track = {} as Track;
      expect(getTrackSpotifyUrl(track)).toBe('');
    });
  });

  describe('getTrackReleaseDate', () => {
    it('returns release date if available', () => {
      const track = {
        release: {
          release_date: '2025-01-17'
        }
      } as Track;

      expect(getTrackReleaseDate(track)).toBe('2025-01-17');
    });

    it('returns N/A if no release date', () => {
      const track = {} as Track;
      expect(getTrackReleaseDate(track)).toBe('N/A');
    });
  });

  describe('getTrackArtists', () => {
    it('joins multiple artist names with commas', () => {
      const track = {
        artists: [
          { name: 'Artist 1' },
          { name: 'Artist 2' },
          { name: 'Artist 3' }
        ]
      } as Track;

      expect(getTrackArtists(track)).toBe('Artist 1, Artist 2, Artist 3');
    });

    it('returns single artist name', () => {
      const track = {
        artists: [{ name: 'Artist 1' }]
      } as Track;

      expect(getTrackArtists(track)).toBe('Artist 1');
    });

    it('returns empty string if no artists', () => {
      const track = {
        artists: []
      } as Track;

      expect(getTrackArtists(track)).toBe('');
    });
  });
});
