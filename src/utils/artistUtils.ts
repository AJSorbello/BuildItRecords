import { Artist } from '../data/mockData';
import { RECORD_LABELS, RecordLabel } from '../constants/labels';

export const getArtistsByLabel = (label: RecordLabel): Artist[] => {
  try {
    const storedArtists = localStorage.getItem('artists');
    if (!storedArtists) return [];
    
    const artists: Artist[] = JSON.parse(storedArtists);
    return artists.filter(artist => artist.recordLabel === label);
  } catch (err) {
    console.error('Error loading artists:', err);
    return [];
  }
};
