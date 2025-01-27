import { API_URL } from '../config';

export interface Artist {
  id: string;
  name: string;
  spotifyUrl?: string;
}

export interface Release {
  id: string;
  title: string;
  releaseDate: string;
  artworkUrl?: string;
  spotifyUrl?: string;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artist?: Artist;
  releaseId: string;
  release?: Release;
  duration_ms: number;
  preview_url?: string;
  spotifyUrl: string;
  uri?: string;
}

export interface ImportLog {
  id: number;
  type: string;
  spotifyId: string;
  status: string;
  error: string | null;
  importedAt: string;
}

// Get tracks by label with pagination
export const getTracks = async (
  token: string,
  labelId: string,
  page: number = 1,
  limit: number = 50
): Promise<{ tracks: Track[]; total: number; offset: number; limit: number }> => {
  const offset = (page - 1) * limit;
  const response = await fetch(
    `${API_URL}/tracks?label=${labelId}&offset=${offset}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch tracks');
  }

  return response.json();
};

// Update track
export const updateTrack = async (
  token: string,
  trackId: string,
  updates: Partial<Track>
): Promise<Track> => {
  const response = await fetch(`${API_URL}/tracks/${trackId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error('Failed to update track');
  }

  return response.json();
};

// Delete track
export const deleteTrack = async (token: string, trackId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/tracks/${trackId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete track');
  }
};

// Get track import history
export const getTrackImports = async (
  token: string,
  trackId: string
): Promise<ImportLog[]> => {
  const response = await fetch(`${API_URL}/tracks/${trackId}/imports`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch track import history');
  }

  return response.json();
};

// Search tracks
export const searchTracks = async (
  token: string,
  query: string,
  limit: number = 20
): Promise<{ tracks: Track[]; total: number }> => {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString()
  });

  const response = await fetch(`${API_URL}/tracks/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to search tracks');
  }

  return response.json();
};
