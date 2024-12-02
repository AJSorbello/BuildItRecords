import { Track } from '../types/track';
import { Artist } from '../data/mockData';
import { mockTracks, mockArtists } from '../data/mockData';

export const initializeData = () => {
  // Initialize tracks if they don't exist
  if (!localStorage.getItem('tracks')) {
    localStorage.setItem('tracks', JSON.stringify(mockTracks));
  }

  // Initialize artists if they don't exist
  if (!localStorage.getItem('artists')) {
    localStorage.setItem('artists', JSON.stringify(mockArtists));
  }
};

export const clearData = () => {
  localStorage.removeItem('tracks');
  localStorage.removeItem('artists');
};

export const resetData = () => {
  localStorage.setItem('tracks', JSON.stringify(mockTracks));
  localStorage.setItem('artists', JSON.stringify(mockArtists));
};

export const getData = () => {
  try {
    const tracks = localStorage.getItem('tracks');
    const artists = localStorage.getItem('artists');
    
    return {
      tracks: tracks ? JSON.parse(tracks) as Track[] : [],
      artists: artists ? JSON.parse(artists) as Artist[] : []
    };
  } catch (error) {
    console.error('Error getting data:', error);
    return { tracks: [], artists: [] };
  }
};
