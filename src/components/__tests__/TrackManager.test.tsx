import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../__tests__/test-utils';
import TrackManager from '../admin/TrackManager';
import { databaseService } from '../../services/DatabaseService';
import type { Track } from '../../types/track';

// Mock DatabaseService
jest.mock('../../services/DatabaseService', () => ({
  databaseService: {
    getTracksByLabel: jest.fn(),
    importTracksFromSpotify: jest.fn()
  }
}));

describe('TrackManager', () => {
  const mockTracks: Track[] = [
    {
      id: '1',
      name: 'Test Track 1',
      artists: [{
        id: '1',
        name: 'Test Artist 1'
      }],
      release: {
        id: '1',
        name: 'Test Album 1',
        images: [{
          url: 'https://example.com/image1.jpg',
          height: 300,
          width: 300
        }],
        artists: [{
          id: '1',
          name: 'Test Artist 1'
        }]
      },
      label: {
        id: 'buildit-deep',
        name: 'Buildit Deep'
      },
      duration: 180000,
      created_at: new Date('2024-01-01').toISOString(),
      updated_at: new Date('2024-01-01').toISOString()
    },
    {
      id: '2',
      name: 'Test Track 2',
      artists: [{
        id: '2',
        name: 'Test Artist 2'
      }],
      release: {
        id: '2',
        name: 'Test Album 2',
        images: [{
          url: 'https://example.com/image2.jpg',
          height: 300,
          width: 300
        }],
        artists: [{
          id: '2',
          name: 'Test Artist 2'
        }]
      },
      label: {
        id: 'buildit-deep',
        name: 'Buildit Deep'
      },
      duration: 210000,
      created_at: new Date('2024-01-02').toISOString(),
      updated_at: new Date('2024-01-02').toISOString()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders track list', async () => {
    render(<TrackManager tracks={mockTracks} />);

    await waitFor(() => {
      expect(screen.getByText('Test Track 1')).toBeInTheDocument();
      expect(screen.getByText('Test Track 2')).toBeInTheDocument();
      expect(screen.getByText('Test Artist 1')).toBeInTheDocument();
      expect(screen.getByText('Test Artist 2')).toBeInTheDocument();
    });
  });

  it('displays track duration in correct format', () => {
    render(<TrackManager tracks={mockTracks} />);
    
    expect(screen.getByText('3:00')).toBeInTheDocument(); // 180000ms = 3:00
    expect(screen.getByText('3:30')).toBeInTheDocument(); // 210000ms = 3:30
  });

  it('displays track images', () => {
    render(<TrackManager tracks={mockTracks} />);
    
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg');
  });

  it('sorts tracks by created date in descending order', () => {
    render(<TrackManager tracks={mockTracks} />);
    
    const trackElements = screen.getAllByRole('listitem');
    expect(trackElements[0]).toHaveTextContent('Test Track 2'); // More recent
    expect(trackElements[1]).toHaveTextContent('Test Track 1'); // Older
  });
});
