import axios from 'axios';

const SOUNDCLOUD_CLIENT_ID = process.env.REACT_APP_SOUNDCLOUD_CLIENT_ID || '';

class SoundCloudService {
  private static instance: SoundCloudService;
  private baseUrl = 'https://api.soundcloud.com';
  private clientId: string;

  private constructor() {
    if (!SOUNDCLOUD_CLIENT_ID) {
      console.warn('SoundCloud client ID not provided');
    }
    this.clientId = SOUNDCLOUD_CLIENT_ID;
  }

  public static getInstance(): SoundCloudService {
    if (!SoundCloudService.instance) {
      SoundCloudService.instance = new SoundCloudService();
    }
    return SoundCloudService.instance;
  }

  private getHeaders() {
    return {
      'Authorization': `OAuth ${this.clientId}`,
    };
  }

  public async getTrack(trackId: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/tracks/${trackId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching SoundCloud track:', error);
      throw error;
    }
  }

  public async searchTracks(query: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/tracks`, {
        headers: this.getHeaders(),
        params: {
          q: query,
          client_id: this.clientId,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching SoundCloud tracks:', error);
      throw error;
    }
  }
}

export const soundcloudService = SoundCloudService.getInstance();
