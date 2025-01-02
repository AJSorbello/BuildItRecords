import { clearData } from './dataInitializer';
import { spotifyService } from '../services/SpotifyService';
import { RECORD_LABELS } from '../constants/labels';
import { API_URL } from '../config';

export const refreshCache = async () => {
  try {
    // Clear frontend cache
    clearData();

    // Call the server's cache warmup endpoint
    const response = await fetch(`${API_URL}/redis/warmup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to warm up cache');
    }

    const data = await response.json();
    if (data.shouldRefreshFrontend) {
      // Trigger a reload of the data
      await Promise.all(Object.values(RECORD_LABELS).map(label => 
        spotifyService.getTracksByLabel(label)
      ));
      console.log('Frontend cache refreshed successfully');
    }

    return true;
  } catch (error) {
    console.error('Error refreshing cache:', error);
    return false;
  }
};
