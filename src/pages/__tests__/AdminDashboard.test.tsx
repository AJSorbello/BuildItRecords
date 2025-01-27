import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../__tests__/test-utils';
import AdminDashboard from '../admin/AdminDashboard';
import { databaseService } from '../../services/DatabaseService';
import { act } from 'react-dom/test-utils';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock DatabaseService
jest.mock('../../services/DatabaseService', () => ({
  databaseService: {
    verifyAdminToken: jest.fn(),
    getTracksByLabel: jest.fn(),
    getReleasesByLabelId: jest.fn(),
    importTracksFromSpotify: jest.fn()
  }
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('fake-token');
    mockNavigate.mockClear();
    
    // Default mock implementations
    (databaseService.verifyAdminToken as jest.Mock).mockResolvedValue({ verified: true });
    (databaseService.getTracksByLabel as jest.Mock).mockResolvedValue({ tracks: [], total: 0 });
    (databaseService.getReleasesByLabelId as jest.Mock).mockResolvedValue({ 
      releases: [], 
      totalReleases: 0, 
      currentPage: 1 
    });
  });

  it('verifies admin token on mount', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(databaseService.verifyAdminToken).toHaveBeenCalled();
    });
  });

  it('redirects to login on token verification failure', async () => {
    (databaseService.verifyAdminToken as jest.Mock).mockResolvedValue({ verified: false });
    
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(databaseService.verifyAdminToken).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('adminToken');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('redirects to login when no token is found', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('loads track data after successful token verification', async () => {
    const mockTracks = [
      {
        id: '1',
        name: 'Test Track',
        artists: [{ id: '1', name: 'Test Artist' }],
        duration: 180000,
        release: {
          id: '1',
          name: 'Test Album',
          images: [{ url: 'test.jpg', width: 300, height: 300 }],
          artists: [{ id: '1', name: 'Test Artist' }]
        },
        label: {
          id: 'buildit-deep',
          name: 'Buildit Deep'
        }
      }
    ];

    (databaseService.getTracksByLabel as jest.Mock).mockResolvedValue({ 
      tracks: mockTracks,
      total: mockTracks.length
    });
    
    (databaseService.getReleasesByLabelId as jest.Mock).mockResolvedValue({
      releases: [mockTracks[0].release],
      totalReleases: 1,
      currentPage: 1
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(databaseService.getTracksByLabel).toHaveBeenCalledWith('buildit-deep');
      expect(databaseService.getReleasesByLabelId).toHaveBeenCalledWith('buildit-deep');
    });
  });

  it('handles API errors gracefully', async () => {
    (databaseService.getTracksByLabel as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('handles network errors during token verification', async () => {
    (databaseService.verifyAdminToken as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/login');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('adminToken');
    });
  });
});
