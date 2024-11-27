import axios from 'axios';

const BEATPORT_API_KEY = process.env.REACT_APP_BEATPORT_API_KEY;

class BeatportService {
  private static instance: BeatportService;
  private baseUrl = 'https://api.beatport.com/v4';
  private headers: { [key: string]: string };

  private constructor() {
    this.headers = {
      'Authorization': `Bearer ${BEATPORT_API_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  public static getInstance(): BeatportService {
    if (!BeatportService.instance) {
      BeatportService.instance = new BeatportService();
    }
    return BeatportService.instance;
  }

  public async getTrackByUPC(upc: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/catalog/tracks/lookup`, {
        headers: this.headers,
        params: {
          upc,
        },
      });

      if (response.data.results.length) {
        const track = response.data.results[0];
        return {
          title: track.name,
          artist: track.artists[0].name,
          imageUrl: track.release.image.uri,
          releaseDate: track.publish_date,
          beatportUrl: track.url,
        };
      }
      throw new Error('Track not found on Beatport');
    } catch (error) {
      console.error('Error fetching track from Beatport:', error);
      throw error;
    }
  }
}

export const beatportService = BeatportService.getInstance();
