import { databaseService } from '../DatabaseService';
import { DatabaseError } from '../../utils/errors';
import fetchMock from 'jest-fetch-mock';

describe('DatabaseService', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    localStorage.clear();
  });

  describe('verifyAdminToken', () => {
    beforeEach(() => {
      fetchMock.resetMocks();
      localStorage.clear();
    });

    it('returns verified true when token is valid', async () => {
      localStorage.setItem('adminToken', 'valid-token');
      fetchMock.mockResponseOnce(JSON.stringify({
        verified: true,
        message: 'Token verified'
      }));

      const result = await databaseService.verifyAdminToken();
      expect(result.verified).toBe(true);
      expect(result.message).toBe('Token verified');
    });

    it('returns verified false when token is invalid', async () => {
      localStorage.setItem('adminToken', 'invalid-token');
      fetchMock.mockResponseOnce(JSON.stringify({
        verified: false,
        message: 'Invalid token'
      }));

      const result = await databaseService.verifyAdminToken();
      expect(result.verified).toBe(false);
      expect(result.message).toBe('Invalid token');
    });

    it('returns verified false when no token is present', async () => {
      const result = await databaseService.verifyAdminToken();
      expect(result.verified).toBe(false);
      expect(result.message).toBe('No token found');
    });

    it('handles network errors', async () => {
      localStorage.setItem('adminToken', 'valid-token');
      fetchMock.mockReject(new Error('Network error'));

      await expect(databaseService.verifyAdminToken()).rejects.toThrow('Network error');
    });
  });

  describe('getReleasesByLabelId', () => {
    it('fetches releases for a label', async () => {
      const mockReleases = {
        releases: [
          {
            id: '1',
            name: 'Test Release',
            artists: [{
              id: '1',
              name: 'Test Artist'
            }],
            release_date: '2024-01-01',
            images: [{
              url: 'https://example.com/image.jpg',
              height: 300,
              width: 300
            }],
            label_id: 'buildit-deep',
            total_tracks: 12
          }
        ],
        totalReleases: 1,
        currentPage: 1
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockReleases));

      const result = await databaseService.getReleasesByLabelId('buildit-deep');
      expect(result).toEqual(mockReleases);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/releases?label=buildit-deep'),
        expect.any(Object)
      );
    });

    it('handles empty response', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({
        releases: [],
        totalReleases: 0,
        currentPage: 1
      }));

      const result = await databaseService.getReleasesByLabelId('buildit-deep');
      expect(result.releases).toEqual([]);
      expect(result.totalReleases).toBe(0);
    });

    it('handles errors', async () => {
      fetchMock.mockReject(new Error('Failed to fetch'));
      await expect(databaseService.getReleasesByLabelId('buildit-deep')).rejects.toThrow();
    });
  });

  describe('getTracksByLabel', () => {
    it('fetches tracks for a label', async () => {
      const mockTracks = {
        tracks: [
          {
            id: '1',
            name: 'Test Track',
            duration: 180000,
            artists: [{
              id: '1',
              name: 'Test Artist'
            }],
            release: {
              id: '1',
              name: 'Test Release',
              images: [{
                url: 'https://example.com/image.jpg',
                height: 300,
                width: 300
              }]
            },
            label: {
              id: 'buildit-deep',
              name: 'Buildit Deep'
            }
          }
        ],
        total: 1
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockTracks));

      const result = await databaseService.getTracksByLabel('buildit-deep');
      expect(result).toEqual(mockTracks);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/tracks?label=buildit-deep'),
        expect.any(Object)
      );
    });

    it('handles empty response', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({
        tracks: [],
        total: 0
      }));

      const result = await databaseService.getTracksByLabel('buildit-deep');
      expect(result.tracks).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('handles errors', async () => {
      fetchMock.mockReject(new Error('Failed to fetch'));
      await expect(databaseService.getTracksByLabel('buildit-deep')).rejects.toThrow();
    });
  });

  describe('adminLogin', () => {
    it('returns token on successful login', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'test-token',
          message: 'Login successful'
        }
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await databaseService.adminLogin('admin', 'password');
      expect(result).toEqual({
        success: true,
        token: 'test-token',
        message: 'Login successful'
      });
    });

    it('handles failed login', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({
        success: false,
        error: 'Invalid credentials'
      }), { status: 401 });

      const result = await databaseService.adminLogin('admin', 'wrong-password');
      expect(result).toEqual({
        success: false,
        message: 'Invalid credentials'
      });
    });
  });

  describe('importTracksFromSpotify', () => {
    it('successfully imports tracks', async () => {
      const mockResponse = {
        success: true,
        message: 'Successfully imported 10 tracks'
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await databaseService.importTracksFromSpotify('buildit-deep');
      expect(result).toEqual(mockResponse);
    });

    it('handles import errors', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({
        success: false,
        error: 'Failed to import tracks'
      }), { status: 400 });

      await expect(databaseService.importTracksFromSpotify('buildit-deep'))
        .rejects
        .toThrow(DatabaseError);
    });
  });
});
