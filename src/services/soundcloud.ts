import axios from 'axios';
import { SOUNDCLOUD_CLIENT_ID } from '@env';

class SoundCloudService {
  private static instance: SoundCloudService;
  private baseUrl = 'https://api.soundcloud.com';
  private clientId: string;

  private constructor() {
    this.clientId = SOUNDCLOUD_CLIENT_ID;
  }

  public static getInstance(): SoundCloudService {
    if (!SoundCloudService.instance) {
      SoundCloudService.instance = new SoundCloudService();
    }
    return SoundCloudService.instance;
  }

  public async getTrackByISRC(isrc: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/tracks`, {
        params: {
          client_id: this.clientId,
          q: isrc,
        },
      });

      if (response.data.length) {
        const track = response.data[0];
        return {
          title: track.title,
          artist: track.user.username,
          imageUrl: track.artwork_url?.replace('large', 't500x500'),
          releaseDate: track.created_at,
          soundcloudUrl: track.permalink_url,
        };
      }
      throw new Error('Track not found on SoundCloud');
    } catch (error) {
      console.error('Error fetching track from SoundCloud:', error);
      throw error;
    }
  }
}

export const soundcloudService = SoundCloudService.getInstance();
