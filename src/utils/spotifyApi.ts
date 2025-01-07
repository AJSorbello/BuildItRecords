const SPOTIFY_BASE_URL = 'https://api.spotify.com/v1';

interface SpotifyError {
  status: number;
  message: string;
}

class SpotifyApiError extends Error {
  status: number;
  
  constructor(error: SpotifyError) {
    super(error.message);
    this.status = error.status;
    this.name = 'SpotifyApiError';
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new SpotifyApiError({
      status: response.status,
      message: error.error?.message || 'Unknown error occurred'
    });
  }
  return response.json();
};

export const spotifyApi = {
  async getTrack(trackId: string, accessToken: string) {
    const response = await fetch(`${SPOTIFY_BASE_URL}/tracks/${trackId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return handleResponse(response);
  },

  async searchTracks(query: string, accessToken: string) {
    const params = new URLSearchParams({
      q: query,
      type: 'track',
      limit: '10'
    });

    const response = await fetch(`${SPOTIFY_BASE_URL}/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return handleResponse(response);
  },

  async getUserProfile(accessToken: string) {
    const response = await fetch(`${SPOTIFY_BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return handleResponse(response);
  },

  async getUserPlaylists(accessToken: string) {
    const response = await fetch(`${SPOTIFY_BASE_URL}/me/playlists`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return handleResponse(response);
  }
};
