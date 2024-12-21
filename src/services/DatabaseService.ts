import { Track } from '../types/track';
import { Artist } from '../types/Artist';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';

class DatabaseService {
  private static instance: DatabaseService;
  private readonly API_URL = 'http://localhost:3001/api';

  private constructor() {
    console.log('DatabaseService initialized');
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private normalizeLabel(label: string): string {
    return label.toLowerCase();
  }

  getMockTracks(label: RecordLabel): Track[] {
    return [
      {
        id: '1',
        name: 'Track 1',
        trackTitle: 'Track 1',
        artist: 'Artist 1',
        artists: [{
          id: '1',
          name: 'Artist 1',
          imageUrl: 'https://example.com/artist1.jpg',
          image: 'https://example.com/artist1.jpg',
          recordLabel: RECORD_LABELS['Build It Records'],
          labels: [RECORD_LABELS['Build It Records']],
          releases: [],
          spotifyUrl: 'https://open.spotify.com/artist/1',
          genres: [],
          bio: 'Artist 1 bio'
        }],
        album: {
          id: '1',
          name: 'Album 1',
          releaseDate: '2024-01-01',
          totalTracks: 1,
          images: []
        },
        albumCover: 'https://example.com/album1.jpg',
        recordLabel: RECORD_LABELS['Build It Records'],
        label: RECORD_LABELS['Build It Records'],
        releaseDate: '2024-01-01',
        previewUrl: 'https://example.com/preview1.mp3',
        beatportUrl: 'https://www.beatport.com/track/1',
        soundcloudUrl: 'https://soundcloud.com/track1',
        spotifyUrl: 'https://open.spotify.com/track/1',
        genres: ['House', 'Tech House']
      }
    ];
  }

  async getTracksForLabel(label: RecordLabel): Promise<Track[]> {
    // Return mock data for now
    return this.getMockTracks(label);
  }

  async setTracksForLabel(label: RecordLabel, tracks: Track[]): Promise<void> {
    try {
      const normalizedLabel = this.normalizeLabel(label);
      const response = await fetch(`${this.API_URL}/label/${normalizedLabel}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tracks }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to set tracks');
      }
    } catch (error) {
      console.error('Error setting tracks:', error);
      throw error;
    }
  }

  async getAllTracks(label: RecordLabel): Promise<Track[]> {
    // Return mock data for now
    return this.getMockTracks(label);
  }

  async saveTracks(tracks: Track[]): Promise<void> {
    try {
      const response = await fetch(`${this.API_URL}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tracks),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving tracks:', error);
      throw error;
    }
  }

  async getArtistsForLabel(label: RecordLabel): Promise<Artist[]> {
    try {
      // Fetch artists from the database or API
      // For now, return mock data
      const mockArtists: Artist[] = [
        {
          id: '1',
          name: 'Artist 1',
          imageUrl: 'https://example.com/artist1.jpg',
          image: 'https://example.com/artist1.jpg',
          bio: 'Artist 1 bio',
          recordLabel: RECORD_LABELS['Build It Records'],
          labels: [RECORD_LABELS['Build It Records']],
          releases: [],
          spotifyUrl: 'https://open.spotify.com/artist/1',
          genres: []
        },
        {
          id: '2',
          name: 'Artist 2',
          imageUrl: 'https://example.com/artist2.jpg',
          image: 'https://example.com/artist2.jpg',
          bio: 'Artist 2 bio',
          recordLabel: RECORD_LABELS['Build It Records'],
          labels: [RECORD_LABELS['Build It Records']],
          releases: [],
          spotifyUrl: 'https://open.spotify.com/artist/2',
          genres: []
        }
      ];
      return mockArtists;
    } catch (error) {
      console.error('Error fetching artists:', error);
      throw error;
    }
  }

  async setArtistsForLabel(label: RecordLabel, artists: Artist[]): Promise<void> {
    try {
      const normalizedLabel = this.normalizeLabel(label);
      const response = await fetch(`${this.API_URL}/label/${normalizedLabel}/artists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ artists }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to set artists');
      }
    } catch (error) {
      console.error('Error setting artists:', error);
      throw error;
    }
  }
}

export const databaseService = DatabaseService.getInstance();
