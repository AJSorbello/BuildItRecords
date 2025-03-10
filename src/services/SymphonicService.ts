import { Release } from '../types/release';
import { RecordLabel, RECORD_LABELS } from '../constants/labels';

interface SymphonicRelease {
  id: string;
  title: string;
  artist: string;
  artwork_url: string;
  release_date: string;
  genre: string;
  label_name: string;
  stores: {
    beatport?: string;
    spotify?: string;
    soundcloud?: string;
  };
  tracks: Array<{
    id: string;
    title: string;
    artist: string;
    duration: string;
    spotify_id?: string;
    preview_url?: string;
  }>;
}

class SymphonicService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.symphonic.com/v1'; // Replace with actual Symphonic API URL
  }

  async getAllReleases(page = 1, limit = 100): Promise<Release[]> {
    try {
      let allReleases: Release[] = [];
      let hasMore = true;
      
      while (hasMore) {
        const response = await fetch(
          `${this.baseUrl}/releases?page=${page}&limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch releases');
        }

        const data = await response.json();
        const releases = this.transformReleases(data.releases);
        allReleases = [...allReleases, ...releases];

        // Check if there are more pages
        hasMore = data.has_more || data.next_page;
        page++;

        // Add delay between requests to avoid rate limiting
        await this.delay(1000);
      }

      return allReleases;
    } catch (error) {
      console.error('Error fetching all releases:', error);
      return [];
    }
  }

  async syncReleases(): Promise<void> {
    try {
      // Get the last sync timestamp from local storage
      const lastSync = localStorage.getItem('lastSyncTimestamp');
      const params = lastSync ? `?updated_after=${lastSync}` : '';

      const response = await fetch(`${this.baseUrl}/releases/sync${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to sync releases');
      }

      const data = await response.json();
      const releases = this.transformReleases(data.releases);

      // Store releases in local storage or your preferred storage solution
      await this.storeReleases(releases);

      // Update last sync timestamp
      localStorage.setItem('lastSyncTimestamp', new Date().toISOString());
    } catch (error) {
      console.error('Error syncing releases:', error);
    }
  }

  private transformReleases(releases: SymphonicRelease[]): Release[] {
    return releases.map(item => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      artwork: item.artwork_url,
      releaseDate: new Date(item.release_date).toISOString().split('T')[0],
      tracks: item.tracks.map(track => ({
        id: track.id,
        trackTitle: track.title,
        artist: track.artist,
        albumCover: item.artwork_url,
        album: {
          name: item.title,
          releaseDate: new Date(item.release_date).toISOString().split('T')[0],
          images: [{
            url: item.artwork_url,
            height: 640,
            width: 640
          }]
        },
        recordLabel: this.determineLabel(item.label_name),
        previewUrl: track.preview_url || null,
        spotifyUrl: track.spotify_id ? `https://open.spotify.com/track/${track.spotify_id}` : '',
        releaseDate: new Date(item.release_date).toISOString().split('T')[0],
        beatportUrl: '',
        soundcloudUrl: ''
      })),
      label: this.determineLabel(item.label_name),
      spotifyUrl: item.stores?.spotify || '',
      beatportUrl: item.stores?.beatport || '',
      soundcloudUrl: item.stores?.soundcloud || ''
    }));
  }

  private async storeReleases(releases: Release[]): Promise<void> {
    // Store in IndexedDB for web or AsyncStorage for mobile
    try {
      const storage = window.localStorage;
      const existingReleases = JSON.parse(storage.getItem('releases') || '[]');
      
      // Merge new releases with existing ones, avoiding duplicates
      const mergedReleases = [...existingReleases];
      releases.forEach(release => {
        const index = mergedReleases.findIndex(r => r.id === release.id);
        if (index >= 0) {
          mergedReleases[index] = release;
        } else {
          mergedReleases.push(release);
        }
      });

      storage.setItem('releases', JSON.stringify(mergedReleases));
    } catch (error) {
      console.error('Error storing releases:', error);
    }
  }

  private determineLabel(labelName: string): RecordLabel {
    const normalizedName = labelName.toLowerCase();
    if (normalizedName.includes('tech')) {
      return RECORD_LABELS['buildit-tech'];
    } else if (normalizedName.includes('deep')) {
      return RECORD_LABELS['buildit-deep'];
    }
    return RECORD_LABELS['buildit-records'];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      const timeoutId = window.setTimeout(resolve, ms);
      return () => window.clearTimeout(timeoutId);
    });
  }
}

export default SymphonicService;
