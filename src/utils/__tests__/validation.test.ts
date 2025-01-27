import {
  isValidTrack,
  isValidAlbum,
  isValidArtist,
  validateSpotifyId,
  validateLabelId,
  validateTrackNumber,
  validateDuration,
  ValidationError
} from '../validation';

describe('Validation Utilities', () => {
  describe('isValidTrack', () => {
    it('should validate a correct track object', () => {
      const validTrack = {
        id: '1234567890',
        name: 'Test Track',
        duration_ms: 180000,
        artists: [{
          id: 'artist123',
          name: 'Test Artist',
          type: 'artist',
          uri: 'spotify:artist:123',
          external_urls: {
            spotify: 'https://open.spotify.com/artist/123'
          }
        }],
        album: {
          id: 'album123',
          name: 'Test Album',
          album_type: 'album',
          total_tracks: 10,
          release_date: '2025-01-01',
          release_date_precision: 'day',
          images: [],
          external_urls: {
            spotify: 'https://open.spotify.com/album/123'
          },
          uri: 'spotify:album:123',
          href: 'https://api.spotify.com/v1/albums/123',
          type: 'album',
          artists: []
        },
        track_number: 1,
        disc_number: 1,
        preview_url: 'https://preview.url',
        external_urls: {
          spotify: 'https://open.spotify.com/track/123'
        },
        external_ids: {
          isrc: 'USRC12345678'
        },
        uri: 'spotify:track:123',
        type: 'track',
        explicit: false,
        popularity: 50,
        href: 'https://api.spotify.com/v1/tracks/123'
      };

      expect(isValidTrack(validTrack)).toBe(true);
    });

    it('should reject invalid track objects', () => {
      const invalidTracks = [
        null,
        undefined,
        {},
        { id: 123 }, // wrong type for id
        { id: 'track123', name: 123 }, // wrong type for name
        { id: 'track123', name: 'Test', duration_ms: '180000' }, // wrong type for duration
        { id: 'track123', name: 'Test', duration_ms: 180000, artists: 'artist123' }, // wrong type for artists
      ];

      invalidTracks.forEach(track => {
        expect(isValidTrack(track)).toBe(false);
      });
    });
  });

  describe('isValidAlbum', () => {
    it('should validate a correct album object', () => {
      const validAlbum = {
        id: 'album123',
        name: 'Test Album',
        album_type: 'album',
        total_tracks: 10,
        release_date: '2025-01-01',
        release_date_precision: 'day',
        images: [],
        external_urls: {
          spotify: 'https://open.spotify.com/album/123'
        },
        uri: 'spotify:album:123',
        href: 'https://api.spotify.com/v1/albums/123',
        type: 'album',
        artists: [{
          id: 'artist123',
          name: 'Test Artist',
          type: 'artist',
          uri: 'spotify:artist:123',
          external_urls: {
            spotify: 'https://open.spotify.com/artist/123'
          }
        }]
      };

      expect(isValidAlbum(validAlbum)).toBe(true);
    });

    it('should reject invalid album objects', () => {
      const invalidAlbums = [
        null,
        undefined,
        {},
        { id: 123 },
        { id: 'album123', album_type: 'invalid_type' },
        { id: 'album123', release_date_precision: 'invalid_precision' }
      ];

      invalidAlbums.forEach(album => {
        expect(isValidAlbum(album)).toBe(false);
      });
    });
  });

  describe('validateSpotifyId', () => {
    it('should validate correct Spotify IDs', () => {
      const validIds = [
        '1234567890123456789012',
        'abcdefghijklmnopqrstuv',
        'ABC123xyz789defGHIJKLM'
      ];

      validIds.forEach(id => {
        expect(validateSpotifyId(id)).toBe(true);
      });
    });

    it('should reject invalid Spotify IDs', () => {
      const invalidIds = [
        '',
        '123',
        'abc',
        '12345678901234567890123', // too long
        '123456789012345678901', // too short
        'abc!defghijklmnopqrstuv', // invalid characters
        'abc defghijklmnopqrstuv' // contains space
      ];

      invalidIds.forEach(id => {
        expect(validateSpotifyId(id)).toBe(false);
      });
    });
  });

  describe('validateDuration', () => {
    it('should validate correct durations', () => {
      const validDurations = [
        1000, // 1 second
        180000, // 3 minutes
        3600000, // 1 hour
        86400000 // 24 hours
      ];

      validDurations.forEach(duration => {
        expect(validateDuration(duration)).toBe(true);
      });
    });

    it('should reject invalid durations', () => {
      const invalidDurations = [
        0,
        -1000,
        86400001, // > 24 hours
        1.5, // not an integer
        NaN,
        Infinity
      ];

      invalidDurations.forEach(duration => {
        expect(validateDuration(duration)).toBe(false);
      });
    });
  });

  describe('ValidationError', () => {
    it('should create error with correct name and message', () => {
      const error = new ValidationError('Test error message');
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Test error message');
      expect(error instanceof Error).toBe(true);
    });
  });
});
